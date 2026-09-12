import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMany = vi.fn();
const $disconnect = vi.fn(() => Promise.resolve());
const sendEmail = vi.fn();
const listUsersWithOverdueLoans = vi.fn();
const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

vi.mock("../config/prisma.js", () => ({
  prisma: { user: { updateMany }, $disconnect },
}));

vi.mock("../config/logger.js", () => ({ logger }));

vi.mock("../mailer/email.js", () => ({ sendEmail }));

vi.mock("../services/loans.js", () => ({
  listUsersWithOverdueLoans,
  overdueEmailCutoff: (days) => new Date(Date.now() - days * 24 * 3600 * 1000),
}));

function makeEntry(id, loans) {
  return {
    user: {
      id,
      email: `${id}@example.com`,
      fullName: `User ${id}`,
    },
    overdueLoans: loans,
  };
}

const loan = (name, dueDate) => ({ item: { name }, dueDate });

/**
 * The job module calls main() on import, so each test re-imports it with a
 * fresh module registry and then drains the pending microtasks/promises.
 */
async function runJob() {
  vi.resetModules();
  process.exitCode = undefined;
  await import("./remindUserOverdue.js");
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  updateMany.mockResolvedValue({ count: 1 });
  sendEmail.mockResolvedValue(undefined);
  listUsersWithOverdueLoans.mockResolvedValue({ data: [] });
});

describe("remindUserOverdue job", () => {
  it("exits cleanly when there is nothing to send", async () => {
    await runJob();

    expect(listUsersWithOverdueLoans).toHaveBeenCalledTimes(1);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
    expect($disconnect).toHaveBeenCalled();
  });

  it("queries with the reminder interval and batch size", async () => {
    await runJob();

    expect(listUsersWithOverdueLoans).toHaveBeenCalledWith({
      lastOverdueEmailSentOlderThanDays: 2,
      page: 1,
      pageSize: 100,
    });
  });

  it("sends a formatted email and stamps the user", async () => {
    const dueDate = new Date("2026-08-01T00:00:00.000Z");
    listUsersWithOverdueLoans
      .mockResolvedValueOnce({
        data: [makeEntry("u1", [loan("Rope", dueDate)])],
      })
      .mockResolvedValue({ data: [] });

    await runJob();

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith({
      to: "u1@example.com",
      subject: "Your overdue loans",
      template: "overdue-loan",
      data: {
        name: "User u1",
        loans: [{ gearName: "Rope", dueDate: expect.any(String) }],
      },
    });

    expect(updateMany).toHaveBeenCalledTimes(1);
    const args = updateMany.mock.calls[0][0];
    expect(args.where.id).toBe("u1");
    expect(args.where.OR[0]).toEqual({ lastOverdueEmailSentAt: null });
    expect(args.where.OR[1].lastOverdueEmailSentAt.lt).toBeInstanceOf(Date);
    expect(args.data.lastOverdueEmailSentAt).toBeInstanceOf(Date);
    expect(process.exitCode).toBeUndefined();
  });

  it("pages until a batch yields no unattempted users", async () => {
    listUsersWithOverdueLoans
      .mockResolvedValueOnce({ data: [makeEntry("u1", [loan("Rope")])] })
      .mockResolvedValueOnce({ data: [makeEntry("u2", [loan("Harness")])] })
      .mockResolvedValue({ data: [] });

    await runJob();

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(listUsersWithOverdueLoans).toHaveBeenCalledTimes(3);
  });

  it("does not re-send to a user returned again in a later batch", async () => {
    const entry = makeEntry("u1", [loan("Rope")]);
    listUsersWithOverdueLoans.mockResolvedValue({ data: [entry] });

    await runJob();

    // Second batch returns the same user, which is already attempted -> stop.
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(listUsersWithOverdueLoans).toHaveBeenCalledTimes(2);
  });

  it("skips stamping and flags failure when the email fails", async () => {
    listUsersWithOverdueLoans
      .mockResolvedValueOnce({ data: [makeEntry("u1", [loan("Rope")])] })
      .mockResolvedValue({ data: [] });
    sendEmail.mockRejectedValueOnce(new Error("smtp down"));

    await runJob();

    expect(updateMany).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1" }),
      "Failed to send overdue reminder email",
    );
    expect(process.exitCode).toBe(1);
  });

  it("continues with other users after one email fails", async () => {
    listUsersWithOverdueLoans
      .mockResolvedValueOnce({
        data: [
          makeEntry("u1", [loan("Rope")]),
          makeEntry("u2", [loan("Harness")]),
        ],
      })
      .mockResolvedValue({ data: [] });
    sendEmail.mockRejectedValueOnce(new Error("smtp down"));

    await runJob();

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany.mock.calls[0][0].where.id).toBe("u2");
    expect(process.exitCode).toBe(1);
  });

  it("warns when a concurrent run already stamped the user", async () => {
    listUsersWithOverdueLoans
      .mockResolvedValueOnce({ data: [makeEntry("u1", [loan("Rope")])] })
      .mockResolvedValue({ data: [] });
    updateMany.mockResolvedValue({ count: 0 });

    await runJob();

    expect(logger.warn).toHaveBeenCalledWith(
      { userId: "u1" },
      "Overdue reminder sent but already stamped by a concurrent run",
    );
    // The send still succeeded, so this is not counted as a failure.
    expect(process.exitCode).toBeUndefined();
  });

  it("counts a stamping error as a failure after a successful send", async () => {
    listUsersWithOverdueLoans
      .mockResolvedValueOnce({ data: [makeEntry("u1", [loan("Rope")])] })
      .mockResolvedValue({ data: [] });
    updateMany.mockRejectedValue(new Error("db down"));

    await runJob();

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1" }),
      "Failed to record overdue reminder timestamp after sending",
    );
    expect(process.exitCode).toBe(1);
  });

  it("stops at the batch limit and warns", async () => {
    let n = 0;
    listUsersWithOverdueLoans.mockImplementation(() => {
      n++;
      return Promise.resolve({ data: [makeEntry(`u${n}`, [loan("Rope")])] });
    });

    await runJob();

    expect(listUsersWithOverdueLoans).toHaveBeenCalledTimes(100);
    expect(sendEmail).toHaveBeenCalledTimes(100);
    expect(logger.warn).toHaveBeenCalledWith(
      { maxBatches: 100 },
      "Overdue reminder job hit the batch limit; some users may not have been notified",
    );
  });

  it("sets a failure exit code when the query itself throws", async () => {
    listUsersWithOverdueLoans.mockRejectedValue(new Error("db down"));

    await runJob();

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      "Overdue reminder job failed",
    );
    expect(process.exitCode).toBe(1);
    expect($disconnect).toHaveBeenCalled();
  });
});

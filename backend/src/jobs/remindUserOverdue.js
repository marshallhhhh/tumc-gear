import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";
import {
  listUsersWithOverdueLoans,
  overdueEmailCutoff,
} from "../services/loans.js";
import { sendEmail } from "../mailer/email.js";

const REMINDER_INTERVAL_DAYS = 2;
// buildPaginationQuery hard-caps pageSize at 100, so page through in batches.
const BATCH_SIZE = 100;
// Safety valve so a stamping failure can never produce an unbounded loop.
const MAX_BATCHES = 100;

const dueDateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function buildEmail({ user, overdueLoans }) {
  return {
    to: user.email,
    subject: "Your overdue loans",
    template: "overdue-loan",
    data: {
      name: user.fullName,
      loans: overdueLoans.map((loan) => ({
        gearName: loan.item.name,
        dueDate: dueDateFormatter.format(loan.dueDate),
      })),
    },
  };
}

/**
 * Stamp the reminder timestamp only if the user still matches the selection
 * predicate, so an overlapping run that already emailed this user is not
 * overwritten. Returns whether this run won the claim.
 */
async function markReminderSent(userId, cutoff) {
  const { count } = await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [
        { lastOverdueEmailSentAt: null },
        { lastOverdueEmailSentAt: { lt: cutoff } },
      ],
    },
    data: { lastOverdueEmailSentAt: new Date() },
  });
  return count > 0;
}

async function main() {
  // A user only leaves the result set once stamped, and stamping happens only
  // after a successful send. Tracking attempts stops failed sends from being
  // retried forever inside a single run.
  const attempted = new Set();
  let sent = 0;
  let failed = 0;
  let batch = 0;

  for (; batch < MAX_BATCHES; batch++) {
    const cutoff = overdueEmailCutoff(REMINDER_INTERVAL_DAYS);

    const { data } = await listUsersWithOverdueLoans({
      lastOverdueEmailSentOlderThanDays: REMINDER_INTERVAL_DAYS,
      page: 1,
      pageSize: BATCH_SIZE,
      ...(attempted.size > 0 && { excludeUserIds: [...attempted] }),
    });

    const pending = data.filter((entry) => !attempted.has(entry.user.id));
    if (pending.length === 0) break;

    for (const entry of pending) {
      const userId = entry.user.id;
      attempted.add(userId);

      try {
        await sendEmail(buildEmail(entry));
      } catch (err) {
        failed++;
        logger.error({ err, userId }, "Failed to send overdue reminder email");
        continue;
      }

      try {
        const claimed = await markReminderSent(userId, cutoff);
        if (!claimed) {
          logger.warn(
            { userId },
            "Overdue reminder sent but already stamped by a concurrent run",
          );
        }
        sent++;
      } catch (err) {
        // The email went out; only the bookkeeping failed. Worst case the user
        // receives one duplicate reminder on a later run.
        failed++;
        logger.error(
          { err, userId },
          "Failed to record overdue reminder timestamp after sending",
        );
      }
    }
  }

  if (batch === MAX_BATCHES) {
    logger.warn(
      { maxBatches: MAX_BATCHES },
      "Overdue reminder job hit the batch limit; some users may not have been notified",
    );
  }

  logger.info(
    { attempted: attempted.size, sent, failed },
    "Overdue reminder job finished",
  );

  return failed;
}

main()
  .then((failed) => {
    if (failed > 0) process.exitCode = 1;
  })
  .catch((err) => {
    logger.error({ err }, "Overdue reminder job failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect().catch(() => {}));

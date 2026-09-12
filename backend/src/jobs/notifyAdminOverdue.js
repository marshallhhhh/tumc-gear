import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";
import { listUsersWithOverdueLoans } from "../services/loans.js";
import { sendEmail } from "../mailer/email.js";

// buildPaginationQuery hard-caps pageSize at 100, so page through in batches.
const BATCH_SIZE = 100;
// Safety valve so a stamping failure can never produce an unbounded loop.
const MAX_BATCHES = 100;

const ADMIN_EMAIL = "tasuniclimbing@gmail.com";

function buildEmail({ users }) {
  return {
    to: ADMIN_EMAIL,
    subject: "Overdue loans",
    template: "admin-overdue-loans",
    data: {
      users: users.map(({ user, overdueLoans }) => ({
        user,
        overdueLoans: overdueLoans.map((loan) => ({
          item: loan.item,
          overdueBy: Math.ceil(
            (Date.now() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24),
          ),
        })),
      })),
    },
  };
}

async function main() {
  const users = [];
  let totalPages = 0;

  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const { data, totalPages: responseTotalPages } =
      await listUsersWithOverdueLoans({
        page: batch + 1,
        pageSize: BATCH_SIZE,
      });

    users.push(...data);
    totalPages = responseTotalPages;

    if (batch + 1 >= responseTotalPages) break;
  }

  if (totalPages > MAX_BATCHES) {
    logger.warn(
      { maxBatches: MAX_BATCHES },
      "Admin overdue notification job hit the batch limit; some users may be missing from the email",
    );
  }

  if (users.length === 0) {
    logger.info(
      "Admin overdue notification job finished; no overdue loans found",
    );
    return 0;
  }

  try {
    await sendEmail(buildEmail({ users }));
  } catch (err) {
    logger.error({ err }, "Failed to send admin overdue notification email");
    return 1;
  }

  logger.info(
    { userCount: users.length },
    "Admin overdue notification job finished",
  );
  return 0;
}

main()
  .then((failed) => {
    if (failed > 0) process.exitCode = 1;
  })
  .catch((err) => {
    logger.error({ err }, "Admin overdue notification job failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect().catch(() => {}));

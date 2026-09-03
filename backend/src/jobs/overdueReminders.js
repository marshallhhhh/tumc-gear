import { prisma } from "../config/prisma.js";
import {
  listUsersWithOverdueLoans,
  overdueEmailCutoff,
} from "../services/loans.js";
import { sendEmail } from "../mailer/email.js";

const REMINDER_INTERVAL_DAYS = 2;

async function main() {
  const usersToNotify = await listUsersWithOverdueLoans({
    lastOverdueEmailSentOlderThanDays: REMINDER_INTERVAL_DAYS,
    page: 1,
    pageSize: 1000,
  });

  const cutoff = overdueEmailCutoff(REMINDER_INTERVAL_DAYS);

  for (const user of usersToNotify.data) {
    // Claim the user by re-asserting the selection predicate in the write.
    // Overlapping runs therefore split the set instead of both emailing
    // everyone. Stamping before sending means a send failure costs a skipped
    // reminder rather than a duplicate one.
    const { count } = await prisma.user.updateMany({
      where: {
        id: user.user.id,
        OR: [
          { lastOverdueEmailSentAt: null },
          { lastOverdueEmailSentAt: { lt: cutoff } },
        ],
      },
      data: { lastOverdueEmailSentAt: new Date() },
    });
    if (count === 0) continue;

    const loanData = user.overdueLoans.map((loan) => ({
      gearName: loan.item.name,
      dueDate: loan.dueDate.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    }));

    await sendEmail({
      to: user.user.email,
      subject: "Your overdue loans",
      template: "overdue-loan",
      data: {
        name: user.user.fullName,
        loans: loanData,
      },
    });
  }
}

main();

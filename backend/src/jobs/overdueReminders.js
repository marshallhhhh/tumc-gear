import { listUsersWithOverdueLoans } from "../services/loans.js";
import { updateUser } from "../services/users.js";
import { sendEmail } from "../mailer/email.js";

async function main() {
  const usersToNotify = await listUsersWithOverdueLoans({
    lastOverdueEmailSentOlderThanDays: 2,
    page: 1,
    pageSize: 1000,
  });

  for (const user of usersToNotify.data) {
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

    await updateUser(user.user.id, { lastOverdueEmailSentAt: new Date() });
  }
}

main();

import { listOverdueLoans } from "../services/loans.js";
import { sendEmail } from "../mailer/email.js";

async function main() {
    const overdueLoans = await listOverdueLoans({ page: 1, pageSize: 1000 });

    for (const loan of overdueLoans.data) {
        await sendEmail({
            to: loan.user.email,
            subject: "Your loan is overdue",
            template: "overdue-loan",
            data: {
                name: loan.user.fullName,
                gearName: loan.item.name,
                dueDate: loan.dueDate.toLocaleDateString(),
            },
        });
    }
}

main()
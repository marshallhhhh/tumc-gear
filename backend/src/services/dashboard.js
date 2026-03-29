import { prisma } from "../config/prisma.js";

export async function getDashboardStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalItems,
    openFoundReports,
    activeLoans,
    overdueLoans,
    totalUsers,
  ] = await Promise.all([
    prisma.item.count(),
    prisma.foundReport.count({ where: { status: "OPEN" } }),
    prisma.loan.count({ where: { status: "ACTIVE" } }),
    prisma.loan.count({
      where: { status: "ACTIVE", dueDate: { lt: startOfToday } },
    }),
    prisma.user.count(),
  ]);

  return {
    totalItems,
    openFoundReports,
    activeLoans,
    overdueLoans,
    totalUsers,
  };
}

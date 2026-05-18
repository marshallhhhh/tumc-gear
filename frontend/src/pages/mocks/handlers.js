import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/dashboard", () =>
    HttpResponse.json({
      totalItems: 42,
      openFoundReports: 3,
      activeLoans: 7,
      overdueLoans: 1,
      totalUsers: 15,
    })
  ),
  // Mock auth/session endpoints too
];
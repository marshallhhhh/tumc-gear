import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../services/dashboard";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStats,
    staleTime: 30_000,
  });
}

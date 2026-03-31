import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as foundReportsApi from "../services/foundReports";

export function useFoundReports(params) {
  return useQuery({
    queryKey: ["foundReports", params],
    queryFn: () => foundReportsApi.getFoundReports(params),
    staleTime: 30_000,
  });
}

export function useFoundReport(id) {
  return useQuery({
    queryKey: ["foundReport", id],
    queryFn: () => foundReportsApi.getFoundReport(id),
    staleTime: 60_000,
    enabled: !!id,
  });
}

export function useCreateFoundReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: foundReportsApi.createFoundReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["foundReports"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCloseFoundReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: foundReportsApi.closeFoundReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["foundReports"] });
      qc.invalidateQueries({ queryKey: ["foundReport"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["item"] });
    },
  });
}

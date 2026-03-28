import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as loansApi from "../services/loans";

export function useLoans(params) {
  return useQuery({
    queryKey: ["loans", params],
    queryFn: () => loansApi.getLoans(params),
    staleTime: 30_000,
  });
}

export function useMyLoans(params) {
  return useQuery({
    queryKey: ["loans", "my", params],
    queryFn: () => loansApi.getMyLoans(params),
    staleTime: 30_000,
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loansApi.createLoan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useReturnLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => loansApi.returnLoan(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCancelLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loansApi.cancelLoan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useExtendLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => loansApi.extendLoan(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}

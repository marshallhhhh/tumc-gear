import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as qrApi from "../services/qr";

export function useResolveQr() {
  return useMutation({
    mutationFn: qrApi.resolveQr,
  });
}

export function useCreateQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: qrApi.createQr,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qrTags"] });
    },
  });
}

export function useAssignQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nanoid, itemId }) => qrApi.assignQr(nanoid, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qrTags"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item"] });
    },
  });
}

export function useUnassignQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: qrApi.unassignQr,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qrTags"] });
      qc.invalidateQueries({ queryKey: ["item"] });
    },
  });
}

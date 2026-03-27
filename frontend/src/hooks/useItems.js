import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as itemsApi from "../services/items";

export function useItems(params, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["items", params],
    queryFn: () => itemsApi.getItems(params),
    staleTime: 30_000,
    enabled,
  });
}

export function useItem(id, { waitForAuth = false } = {}) {
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => itemsApi.getItemById(id),
    staleTime: 60_000,
    enabled: !!id && !waitForAuth,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: itemsApi.createItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => itemsApi.updateItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item"] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: itemsApi.deleteItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

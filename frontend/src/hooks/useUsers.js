import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../services/users";

export function useMe() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: usersApi.getMe,
    staleTime: 60_000,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });
}

export function useUser(id) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => usersApi.getUser(id),
    staleTime: 60_000,
    enabled: !!id,
  });
}

export function useUsers(params) {
  return useQuery({
    queryKey: ["users", "list", params],
    queryFn: () => usersApi.getUsers(params),
    staleTime: 30_000,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => usersApi.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

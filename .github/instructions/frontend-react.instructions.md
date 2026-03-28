---
applyTo: "frontend/src/**"
description: "Use when editing frontend React components, hooks, services, or pages. Covers React Query hook structure, useNotification/useAuth usage, MUI sx styling, and service → hook → component wiring."
---

# Frontend React Patterns

## Layer Wiring: Service → Hook → Component

### Services (`services/*.js`) — Named exports, unwrap response

```js
import api from "./api";

export const getThings = (params) =>
  api.get("/things", { params }).then((r) => r.data);

export const createThing = (data) =>
  api.post("/thing", data).then((r) => r.data);

export const updateThing = (id, data) =>
  api.patch(`/thing/${id}`, data).then((r) => r.data);

export const deleteThing = (id) => api.delete(`/thing/${id}`);
```

### Hooks (`hooks/use*.js`) — React Query, named exports

```js
import * as thingsApi from "../services/things";

export function useThings(params) {
  return useQuery({
    queryKey: ["things", params],
    queryFn: () => thingsApi.getThings(params),
    staleTime: 30_000, // 30s for lists, 60_000 for detail
  });
}

export function useCreateThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: thingsApi.createThing,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["things"] }),
  });
}
```

- Query keys: `['domain', ...params]` — hierarchical for invalidation.
- Invalidate all affected query keys on mutation success — not just the parent list. Cross-domain invalidation is common (e.g., loan mutations invalidate `["loans"]`, `["items"]`, `["item"]`, `["dashboard"]`).
- Conditional queries: use `enabled: !!id` for detail queries. Hooks may also accept an `enabled` option for more complex conditions (e.g., `enabled: !!id && !waitForAuth`).

### Components/Pages — Destructure hooks, async handlers

```jsx
const { data: thing, isLoading, error } = useThing(id);
const createThing = useCreateThing();
const { notify } = useNotification();
const { isAdmin, isAuthenticated } = useAuth();

const handleSubmit = async (values) => {
  try {
    await createThing.mutateAsync(values);
    notify("Created successfully", "success");
  } catch (err) {
    notify(
      err.response?.data?.message || err.message || "Failed to create",
      "error",
    );
  }
};
```

- Default export for both pages and feature components.
- `.mutateAsync()` for async/await in handlers, not `.mutate()`.
- Error messages: extract with triple fallback `err.response?.data?.message || err.message || "Fallback text"`.

## Auth & Notifications

- **Auth:** `const { user, session, loading, isAdmin, isMember, isAuthenticated } = useAuth();`
  - Also exposes auth methods: `signIn`, `signUp`, `signOut`, `resetPassword`, `updatePassword`.
  - Use `loading` to gate renders while auth state is resolving (see ProtectedRoute, AdminRoute).
- **Notify:** `const { notify } = useNotification();` → `notify(message, severity)` where severity is `'success' | 'error' | 'warning' | 'info'`.

## Loading & Error States

- Page loading: use named exports from `components/PageSkeleton`:
  - `<TableSkeleton rows={5} columns={4} />` for table pages.
  - `<DetailSkeleton />` for detail pages.
  - `<CardsSkeleton count={6} />` for card grid pages.
- Inline loading: MUI `<Skeleton />`.
- Button loading: disable with `.isPending` + show `<CircularProgress size={24} />`.
- Errors: MUI `<Alert severity="error">`.
- Empty state: use `<EmptyState />` from `components/EmptyState`.

## MUI Styling

- Use the `sx` prop for all styling — no `styled()`, no CSS modules.
- Theme palette: primary `#1347e7`, success `#1c9f2b`, yellow `#fbc02d`, purple `#cf2bc0`.
- Background: default `#fafafa`, paper `#ffffff`. Border radius: `8`.
- `textTransform: 'none'` is already set on buttons globally.
- Chips default to `variant: "filled"`.

## Routing Guards

- Public pages: render directly in `AppRouter`.
- Authenticated pages: wrap in `<ProtectedRoute>`.
- Admin pages: wrap in `<AdminRoute>`.

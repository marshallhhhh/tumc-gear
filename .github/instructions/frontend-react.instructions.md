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
- Always invalidate the parent list query on mutation success.
- Use `enabled: !!id` for conditional queries.

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
    notify(err.response?.data?.message || err.message, "error");
  }
};
```

- Default export for pages, named exports for feature components.
- `.mutateAsync()` for async/await in handlers, not `.mutate()`.
- Error messages: extract from `err.response?.data?.message`.

## Auth & Notifications

- **Auth:** `const { user, session, isAdmin, isMember, isAuthenticated } = useAuth();`
- **Notify:** `const { notify } = useNotification();` → `notify(message, severity)` where severity is `'success' | 'error' | 'warning' | 'info'`.

## Loading & Error States

- Full-page loading: `<PageSkeleton />` from `components/PageSkeleton`.
- Inline loading: MUI `<Skeleton />`.
- Button loading: disable with `.isPending` + show `<CircularProgress size={24} />`.
- Errors: MUI `<Alert severity="error">`.

## MUI Styling

- Use the `sx` prop for all styling — no `styled()`, no CSS modules.
- Theme colors: primary `#1D4ED8`, secondary `#EF5526`, info `#3F88C5`.
- `textTransform: 'none'` is already set on buttons globally.

## Routing Guards

- Public pages: render directly in `AppRouter`.
- Authenticated pages: wrap in `<ProtectedRoute>`.
- Admin pages: wrap in `<AdminRoute>`.

---
description: "Audit frontend code for convention violations, React Query misuse, auth gaps, and UI inconsistencies against project standards"
agent: "agent"
tools: [read, search]
argument-hint: "Optional: specific area to audit (e.g. 'hooks', 'pages/admin', 'loans') or leave blank for full audit"
---

# Frontend Code Audit

Audit the frontend codebase for bugs, convention violations, and inconsistencies with project standards.

## Reference Standards

Read these files first — they define what "correct" looks like:

- [Frontend patterns](../instructions/frontend-react.instructions.md) — service → hook → component wiring, React Query, auth, MUI styling, routing guards
- [App entry](../../frontend/src/App.jsx) — top-level providers and layout
- [Router](../../frontend/src/routes/AppRouter.jsx) — route definitions and guards

## Scope

If an argument was provided, audit only that area's files (e.g. a specific feature, hook, or page folder). Otherwise audit all files under `frontend/src/`.

## Audit Checklist

### 1. Layer Wiring (Service → Hook → Component)

- Services use named exports, call `api.get/post/patch/delete`, and unwrap with `.then(r => r.data)`
- Hooks use `useQuery`/`useMutation` from React Query with proper query keys (`['domain', ...params]`)
- Components/pages destructure hooks — no direct Axios or `fetch` calls in components
- No data fetching in `useEffect` — all fetching goes through React Query hooks

### 2. React Query Patterns

- `staleTime` is set: 30s (`30_000`) for lists, 60s (`60_000`) for detail queries
- Mutations use `onSuccess` to invalidate all affected query keys, including cross-domain keys (e.g. loan mutations invalidate `["loans"]`, `["items"]`, `["item"]`, `["dashboard"]`)
- Conditional queries use `enabled: !!id` or similar guards
- Handlers use `.mutateAsync()` with `await` — not `.mutate()`

### 3. Auth & Route Protection

- Protected pages are wrapped in `<ProtectedRoute>`
- Admin pages are wrapped in `<AdminRoute>`
- Components that need auth use `useAuth()` and check `isAdmin`, `isMember`, or `isAuthenticated`
- Auth `loading` state is checked before rendering gated content
- No admin-only UI rendered without an `isAdmin` guard

### 4. Notifications & Error Messages

- User-facing feedback uses `useNotification()` → `notify(message, severity)` — not `alert()`, `console.log`, or `window.confirm`
- Error messages use triple fallback: `err.response?.data?.message || err.message || "Fallback text"`
- Success/error severity matches the action (success for creates/updates, error for failures)

### 5. Loading & Empty States

- Full-page loading uses named exports from `PageSkeleton`: `<TableSkeleton>`, `<DetailSkeleton>`, `<CardsSkeleton>`
- Inline loading uses MUI `<Skeleton />`
- Buttons show loading state with `.isPending` + `<CircularProgress size={24} />`
- Empty data states use `<EmptyState />` component
- Error states use MUI `<Alert severity="error">`

### 6. MUI & Styling

- All styling uses the `sx` prop — no `styled()`, CSS modules, or inline `style` props
- Theme colors are used from the palette, not hardcoded hex values
- Chips use `variant: "filled"` (the default)
- No `textTransform` overrides on buttons (already set globally to `'none'`)

### 7. Component Patterns

- Pages and feature components use default exports
- Reusable components are used where available: `DataTable`, `StatusBadge`, `ConfirmDialog`, `LocationMinimap`, `QrScanner`, `EmptyState`
- No duplicated UI logic that should use an existing shared component

### 8. General Code Quality

- No unused imports or variables
- No hardcoded API URLs — all requests go through `services/api.js`
- No stale or commented-out code blocks
- Consistent destructuring patterns across similar components

## Output Format

For each finding, report:

- **File**: workspace-relative path with line number
- **Severity**: `Critical` (security risk, broken auth guard, data loss), `Warning` (convention violation or bug), `Info` (minor improvement)
- **Issue**: What is wrong
- **Fix**: What should change (include a code snippet if helpful)

Group findings by area (hooks, services, pages, components), then by severity within each group.

End with a summary table:

| Severity | Count |
| -------- | ----- |
| Critical | _n_   |
| Warning  | _n_   |
| Info     | _n_   |

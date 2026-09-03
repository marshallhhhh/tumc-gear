---
applyTo: "frontend/**"
description: "Conventions and facts for the TUMC Gear React/Vite frontend."
---

# Frontend instructions

## Stack

- React 19 + Vite 7, plain **JavaScript/JSX — no TypeScript, no typecheck step**.
- ESM (`"type": "module"`). Imports omit file extensions (`import api from "./api"`).
- MUI 7 (`@mui/material`, `@mui/icons-material`) with `@emotion/react` / `@emotion/styled`; `@base-ui/react` is also a dependency.
- React Router 7 (`react-router-dom`), TanStack Query 5 (+ devtools), axios.
- `@supabase/supabase-js` for auth, `leaflet` / `react-leaflet` for maps, `html5-qrcode` for scanning, `qrcode.react` + `nanoid` for tag generation.
- No path aliases are configured — use relative imports.
- `vite.config.js` defines `manualChunks` splitting `@supabase`, `@mui`, and `leaflet` into separate vendor bundles; keep that config when touching the build.

## Directory layout (`frontend/src`)

```
main.jsx            # providers + root render
App.jsx             # renders <AppRouter /> only
theme.js            # MUI createTheme
routes/             # AppRouter.jsx, ProtectedRoute.jsx, AdminRoute.jsx
layouts/MainLayout.jsx
pages/              # public + member pages
pages/admin/        # Dashboard, GearList, GearDetail, Users, Loans, FoundReports
features/           # items, loans, users, tags, foundReports — resource-specific composite UI
components/         # shared presentational components
context/            # AuthContext.jsx, NotificationContext.jsx
hooks/              # use*.js — one file per resource, TanStack Query wrappers
services/           # api.js, supabase.js + one axios module per resource
utils/date.js
```

## Data flow (required layering)

`services/*.js` (axios) → `hooks/use*.js` (TanStack Query) → components.

- **Never call axios or `api` directly from a component/page.** Add a service function, then a hook.
- Service functions are one-liners returning `.then((r) => r.data)`; only `delete*` returns the raw response.
- Hooks import services as `import * as itemsApi from "../services/items"` and use named exports (`useItems`, `useCreateItem`, …).
- Queries use array query keys: `["items", params]`, `["item", id, opts]`, `["loans", "my", params]`, `["users", "me"]`, `["users", "list", params]`, `["foundReports", params]`, `["foundReport", id]`, `["qrTags"]`, `["dashboard"]`, `["categories"]`.
- Mutations invalidate all affected keys in `onSuccess` via `useQueryClient()` (`qc.invalidateQueries({ queryKey: [...] })`). Anything that changes availability must invalidate `["items"]`, `["item"]`, and `["dashboard"]` as applicable.
- `staleTime` is set explicitly on queries (commonly `30_000` for lists, `60_000` for details).
- Global `QueryClient` defaults (in `main.jsx`): `retry: 1`, `refetchOnWindowFocus: false`.

## API client (`services/api.js`)

- Single axios instance with `baseURL: import.meta.env.VITE_API_URL`.
- The access token is held in a module-level variable and pushed in by `AuthContext` via `setAccessToken()`. **Do not call `supabase.auth.getSession()` per request** — it can hang while an internal refresh lock is held.
- A response interceptor handles `401` globally: signs out of Supabase, clears the query cache, redirects to `/login`. Do not duplicate 401 handling in components.

## Auth

- `AuthContext` owns all Supabase auth calls (`signIn`, `signUp`, `signOut`, `resetPassword`, `updatePassword`) and exposes `session`, `user`, `loading`, `isAdmin`, `isMember`, `isAuthenticated`. Consume it with `useAuth()`; never call `supabase.auth.*` from pages.
- The backend `/users/me` response is the source of truth for the local user record and role (`ADMIN` / `MEMBER`).
- `ProtectedRoute` (authenticated) and `AdminRoute` (authenticated + admin) render a `CircularProgress` while `loading`, then `<Navigate>`. These guards are **UX only — the backend is the security boundary**; never rely on them for authorization.

## Routing (`routes/AppRouter.jsx`)

- All routes are nested under `<MainLayout />` (Navbar + `<Outlet />` + Footer).
- Public: `/home` (with `/` redirecting to it), `/login`, `/signup`, `/item/:shortId`, `/report-found`, `/t/:nanoid`, `/reset-password`, `*` → `NotFound`.
- Member (`ProtectedRoute`): `/my-loans`, `/profile`.
- Admin (`AdminRoute`): `/admin/dashboard`, `/admin/items`, `/admin/items/:shortId`, `/admin/users`, `/admin/loans`, `/admin/found-reports`, `/print-tags`.
- `:shortId` is the human-readable item id; `:nanoid` is the 6-char QR tag id. Use these, not database UUIDs, in URLs.
- Pages are imported eagerly (no `React.lazy`).

## UI conventions

- Use the shared components rather than re-implementing: `DataTable`, `StatusChip`, `EmptyState`, `ConfirmDialog`, the styled `Dialog`/`DialogTitle`/`DialogContent`/`DialogActions` from `components/Dialog.jsx`, `PageSkeleton` exports (`TableSkeleton`, `DetailSkeleton`, `CardsSkeleton`), `NumberSpinner`, `QrScanner`, `LocationMinimap`.
- `DataTable` takes a `columns` array of `{ id, label, render?, sortable?, sx? }` and 0-based `page`; the API is 1-based, so convert (`page={page - 1}`, `updateParam("page", String(p + 1))`).
- `StatusChip` maps status strings to label/colour in a single `statusConfig` map — extend that map instead of hardcoding chips.
- Styling is done with MUI `sx` props and layout props on `Box`/`Stack`; only `App.css` / `index.css` exist for globals. Use theme tokens (`text.secondary`, `background.default`, `primary.main`) rather than raw hex values; the palette and shared overrides live in `theme.js`.
- Loading states render a skeleton, empty results render `EmptyState`.

## Notifications and error handling

- User feedback goes through `useNotification()` → `notify(message, severity)` with severity `"success" | "error" | "warning" | "info"` (MUI `Snackbar` + `Alert`, top-centre, 4s).
- Mutation errors are surfaced as:
  ```js
  notify(err.response?.data?.message || err.message || "Failed to …", "error");
  ```
  The backend error envelope is `{ error, message, details }`, so read `err.response.data.message`.
- `components/ErrorBoundary.jsx` wraps the app in `main.jsx` for render-time crashes.

## List pages

Admin list pages keep filter/pagination/sort state in the URL via `useSearchParams` (`page`, `pageSize`, `sortBy`, `sortOrder`, `search`, plus resource filters), debounce search input (~300 ms with a `setTimeout` effect), and reset `page` to `1` whenever another param changes.

## Dates

Use the helpers in `utils/date.js` — `formatDate` (en-GB `dd/mm/yyyy`), `formatDateTime`, `formatDayOfWeekDate`. Do not introduce a date library or inline formatting.

## Environment variables

- Only `VITE_`-prefixed vars reach the browser: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`, `VITE_APP_TITLE`, `VITE_FOOTER_TEXT` (see `frontend/.env.example`).
- **Never put secrets in frontend env vars.** The Supabase anon key is public by design; service-role keys and SMTP credentials belong in the backend only.
- Add any new var to `frontend/.env.example`.

## Lint / format / build

- ESLint flat config at the repo root: `js/recommended` + `eslint-plugin-react` (React 19). `react/react-in-jsx-scope` and `react/prop-types` are **off** — do not add `PropTypes`.
- Unused vars are errors unless prefixed with `_` (hence `(_, reason) => …`).
- Prettier defaults with `endOfLine: "lf"`: double quotes, semicolons, trailing commas.
- Validate changes from the repo root with `npm run lint && npm run format:check`, plus `cd frontend && npm run build`. CI runs ESLint + Prettier only.
- `npm test` in `frontend` is wired to `node --test`, but **no test files are committed** — do not claim tests pass; new tests must use `node --test`.

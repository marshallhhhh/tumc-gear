# Project Overview

**App Name:** Climbing Club Gear Manager — Frontend

**Purpose:**
React SPA for tracking climbing gear inventory. Members scan QR codes, checkout/return items, and report found gear. Admins manage items, users, loans, QR tags, and found reports through an admin dashboard.

**Users:**

- Public (unauthenticated): scan QR codes, report found items, view item details
- Members: checkout/return items, view personal loans, manage profile
- Admins: all member features plus full CRUD on items, users, loans, QR tags, found reports, and dashboard analytics

# Tech Stack

- **Framework:** React 19 (ES Modules, `type: "module"`)
- **Bundler:** Vite 7
- **UI library:** MUI 7 (`@mui/material`, `@mui/icons-material`)
- **Data fetching:** TanStack React Query 5
- **HTTP client:** Axios
- **Routing:** React Router 7 (`react-router-dom`)
- **Auth provider:** Supabase JS SDK (`@supabase/supabase-js`)
- **QR scanning:** html5-qrcode
- **QR rendering:** qrcode.react
- **Maps:** Leaflet + react-leaflet (Carto tile layer)
- **Styling:** MUI `sx` prop (no CSS modules, no `styled()`)

# Folder Structure

```
/frontend
  index.html
  package.json
  vite.config.js
  /public
  /docs
    system-spec-frontend.md
  /src
    App.jsx               # Root component — renders <AppRouter />
    main.jsx              # Entry point — provider stack
    theme.js              # MUI theme overrides
    index.css             # Global reset (body margin: 0)
    App.css               # Unused (empty)
    /assets
    /context
      AuthContext.jsx      # Supabase auth state + DB user
      NotificationContext.jsx  # Snackbar notification system
    /routes
      AppRouter.jsx        # All route definitions + layout
      ProtectedRoute.jsx   # Member route guard
      AdminRoute.jsx       # Admin route guard
    /layouts
      MainLayout.jsx       # Navbar + Outlet + Footer
    /pages
      Home.jsx
      Login.jsx
      SignUp.jsx
      ItemDetail.jsx
      MyLoans.jsx
      Profile.jsx
      QrLanding.jsx
      ReportFound.jsx
      ResetPassword.jsx
      NotFound.jsx
      /admin
        Dashboard.jsx
        GearList.jsx
        GearDetail.jsx
        Loans.jsx
        Users.jsx
        FoundReports.jsx
    /features
      /items
        CreateItemDialog.jsx
        EditGearDialog.jsx
        QrTagSection.jsx
        ActivityHistory.jsx
        ActivityDetailModal.jsx
      /loans
        LoanDetailModal.jsx
      /users
        UserDetailModal.jsx
      /foundReports
        FoundReportDetailModal.jsx
    /hooks
      useCategories.js
      useDashboard.js
      useFoundReports.js
      useGeolocation.js
      useItems.js
      useLoans.js
      useQr.js
      useUsers.js
    /services
      api.js               # Axios instance + interceptors
      supabase.js          # Supabase client init
      categories.js
      dashboard.js
      foundReports.js
      items.js
      loans.js
      qr.js
      users.js
    /components
      ConfirmDialog.jsx
      DataTable.jsx
      EmptyState.jsx
      Footer.jsx
      LocationMinimap.jsx
      Navbar.jsx
      PageSkeleton.jsx
      QrScanner.jsx
      StatusBadge.jsx
    /utils
      date.js              # Date formatting helpers
```

# Architecture

## Provider Stack (main.jsx)

```
ThemeProvider (MUI theme)
  └─ CssBaseline (MUI reset)
      └─ QueryClientProvider (React Query)
          └─ BrowserRouter (React Router)
              └─ AuthProvider (Supabase + DB user state)
                  └─ NotificationProvider (Snackbar)
                      └─ <App />
```

**React Query defaults:**

- `retry: 1`
- `refetchOnWindowFocus: false`

The QueryClient is also passed to `api.js` via `setQueryClient()` so the Axios 401 interceptor can clear the cache on session expiry.

Leaflet CSS is imported globally in `main.jsx`.

## Layer Wiring

```
Page/Feature  →  Custom Hook (React Query)  →  Service (Axios wrapper)  →  api.js (interceptors)  →  Backend API
```

- **Services** (`services/*.js`): Named exports, call Axios, unwrap `r.data`.
- **Hooks** (`hooks/use*.js`): Named exports, wrap `useQuery`/`useMutation`, manage query keys and invalidation.
- **Pages/Features**: Default exports, destructure hooks, use `mutateAsync()` in async handlers.

# Authentication

## Supabase Integration

- Supabase client initialized in `services/supabase.js` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Auth operations (signIn, signUp, signOut, resetPassword, updatePassword) are methods on `AuthContext`.
- On mount, `AuthContext` calls `supabase.auth.getSession()` and fetches the DB user via `GET /users/me`.
- On auth state change (`SIGNED_IN`, `TOKEN_REFRESHED`), the DB user is re-fetched silently.
- On `SIGNED_OUT`, user and session state are cleared.

## Token Sync

- `AuthContext` calls `setAccessToken(token)` on `api.js` whenever the session changes.
- The Axios request interceptor injects `Authorization: Bearer {token}` on every request.
- This avoids calling `supabase.auth.getSession()` on every API call (prevents refresh lock issues).

## 401 Recovery

- The Axios response interceptor catches 401 errors.
- On 401: signs out via Supabase, clears the React Query cache, and redirects to `/login`.
- A flag prevents duplicate 401 handling.

## AuthContext API

```js
const {
  user, // DB user object (fullName, role, email, etc.)
  session, // Supabase auth session (JWT)
  loading, // true while initial auth resolves
  isAdmin, // user?.role === "ADMIN"
  isMember, // user?.role === "MEMBER" || isAdmin
  isAuthenticated, // !!session && !!user
  signIn, // (email, password) → Promise
  signUp, // (email, password, fullName) → Promise
  signOut, // () → clears token + session + user
  resetPassword, // (email) → sends reset email
  updatePassword, // (password) → updates session password
} = useAuth();
```

# Routing

## Route Map

All routes render inside `<MainLayout>` (Navbar + `<Outlet />` + Footer).

### Public Routes

| Path              | Page                   | Description                                |
| ----------------- | ---------------------- | ------------------------------------------ |
| `/`               | → redirects to `/home` |                                            |
| `/home`           | Home                   | Landing page with QR scan + shortId search |
| `/login`          | Login                  | Email/password sign in                     |
| `/signup`         | SignUp                 | Account creation                           |
| `/item/:shortId`  | ItemDetail             | Item view with checkout/return             |
| `/report-found`   | ReportFound            | Found item report form                     |
| `/t/:nanoid`      | QrLanding              | QR code resolution + admin assignment      |
| `/reset-password` | ResetPassword          | Password reset (from email link)           |
| `*`               | NotFound               | 404 page                                   |

### Protected Routes (Member+)

Wrapped in `<ProtectedRoute>`: redirects to `/login` if unauthenticated (preserves return URL in location state).

| Path        | Page    | Description                |
| ----------- | ------- | -------------------------- |
| `/my-loans` | MyLoans | Current user's loans       |
| `/profile`  | Profile | Edit name, change password |

### Admin Routes

Wrapped in `<AdminRoute>`: redirects to `/login` if unauthenticated, to `/home` if not admin.

| Path                    | Page         | Description              |
| ----------------------- | ------------ | ------------------------ |
| `/admin/dashboard`      | Dashboard    | Stat cards with counts   |
| `/admin/items`          | GearList     | Paginated item table     |
| `/admin/items/:shortId` | GearDetail   | Item detail + QR + loans |
| `/admin/users`          | Users        | Paginated user table     |
| `/admin/loans`          | Loans        | Paginated loan table     |
| `/admin/found-reports`  | FoundReports | Paginated reports table  |

## Route Guards

### ProtectedRoute

1. If `loading` → show `CircularProgress`
2. If `!isAuthenticated` → `Navigate` to `/login` with `from` state
3. Else → render children

### AdminRoute

1. If `loading` → show `CircularProgress`
2. If `!isAuthenticated` → `Navigate` to `/login`
3. If `!isAdmin` → `Navigate` to `/home`
4. Else → render children

# Layout

## MainLayout

Flexbox column layout with `minHeight: 100vh`:

```
<Navbar />        ← sticky top
<Box main>        ← flexGrow: 1 (fills remaining space)
  <Outlet />
</Box>
<Footer />        ← pushed to bottom
```

## Navbar

Responsive with two modes:

**Desktop (md+):** Top `AppBar` with logo, navigation buttons, user menu dropdown.

| Auth State      | Visible Nav Items                                                            |
| --------------- | ---------------------------------------------------------------------------- |
| Unauthenticated | Home, Sign In, Sign Up                                                       |
| Member          | Borrow (home), My Loans                                                      |
| Admin           | Dashboard, Gear, Users, Loans (dropdown: All Loans / Overdue), Found Reports |

**User menu** (authenticated): My Profile, Sign Out.

**Mobile (below md):** Sticky `BottomNavigation` with condensed tabs + "More" overflow menu.

**Loading state:** Skeleton placeholders while auth resolves.

## Footer

Reads `VITE_FOOTER_TEXT` env var. Renders footer text if set; returns `null` otherwise.

# Pages

## Public Pages

### Home

- QR code scanner button (opens `QrScanner` component)
- ShortId search field with auto-formatting (e.g., "HAR-001")
- On scan → navigates to `/t/{nanoid}`
- On shortId search → navigates to `/item/{shortId}`
- Sign in / sign up buttons for unauthenticated users

### Login

- Email + password form
- "Forgot password?" link → calls `resetPassword(email)` → shows notification
- On success → redirects to return URL (from location state) or `/home`
- Link to sign up page

### SignUp

- Email, full name, password fields
- Name validation: letters, spaces, hyphens, apostrophes, periods only
- Password minimum: 6 characters
- On success → shows confirmation screen → navigate to login

### ItemDetail

- Displays item name, category, short ID, description, status badge
- QR code SVG if QR tag exists
- **Checkout flow** (authenticated, item available):
  - Duration picker (1–30 days)
  - Requires geolocation permission
  - Creates loan via `useCreateLoan()`
- **Return flow** (authenticated, user's active loan):
  - Requires geolocation permission
  - Returns loan via `useReturnLoan()`
- "Report Found" button → navigates to `/report-found?itemId={id}`
- Shows warning if checked out by another user

### QrLanding

- Resolves nanoid via `useResolveQr()`
- **If resolved:** navigates to `/item/{shortId}`
- **If not found (member):** shows error
- **If not found (admin):** shows QR assignment UI:
  - Debounced item search field
  - Select item → confirm → assign via `useAssignQr()`
  - Handles conflict (QR already assigned) with reassign confirmation

### ReportFound

- Pre-filled item info from `itemId` query param
- Contact info field (optional, 500 char max)
- Description field (multiline, 2000 char max)
- Location sharing checkbox (optional)
- On submit → creates found report → redirects to home

### ResetPassword

- Triggered from Supabase email link
- New password + confirm password fields
- Validates password match
- On success → redirects to `/home`

### NotFound

- 404 display with "Go Home" button

## Protected Pages (Member+)

### MyLoans

- Tab filters: All, Active, Returned, Cancelled
- List view with item name, status badge, due/checkout date
- OVERDUE flag shown if loan is past due and still active
- Pagination (5, 10, 25, 50 rows)
- Click row → opens `LoanDetailModal`

### Profile

- Email (read-only)
- Full name (editable, validated with name regex)
- Save → `useUpdateMe()`
- "Change Password" → sends reset email via Supabase

## Admin Pages

### Dashboard

Stat cards (clickable, navigate to filtered views):

| Stat               | Destination                        | Highlight   |
| ------------------ | ---------------------------------- | ----------- |
| Total Items        | `/admin/items`                     | —           |
| Open Found Reports | `/admin/found-reports?status=OPEN` | Red if > 0  |
| Active Loans       | `/admin/loans?status=ACTIVE`       | Blue if > 0 |
| Overdue Loans      | `/admin/loans?overdue=true`        | Red if > 0  |
| Total Users        | `/admin/users`                     | —           |

### GearList

- Debounced search field
- Filters: Category (select), Has QR Tag (yes/no), Active Loan (checked out/available)
- DataTable columns: Name, QR icon, Category, Short ID, Status (AVAILABLE/CHECKED_OUT)
- "Add Gear" button → opens `CreateItemDialog`
- Sorting, pagination (default 50 rows)
- Click row → navigates to `/admin/items/{shortId}`
- Filter/pagination state stored in URL search params

### GearDetail

- Header with item name, edit/delete buttons
- **Gear Details panel:** category, description, serial number, created date
- **QR Tag panel:** `QrTagSection` (scan/assign/remove QR)
- **Current Loan panel:** status, borrower, checkout/due dates, "Manage Loan" button → `LoanDetailModal`, or "Available" if no active loan
- **Activity History panel:** `ActivityHistory` table
- Edit → `EditGearDialog`
- Delete → `ConfirmDialog` → `useDeleteItem()`

### Users

- DataTable columns: Name, Email, Role (chip: ADMIN blue / MEMBER default), Status (Active green / Inactive yellow), Joined date
- Pagination, sorting by createdAt desc
- Click row → opens `UserDetailModal`

### Loans

- DataTable columns: Item name (clickable → item detail), Borrower, Checkout date, Due date, Status
- Status shows OVERDUE if past due and active
- Click row → opens `LoanDetailModal` (with admin actions)
- Supports URL param filters: `status`, `overdue`

### FoundReports

- DataTable columns: Status (badge), Item name, Reported date, Contact, Description (truncated)
- Pagination, sorting by createdAt desc
- Click row → opens `FoundReportDetailModal`
- Supports URL param filter: `status`

# Feature Components

## Items

### CreateItemDialog

- Modal form: name (required), category (select or create new), description, serial number
- Uses `useCreateItem()`, `useCategories()`, `useCreateCategory()`
- On success → notification + callback

### EditGearDialog

- Same fields as create, pre-populated from item
- Uses `useUpdateItem()`, `useCategories()`, `useCreateCategory()`

### QrTagSection

- **If QR exists:** shows QR code SVG (160×160), nanoid text, "Remove QR" button
- **If no QR:** `QrScanner` for scanning + manual nanoid input (6 chars) + "Assign" button
- Confirm dialogs for: assign, remove, reassign (conflict)
- Uses `useAssignQr()`, `useUnassignQr()`

### ActivityHistory

- Builds activity entries from item loan/report data
- DataTable columns: Event (chip, color-coded), Date, User
- Event types: Created, Checked Out, Returned, Loan Cancelled, Found Report Filed
- Sorted by timestamp descending
- Click row → opens `ActivityDetailModal`

### ActivityDetailModal

- Event type chip, date/time, user (clickable → admin users)
- Contact info, description (if present)
- Location minimap with copyable coordinates

## Loans

### LoanDetailModal

- Item name (clickable → item detail), borrower, status badge
- Checkout date, due date, return date (if returned)
- Checkout location minimap, return location minimap (if returned)
- **Active loan actions:**
  - "Return" (own loan) → geolocation → confirm
  - "Cancel" (admin, any loan) → confirm
  - "Extend" → dialog for days (1–30)
- Uses `useReturnLoan()`, `useCancelLoan()`, `useExtendLoan()`, `useGeolocation()`, `useAuth()`

## Users

### UserDetailModal

- Full name, email, role, active status, joined date
- Active loans list (if any, clickable → `LoanDetailModal`)
- Actions: toggle role (Admin/Member), toggle active status, delete user
- Confirm dialogs for deactivation and deletion
- Uses `useUpdateUser()`, `useDeleteUser()`

## Found Reports

### FoundReportDetailModal

- Item name (clickable → admin item detail), short ID, status badge
- Reported date/time, contact info, description
- Location minimap (if coordinates present)
- Closed timestamp + admin who closed (if applicable)
- "Close Report" button (if status === OPEN)
- Uses `useCloseFoundReport()`

# Reusable Components

## DataTable

Paginated, sortable table with row click support.

```jsx
<DataTable
  columns={[{ id, label, sortable?, render?, sx? }]}
  rows={array}
  totalCount={number}
  page={number}
  pageSize={number}
  sortBy={string}
  sortOrder={"asc" | "desc"}
  onPageChange={(page) => void}
  onPageSizeChange={(size) => void}
  onSortChange={(columnId, order) => void}
  onRowClick={(row) => void}
  loading={boolean}
/>
```

## ConfirmDialog

```jsx
<ConfirmDialog
  open={boolean}
  title={string}
  message={string}
  onConfirm={function}
  onCancel={function}
  confirmText={string}      // default: "Confirm"
  cancelText={string}       // default: "Cancel"
  confirmColor={string}     // default: "error"
/>
```

## StatusBadge

MUI Chip mapping status to color.

```jsx
<StatusBadge status={string} size={"small" | "medium"} />
```

| Status      | Color   |
| ----------- | ------- |
| ACTIVE      | success |
| RETURNED    | default |
| CANCELLED   | default |
| OVERDUE     | error   |
| AVAILABLE   | success |
| CHECKED_OUT | warning |
| OPEN        | warning |
| CLOSED      | default |

## EmptyState

```jsx
<EmptyState message={string} icon={Component} />
```

Defaults: message = "No data found", icon = `SearchOffIcon`.

## LocationMinimap

Leaflet map with marker at given coordinates.

```jsx
<LocationMinimap latitude={number} longitude={number} height={number} />
```

Default height: 200. Uses Carto tile layer. Displays formatted lat/lng.

## QrScanner

Camera-based QR code scanner using html5-qrcode.

```jsx
<QrScanner onScan={(nanoid) => void} children={string} {...buttonProps} />
```

- Extracts nanoid from URL path `/t/{nanoid}`
- Validates host and nanoid format (6-char alphanumeric)
- Camera preference: back/rear/environment → default
- Debounce: 2 seconds between scans
- Overlay with visual QR frame guide

## PageSkeleton

Named exports for loading states:

- `<TableSkeleton rows={5} columns={4} />` — table loading placeholder
- `<DetailSkeleton />` — detail page loading placeholder
- `<CardsSkeleton count={6} />` — grid of card loading placeholders

# Services (API Layer)

All services are in `services/*.js`. Each exports named functions that call the Axios instance and unwrap `response.data`.

## api.js (Axios Instance)

- Base URL: `VITE_API_URL`
- `setAccessToken(token)` — called by AuthContext to sync Bearer token
- `setQueryClient(qc)` — called in main.jsx for 401 cache clearing
- Request interceptor: injects `Authorization: Bearer {token}`
- Response interceptor: 401 → sign out + clear cache + redirect to `/login`

## categories.js

| Function                   | HTTP Method | Endpoint           |
| -------------------------- | ----------- | ------------------ |
| `getCategories()`          | GET         | `/categories`      |
| `createCategory(data)`     | POST        | `/categories`      |
| `updateCategory(id, data)` | PATCH       | `/categories/{id}` |
| `deleteCategory(id)`       | DELETE      | `/categories/{id}` |

## dashboard.js

| Function              | HTTP Method | Endpoint     |
| --------------------- | ----------- | ------------ |
| `getDashboardStats()` | GET         | `/dashboard` |

## items.js

| Function                  | HTTP Method | Endpoint     |
| ------------------------- | ----------- | ------------ |
| `getItems(params)`        | GET         | `/items`     |
| `getItemById(id, params)` | GET         | `/item/{id}` |
| `createItem(data)`        | POST        | `/item`      |
| `updateItem(id, data)`    | PATCH       | `/item/{id}` |
| `deleteItem(id)`          | DELETE      | `/item/{id}` |

`getItemById` supports query params: `includeLoans`, `includeFoundReports`.

## loans.js

| Function               | HTTP Method | Endpoint             |
| ---------------------- | ----------- | -------------------- |
| `createLoan(data)`     | POST        | `/loans`             |
| `getLoans(params)`     | GET         | `/loans`             |
| `getMyLoans(params)`   | GET         | `/loans/my`          |
| `returnLoan(id, data)` | POST        | `/loans/{id}/return` |
| `cancelLoan(id)`       | POST        | `/loans/{id}/cancel` |
| `extendLoan(id, data)` | PATCH       | `/loans/{id}/extend` |

## qr.js

| Function                            | HTTP Method | Endpoint          |
| ----------------------------------- | ----------- | ----------------- |
| `resolveQr(nanoid)`                 | POST        | `/qr/resolve`     |
| `createQr(nanoid)`                  | POST        | `/qr`             |
| `getQrTags(params)`                 | GET         | `/qr`             |
| `assignQr(nanoid, itemId, options)` | POST        | `/qr/assign`      |
| `unassignQr(id)`                    | DELETE      | `/qr/{id}/assign` |

## users.js

| Function               | HTTP Method | Endpoint      |
| ---------------------- | ----------- | ------------- |
| `getMe()`              | GET         | `/users/me`   |
| `updateMe(data)`       | PATCH       | `/users/me`   |
| `getUser(id)`          | GET         | `/users/{id}` |
| `getUsers(params)`     | GET         | `/users`      |
| `updateUser(id, data)` | PATCH       | `/users/{id}` |
| `deleteUser(id)`       | DELETE      | `/users/{id}` |

## foundReports.js

| Function                  | HTTP Method | Endpoint                    |
| ------------------------- | ----------- | --------------------------- |
| `createFoundReport(data)` | POST        | `/found-reports`            |
| `getFoundReports(params)` | GET         | `/found-reports`            |
| `getFoundReport(id)`      | GET         | `/found-reports/{id}`       |
| `closeFoundReport(id)`    | POST        | `/found-reports/{id}/close` |

# Hooks (Data Layer)

All hooks are in `hooks/use*.js`. Named exports wrapping React Query.

## React Query Conventions

- **staleTime:** 30s for lists, 60s for details/single resources
- **Query keys:** hierarchical `["domain", ...params]`
- **Conditional queries:** `enabled: !!id` for detail hooks
- **Mutations:** invalidate all affected query keys on success (including cross-domain)
- **Error extraction:** `err.response?.data?.message || err.message || "Fallback"`
- **Async handlers:** use `.mutateAsync()` (not `.mutate()`)

## Query Key Map

| Key Pattern                                           | Hook            | Type   |
| ----------------------------------------------------- | --------------- | ------ |
| `["categories"]`                                      | useCategories   | List   |
| `["dashboard"]`                                       | useDashboard    | Single |
| `["foundReports", params]`                            | useFoundReports | List   |
| `["foundReport", id]`                                 | useFoundReport  | Detail |
| `["items", params]`                                   | useItems        | List   |
| `["item", id, { includeLoans, includeFoundReports }]` | useItem         | Detail |
| `["loans", params]`                                   | useLoans        | List   |
| `["loans", "my", params]`                             | useMyLoans      | List   |
| `["qrTags"]`                                          | useQr hooks     | List   |
| `["users", "me"]`                                     | useMe           | Detail |
| `["users", id]`                                       | useUser         | Detail |
| `["users", "list", params]`                           | useUsers        | List   |

## Mutation Invalidation Map

| Mutation          | Invalidates                                                        |
| ----------------- | ------------------------------------------------------------------ |
| createItem        | `["items"]`, `["dashboard"]`                                       |
| updateItem        | `["items"]`, `["item"]`                                            |
| deleteItem        | `["items"]`, `["dashboard"]`                                       |
| createLoan        | `["loans"]`, `["items"]`, `["item"]`, `["dashboard"]`              |
| returnLoan        | `["loans"]`, `["items"]`, `["item"]`, `["dashboard"]`              |
| cancelLoan        | `["loans"]`, `["items"]`, `["item"]`, `["dashboard"]`              |
| extendLoan        | `["loans"]`, `["items"]`, `["item"]`                               |
| createFoundReport | `["foundReports"]`, `["dashboard"]`                                |
| closeFoundReport  | `["foundReports"]`, `["foundReport"]`, `["dashboard"]`, `["item"]` |
| assignQr          | `["qrTags"]`, `["items"]`, `["item"]`                              |
| unassignQr        | `["qrTags"]`, `["items"]`, `["item"]`                              |
| createCategory    | `["categories"]`                                                   |
| updateCategory    | `["categories"]`                                                   |
| deleteCategory    | `["categories"]`                                                   |
| updateMe          | `["users", "me"]`                                                  |
| updateUser        | `["users"]`                                                        |
| deleteUser        | `["users"]`, `["dashboard"]`                                       |

## useGeolocation (non-Query hook)

```js
const { getLocation, loading, error } = useGeolocation();
const { latitude, longitude } = await getLocation();
```

- Uses Browser Geolocation API
- Options: `enableHighAccuracy: true`, `timeout: 10000`, `maximumAge: 0`
- Returns a Promise resolving to `{ latitude, longitude }`

# Notifications

```js
const { notify } = useNotification();
notify("Success message", "success");
```

- Severity: `success` | `error` | `warning` | `info`
- Renders MUI `<Snackbar>` with `<Alert>`
- Position: top-center
- Auto-hide: 4000ms
- Variant: filled
- Ignores clickaway dismissals

# Theming

## Palette

| Token      | Value     |
| ---------- | --------- |
| primary    | `#1347e7` |
| success    | `#1c9f2b` |
| yellow     | `#fbc02d` |
| purple     | `#cf2bc0` |
| bg.default | `#fafafa` |
| bg.paper   | `#ffffff` |

## Typography

- Font family: Roboto
- All headings (h1–h6): `fontWeight: 600`

## Component Overrides

- `MuiButton`: `textTransform: none` (no uppercase)
- `MuiChip`: `variant: "filled"` by default

## Shape

- `borderRadius: 8`

# Error Handling

## API Errors

- All backend errors follow `{ error, message, details }` shape.
- Error messages extracted in handlers via triple fallback:
  ```js
  err.response?.data?.message || err.message || "Fallback text";
  ```
- Displayed to user via `useNotification()`.

## 401 Handling (Global)

- Axios response interceptor catches 401.
- Signs out via Supabase, clears React Query cache, redirects to `/login`.
- Prevents duplicate handling with a flag.

## Form Validation (Client-side)

- Name fields: regex pattern `^[A-Za-z\s\-'.]+$` (letters, spaces, hyphens, apostrophes, periods)
- Password: minimum 6 characters
- ShortId format: `{PREFIX}-{###}` (auto-formatted on input)
- Nanoid: 6 alphanumeric characters
- Loan duration: 1–30 days
- Contact info: max 500 characters
- Description: max 2000 characters

# Loading States

| Context             | Component                                   |
| ------------------- | ------------------------------------------- |
| Full page (table)   | `<TableSkeleton rows columns />`            |
| Full page (detail)  | `<DetailSkeleton />`                        |
| Full page (cards)   | `<CardsSkeleton count />`                   |
| Inline content      | MUI `<Skeleton />`                          |
| Button pending      | Disabled + `<CircularProgress size={24} />` |
| Route guard loading | `<CircularProgress />` centered             |
| Navbar auth loading | Skeleton placeholders                       |

# Environment Variables

| Variable                 | Description                                   |
| ------------------------ | --------------------------------------------- |
| `VITE_API_URL`           | Backend API base URL                          |
| `VITE_APP_URL`           | Frontend app URL                              |
| `VITE_SUPABASE_URL`      | Supabase project URL                          |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key                 |
| `VITE_FOOTER_TEXT`       | Footer text (optional, hides footer if empty) |

# Build & Dev

```bash
cd frontend
npm run dev       # Vite dev server with HMR
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

# Coding Standards

## General

- ES Modules everywhere (`type: "module"` in package.json)
- Default exports for pages and feature components
- Named exports for hooks, services, and utility functions
- MUI `sx` prop for all styling — no `styled()`, no CSS modules
- Triple fallback for error messages in handlers
- `.mutateAsync()` for async/await in mutation handlers

## Comments

- Use comments only where necessary to explain non-obvious code
- Avoid redundant or AI-generated comments

## File Organization

- One component per file
- Services: one file per domain (matches backend routes)
- Hooks: one file per domain, named `use{Domain}.js`
- Features: grouped by domain under `features/{domain}/`
- Pages: flat under `pages/`, admin pages under `pages/admin/`

## URL State Management

- Admin tables store pagination, sorting, and filter state in URL search params
- Enables shareable/bookmarkable filtered views
- Filter changes reset page to 0

# Utilities

## date.js

| Function                 | Output Format         | Example               |
| ------------------------ | --------------------- | --------------------- |
| `formatDate(d)`          | `DD/MM/YYYY`          | `31/03/2026`          |
| `formatDateTime(d)`      | `DD/MM/YYYY at HH:mm` | `31/03/2026 at 14:30` |
| `formatDayOfWeekDate(d)` | `[Weekday] DD/MM`     | `Tuesday 31/03`       |

Locale: en-GB.

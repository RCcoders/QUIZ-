# Design Document: Teacher Layout Alignment

## Overview

This design addresses two related problems in the QuizMaster teacher section:

1. **Inconsistent sidebar implementations** — `MyQuizzes` renders its own custom inline sidebar with different branding, nav items, and styling instead of using the shared `TeacherSidebar` component.
2. **Broken Library navigation** — The Library page is routed at `/library` (a public route), but the sidebar links to `/library`. There is no `/teacher/library` protected route, so the sidebar link is inconsistent with the teacher section structure.

The fix is surgical: update `TeacherSidebar` to have the correct four nav items with correct paths, add a `/teacher/library` protected route, update `MyQuizzes` to use `TeacherSidebar`, and ensure all teacher pages share the same layout shell pattern.

## Architecture

The teacher section follows a simple layout pattern:

```
App.tsx (Router)
  └── ProtectedRoute
        └── <TeacherPage>
              ├── TeacherSidebar (fixed, 240px wide)
              └── <main> (flex: 1, marginLeft: 240px)
```

All four teacher pages — `TeacherDashboard`, `MyQuizzes`, `Reports`, `Library` — must conform to this pattern. No page should define its own sidebar.

```mermaid
graph TD
    A[App.tsx Router] --> B[/teacher → TeacherDashboard]
    A --> C[/teacher/my-quizzes → MyQuizzes]
    A --> D[/teacher/reports → Reports]
    A --> E[/teacher/library → Library]
    B --> F[TeacherSidebar]
    C --> F
    D --> F
    E --> F
    F --> G[Dashboard link → /teacher]
    F --> H[My Quizzes link → /teacher/my-quizzes]
    F --> I[Reports link → /teacher/reports]
    F --> J[Library link → /teacher/library]
```

## Components and Interfaces

### TeacherSidebar (modified)

The `navItems` array is the only structural change needed:

```typescript
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',   path: '/teacher' },
  { icon: BookOpen,        label: 'My Quizzes',  path: '/teacher/my-quizzes' },
  { icon: BarChart2,       label: 'Reports',     path: '/teacher/reports' },
  { icon: Library,         label: 'Library',     path: '/teacher/library' },
];
```

Remove: `{ icon: Users, label: 'Students', path: '#' }`

No other changes to `TeacherSidebar` are needed — the existing styling, active state logic, Pro Tip card, and sign-out button remain unchanged.

### MyQuizzes (modified)

Remove the entire inline `<aside>` block (lines ~65–110 in the current file) and replace the outer layout with the standard teacher shell:

```tsx
// Before
<div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
  <aside style={{ width: 200, ... }}>
    {/* custom inline sidebar */}
  </aside>
  <div style={{ marginLeft: 200, ... }}>

// After
<div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5F5' }}>
  <TeacherSidebar />
  <main style={{ flex: 1, marginLeft: '240px', padding: '0 2rem 2rem', minWidth: 0 }}>
```

The `NAV_ITEMS` constant and the `signOut`/`displayName` usage in the old sidebar footer can be removed from `MyQuizzes` since `TeacherSidebar` handles those.

### App.tsx (modified)

Two changes:

1. Add `/teacher/library` protected route:
```tsx
<Route
  path="/teacher/library"
  element={
    <ProtectedRoute>
      <Library />
    </ProtectedRoute>
  }
/>
```

2. Update `hideNavbar` to include `/teacher/library`:
```tsx
const hideNavbar = location.pathname === '/' 
  || location.pathname.startsWith('/teacher') 
  || location.pathname === '/library';
```
Note: `/teacher/library` is already covered by `startsWith('/teacher')`, so this is already handled correctly once the route is added.

## Data Models

No data model changes are required. This feature is purely a layout/routing concern.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: TeacherSidebar renders exactly four nav items with correct labels

*For any* render of `TeacherSidebar`, the component should contain exactly four navigation links with labels "Dashboard", "My Quizzes", "Reports", and "Library" — and no "Students" link.

**Validates: Requirements 1.1, 1.5**

### Property 2: TeacherSidebar nav items link to correct paths

*For any* render of `TeacherSidebar`, each nav item's `href` should match: Dashboard → `/teacher`, My Quizzes → `/teacher/my-quizzes`, Reports → `/teacher/reports`, Library → `/teacher/library`.

**Validates: Requirements 1.4**

### Property 3: Active nav item matches current route

*For any* route within the teacher section, the nav item whose path matches the current route should have the active background color (`#FFF3EE`) and text color (`#FF5C1A`), while all other items should not.

**Validates: Requirements 1.3**

### Property 4: All teacher pages use TeacherSidebar with correct main content offset

*For any* teacher page (Dashboard, MyQuizzes, Reports, Library), the rendered output should include a `TeacherSidebar` component and a main content area with `marginLeft: 240px`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 5: All teacher pages share consistent background and padding

*For any* teacher page, the outermost wrapper should have `background: #F5F5F5` and the main content area should have `padding: 0 2rem 2rem`.

**Validates: Requirements 4.1, 4.4**

## Error Handling

- If `TeacherSidebar` is rendered outside a `BrowserRouter` context, `NavLink` will throw. This is already handled by `App.tsx` wrapping everything in `BrowserRouter`.
- If a user navigates to `/teacher/library` without authentication, `ProtectedRoute` redirects to `/auth`. No additional error handling needed.
- The old `/library` public route remains in place so that any existing bookmarks or student-facing links to `/library` continue to work.

## Testing Strategy

### Unit Tests

- Render `TeacherSidebar` and assert: exactly 4 nav items, correct labels, correct `href` values, no "Students" item.
- Render `TeacherSidebar` with a mocked router at `/teacher/my-quizzes` and assert the "My Quizzes" item has active styles.
- Render `MyQuizzes` and assert `TeacherSidebar` is present and no inline `<aside>` with custom branding exists.

### Property-Based Tests

Property tests are less applicable here since the changes are deterministic structural fixes rather than data-transformation logic. The correctness properties above are best validated as targeted unit/integration tests rather than randomized property tests.

- **Property 1 & 2**: Single render assertion (example test) — the nav items are a static constant, not derived from dynamic input.
- **Property 3**: Parameterized test across the four known routes — render sidebar at each route, assert correct active item.
- **Property 4 & 5**: Parameterized test across the four teacher page components — render each, assert layout structure.

### Integration Tests

- Navigate to `/teacher/library` in a test environment with an authenticated user and assert the Library page renders with `TeacherSidebar`.
- Navigate to `/teacher/library` without authentication and assert redirect to `/auth`.

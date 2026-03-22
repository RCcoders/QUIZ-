# Implementation Plan: Teacher Layout Alignment

## Overview

Fix layout inconsistencies across teacher pages by: updating `TeacherSidebar` to have the correct four nav items, adding a `/teacher/library` protected route, and refactoring `MyQuizzes` to use `TeacherSidebar` instead of its custom inline sidebar.

## Tasks

- [x] 1. Update TeacherSidebar nav items
  - Replace the `navItems` array in `src/components/TeacherSidebar.tsx` with exactly four items: Dashboard (`/teacher`), My Quizzes (`/teacher/my-quizzes`), Reports (`/teacher/reports`), Library (`/teacher/library`)
  - Remove the "Students" item that links to `#`
  - Remove the unused `Users` icon import if no longer needed
  - _Requirements: 1.1, 1.4, 1.5_

  - [x] 1.1 Write unit tests for TeacherSidebar nav items
    - Render `TeacherSidebar` and assert exactly 4 nav items with correct labels and `href` values
    - Assert no "Students" item is present
    - **Property 1: TeacherSidebar renders exactly four nav items with correct labels**
    - **Property 2: TeacherSidebar nav items link to correct paths**
    - **Validates: Requirements 1.1, 1.4, 1.5**

- [x] 2. Add /teacher/library protected route in App.tsx
  - Import `Library` is already present; add a new `<Route path="/teacher/library">` wrapped in `<ProtectedRoute>` that renders `<Library />`
  - Verify the `hideNavbar` logic already covers `/teacher/library` via `startsWith('/teacher')`
  - _Requirements: 3.1, 3.3, 3.4_

  - [x] 2.1 Write unit test for /teacher/library route
    - Render the app at `/teacher/library` with an authenticated user and assert the Library component is present
    - Render the app at `/teacher/library` without authentication and assert redirect to `/auth`
    - **Validates: Requirements 3.1, 3.4**

- [x] 3. Refactor MyQuizzes to use TeacherSidebar
  - Remove the inline `<aside>` block and its associated `NAV_ITEMS` constant from `src/pages/MyQuizzes.tsx`
  - Import and render `TeacherSidebar` at the top of the layout
  - Update the outer wrapper: change `background` to `#F5F5F5`, change `marginLeft` from `200` to `240px`
  - Update the `<main>` content area to use `padding: '0 2rem 2rem'`
  - Remove the `signOut` and `displayName` usage that was only needed for the old sidebar footer
  - _Requirements: 2.1, 4.1, 4.4_

  - [x] 3.1 Write unit test for MyQuizzes layout
    - Render `MyQuizzes` and assert `TeacherSidebar` is present in the output
    - Assert no element with text "The Curated Classroom" (old inline sidebar branding) is present
    - Assert the main content wrapper has `marginLeft: 240px` and `background: #F5F5F5`
    - **Property 4: All teacher pages use TeacherSidebar with correct main content offset**
    - **Property 5: All teacher pages share consistent background and padding**
    - **Validates: Requirements 2.1, 4.1, 4.4**

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Verify layout consistency across all teacher pages
  - Confirm `TeacherDashboard`, `Reports`, and `Library` already use `TeacherSidebar` with `marginLeft: 240px` and `background: #F5F5F5` and `padding: '0 2rem 2rem'`
  - If any page deviates, update it to match the standard layout shell
  - _Requirements: 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4_

  - [x] 5.1 Write parameterized layout tests for all teacher pages
    - For each of TeacherDashboard, Reports, Library: render the page and assert TeacherSidebar is present, main content has `marginLeft: 240px`, wrapper has `background: #F5F5F5`
    - **Property 4: All teacher pages use TeacherSidebar with correct main content offset**
    - **Property 5: All teacher pages share consistent background and padding**
    - **Validates: Requirements 2.2, 2.3, 2.4, 4.1, 4.4**

- [ ] 6. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster fix
- The public `/library` route in `App.tsx` should remain untouched — it serves student/public users
- The `TeacherSidebar` active state logic uses `NavLink` from react-router-dom and already works correctly; no changes needed there beyond updating the paths

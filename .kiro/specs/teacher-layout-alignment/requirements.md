# Requirements Document

## Introduction

This feature addresses layout alignment inconsistencies across the QuizMaster application and establishes a consistent, unified navigation structure for the teacher section. Currently, the teacher pages use different sidebar implementations — `MyQuizzes` has its own custom inline sidebar while other pages use `TeacherSidebar`. The Library page is also routed outside the teacher section (`/library` instead of `/teacher/library`), causing broken navigation links. This feature standardizes all teacher pages to use a single shared sidebar with four sections: Dashboard, My Quizzes, Reports, and Library.

## Glossary

- **TeacherSidebar**: The shared sidebar component used across all teacher-facing pages
- **Teacher Section**: The set of protected pages accessible to authenticated teachers, rooted at `/teacher`
- **Layout Shell**: The outer wrapper combining `TeacherSidebar` and a main content area
- **Teacher Page**: Any page rendered under the `/teacher` route prefix
- **Active Route**: The currently selected navigation item, visually highlighted in the sidebar

## Requirements

### Requirement 1: Unified Teacher Sidebar Navigation

**User Story:** As a teacher, I want a consistent sidebar navigation across all teacher pages, so that I can move between sections without disorientation.

#### Acceptance Criteria

1. THE TeacherSidebar SHALL display exactly four navigation items: Dashboard, My Quizzes, Reports, and Library
2. WHEN a teacher navigates to any teacher page, THE TeacherSidebar SHALL be visible on the left side of the screen
3. WHEN a teacher clicks a navigation item, THE TeacherSidebar SHALL highlight the item corresponding to the current route as active
4. THE TeacherSidebar SHALL link Dashboard to `/teacher`, My Quizzes to `/teacher/my-quizzes`, Reports to `/teacher/reports`, and Library to `/teacher/library`
5. THE TeacherSidebar SHALL NOT display a "Students" navigation item

### Requirement 2: Consistent Teacher Page Layout

**User Story:** As a teacher, I want all teacher pages to share the same layout structure, so that the interface feels cohesive and predictable.

#### Acceptance Criteria

1. THE MyQuizzes page SHALL use TeacherSidebar instead of its own inline sidebar implementation
2. THE TeacherDashboard page SHALL use TeacherSidebar with a main content area offset by the sidebar width of 240px
3. THE Reports page SHALL use TeacherSidebar with a main content area offset by the sidebar width of 240px
4. THE Library page SHALL use TeacherSidebar with a main content area offset by the sidebar width of 240px
5. WHEN TeacherSidebar is rendered, THE Layout SHALL apply a left margin of 240px to the main content area to prevent content from being hidden behind the fixed sidebar

### Requirement 3: Library Route Under Teacher Section

**User Story:** As a teacher, I want the Library to be accessible from the teacher navigation, so that I can browse community quizzes without leaving the teacher interface.

#### Acceptance Criteria

1. THE App SHALL register a protected route at `/teacher/library` that renders the Library page
2. WHEN a teacher navigates to `/teacher/library`, THE Library page SHALL render with TeacherSidebar visible
3. THE App SHALL hide the top Navbar on the `/teacher/library` route
4. IF a user is not authenticated and navigates to `/teacher/library`, THEN THE App SHALL redirect the user to the authentication page

### Requirement 4: Page Alignment Consistency

**User Story:** As a teacher, I want all teacher pages to have consistent spacing and alignment, so that the interface looks professional and polished.

#### Acceptance Criteria

1. THE main content area on all teacher pages SHALL use consistent padding of `0 2rem 2rem`
2. THE top bar on all teacher pages SHALL use consistent padding of `20px 0` with a bottom border of `1px solid #E5E7EB`
3. WHEN the viewport is rendered, THE TeacherSidebar SHALL remain fixed at the left edge and not scroll with page content
4. THE background color of all teacher pages SHALL be `#F5F5F5`

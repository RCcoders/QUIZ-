# Bugfix Requirements Document

## Introduction

After a successful login, users are redirected to the wrong dashboard based on the UI role toggle selection rather than their actual account role. A teacher who logs in with the "Student" toggle selected gets sent to `/student/dashboard`, which then bounces them to `/teacher` via `StudentRoute`. The reverse also happens for students landing on teacher-protected routes. This creates a redirect loop or lands users on the wrong page, and the issue recurs because the login page uses its local `role` state for navigation instead of the authenticated user's actual role from `AuthContext`.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a teacher account signs in with the "Student" role toggle selected THEN the system redirects to `/student/dashboard` instead of `/teacher`

1.2 WHEN a student account signs in with the "Teacher" role toggle selected THEN the system redirects to `/teacher` instead of `/student/dashboard`

1.3 WHEN sign-in succeeds via email/password THEN the system navigates using the UI toggle `role` state rather than the authenticated user's actual role stored in `AuthContext`

1.4 WHEN sign-in succeeds via Google THEN the system navigates using the UI toggle `role` state rather than the authenticated user's actual role stored in `AuthContext`

1.5 WHEN a user is already authenticated and the `LoginPage` mounts THEN the system may redirect to the wrong route if `userProfile` is still `null` during the loading phase

### Expected Behavior (Correct)

2.1 WHEN a teacher account signs in with any role toggle selection THEN the system SHALL redirect to `/teacher`

2.2 WHEN a student account signs in with any role toggle selection THEN the system SHALL redirect to `/student/dashboard`

2.3 WHEN sign-in succeeds via email/password THEN the system SHALL navigate using the authenticated user's actual role from `AuthContext` (not the UI toggle state)

2.4 WHEN sign-in succeeds via Google THEN the system SHALL navigate using the authenticated user's actual role from `AuthContext` (not the UI toggle state)

2.5 WHEN a user is already authenticated and `userProfile` is available THEN the system SHALL redirect to the correct route for their actual role

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an unauthenticated user visits a protected teacher route THEN the system SHALL CONTINUE TO redirect them to `/auth`

3.2 WHEN an unauthenticated user visits a protected student route THEN the system SHALL CONTINUE TO redirect them to `/login`

3.3 WHEN a student attempts to access a teacher-protected route after login THEN the system SHALL CONTINUE TO redirect them to `/student/dashboard`

3.4 WHEN a teacher attempts to access a student-protected route after login THEN the system SHALL CONTINUE TO redirect them to `/teacher`

3.5 WHEN a user signs out THEN the system SHALL CONTINUE TO clear the stored role and redirect to the landing page

3.6 WHEN a new user signs up with a selected role THEN the system SHALL CONTINUE TO store that role and redirect correctly

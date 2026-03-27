# Role-Switching Login Bug — Tasks

## Tasks

- [x] 1. Write exploratory tests to confirm the bug on unfixed code
  - [x] 1.1 Write test: teacher signs in with student toggle → assert navigate called with `/student/dashboard` (wrong)
  - [x] 1.2 Write test: student signs in with teacher toggle → assert navigate called with `/teacher` (wrong)
  - [x] 1.3 Write test: Google sign-in with mismatched toggle → assert wrong path used
  - [x] 1.4 Write test: already-authenticated user mounts LoginPage with userProfile=null → assert no redirect fires
  - [x] 1.5 Run tests against unfixed code and confirm all exploratory tests fail as expected

- [x] 2. Fix AuthContext to populate userProfile after authentication
  - [x] 2.1 After `onAuthStateChanged` fires with a valid Firebase user, construct and set a `UserProfile` object using the role from `localStorage` (or default `'student'`)
  - [x] 2.2 After `signIn` and `signInWithGoogle` resolve successfully, ensure `userProfile` is set with the correct role
  - [x] 2.3 Verify `userProfile` is cleared to `null` on sign-out (already done, confirm unchanged)

- [x] 3. Fix LoginPage to navigate using actual account role
  - [x] 3.1 Remove `navigate(getRedirectPath(role), { replace: true })` from `handleSubmit` success branch
  - [x] 3.2 Remove `navigate(getRedirectPath(role), { replace: true })` from `handleGoogleSignIn` success branch
  - [x] 3.3 Update the `useEffect` guard from `if (user && userProfile)` to `if (user && userProfile && !loading)` to ensure it fires once auth resolves
  - [x] 3.4 Confirm the `useEffect` now drives all post-login navigation via `getRedirectPath(userProfile.role)`

- [x] 4. Write fix-checking tests (Property 1)
  - [x] 4.1 Write test: teacher account + student toggle → after fix, navigate called with `/teacher`
  - [x] 4.2 Write test: student account + teacher toggle → after fix, navigate called with `/student/dashboard`
  - [x] 4.3 Write test: Google sign-in with mismatched toggle → after fix, navigate uses actual role
  - [x] 4.4 Write test: already-authenticated user mounts LoginPage → useEffect fires redirect to correct route

- [x] 5. Write preservation-checking tests (Property 2)
  - [x] 5.1 Write test: `ProtectedRoute` — unauthenticated user redirects to `/auth` (unchanged)
  - [x] 5.2 Write test: `ProtectedRoute` — student redirects to `/student/dashboard` (unchanged)
  - [x] 5.3 Write test: `ProtectedRoute` — teacher renders children (unchanged)
  - [x] 5.4 Write test: `StudentRoute` — unauthenticated user redirects to `/login` (unchanged)
  - [x] 5.5 Write test: `StudentRoute` — teacher redirects to `/teacher` (unchanged)
  - [x] 5.6 Write test: `StudentRoute` — student renders children (unchanged)
  - [x] 5.7 Write test: sign-out clears `localStorage` role and sets user to null (unchanged)

- [x] 6. Run all tests and verify
  - [x] 6.1 Run the full test suite and confirm exploratory tests now pass (bug is fixed)
  - [x] 6.2 Confirm all preservation tests pass (no regressions)
  - [x] 6.3 Confirm no existing tests were broken by the changes

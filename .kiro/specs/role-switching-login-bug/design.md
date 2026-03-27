# Role-Switching Login Bug — Bugfix Design

## Overview

After a successful login, `LoginPage` navigates using its local `role` state (the UI toggle) instead of the authenticated user's actual role from `AuthContext`. This means a teacher who logs in with the "Student" toggle selected gets sent to `/student/dashboard`, which then bounces them back to `/teacher` via `StudentRoute`. The fix is to remove the post-sign-in `navigate()` calls from `LoginPage` and rely entirely on the `useEffect` that watches `user` + `userProfile` — but that requires `AuthContext` to actually populate `userProfile` with the real role from Firestore/storage, which it currently does not do.

The root cause is two-fold:
1. `LoginPage.handleSubmit` and `handleGoogleSignIn` call `navigate(getRedirectPath(role))` using the UI toggle state immediately after sign-in succeeds, before `AuthContext` has resolved the real role.
2. `AuthContext` never populates `userProfile` — it is always `null` — so the `useEffect` redirect guard in `LoginPage` never fires for already-authenticated users either.

## Glossary

- **Bug_Condition (C)**: Sign-in succeeds AND the navigation target is derived from the UI toggle `role` state rather than the authenticated user's actual role
- **Property (P)**: After sign-in, the user is redirected to the route matching their actual account role (`userProfile.role`)
- **Preservation**: Route guards (`ProtectedRoute`, `StudentRoute`), sign-out behavior, and sign-up flow must remain unchanged
- **LoginPage**: `src/pages/LoginPage.tsx` — renders the login form and handles post-login navigation
- **AuthContext**: `src/contexts/AuthContext.tsx` — manages Firebase auth state; exposes `user`, `userProfile`, `loading`
- **userProfile**: The `UserProfile | null` value in `AuthContext`; currently always `null` because `AuthContext` never sets it after sign-in
- **role (UI toggle)**: Local `useState` in `LoginPage` — reflects which toggle button the user clicked, NOT their account role
- **getRedirectPath**: `src/utils/scoring.ts` — maps a role string to the correct dashboard path
- **ProtectedRoute**: `src/components/ProtectedRoute.tsx` — guards teacher routes; redirects students to `/student/dashboard`
- **StudentRoute**: `src/components/StudentRoute.tsx` — guards student routes; redirects teachers to `/teacher`

## Bug Details

### Bug Condition

The bug manifests when sign-in succeeds (email/password or Google) and `LoginPage` immediately calls `navigate(getRedirectPath(role))` where `role` is the local UI toggle state. The authenticated user's actual role (stored in `localStorage` as `userRole` and read by `AuthContext`) is ignored at this point.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { signInMethod: 'email' | 'google', uiToggleRole: 'student' | 'teacher', actualAccountRole: 'student' | 'teacher' }
  OUTPUT: boolean

  RETURN signInSucceeded(input)
         AND input.uiToggleRole != input.actualAccountRole
         AND navigatedTo(getRedirectPath(input.uiToggleRole))   // wrong path used
END FUNCTION
```

### Examples

- Teacher account logs in with "Student" toggle → navigated to `/student/dashboard` → `StudentRoute` bounces them to `/teacher` (redirect loop / flash)
- Student account logs in with "Teacher" toggle → navigated to `/teacher` → `ProtectedRoute` bounces them to `/student/dashboard`
- Already-authenticated teacher refreshes `/login` with `userProfile === null` → `useEffect` never fires → no redirect (stuck on login page)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `ProtectedRoute` must continue redirecting unauthenticated users to `/auth` and students to `/student/dashboard`
- `StudentRoute` must continue redirecting unauthenticated users to `/login` and teachers to `/teacher`
- Sign-out must continue clearing `localStorage` role and resetting auth state
- Sign-up flow (`SignupPage`) must continue storing the selected role and redirecting correctly
- The UI role toggle on `LoginPage` may remain for UX purposes but must not influence post-login navigation

**Scope:**
All behaviors that do NOT involve post-login navigation in `LoginPage` are unaffected. This includes:
- Route guard logic in `ProtectedRoute` and `StudentRoute`
- `AuthContext.signOut` behavior
- `AuthContext.signUp` behavior
- Any page that does not call `navigate(getRedirectPath(role))` with the UI toggle state

## Hypothesized Root Cause

1. **LoginPage uses UI toggle for navigation**: In `handleSubmit` and `handleGoogleSignIn`, after a successful sign-in the code calls `navigate(getRedirectPath(role))` where `role` is the local `useState` variable (the toggle), not the account role. This is the primary defect.

2. **AuthContext never sets userProfile**: `AuthContext` reads `localStorage.getItem('userRole')` and sets `user.role`, but `userProfile` is initialized to `null` and never updated after sign-in. The `useEffect` in `LoginPage` that watches `user && userProfile` therefore never triggers for a fresh sign-in, leaving the immediate `navigate()` call as the only redirect mechanism — and it uses the wrong role.

3. **Race condition on already-authenticated mount**: When `LoginPage` mounts for an already-authenticated user, `userProfile` is `null` so the `useEffect` guard does nothing. The user stays on the login page until they interact.

4. **localStorage role not synchronized with UI toggle**: `AuthContext.signIn` reads `localStorage.getItem('userRole')` to set the role on the `user` object, but `LoginPage` never writes the UI toggle value to `localStorage` before calling `signIn`. So even `user.role` may be stale from a previous session.

## Correctness Properties

Property 1: Bug Condition - Post-Login Navigation Uses Actual Account Role

_For any_ sign-in attempt where the UI toggle role differs from the authenticated user's actual account role (isBugCondition returns true), the fixed `LoginPage` SHALL redirect to the route corresponding to the user's actual account role (`getRedirectPath(actualRole)`), not the UI toggle role.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Login Navigation Behavior Unchanged

_For any_ navigation event that does NOT originate from a post-login redirect in `LoginPage` (isBugCondition returns false), the fixed code SHALL produce exactly the same behavior as the original code, preserving all route guard redirects, sign-out flows, and sign-up flows.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

**File**: `src/pages/LoginPage.tsx`

**Specific Changes**:

1. **Remove immediate `navigate()` after sign-in**: Delete the `navigate(getRedirectPath(role), { replace: true })` calls in both `handleSubmit` and `handleGoogleSignIn`. Post-login navigation should be driven by the `useEffect` that watches `user` and `userProfile`.

2. **Fix the `useEffect` redirect to not require `userProfile`**: Since `userProfile` is always `null`, the guard `if (user && userProfile)` never fires. Change it to `if (user && !loading)` and derive the redirect path from `user.role` (which `AuthContext` sets from `localStorage`).

**File**: `src/contexts/AuthContext.tsx`

**Specific Changes**:

3. **Write the correct role to localStorage before sign-in resolves**: The `signIn` and `signInWithGoogle` methods currently read `localStorage.getItem('userRole')` after Firebase resolves. This is fine for returning users, but for the fix to work end-to-end, the `LoginPage` must pass the actual stored role or `AuthContext` must expose a way to set it. Since `LoginPage` no longer controls navigation, `AuthContext` just needs to reliably expose `user.role` from `localStorage`.

4. **Populate `userProfile` from `user.role`**: After `onAuthStateChanged` fires and `user` is set, construct a minimal `UserProfile` object from the stored role so the `LoginPage` `useEffect` can use it. This also fixes the already-authenticated mount case (requirement 2.5).

**File**: `src/pages/LoginPage.tsx` (secondary)

5. **Update `useEffect` dependency**: Change `if (user && userProfile)` to `if (user && userProfile && !loading)` once `AuthContext` populates `userProfile`, ensuring the redirect fires as soon as auth state resolves.

### Summary of Navigation Flow After Fix

```
User submits form
  → signIn() / signInWithGoogle() resolves (no navigate call)
  → AuthContext sets user + userProfile with actual role from localStorage
  → LoginPage useEffect fires: navigate(getRedirectPath(userProfile.role))
  → Correct dashboard for actual role
```

## Testing Strategy

### Validation Approach

Two-phase: first run exploratory tests on unfixed code to confirm the bug and root cause, then verify the fix and preservation.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples demonstrating the bug on unfixed code. Confirm that `LoginPage` navigates using the UI toggle role, not the account role.

**Test Plan**: Mock `AuthContext` to return a user with `role: 'teacher'` after sign-in, set the UI toggle to `'student'`, submit the form, and assert the navigation target.

**Test Cases**:
1. **Teacher signs in with Student toggle**: Mock `signIn` success + `user.role = 'teacher'`, toggle = `'student'` → assert `navigate` called with `/student/dashboard` (bug: should be `/teacher`)
2. **Student signs in with Teacher toggle**: Mock `signIn` success + `user.role = 'student'`, toggle = `'teacher'` → assert `navigate` called with `/teacher` (bug: should be `/student/dashboard`)
3. **Google sign-in with wrong toggle**: Same as above but via `handleGoogleSignIn`
4. **Already-authenticated user on mount**: `user` set, `userProfile = null` → assert no redirect fires (bug: stuck on login)

**Expected Counterexamples**:
- `navigate` is called with the toggle role path, not the account role path
- The `useEffect` never fires because `userProfile` is always `null`

### Fix Checking

**Goal**: Verify that after the fix, all buggy inputs produce the correct navigation target.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := LoginPage_fixed(input)
  ASSERT navigatedTo(getRedirectPath(input.actualAccountRole))
END FOR
```

### Preservation Checking

**Goal**: Verify that non-login navigation (route guards, sign-out, sign-up) is completely unaffected.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT ProtectedRoute_original(input) = ProtectedRoute_fixed(input)
  ASSERT StudentRoute_original(input) = StudentRoute_fixed(input)
  ASSERT signOut_original() = signOut_fixed()
END FOR
```

**Testing Approach**: Property-based testing for route guard behavior across many random auth states.

**Test Cases**:
1. **ProtectedRoute preservation**: Unauthenticated → `/auth`; student → `/student/dashboard`; teacher → renders children
2. **StudentRoute preservation**: Unauthenticated → `/login`; teacher → `/teacher`; student → renders children
3. **Sign-out preservation**: After `signOut()`, `user` is null and `localStorage` role is cleared
4. **Sign-up preservation**: `signUp()` stores the provided role and `user.role` reflects it

### Unit Tests

- `LoginPage`: after successful sign-in, `navigate` is called with `getRedirectPath(user.role)` not `getRedirectPath(uiToggleRole)`
- `LoginPage`: `useEffect` fires redirect when `user` and `userProfile` are both set
- `AuthContext`: `signIn` sets `user.role` from `localStorage`
- `AuthContext`: `userProfile` is populated after `onAuthStateChanged` fires

### Property-Based Tests

- Generate random `(uiToggleRole, actualAccountRole)` pairs and verify post-login navigation always uses `actualAccountRole`
- Generate random auth states and verify `ProtectedRoute` and `StudentRoute` behavior is unchanged
- Generate random role values and verify `getRedirectPath` returns consistent paths

### Integration Tests

- Full login flow: teacher account + student toggle → lands on `/teacher`
- Full login flow: student account + teacher toggle → lands on `/student/dashboard`
- Already-authenticated user visits `/login` → redirected to correct dashboard immediately
- Sign-out then sign-in with different toggle → correct dashboard for account role

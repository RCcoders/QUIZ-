# Implementation Plan: Profile Settings Redesign

## Overview

Modernise `ProfileEditor`, `StudentSettings`, and `TeacherSettings` with a profile hero section, live avatar preview, inline validation, a unified toast system, and role-appropriate theming. A new `SettingsToast` component is introduced; no new routes or Firestore collections are needed.

## Tasks

- [ ] 1. Create `SettingsToast` component
  - Create `src/components/SettingsToast.tsx` with `SettingsToastProps` interface (`message`, `type`, `onDismiss`, `autoDismissMs`)
  - Position fixed `bottom-6 right-6 z-50`; success auto-dismisses after 3 000 ms, error persists until user clicks ×
  - _Requirements: 4.1, 4.2, 4.4_

  - [ ]* 1.1 Write property test for at-most-one toast
    - **Property 7: At most one toast visible at a time**
    - **Validates: Requirements 4.3**
    - File: `src/pages/Settings.property.test.ts`

- [ ] 2. Add `getInitialsAvatar` utility and create `ProfileHero` component
  - Add `getInitialsAvatar(displayName: string): string` helper (first letter of each word, max 2 chars, uppercased) to `src/utils/scoring.ts` or a new `src/utils/avatarUtils.ts`
  - Create `src/components/ProfileHero.tsx` with `ProfileHeroProps` interface (`displayName`, `avatarUrl`, `role`, `streak`)
  - Render 80 × 80 px circular avatar (image or initials fallback), display name heading, role badge, and streak with flame icon
  - Apply `#6366F1` border/badge for student, `#FF5C1A` for teacher
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 2.1 Write property test for initials derivation
    - **Property 1: Initials derived from display name**
    - **Validates: Requirements 1.3, 2.2**
    - File: `src/components/ProfileEditor.property.test.ts`

  - [ ]* 2.2 Write property test for ProfileHero streak rendering
    - **Property 3: Profile Hero renders streak value**
    - **Validates: Requirements 1.6**
    - File: `src/pages/Settings.property.test.ts`

- [ ] 3. Update `ProfileEditor` with live avatar preview and on-blur validation
  - Update `ProfileEditorProps` to replace internal success/error UI with `onSaved?: (message: string) => void` and `onError?: (message: string) => void` callbacks
  - Add debounced (300 ms) avatar URL preview: 64 × 64 px circle next to the URL input; fall back to `InitialsAvatar` when URL is empty or image fails to load
  - Change display name validation to fire on blur (not on change); show inline errors per requirements 3.1 and 3.2
  - Disable save button while a validation error is present
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.1 Write property test for avatar preview URL binding
    - **Property 4: Avatar preview updates with URL input**
    - **Validates: Requirements 2.1**
    - File: `src/components/ProfileEditor.property.test.ts`

  - [ ]* 3.2 Write property test for validation error disables save
    - **Property 5: Validation error disables save and clears on valid input**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - File: `src/components/ProfileEditor.property.test.ts`

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Redesign `StudentSettings` page
  - Replace the plain `<h1>Settings</h1>` header with the new `ProfileHero` component (reads from `userProfile` via `useAuth()`)
  - Replace inline success/error messages in the profile section with `SettingsToast` managed at page level (single `useState<ToastState | null>`)
  - Wire `ProfileEditor`'s `onSaved` / `onError` callbacks to show the page-level toast
  - Replace inline success/error in the password section with toast callbacks; implement reauthentication before `updatePassword`
  - Replace inline success/error in the notifications section with toast callbacks; keep revert-on-failure logic
  - Apply Student_Theme: dark gradient background, indigo accents, `rounded-2xl` cards, Inter font
  - Ensure `StudentNavbar` is rendered and page title is "Settings – QuizMaster"
  - _Requirements: 1.1–1.8, 4.1–4.4, 5.1–5.5, 6.1–6.4, 8.1, 8.3, 8.4, 8.5, 9.1, 9.2, 10.1_

  - [ ]* 5.1 Write unit tests for StudentSettings
    - Test `StudentNavbar` is rendered, page title is set, `ProfileHero` is present, toast appears on save success/failure
    - _Requirements: 8.5, 10.1, 4.1, 4.2_

  - [ ]* 5.2 Write property test for short password rejection
    - **Property 6: Short passwords are rejected**
    - **Validates: Requirements 5.3**
    - File: `src/pages/Settings.property.test.ts`

  - [ ]* 5.3 Write property test for notification toggle Firestore persistence
    - **Property 8: Notification toggle persists to Firestore**
    - **Validates: Requirements 6.2, 6.3**
    - File: `src/pages/Settings.property.test.ts`

- [ ] 6. Redesign `TeacherSettings` page
  - Replace the plain `<h1>Settings</h1>` header with the new `ProfileHero` component
  - Replace inline success/error messages with `SettingsToast` at page level
  - Wire `ProfileEditor`'s `onSaved` / `onError` callbacks to the page-level toast
  - Replace inline success/error in the password section with toast callbacks; keep reauthentication logic
  - Replace inline success/error in the class preferences section with toast callbacks; add >50-char inline validation
  - Pre-populate Default Subject input from `userProfile.defaultSubject`
  - Apply Teacher_Theme: white sidebar, orange accents, light grey background, `rounded-2xl` cards, Inter font
  - Ensure `TeacherSidebar` is rendered and page title is "Settings – QuizMaster"
  - _Requirements: 1.1–1.8, 4.1–4.4, 5.1–5.5, 7.1–7.5, 8.2, 8.3, 8.4, 8.6, 9.1, 9.2, 9.3, 10.1_

  - [ ]* 6.1 Write unit tests for TeacherSettings
    - Test `TeacherSidebar` is rendered, page title is set, `ProfileHero` is present, toast appears on save success/failure
    - _Requirements: 8.6, 10.1, 4.1, 4.2_

  - [ ]* 6.2 Write property test for default subject pre-population
    - **Property 9: Default subject pre-populated from UserProfile**
    - **Validates: Requirements 7.2**
    - File: `src/pages/Settings.property.test.ts`

  - [ ]* 6.3 Write property test for default subject length validation
    - **Property 10: Default subject length validation**
    - **Validates: Requirements 7.3**
    - File: `src/pages/Settings.property.test.ts`

- [ ] 7. Responsive layout adjustments
  - Ensure single-column layout below 768 px for both pages
  - Hide `TeacherSidebar` below 768 px and provide equivalent mobile navigation
  - Stack `ProfileHero` avatar and text vertically below 640 px
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** (`fc.assert(fc.property(...), { numRuns: 100 })`) consistent with the existing codebase
- Toast state is owned at the page level so at most one toast is visible at a time

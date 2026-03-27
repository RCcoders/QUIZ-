# Requirements Document

## Introduction

QuizMaster currently has two separate settings pages — one for students (`StudentSettings`) and one for teachers (`TeacherSettings`) — both of which share a basic `ProfileEditor` component. The pages are functional but visually plain: flat white cards on a grey background with no visual identity, no profile header, and no role-specific personality.

This feature redesigns both pages to be more modern, visually appealing, and user-friendly while preserving all existing functionality. The redesign introduces a prominent profile hero section (avatar, display name, role badge, streak), a tabbed or sectioned layout for settings groups, role-appropriate theming (indigo for students, orange for teachers), an avatar preview with upload-by-URL, and improved form UX with inline validation feedback. The shared `ProfileEditor` component will be updated to support the new design.

---

## Glossary

- **Settings_Page**: The combined profile and settings page rendered at `/student/settings` or `/teacher/settings`
- **Profile_Hero**: The top section of the Settings_Page displaying the user's avatar, display name, role badge, and streak
- **ProfileEditor**: The shared React component responsible for editing display name and avatar URL
- **Avatar**: A circular image representing the user, derived from `UserProfile.avatarUrl` or falling back to initials
- **Initials_Avatar**: A coloured circle displaying the user's initials when no `avatarUrl` is set
- **Student_Theme**: The indigo (#6366F1) colour scheme used on student-facing pages
- **Teacher_Theme**: The orange (#FF5C1A) colour scheme used on teacher-facing pages
- **Streak**: The consecutive-day activity count stored in `UserProfile.streak`
- **Settings_Section**: A visually distinct card grouping related settings fields (e.g. Profile, Security, Notifications, Class Preferences)
- **Toast**: A transient, non-blocking notification shown after a save action succeeds or fails
- **Reauthentication**: The Firebase process of verifying the user's current password before allowing a password change
- **UserProfile**: The TypeScript interface `{ uid, email, displayName, role, avatarUrl, createdAt, streak, lastActiveDate, notificationPrefs?, defaultSubject? }`

---

## Requirements

### Requirement 1: Profile Hero Section

**User Story:** As a student or teacher, I want to see a visually prominent profile header at the top of my settings page, so that the page feels personal and I can quickly confirm my identity.

#### Acceptance Criteria

1. THE Settings_Page SHALL render a Profile_Hero section above all Settings_Sections.
2. WHEN `UserProfile.avatarUrl` is a non-empty string, THE Profile_Hero SHALL display the avatar image in a circular frame with a diameter of 80px.
3. WHEN `UserProfile.avatarUrl` is null or empty, THE Profile_Hero SHALL display an Initials_Avatar using the first letter of each word in `UserProfile.displayName`, styled with the role's accent colour as the background.
4. THE Profile_Hero SHALL display `UserProfile.displayName` as the primary heading below the avatar.
5. THE Profile_Hero SHALL display a role badge reading "Student" or "Teacher" based on `UserProfile.role`.
6. THE Profile_Hero SHALL display the current streak value from `UserProfile.streak` alongside a flame icon.
7. WHEN `UserProfile.role` is `student`, THE Profile_Hero SHALL apply the Student_Theme accent colour (#6366F1) to the avatar border and role badge.
8. WHEN `UserProfile.role` is `teacher`, THE Profile_Hero SHALL apply the Teacher_Theme accent colour (#FF5C1A) to the avatar border and role badge.

---

### Requirement 2: Avatar Preview in Profile Editor

**User Story:** As a user, I want to see a live preview of my avatar while editing the avatar URL, so that I can confirm the image looks correct before saving.

#### Acceptance Criteria

1. WHEN the user types a URL into the avatar URL field, THE ProfileEditor SHALL display a circular preview image using that URL within 300ms of the last keystroke.
2. WHEN the avatar URL field is empty, THE ProfileEditor SHALL display the Initials_Avatar as the preview.
3. IF the avatar URL resolves to an image that fails to load, THEN THE ProfileEditor SHALL fall back to displaying the Initials_Avatar in the preview.
4. THE ProfileEditor SHALL render the avatar preview at a diameter of 64px adjacent to the avatar URL input field.

---

### Requirement 3: Display Name Validation

**User Story:** As a user, I want immediate feedback when my display name is invalid, so that I can correct it before attempting to save.

#### Acceptance Criteria

1. WHEN the display name field loses focus and the value is fewer than 1 character, THE ProfileEditor SHALL display an inline error message reading "Display name is required."
2. WHEN the display name field loses focus and the value exceeds 50 characters, THE ProfileEditor SHALL display an inline error message reading "Display name must be 50 characters or fewer."
3. WHILE an inline validation error is shown, THE ProfileEditor SHALL disable the save button.
4. WHEN the display name field value becomes valid, THE ProfileEditor SHALL clear the inline error message.

---

### Requirement 4: Save Feedback via Toast

**User Story:** As a user, I want a brief confirmation message after saving any settings, so that I know my changes were persisted without the page scrolling or reloading.

#### Acceptance Criteria

1. WHEN a settings save operation completes successfully, THE Settings_Page SHALL display a Toast with a success message for 3 seconds then dismiss it automatically.
2. IF a settings save operation fails, THEN THE Settings_Page SHALL display a Toast with a descriptive error message that persists until the user dismisses it.
3. THE Settings_Page SHALL render at most one Toast at a time; a new Toast SHALL replace any currently visible Toast.
4. THE Toast SHALL be positioned in the bottom-right corner of the viewport and SHALL NOT obscure form fields.

---

### Requirement 5: Password Change Security

**User Story:** As a user, I want to change my password securely, so that my account remains protected.

#### Acceptance Criteria

1. WHEN the user submits the Change Password form, THE Settings_Page SHALL reauthenticate the user with the current password before calling `updatePassword`.
2. IF reauthentication fails due to an incorrect current password, THEN THE Settings_Page SHALL display an inline error reading "Incorrect current password."
3. WHEN the new password field value is fewer than 8 characters, THE Settings_Page SHALL display an inline error reading "New password must be at least 8 characters." and SHALL prevent form submission.
4. WHEN the password change succeeds, THE Settings_Page SHALL clear both password fields and display a success Toast.
5. WHILE the password change request is in flight, THE Settings_Page SHALL disable the submit button and display a loading indicator.

---

### Requirement 6: Student Notification Preferences

**User Story:** As a student, I want to manage my notification preferences from the settings page, so that I control which emails I receive.

#### Acceptance Criteria

1. WHEN `UserProfile.role` is `student`, THE Settings_Page SHALL render a Notifications Settings_Section containing a toggle for "Email me when a new quiz is published in my subjects."
2. WHEN the user toggles the notification preference, THE Settings_Page SHALL persist the new value to Firestore via a merge write within 500ms.
3. IF the Firestore write fails, THEN THE Settings_Page SHALL revert the toggle to its previous state and display an error Toast.
4. WHILE the Firestore write is in flight, THE Settings_Page SHALL disable the toggle to prevent duplicate writes.

---

### Requirement 7: Teacher Class Preferences

**User Story:** As a teacher, I want to set a default subject for my quizzes, so that new quizzes are pre-filled with my most-used subject.

#### Acceptance Criteria

1. WHEN `UserProfile.role` is `teacher`, THE Settings_Page SHALL render a Class Preferences Settings_Section containing a text input for "Default Subject."
2. THE Settings_Page SHALL pre-populate the Default Subject input with `UserProfile.defaultSubject` when the page loads.
3. WHEN the Default Subject value exceeds 50 characters, THE Settings_Page SHALL display an inline error and prevent form submission.
4. WHEN the teacher saves Class Preferences, THE Settings_Page SHALL persist `defaultSubject` to Firestore via a merge write.
5. IF the Firestore write fails, THEN THE Settings_Page SHALL display an error Toast with the message "Failed to save preferences. Please try again."

---

### Requirement 8: Role-Appropriate Theming

**User Story:** As a user, I want the settings page to match the visual style of the rest of the app for my role, so that the experience feels consistent.

#### Acceptance Criteria

1. WHEN `UserProfile.role` is `student`, THE Settings_Page SHALL use the Student_Theme: dark navbar (`rgba(15, 12, 41, 0.95)`), indigo (#6366F1) accent on interactive elements, and a dark/gradient page background consistent with other student pages.
2. WHEN `UserProfile.role` is `teacher`, THE Settings_Page SHALL use the Teacher_Theme: white sidebar, orange (#FF5C1A) accent on interactive elements, and a light grey (#F3F4F6) page background consistent with other teacher pages.
3. THE Settings_Page SHALL use the Inter font family for all text.
4. THE Settings_Page SHALL use `rounded-2xl` card styling for all Settings_Sections.
5. WHEN `UserProfile.role` is `student`, THE Settings_Page SHALL render the StudentNavbar component above the page content.
6. WHEN `UserProfile.role` is `teacher`, THE Settings_Page SHALL render the TeacherSidebar component alongside the page content.

---

### Requirement 9: Responsive Layout

**User Story:** As a user on a mobile device, I want the settings page to be usable on small screens, so that I can update my profile from any device.

#### Acceptance Criteria

1. THE Settings_Page SHALL render a single-column layout on viewports narrower than 768px.
2. THE Settings_Page SHALL render a centred, max-width-2xl content column on viewports 768px and wider.
3. WHEN `UserProfile.role` is `teacher`, THE Settings_Page SHALL hide the TeacherSidebar on viewports narrower than 768px and provide an equivalent navigation mechanism.
4. THE Profile_Hero SHALL stack the avatar and text content vertically on viewports narrower than 640px.

---

### Requirement 10: Page Metadata

**User Story:** As a user, I want the browser tab to show a meaningful title when I am on the settings page, so that I can identify the tab easily.

#### Acceptance Criteria

1. THE Settings_Page SHALL set the document title to "Settings – QuizMaster" using the `react-helmet-async` Helmet component.

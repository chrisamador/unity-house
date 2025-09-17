# Academics GPA Tracker – Product Requirements Document (PRD)

Version: 1.0

## 1. Overview
Academics GPA Tracker for undergraduate students and school administrators to manage course syllabi, extract assignments using AI, enter grades, and view GPA insights.

Primary value:
- Students upload a syllabus (PDF/TXT), AI extracts course info and assignments, students review/edit, then save to track grades and compute GPA.
- Students can see a comparison of their GPA to their school average.
- Admins can view user lists; students view personal GPA; admins view GPA statistics across all schools.

## 2. Goals and Non-Goals
- Goals
  - Enable quick syllabus upload and accurate extraction of course details and assignments.
  - Provide grade entry per assignment with computed percentages, course-level grade, and overall GPA.
  - Provide admin workflow for approving users and viewing aggregate GPA metrics.
  - Persist data in Convex; authenticate users; ensure role-based access.
- Non-Goals
  - Complex LMS integrations (Canvas, Blackboard) in v1.
  - Mobile apps (web responsive only).
  - Supporting file types other than PDF/TXT for extraction in v1.

## 3. Personas
- Undergraduate Student
  - Needs to upload course syllabus, see assignments, enter grades, monitor GPA.
- Administrator
  - Needs to review user list and school-level GPA insights.

## 4. High-Level User Stories
- As a Student, I can upload a syllabus file and see AI-extracted course info and assignments.
- As a Student, I can review and edit extracted details before saving.
- As a Student, I can view assignments, enter grades, and see calculated percentages and GPA.
- As an Admin, I can view all approved users and school-level GPA statistics.

## 5. Functional Requirements
- Profile Setup (first sign-in)
  - Capture: role (`admin` or `undergraduate`), first name, last name, school, studentId (undergrads only).
  - Undergraduates auto-approved in v1; admins require admin approval.
  - Schools list can remain static in v1.
- Roles & Access
  - Student: syllabus upload, AI extraction, review/edit, grades entry, personal GPA dashboards.
  - Admin: user management (approve users), school GPA overview.
- Syllabus Management
  - Upload via Convex storage; supported types: PDF/TXT; up to 10MB (configurable).
  - Create temporary syllabus record before save.
  - Extraction via OpenAI using `gpt-4.1-nano` with pdf-parse for PDF text.
  - Review screen shows file preview and editable form; Save writes assignments and updates syllabus/course info; mark `isProcessed`.
- Assignment & Grades
  - Store assignments with name, optional due date, weight (0–100), optional category, optional maxPoints.
  - Enter grades per assignment (points earned, max points) => compute percentage; update existing grade if present.
- GPA & Insights
  - Per-user GPA: compute from courses and graded assignments using weight normalization and credit hours (default 3).
  - School average GPA across approved undergraduates.
  - Credit hours are fixed (default 3) and not user-editable in v1.
- User Management (Admin)
  - List users (pending and approved), approve users.


## 6. Data Model (Convex Schema)
Tables (see `convex/schema.ts`):
- users (from `@convex-dev/auth`)
- userProfiles
  - userId, role, firstName, lastName, school, studentId?, profilePicture?, isApproved
- syllabi
  - userId, courseName, courseCode, semester, year, fileId, fileName, isProcessed, uploadedAt
- assignments
  - syllabusId, userId, name, dueDate?, weight, category?, maxPoints?
- grades
  - assignmentId, userId, pointsEarned, maxPoints, percentage, enteredAt
- courses
  - userId, courseName, courseCode, semester, year, creditHours, currentGPA?

Key indexes:
- userProfiles: by_user_id, by_role, by_school
- syllabi: by_user_id, by_course(courseCode, semester, year)
- assignments: by_syllabus, by_user
- grades: by_assignment, by_user
- courses: by_user, by_semester

## 7. UX Flows
- First-Time User (Student)
  1) Sign up/sign in; 2) Complete Profile; 3) Arrive at Dashboard Overview; 4) Upload syllabus; 5) Review extracted info; 6) Save; 7) Enter grades as available.
- Admin Onboarding
  1) Sign in; 2) Complete Profile with admin role; 3) Wait for approval (by existing admin); 4) On approval, access User Management and statistics.
- Syllabus Upload & Extraction
  1) Choose file (PDF/TXT), auto-upload; 2) Extraction state; 3) Review screen with file preview and editor; 4) Save to persist.

## 8. Permissions & Security
- All queries/mutations/actions check `getAuthUserId` to ensure authentication and owner access.
- Admin-only operations verify requester’s profile role is `admin`.
- Files stored in Convex storage; URLs are generated server-side and not hardcoded.
- Never trust client extraction results—server action (`ai.extractAssignments`) fetches file from storage.

## 9. Performance & Limits
- File size: follow Convex recommended/default limits; no explicit hard cap beyond platform limits in v1.
- PDF parsing via `pdf-parse`; large PDFs may timeout; client shows an 8s preview timeout fallback.
- OpenAI model: `gpt-4.1-nano`; temperature 0; max_tokens ~1500.
- Queries are scoped to authenticated user to minimize data transfer.
 - No strict SLA/latency requirements defined for v1.

## 10. Privacy & Compliance
- No specific data retention, PII handling, or OpenAI usage policy constraints required for v1.
- Syllabi and grades are user-specific and not shared with other students.
- School-level GPA metrics aggregate across students without revealing individual grade details.

## 12. Acceptance Criteria (V1)
- Auth flows work (Password + Anonymous), sign-in/out, protected data access.
- Profile creation works; undergrads auto-approved; admins gated until approved.
- Students can upload PDF/TXT syllabus; extraction runs; review UI shows preview and editable fields; save persists to DB.
- Assignments visible under selected syllabus; grades can be entered and updated; percentages calculated.
- GPA card shows per-user GPA; school average displays for all users; admins can view user lists and approve users.
- Dark mode toggle switches theme across app.
- All user-specific queries are scoped to the authenticated user; admin-only actions are restricted.

## 14. Non-Functional Requirements
- Reliability: No data loss on refresh; actions idempotent where appropriate (grades upsert).
- Usability: Clear error and success toasts; loading spinners for async calls; accessible forms.
- Maintainability: Convex functions separated by domain; clear TypeScript types.

## 15. Analytics & Telemetry (Optional v1)
- Track syllabus upload success/failure counts.
- Track extraction duration and error rates (server logs available; add metrics later).

## 16. Testing Strategy
- Unit tests for utility functions (future addition).
- Manual test plan covering:
  - Auth, profile setup (student/admin), admin approval path.
  - Syllabus upload (PDF & TXT), extraction, review, save.
  - Assignment listing, grade entry, GPA calculations.
  - Role gating and access control for queries/mutations.

## 17. Deployment
- Development: `npm run dev` runs Vite and Convex locally.
- Production: Frontend hosted on Netlify; backend remains Convex. Ensure environment variables set on both platforms.
- Note: A Next.js migration plan exists in `docs/next-migration-guide.md` if moving to Next.js.

## 18. Decisions (v1)
- Authentication: Anonymous auth is allowed in production.
- File policy: Follow Convex recommended/default file size limits; PDF/TXT only.
- Admin scope: No additional analytics beyond approvals and average GPA.
- Compliance: No special requirements for v1.
- Email workflows: No email verification or password reset in v1.
- Credits: Credit hours are not editable and not imported from external sources in v1.
- Deployment: Frontend on Netlify; backend on Convex.
- Schools list: Static list is acceptable for v1.
- Assignment fields: No attachments/links/notes or rubric sub-items in v1.
- SLA/performance: No hard requirements defined.

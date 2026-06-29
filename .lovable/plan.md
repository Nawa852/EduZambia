## Goal
Ship the full Teacher experience matching the Mrs. Mulenga reference image, wire up Lovable AI edge functions for lesson/quiz/grading/parent updates, and add teacher→student→parent linking with manual rosters + guardian links.

## 1. Fix blocking runtime error
`ThemeContext` is crashing the whole app (`useState` on null React). Root cause is a Vite dep cache mismatch after recent installs. Clear `.vite` and restart dev server. No code change needed unless it persists; then guard `ThemeProvider` against SSR-style null.

## 2. Database — connectivity layer (one migration)
New tables (all with GRANTs + RLS):
- `classes` — teacher_id, name, grade, subject, room, color
- `class_enrollments` — class_id, student_id, status
- `class_invites` — class_id, code (unique), expires_at  *(used internally for roster add-by-code, optional)*
- `guardian_links` already exists → reuse; add `verified` + RLS policy so parents see linked student progress
- `parent_updates` — teacher_id, student_id, parent_id, subject, body, generated_by_ai, sent_at
- `lesson_plans` — teacher_id, class_id, title, topic, grade, content (jsonb), ai_generated
- `generated_quizzes` — teacher_id, class_id, topic, questions (jsonb), ai_generated

Helper SQL function `is_classmate_teacher(_class uuid)` for RLS reads.

## 3. Edge Functions (Lovable AI Gateway, `google/gemini-3-flash-preview`, streaming where useful)
- `ai-lesson-plan` — ECZ-aligned, returns structured JSON (objectives, activities, assessment, resources)
- `ai-quiz-generator` — N questions, difficulty, type (MCQ/short/essay), ECZ topic mapping
- `ai-grade-assist` — input submission text + rubric → suggested score + feedback
- `ai-parent-update` — input student stats → friendly bilingual update (English + local language toggle)
- `ai-curriculum-copilot` — general chat tool for teachers (streaming, SSE)
- `ai-attendance-insight` — flags at-risk students from attendance/grade patterns

All with CORS, zod input validation, 429/402 surfacing.

## 4. Teacher pages (pixel-faithful to the reference image)
Shared `TeacherShell` with left sidebar (TEACHER badge, nav items, school card, achievements card) + top search + date picker, exactly like image.

Pages:
- `/teacher` — Dashboard: 4 stat cards (My Classes, Students, Assignments, Avg Progress), My Classes list with progress bars + colored subject icons, Today's Schedule timeline with room chips, Recent Assignments, Class Progress Overview chart (recharts multi-line), School Announcements, Curriculum Co-Pilot AI panel, Quick Resources grid, bottom Quick Actions bar
- `/teacher/classes` — class cards grid + roster management (add students by email/search, generate invite code)
- `/teacher/classes/:id` — roster, attendance shortcut, gradebook shortcut, AI lesson plan/quiz buttons
- `/teacher/lessons` — list + AI generator panel (streaming) + save to lesson_plans
- `/teacher/assignments` — list + create + AI quiz generator integration
- `/teacher/gradebook` — table per class with AI grade-assist on each submission
- `/teacher/students` — directory with linked guardians, "Send AI Update to Parent" action
- `/teacher/attendance` — daily roster, mark present/absent/late, at-risk AI flag
- `/teacher/reports` — analytics charts, AI insights summary
- `/teacher/curriculum-copilot` — full streaming chat using AI Elements (Conversation/Message/PromptInput/Shimmer)
- `/teacher/resources` — ECZ syllabus, past papers, question bank, video lessons
- `/teacher/communications` — parent updates inbox/compose with AI draft

UI polish: gradient hero, MD3 cards with soft shadows, rounded-2xl, subject color tokens, animated progress bars, sticky bottom action bar, dark/light parity.

## 5. Connectivity flows
- Teacher → Students: teacher adds students to a class (search by email or invite code). Students see class on their dashboard.
- Student → Parent: parent requests `guardian_links` row referencing student email; student approves from settings → unlocks parent dashboard view of grades/attendance/AI updates.
- Teacher → Parent: from `/teacher/students/:id`, "Generate Parent Update" calls `ai-parent-update`, teacher reviews + sends → row in `parent_updates`, parent sees in their dashboard + push notification (existing service).

## 6. AI everywhere (sprinkled, not standalone screens)
- Dashboard: Curriculum Co-Pilot card → opens chat
- Lessons list: "✨ Generate with AI" FAB
- Assignments create: "Auto-fill questions with AI" toggle
- Gradebook row: "AI suggest grade" inline
- Student detail: "Draft parent update with AI", "Spot at-risk patterns"
- Attendance: "Explain absence patterns"

## 7. Verification
- Deploy all 6 edge functions, curl one each to confirm 200
- Playwright: login as teacher demo, visit `/teacher`, screenshot, verify hero stats render
- Typecheck clean

## Out of scope this turn
- Live class video for teachers (already covered by existing LiveLearningPage)
- Native mobile teacher build
- Marketplace integration

This is roughly 1 migration + 6 edge functions + ~14 page files + 1 shell + ~6 shared components. I'll build in parallel batches.

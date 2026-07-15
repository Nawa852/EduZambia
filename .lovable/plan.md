# Deep-Wire Specialist Role Suites + Student/Teacher Follow-ups

Goal: turn the specialist dashboards (Medical, Entrepreneur, Developer, NGO, Skills) from visual shells into fully functional workspaces with real database tables, RLS, edge functions, and AI. Then round out Student learning and remaining Teacher pages. Every new page reads/writes real data and every AI panel talks to a deployed edge function.

Priority order: Specialist roles → Student learning → Teacher suite.

---

## Phase 1 — Medical Suite (Dr. Chanda)

**Backend (single migration)**
- `medical_cpd_activities` — user_id, title, category, hours, provider, completed_at, evidence_url
- `medical_patients` — owner_id (doctor), initials, age, sex, complaint, status, next_review
- `medical_case_notes` — case_id (→ clinical_cases), user_id, subjective, objective, assessment, plan
- `medical_drug_lookups` — user_id, drug_name, zambian_availability, checked_at (audit trail)
- Reuse: `clinical_cases`, `clinical_rotations`

All tables: GRANT to authenticated + service_role, RLS scoped to `owner_id/user_id = auth.uid()`.

**Pages** (`src/pages/medical/…`)
1. `/medical/cpd` — CPD tracker: donut of hours by category, table of activities, "Log activity" dialog, export PDF certificate.
2. `/medical/sandbox` — Clinical Sandbox: interactive case simulator wired to existing `medical-case-simulator` edge function. Streamed diagnosis, differentials, ordered investigations, feedback.
3. `/medical/patients` — Patient list + detail drawer with SOAP notes editor; AI "Draft SOAP" via new `ai-soap-draft` function.
4. `/medical/drugs` — Zambian drug reference search using existing `medical-drug-reference` function; save to `medical_drug_lookups`.
5. `/medical/collab` — Specialist collaboration board (reuses `mentors_directory` + `mentor_requests` filtered to `role = doctor`).

**Edge functions**
- `ai-soap-draft` (new): takes vitals + complaint → returns structured SOAP JSON.
- Verify existing: `medical-case-simulator`, `medical-drug-reference`, `medical-notes-generator`.

---

## Phase 2 — Entrepreneur Suite (Brighton)

**Backend**
- Reuse: `ventures`, `venture_financials`, `business_milestones`, `pitch_decks`, `grants`.
- New: `venture_cofounder_matches` — user_id, target_user_id, skills, status, message.

**Pages** (`src/pages/entrepreneur/…`)
1. `/entrepreneur/ventures` — CRUD list, stage board (idea → validated → launched → scaling), financial summary tile per venture.
2. `/entrepreneur/ventures/:id` — Detail: milestones, financials chart (from `venture_financials`), team, documents.
3. `/entrepreneur/funding` — Grant discovery: reads `grants` + calls existing `funding-opportunities` function; save/apply flow.
4. `/entrepreneur/pitch` — AI Pitch Deck builder wired to existing `pitch-deck-generator`; save to `pitch_decks`, export.
5. `/entrepreneur/cofounders` — Match board using `peer-matcher` + new `venture_cofounder_matches` table.
6. `/entrepreneur/market-research` — wired to `market-research-assistant`; save reports to `user_materials`.

---

## Phase 3 — Developer Suite (Clever)

**Backend**
- Reuse: `developer_projects`.
- New: `developer_bounties` — poster_id, title, description, reward_kwacha, tags, status, deadline, winner_id.
- New: `developer_bounty_submissions` — bounty_id, developer_id, repo_url, notes, status, score.
- New: `developer_reputation` — user_id, points, tier, badges (jsonb).

**Pages** (`src/pages/dev/…`)
1. `/dev/projects` — CRUD project list + detail (README, stack, links).
2. `/dev/bounties` — Bounty board (list, filter, apply, my submissions).
3. `/dev/bounties/:id` — Detail + submit solution + AI code review via existing `ai-code-review`.
4. `/dev/challenges` — Coding challenges via existing `coding-challenge-generator`, tracked attempts.
5. `/dev/reputation` — Reputation & badges page (from `developer_reputation` + `user_badges`).

---

## Phase 4 — NGO Suite (Mercy)

**Backend**
- Reuse: `ngo_programs`, `ngo_partnerships`, `ngo_beneficiaries`, `donor_pledges`.
- New: `ngo_impact_reports` — program_id, period, metrics (jsonb), narrative, generated_by_ai.

**Pages** (`src/pages/ngo/…`)
1. `/ngo/programs` — Program CRUD + progress; per-program beneficiaries count.
2. `/ngo/donors` — Donor list from `donor_pledges` with funding utilization donut.
3. `/ngo/beneficiaries` — Roster + intake form (`ngo_beneficiaries`).
4. `/ngo/partnerships` — Partnership tracker (`ngo_partnerships`), uses existing PII-safe RPC.
5. `/ngo/impact` — AI-generated impact reports via new `ai-ngo-impact` function; save to `ngo_impact_reports`, export PDF.

**Edge function**
- `ai-ngo-impact` (new): program metrics → narrative + KPI summary.

---

## Phase 5 — Skills / Growth Suite

**Backend**
- New: `skills_profile` — user_id, target_role, current_level, motivation.
- New: `skill_assessments` — user_id, skill, score, evidence, assessed_at.
- New: `learning_paths` — user_id, title, steps (jsonb), progress, generated_by_ai.
- Reuse: `user_materials` for portfolio.

**Pages** (`src/pages/skills/…`)
1. `/skills/paths` — Paths list + detail with checklist; AI generator via existing `generate-learning-path`.
2. `/skills/assessments` — Take assessments (AI-generated MCQs) via `generate-assessment-questions`, scored by `grade_assessment_attempt`.
3. `/skills/portfolio` — Public-shareable portfolio (projects, certificates, badges).
4. `/skills/jobs` — Job matches via `job_applications` + `apprenticeships`.

---

## Phase 6 — Student Learning Inner Pages

- `/learn/knowledge-hub` — subjects → topics tree (`curriculum_subjects` / `curriculum_topics`) with notes+flashcards inline.
- `/learn/flashcards` — deck CRUD (`flashcard_decks/cards`) + SM-2 review UI.
- `/learn/notes` — rich notes editor with offline write-through (already exists in memory pattern).
- `/learn/planner` — AI weekly plan via existing `ai-smart-planner`, saved to `study_schedules`.

## Phase 7 — Teacher Suite Completion

- `/teacher/gradebook` — table per class, inline AI grade-assist.
- `/teacher/attendance` — daily roster (`attendance` table) + at-risk AI flag via `ai-attendance-insight`.
- `/teacher/reports` — analytics + AI insight summary.
- `/teacher/communications` — parent updates inbox/compose using `parent_updates` + `ai-parent-update`.

---

## Shared work

- **Navigation**: extend `sidebarConfig.ts` to add the new routes per role. Every specialist inner page uses `HubPageLayout` for consistency (gradient hero + sticky tabs, matches existing hubs).
- **Role guards**: `RoleGuard` on every specialist route.
- **Empty states**: real accounts start at zero — every list shows a branded empty state with a "Create your first …" CTA.
- **Demo data**: `isDemo` flag continues to inject demo rows so the visual dashboards keep working for stakeholder demos.
- **Loading/error**: React Query with skeletons; edge function 429/402 surfaced via toast.

## Technical notes

- All new tables follow the 4-step CREATE → GRANT → RLS → POLICY pattern; helper `is_ngo_owner`, `is_venture_owner` security-definer functions where cross-table checks are needed.
- Edge functions use Lovable AI Gateway with `google/gemini-3-flash-preview` (streaming where the UX benefits: sandbox, pitch, impact reports).
- AI outputs that are stored (SOAP drafts, pitch decks, impact reports) always land in a dedicated table with `generated_by_ai = true` so users can edit before "publishing".
- Reused edge functions are already deployed — I'll only add: `ai-soap-draft`, `ai-ngo-impact`.
- No changes to `handle_new_user`, auth, or existing dashboard visuals.

## Verification

- Migration approved and `supabase--linter` clean.
- One curl per new edge function → 200.
- Playwright smoke: demo-login as each specialist role, land on dashboard, click into 2 inner pages, screenshot.
- Typecheck clean.

## Out of scope

- Native (Capacitor) rebuilds.
- New dashboard visuals (already shipped).
- Live video for medical/NGO.
- Payments/monetization.

Estimated size: 1 migration, 2 new edge functions, ~22 new pages, ~6 shared components. Built in parallel batches by phase.
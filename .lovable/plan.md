# Synapse Cleanup + First 10 Build Areas

Your four documents (plus the earlier Student Guide) are saved in `docs/reference/` as both PDF and plain text, so every future change can be checked against them.

## What the documents define

Synapse = **one brain, four worlds**: Learner, Teacher, Parent, School. Everything is tied to the Zambian curriculum, works offline, carries school branding, and protects minors. Ministry/district views and colleges come **later**.

## Part 1 — Delete what doesn't belong

These are fully removed (pages, menu entries, hub tabs, links, demo-picker cards, onboarding wizards, and their AI functions):

| Remove | Why |
|---|---|
| Doctor / Medical suite (cases, patients, drugs, CPD, rotations) | Not a school platform |
| Entrepreneur suite (ventures, pitch decks, funding, co-founders, financials) | Not in any world |
| Developer suite (IDE, bounties, code review, reputation) | Not in any world |
| Cybersecurity suite (CTF, SOC, terminal, crypto, forensics labs) | Not in any world |
| Skills/workforce suite, AI Business Suite, Marketplace, Meal Planner, Journaling | Off-vision |
| NGO / donor pages | Not in the four worlds |
| Social feed, messenger, DMs, peer matching, mentors, video rooms, public leaderboards, community events, free world courses, video library | Tier 2/3 "hidden" features — deleted, not just hidden |
| Duplicate AI pages (Multi-AI tutor, Comprehensive AI, Study Buddy, Debate, Exam Predictor, second Study Planner, AI Workspace landing, old Courses/Lessons catalog) | Replaced by Synapse AI / BrightSphere |
| Third-party AI functions (Claude, Grok, DeepSeek assistants) | Duplicates of the main AI |

**Kept but parked:** Ministry pages stay (document says "later"), just out of everyday menus.
**Roles:** sign-up offers only Student, Teacher, Parent, School. Existing accounts with removed roles are moved to Student. Database tables for removed suites are left untouched (no data deleted) — they can be dropped later if you want.

## Part 2 — First 10 build areas (in order)

1. **Curriculum engine** — official grade → subject → topic → sub-topic → competence data (with CDC codes) for the 3 MVP subjects; used by every dropdown.
2. **Lesson planner on cascading curriculum dropdowns** — no free text; full MoE format with 5-stage table; regenerate one section; version history.
3. **Schemes of Work "Fill Week 1"** — continue in syllabus order across the term, mark Revision/Test weeks.
4. **School branding** — school logo, colours, name, EMIS on lesson plans, tests, report cards and certificates.
5. **School codes onboarding** — school code → staff codes → class codes → learner codes.
6. **Mastery entry** — after a lesson, tap mastered / not yet per learner in under two minutes; feeds the Learner Model.
7. **Teacher Home (Today)** — action queue (scores to enter, submissions to verify), pulse card, quick actions.
8. **Class list with guardian-link status** — see who has a linked parent, share invite to the rest.
9. **Parent Home + verified study reports** — all children on one screen, study minutes from focus sessions, tonight's conversation starter.
10. **School Command dashboard** — guardian coverage %, teacher planning activity, weak-competence view.

Each area is checked in the preview before moving to the next. Realistically 1–3 land per round; I'll keep a running list so nothing is lost.

## Technical details
- Deletion: remove page files, `App.tsx` routes (old URLs redirect to `/dashboard`), `sidebarConfig.ts` entries, hub tab registries, `ChooseRolePage`/`DemoRolePicker`/onboarding role lists, `studentFeatures.ts` gating for deleted items, and the matching edge functions (deleted from deployment too).
- Data migration: `UPDATE profiles/user_roles` setting removed roles to `student`; enum values left in place (dropping enum values is unsafe).
- New tables: `curriculum_competences` (or extend `curriculum_topics` with codes), `school_branding`, `school_codes`, `mastery_entries`, `lesson_plan_versions` — all with GRANTs + RLS.
- `roadmap.md` tracks the 10 areas; `AGENTS.md` records the "four worlds only" rule.

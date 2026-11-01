# Synapse Platform: Master Plan for Backend Architecture, All AI Features, Automatic Data Ingestion & Test Engineering

**Platform Scope:** 4 Connected Worlds (Learners, Teachers, Parents, Schools)  
**Curriculum Standard:** Zambia 2023 Education Curriculum Framework (ZECF) 3-6-6-3 Structure  
**Infrastructure Target:** Multi-Tenant PostgreSQL + Deno TypeScript Edge Functions  
**Document Companion:** Synapse Master Plan v2, Learner's World Plan, Schools World, Teachers World, Parents World

---

## 1. Architectural Vision & Multi-World Interaction

The Synapse platform operates on one unified principle: **"One Brain, Four Worlds."** Instead of four disconnected applications, every stakeholder interacts with the same persistent **Learner Competence Model** anchored to the official 2023 Zambian Curriculum Development Centre (CDC) taxonomy.

```
                         ┌──────────────────────────────────────────────┐
                         │           CENTRAL CURRICULUM GRAPH           │
                         │    (CDC 2023: ECE -> Primary -> Forms 1-6)   │
                         └──────────────────────┬───────────────────────┘
                                                │
                                                ▼
                         ┌──────────────────────────────────────────────┐
                         │         SHARED LEARNER MASTER ENGINE         │
                         │  (Bayesian Knowledge Tracing & Mastery Log)  │
                         └──────┬────────────┬─────────────┬────────────┘
                                │            │             │            │
            ┌───────────────────┘            │             │            └────────────────────┐
            ▼                                ▼             ▼                                 ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐ ┌────────────────────────┐
│     LEARNERS WORLD    │ │    TEACHERS WORLD     │ │     PARENTS WORLD     │ │     SCHOOLS WORLD      │
├───────────────────────┤ ├───────────────────────┤ ├───────────────────────┤ ├────────────────────────┤
│ • 5-Step Daily Loop   │ │ • MoE 5-Stage Plans   │ │ • Live Truth (No CA   │ │ • Live Command Dashboard│
│ • Socratic AI Tutor   │ │ • Voice-to-Plan       │ │    surprises at term) │ │ • Class Mastery Heatmap│
│ • Local Language Audio│ │ • ECZ Exam Generator  │ │ • Verified Study Logs │ │ • Syllabus Pacing Index│
│ • Past Paper Practice │ │ • AI Optical Marking  │ │ • Home Conversation   │ │ • Branded Report Cards │
│ • Offline First Mode  │ │ • Syllabus Pacing     │ │    Starters           │ │ • Anti-Forgery QR Code │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘ └────────────────────────┘
```

---

## 2. Complete Inventory of Edge Functions (16 Functions Across 4 Worlds)

The backend runs on 16 modular, stateless Deno/TypeScript Edge Functions executing in sub-50ms cold-starts.

### 2.1 Learners World Edge Functions

#### Function 1: `learner-daily-loop`
- **Objective:** Drives the "Minimum Learning Loop" (Warm-up -> Learn -> Practise -> Review -> Proof) in under 20 minutes.
- **Inputs:** `student_id`, `subject_id`, `target_time_minutes` (default 20).
- **Logic:**
  1. Reads `mastery_entries` to find the learner's 3 weakest competences ($P(L_t) < 0.65$) or competences due for spaced repetition review (Ebbinghaus decay curve).
  2. Selects 1 warm-up question (high confidence, $P(L_t) > 0.85$), 3 core target questions with 3-tier scaffolding hints, and 1 challenge question.
  3. Returns a compact session payload (<25KB) that can run completely offline if the learner loses connection.
- **Output:** `{ session_id, questions, target_duration: 1200, offline_payload_hash }`

#### Function 2: `learner-socratic-tutor`
- **Objective:** Interactive conversational AI tutor that guides learners through problems without leaking direct answers.
- **Inputs:** `student_id`, `question_id`, `learner_message`, `chat_history`, `language_preference` ('en', 'bem', 'nya', 'ton').
- **Pedagogical Scaffolding Protocol:**
  - *Tier 1 (Clarification):* Explains what the question is asking in simple terms or local language analogies.
  - *Tier 2 (Method Prompt):* Asks the student to identify the first mathematical or scientific step (e.g., "What formula relates force and acceleration?").
  - *Tier 3 (Worked Analogy):* Shows a parallel problem with different numbers to demonstrate the method.
- **Output:** `{ message, scaffolding_tier, suggested_chips: string[], audio_stream_url? }`

#### Function 3: `learner-past-paper-coach`
- **Objective:** Instant step-by-step worked solutions for official ECZ Grade 7, Grade 9 (Form 2), Grade 12 (Form 4), and GCE past papers.
- **Inputs:** `question_id`, `student_attempt_text_or_choice`.
- **Logic:**
  - Evaluates student attempt against the official ECZ marking rubric.
  - Identifies error type: *Careless arithmetic error*, *Misread question*, *Conceptual misconception*, or *Notation defect*.
  - Tags student weakness back into the `mastery_entries` table.
- **Output:** `{ is_correct, earned_marks, max_marks, step_by_step_solution, error_diagnosis, related_competence_code }`

#### Function 4: `learner-study-planner`
- **Objective:** Dynamically schedules revision sessions leading up to national exams (Grade 6, Form 2, Form 4, Form 6).
- **Inputs:** `student_id`, `exam_date`, `daily_available_minutes`.
- **Logic:**
  - Calculates remaining days and total syllabus topic weights.
  - Prioritizes high-weight ECZ exam topics where student mastery is below 70%.
- **Output:** `{ calendar_events, daily_targets, projected_exam_score }`

---

### 2.2 Teachers World Edge Functions

#### Function 5: `teacher-ai-lesson-plan`
- **Objective:** Generates inspection-ready MoE lesson plans strictly formatted to the official 5-stage Zambian pedagogical standard.
- **Inputs:** `subject_id`, `grade_or_form`, `topic_id`, `competence_code`, `duration_minutes`.
- **5-Stage Schema Generated:**
  1. *Stage 1: Introduction (5 min)* — Baseline recall, hook, learning intentions.
  2. *Stage 2: Lesson Development (15 min)* — Concept explanation, teacher modeling, guided inquiry.
  3. *Stage 3: Application & Group Practice (10 min)* — Student hands-on activity with locally available Zambian teaching aids.
  4. *Stage 4: Assessment & Reflection (7 min)* — Quick formative check against the specific outcome.
  5. *Stage 5: Conclusion & Assignment (3 min)* — Summary, learner self-evaluation, homework task.
- **Output:** `{ official_moe_json, pdf_export_ready_html, learning_aids: string[] }`

#### Function 6: `teacher-voice-to-plan`
- **Objective:** Lets a teacher dictate a lesson or scheme idea while walking to class or on transit and turns it into a formatted MoE plan.
- **Inputs:** `audio_blob` (m4a/mp3/wav), `teacher_id`, `grade_or_form`, `subject_code`.
- **Logic:**
  1. Transcribes audio via Whisper / speech-to-text service.
  2. Matches transcribed terms against the CDC competence taxonomy for that subject and grade.
  3. Fills in missing MoE pedagogical sections (teaching aids, evaluation criteria).
- **Output:** `{ raw_transcript, matched_competence_code, structured_lesson_plan }`

#### Function 7: `teacher-scheme-of-work`
- **Objective:** Auto-generates a 13-week termly Scheme of Work aligned to school term dates, official holidays, and syllabus periods.
- **Inputs:** `school_id`, `academic_term_id`, `subject_id`, `grade_level`.
- **Output:** `{ term_weeks: Array<{ week_number, dates, topic, specific_outcomes, references, teaching_methods, aids }> }`

#### Function 8: `teacher-ai-assessment-builder`
- **Objective:** Generates quizzes, mid-term tests, and mock exams adhering to ECZ paper structures (Section A MCQs, Section B Short Answers, Section C Extended).
- **Inputs:** `subject_id`, `grade_or_form`, `competence_ids`, `total_marks`, `bloom_distribution` (Knowledge 30%, Application 50%, Evaluation 20%).
- **Output:** `{ test_paper_html, marking_scheme_with_rubrics, student_answer_sheet }`

#### Function 9: `teacher-ai-optical-marking`
- **Objective:** Assists teachers in grading physical student worksheets and written tests from photos.
- **Inputs:** `assessment_id`, `student_id`, `image_url_or_base64`.
- **Logic:**
  - Runs Vision OCR on handwritten answers.
  - Matches answers against the official marking guide rubrics.
  - Generates proposed marks and flags ambiguous handwriting for teacher one-tap confirmation.
- **Output:** `{ proposed_marks, max_marks, confidence_score, itemized_feedback, requires_manual_review }`

#### Function 10: `teacher-ai-remarks-generator`
- **Objective:** Synthesizes objective, personalized terminal report comments for class teachers and head teachers.
- **Inputs:** `student_id`, `term_id`.
- **Logic:** Analyzes grade trajectories, attendance percentage, and mastery strengths/weaknesses to produce 2–3 encouraging, actionable sentences.
- **Output:** `{ teacher_remark, head_teacher_remark }`

---

### 2.3 Schools World Edge Functions

#### Function 11: `school-command-live`
- **Objective:** Powers the live executive dashboard for Head Teachers, Deputy Heads, and MoE District Education Board Secretaries (DEBS).
- **Inputs:** `school_id`, `date`.
- **Metrics Computed:**
  - Daily staff and student attendance rates.
  - Fee collection velocity vs operational targets.
  - High-stakes exam readiness index (Grade 6, Form 2, Form 4, Form 6).
  - Curriculum coverage index (% of planned CDC topics taught to date).
- **Output:** `{ attendance_summary, syllabus_pacing_index, exam_readiness_score, critical_alerts }`

#### Function 12: `school-calculate-grades`
- **Objective:** Computes student composite term results using the official Zambian formula (40% CA + 60% Exam) and applies the official 9-point grading scale.
- **Grading Scale:** 1-2 (Distinction), 3-4 (Merit), 5-6 (Credit), 7-8 (Pass), 9 (Unsatisfactory/Fail).
- **Output:** `{ student_aggregates, class_rankings, top_performers, at_risk_students }`

#### Function 13: `school-generate-terminal-report`
- **Objective:** Compiles and freezes tamper-evident A4 terminal report cards for an entire grade or stream in batch.
- **Security:** Injects a unique SHA-256 cryptographic verification token and QR code URL on every card.
- **Output:** `{ total_generated, batch_id, verification_urls }`

#### Function 14: `verify-report-card`
- **Objective:** High-speed public endpoint accessed when scanning the QR code on a Synapse report card.
- **Inputs:** `token` (via query param `?token=...`).
- **Security:** Returns sanitized official verification record (student name, EMIS number, school crest, verified grades, publish timestamp) to prevent report card forgery.
- **Output:** `{ valid: true/false, verified_record: {...} }`

---

### 2.4 Parents World Edge Functions

#### Function 15: `parent-home-support`
- **Objective:** Translates technical classroom topics into everyday Zambian dinner table conversation starters and household activities.
- **Inputs:** `student_id`, `week_number`.
- **Example:** If Form 1 is studying CDC 4.1.2 (Soil Conservation in Agriculture), it generates:
  - *"Ask your child: Why do farmers in Southern Province make ridges across the slope instead of down the slope?"*
  - *"Home activity: Check where rainwater runs off near our compound fence."*
- **Output:** `{ conversation_starters: string[], home_experiments: string[], celebration_prompts: string[] }`

#### Function 16: `parent-verified-study-report`
- **Objective:** Delivers a clear, unvarnished summary of the student's actual learning activity to eliminate end-of-term surprises.
- **Inputs:** `guardian_id`, `student_id`, `timeframe` ('week' | 'month').
- **Metrics:** Verified focus minutes, subjects practiced, competences mastered, attendance anomalies, and recommended teacher check-in points.
- **Output:** `{ total_focus_hours, mastery_delta, attendance_flag, teacher_message_prompt }`

---

### 2.5 Cross-Cutting / Infrastructure Edge Functions

#### Function 17: `sync-offline-cache`
- **Objective:** Handles bidirectional offline synchronization for low-connectivity rural schools.
- **Mechanisms:**
  - Conflict-free resolution using timestamp ordering and client transaction UUIDs.
  - Queues scores, attendance records, and diagnostic attempts on device (IndexedDB / SQLite).
  - Syncs in small gzipped batches when 2G/3G connectivity is re-established.
- **Output:** `{ synced_records_count, conflicts_resolved, server_time }`

---

## 3. Special AI Features Deep Dive

### 3.1 Adaptive Bayesian Knowledge Tracing (BKT) Engine
Synapse does not rely on static test percentages. It maintains a dynamic probabilistic model for every student across every CDC competence:
- $P(L_0)$: Initial probability of competence mastery.
- $P(T)$: Probability of learning transition after an instructional event.
- $P(G)$: Probability of a lucky guess.
- $P(S)$: Probability of a careless slip.

When a student answers a question:
$$P(L_t | \text{Correct}) = \frac{P(L_t) \cdot (1 - P(S))}{P(L_t) \cdot (1 - P(S)) + (1 - P(L_t)) \cdot P(G)}$$
$$P(L_t | \text{Incorrect}) = \frac{P(L_t) \cdot P(S)}{P(L_t) \cdot P(S) + (1 - P(L_t)) \cdot (1 - P(G))}$$
Updated mastery with transition:
$$P(L_{t+1}) = P(L_t | \text{Result}) + (1 - P(L_t | \text{Result})) \cdot P(T)$$

This mathematical engine directly drives the **20-Minute Daily Learner Loop**, ensuring no time is wasted on already-mastered concepts while preventing cognitive overload.

### 3.2 Multilingual Socratic Voice & Text Engine
- **Languages:** English, Icibemba, ChiNyanja, Chitonga, Silozi.
- **STEM Code-Switching:** Keeps technical terms in English (e.g., *"Photosynthesis"*, *"Simultaneous equations"*, *"Capillarity"*) while explaining core conceptual intuition in the learner's home language.
- **Audio Output:** Lightweight compressed speech synthesis for auditory learners and low-literacy home environments.

### 3.3 Teacher Voice-to-Plan & Optical Marking
- **Voice-to-Plan:** Ingests unstructured spoken thoughts from teachers (e.g., *"I want to teach Form 2 chemistry on rates of reaction using effervescence with baking soda and vinegar"*) and converts it into a rigid 5-stage MoE lesson plan tagged to the official CDC competence.
- **Optical Rubric Marking:** Analyzes scanned student papers against multi-criteria marking rubrics, distinguishing between correct method with arithmetic slip vs fundamental conceptual void.

---

## 4. Automated Data Ingestion Pipeline into Database

To build an unassailable moat, Synapse requires an automated ingestion factory that extracts, validates, tags, and stores all official curriculum documents, past papers, and marking schemes.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    AUTOMATED INGESTION FACTORY PIPELINE                         │
├─────────────────┬───────────────────────────────────────────────────────────────┤
│ Stage 1:        │ • Download official CDC syllabi and ECZ Past Paper PDFs       │
│ Document Intake │ • Ingest teacher-uploaded notes and textbooks into /mnt/queue │
├─────────────────┼───────────────────────────────────────────────────────────────┤
│ Stage 2:        │ • Handle non-standard fonts (Type 3 / CID Font re-mapping)    │
│ Preprocessing   │ • High-resolution OCR with Tesseract / LayoutLM for tables    │
│ & Normalization │ • Mathematical formula extraction to LaTeX / MathML           │
├─────────────────┼───────────────────────────────────────────────────────────────┤
│ Stage 3:        │ • LLM-assisted structural parsing into strict JSON Schema     │
│ Semantic        │ • Extraction of Topics, Subtopics, Specific Outcomes          │
│ Extraction      │ • Question-to-competence alignment and rubric breakdown       │
├─────────────────┼───────────────────────────────────────────────────────────────┤
│ Stage 4:        │ • Foreign key integrity verification against CDC master codes │
│ Validation & QA │ • Deduplication of questions across exam years                │
│                 │ • Human-in-the-loop audit flag for low-confidence tags (<0.9) │
├─────────────────┼───────────────────────────────────────────────────────────────┤
│ Stage 5:        │ • Upsert into PostgreSQL tables: curriculum_topics,           │
│ DB Loading      │   curriculum_competences, assessment_questions, marking_guides│
│ & Vector Store  │ • Vector embedding of questions & outcomes for semantic search│
└─────────────────┴───────────────────────────────────────────────────────────────┘
```

### Ingestion Data Schema
```typescript
interface IngestionCurriculumPayload {
  framework: "ZECF_2023";
  tier: "ece" | "primary_lower" | "primary_upper" | "junior_secondary" | "advanced_secondary";
  grade_or_form: string; // e.g., "Form 1", "Grade 4"
  subject_code: string;  // e.g., "MATH-JSEC"
  topics: Array<{
    topic_number: number;
    title: string;
    estimated_periods: number;
    subtopics: Array<{
      subtopic_number: number;
      title: string;
      specific_outcomes: Array<{
        code: string; // e.g., "10.4.1.2"
        statement: string;
        knowledge: string[];
        skills: string[];
        values: string[];
        bloom_level: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
      }>;
    }>;
  }>;
}

interface IngestionQuestionPayload {
  source_exam: "ECZ_NATIONAL" | "MOCK_PROVINCIAL" | "INTERNAL_SCHOOL";
  year: number;
  tier: "junior_secondary" | "advanced_secondary";
  grade_or_form: string;
  paper_number: 1 | 2 | 3;
  section: "A" | "B" | "C";
  question_number: string;
  question_text: string;
  question_latex?: string;
  options?: Array<{ key: "A" | "B" | "C" | "D"; text: string }>;
  correct_answer: string;
  allocated_marks: number;
  marking_guide_steps: Array<{ step_number: number; criteria: string; marks: number }>;
  hints: {
    level_1_concept: string;
    level_2_method: string;
    level_3_analogy: string;
  };
  matched_competence_code: string; // Foreign key to curriculum_competences.code
}
```

---

## 5. Comprehensive Test Engineering & QA Architecture

To ensure mission-critical reliability for national exams and institutional records, the testing strategy spans 5 automated layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SYNAPSE 5-LAYER TEST SUITE                      │
├────────────────────┬───────────────────────────────────────────────────┤
│ 1. Unit Tests      │ • ECZ 9-point grading calculation accuracy        │
│                    │ • Best-6 aggregate points computation logic       │
│                    │ • BKT Bayesian probability update formulas        │
│                    │ • Term weight formulas (40% CA + 60% Exam)        │
├────────────────────┼───────────────────────────────────────────────────┤
│ 2. Security & RLS  │ • Strict cross-school data leak prevention tests  │
│    Isolation Tests │ • Guardian unverified child access denial tests   │
│                    │ • Student exam score tampering prevention         │
├────────────────────┼───────────────────────────────────────────────────┤
│ 3. Offline & Sync  │ • Simulates 100% packet loss & offline state      │
│    Stress Tests    │ • Multi-client concurrent write reconciliation    │
│                    │ • Latency-heavy 2G network throttle simulations   │
├────────────────────┼───────────────────────────────────────────────────┤
│ 4. AI Verification │ • MoE 5-stage lesson plan structural compliance   │
│    & Safety Tests  │ • Hallucination prevention against CDC codes      │
│                    │ • Socratic tutor answer-withholding verification  │
├────────────────────┼───────────────────────────────────────────────────┤
│ 5. End-to-End User │ • Learner 20-min daily loop completion flow       │
│    Flow Tests      │ • Teacher voice-to-plan -> PDF export flow        │
│                    │ • School terminal report card batch printing      │
│                    │ • Public QR code scan-to-verify authentication    │
└────────────────────┴───────────────────────────────────────────────────┘
```

### Sample Automated Test Implementation (Deno Test)
```typescript
// tests/grading_engine_test.ts
import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { determineEczGrade } from "../synapse/functions/calculate-grades/index.ts";

Deno.test("ECZ 9-Point Grading Scale Boundaries", () => {
  assertEquals(determineEczGrade(75).grade, 1); // 75%+ Distinction 1
  assertEquals(determineEczGrade(74).grade, 2); // 70-74% Distinction 2
  assertEquals(determineEczGrade(65).grade, 3); // 65-69% Merit 3
  assertEquals(determineEczGrade(55).grade, 5); // 55-59% Credit 5
  assertEquals(determineEczGrade(45).grade, 7); // 45-49% Pass 7
  assertEquals(determineEczGrade(39).grade, 9); // <40% Unsatisfactory 9
});

Deno.test("Best 6 Aggregate Calculation (Lower is better)", () => {
  const grades = [1, 1, 2, 3, 4, 5, 8, 9];
  grades.sort((a, b) => a - b);
  const bestSixAggregate = grades.slice(0, 6).reduce((a, b) => a + b, 0);
  assertEquals(bestSixAggregate, 1 + 1 + 2 + 3 + 4 + 5); // 16 Points
});
```

---

## 6. Execution Roadmap & Milestones

1. **Sprint 1 (Backend Core & Ingestion Engine):** Deploy multi-tenant schema with RLS, populate the 2023 CDC taxonomy hierarchy, and run the automated ingestion script for Grade 12 & Form 4 Mathematics/Science.
2. **Sprint 2 (Teacher & School Command):** Deploy `teacher-ai-lesson-plan`, `teacher-voice-to-plan`, `school-calculate-grades`, and `school-generate-terminal-report` with QR verification.
3. **Sprint 3 (Learner Loop & Socratic AI):** Deploy `learner-daily-loop`, BKT mastery tracking, and the Socratic multilingual tutor.
4. **Sprint 4 (Parents World & Offline Resilience):** Activate guardian linking, daily WhatsApp/SMS notifications, and client-side offline sync with conflict resolution.

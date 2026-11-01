# Synapse CBC 2023 Database Architecture & Level Registry

**System:** Synapse Learning Hub (`learn-smart-zambia-hub`)  
**Standard:** Zambia Education Curriculum Framework 2023 (ZECF 2023 / CBC)  
**Authority:** Curriculum Development Centre (CDC), Ministry of Education, Republic of Zambia  
**Status:** Official Level Architecture & Verification Blueprint  

---

## 1. Executive Summary & Curriculum Hierarchy

The Zambia 2023 Competency-Based Curriculum (CBC) shifts the national structure from the legacy 7-2-3 model (Grades 1–7 Primary, Grades 8–9 Junior Secondary, Grades 10–12 Senior Secondary) to a distinct **6-4-2 model**:

1. **Primary Education (Grades 1–6):** Foundational numeracy, literacy, and experiential competencies.
2. **Ordinary Secondary Education (Forms 1–4):** Pathway-driven education where learners take 6–7 subjects tailored to career/academic pathways.
3. **Advanced Secondary Education — A-Level (Forms 5–6):** Specialized pre-university academic and technical depth.

In Synapse, these three stages are treated as **distinct curriculum levels** with independent progression rules, grade/form labels, pathway constraints, and assessment models.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ZECF 2023 (CBC) FRAMEWORK                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│LEVEL 1:      │             │LEVEL 2:      │             │LEVEL 3:      │
│PRIMARY       │             │ORDINARY SEC  │             │ADVANCED SEC  │
│Grades 1–6    │             │Forms 1–4     │             │Forms 5–6     │
├──────────────┤             ├──────────────┤             ├──────────────┤
│• Lower (G1-3)│             │• 8 Pathways  │             │• A-Level     │
│• Upper (G4-6)│             │• 6–7 Subjects│             │  Combinations│
└──────────────┘             └──────────────┘             └──────────────┘
```

---

## 2. Level 1: Primary School (Grades 1–6)

### A. Level Division
- **Lower Primary:** Grades 1, 2, and 3
- **Upper Primary:** Grades 4, 5, and 6

### B. Subject Matrix

| Code | Subject Name | Grades | Category | Notes / Provision |
|:---|:---|:---|:---|:---|
| `CBC-PRI-LL` | Literacy and Language | Grades 1–3 | Core Lower Primary | Official Zambian language of zone + early English literacy |
| `CBC-PRI-MS` | Mathematics and Science | Grades 1–3 | Core Lower Primary | Integrated numeracy and early scientific observation |
| `CBC-PRI-CTS` | Creative and Technology Studies | Grades 1–3 | Core Lower Primary | Early digital skills, motor arts, and expressive crafts |
| `CBC-PRI-ENG` | English Language | Grades 4–6 | Core Upper Primary | Primary medium of instruction transition |
| `CBC-PRI-ZL` | Zambian Language | Grades 4–6 | Core Upper Primary | 7 approved Zambian languages (Cinyanja, Icibemba, Chitonga, Silozi, Kiikaonde, Lunda, Luvale) |
| `CBC-PRI-MATH` | Mathematics | Grades 4–6 | Core Upper Primary | Full primary arithmetic, geometry, measurement, statistics |
| `CBC-PRI-SCI` | Science | Grades 4–6 | Core Upper Primary | Living things, physical environment, matter and energy |
| `CBC-PRI-SOC` | Social Studies | Grades 4–6 | Core Upper Primary | History, geography, civics, cultural heritage |
| `CBC-PRI-TECH` | Technology Studies | Grades 4–6 | Core Upper Primary | Foundations of ICT, design, problem solving |
| `CBC-PRI-EXPA` | Expressive Arts | Grades 4–6 | Practical Option | Music, visual art, physical movement, drama |
| `CBC-PRI-HEC` | Home Economics | Grades 4–6 | Practical Option | Food preparation, hygiene, textiles, resource management |

---

## 3. Level 2: Ordinary Secondary School (Forms 1–4)

Ordinary Secondary learners take **6 or 7 subjects** aligned to an approved Pathway.

### A. The 8 Ordinary Secondary Pathways

1. **Natural Sciences (STEM)**
2. **Agricultural Science**
3. **Technology**
4. **Home Economics and Hospitality**
5. **Social Sciences**
6. **Business and Finance**
7. **Performing and Creative Arts**
8. **Physical Education and Sport**

### B. Master Subject Registry (Forms 1–4)

| Subject ID | Subject Name | Subject Type | Primary Pathways |
|:---|:---|:---|:---|
| `CBC-SEC-ENG` | English Language | Common Core | All Pathways (Mandatory) |
| `CBC-SEC-MATH` | Mathematics | Common Core | All Pathways (Mandatory) |
| `CBC-SEC-CIV` | Civic Education | Core / Social | Social Sciences, Business, STEM |
| `CBC-SEC-CS` | Computer Studies | Technical / Core | Technology, STEM, Business |
| `CBC-SEC-BIO` | Biology | Science Core | Natural Sciences (STEM), Agricultural Science, Health |
| `CBC-SEC-PHY` | Physics | Science Core | Natural Sciences (STEM), Technology |
| `CBC-SEC-CHEM` | Chemistry | Science Core | Natural Sciences (STEM), Agricultural Science |
| `CBC-SEC-AGRI` | Agricultural Science | Voc / Applied Core | Agricultural Science |
| `CBC-SEC-GEO` | Geography | Core / Humanity | Social Sciences, Natural Sciences |
| `CBC-SEC-HIST` | History | Humanities Core | Social Sciences |
| `CBC-SEC-RE` | Religious Education | Humanities Core | Social Sciences |
| `CBC-SEC-ZL` | Zambian Language | Languages | All Pathways (Elective / Optional) |
| `CBC-SEC-LIT` | Literature in English | Humanities | Social Sciences, Languages |
| `CBC-SEC-COMM` | Commerce | Business Core | Business and Finance |
| `CBC-SEC-POA` | Principles of Accounts | Business Core | Business and Finance |
| `CBC-SEC-COMP` | Computer Science | Advanced Tech | Technology, Natural Sciences (STEM) |
| `CBC-SEC-DTS` | Design and Technology Studies | Technical Core | Technology |
| `CBC-SEC-ICT` | ICT | Applied Tech | All Pathways (Practical / Elective) |
| `CBC-SEC-ART` | Art and Design | Creative Core | Performing and Creative Arts |
| `CBC-SEC-MUS` | Music | Creative Core | Performing and Creative Arts |
| `CBC-SEC-PE` | Physical Education | Sport Core | Physical Education and Sport |
| `CBC-SEC-FAF` | Fashion and Fabrics | Applied Practical | Home Economics and Hospitality |
| `CBC-SEC-FAN` | Food and Nutrition | Applied Practical | Home Economics and Hospitality |
| `CBC-SEC-HM` | Hospitality Management | Applied Practical | Home Economics and Hospitality |
| `CBC-SEC-TT` | Travel and Tourism | Applied Practical | Home Economics and Hospitality, Business |
| `CBC-SEC-FRE` | French | Modern Languages | Social Sciences, Business, Tourism |
| `CBC-SEC-HEC` | Home Economics | General Applied | Home Economics and Hospitality |

---

## 4. Level 3: Advanced Secondary — A-Level (Forms 5–6)

Forms 5–6 represent pre-university specialization. Learners enroll in focused subject combinations (typically 3–4 principal subjects plus general/communication studies) directly mapped to tertiary programmes.

### Master A-Level Subject Registry (Forms 5–6)

| Subject ID | Subject Name | Academic Domain | Typical Target Faculties / Degree Pathways |
|:---|:---|:---|:---|
| `CBC-ADV-BIO` | Biology | Life Sciences | Medicine, Veterinary, Biochemistry, Ecology |
| `CBC-ADV-PHY` | Physics | Physical Sciences | Engineering, Computer Science, Architecture, Geology |
| `CBC-ADV-CHEM` | Chemistry | Chemical Sciences | Chemical Engineering, Pharmacy, Medicine, Agriculture |
| `CBC-ADV-AGRI` | Agricultural Science | Agricultural Sciences | Agribusiness, Agronomy, Agricultural Engineering |
| `CBC-ADV-CS` | Computer Science | Computing | Software Engineering, Data Science, Cyber Security |
| `CBC-ADV-MATH` | Mathematics | Mathematical Sciences | Actuarial Science, Pure Math, Engineering, Finance |
| `CBC-ADV-GEO` | Geography | Earth & Environmental | Urban Planning, Environmental Science, Geomatics |
| `CBC-ADV-DT` | Design and Technology | Engineering & Design | Mechanical Engineering, Industrial Design |
| `CBC-ADV-FAF` | Fashion and Fabrics | Textile & Design | Fashion Design, Textile Manufacturing |
| `CBC-ADV-FAN` | Food and Nutrition | Nutritional Sciences | Dietetics, Food Technology, Public Health |
| `CBC-ADV-HM` | Hospitality Management | Service Industries | Hotel Administration, Event Management |
| `CBC-ADV-TT` | Travel and Tourism | Tourism & Commerce | Ecotourism, Heritage Management, Aviation |
| `CBC-ADV-CIV` | Civic Education | Governance & Law | Public Policy, Political Science, Diplomacy |
| `CBC-ADV-ENG` | English Language | Linguistics & Comm | Journalism, Mass Communication, Applied Linguistics |
| `CBC-ADV-HIST` | History | Historical Studies | Law, International Relations, Heritage |
| `CBC-ADV-RS` | Religious Studies | Philosophy & Theology | Ethics, Philosophy, Religious Leadership |
| `CBC-ADV-LIT` | Literature in English | Literary Studies | Creative Writing, Media, Law, Publishing |
| `CBC-ADV-ZL` | Zambian Language | African Linguistics | Translation, Indigenous Knowledge, Cultural Studies |

---

## 5. TypeScript Data Architecture for Synapse

To support offline access, instant client-side switching, and database synchronization, the following typed models govern the Synapse curriculum engine:

```typescript
// src/lib/curriculum/types.ts

export type CurriculumFramework = 'ECZ_2013' | 'CBC_2023';

export type CBCLevel = 
  | 'cbc_primary'       // Grades 1–6
  | 'cbc_ordinary_sec'  // Forms 1–4
  | 'cbc_advanced_sec'; // Forms 5–6 (A-Level)

export type CBCSubLevel = 
  | 'lower_primary'     // Grades 1–3
  | 'upper_primary'     // Grades 4–6
  | 'ordinary_sec'      // Forms 1–4
  | 'advanced_sec';     // Forms 5–6

export type CBCPathway =
  | 'natural_sciences'
  | 'agricultural_science'
  | 'technology'
  | 'home_economics_hospitality'
  | 'social_sciences'
  | 'business_finance'
  | 'performing_creative_arts'
  | 'physical_education_sport';

export interface CurriculumSubjectDef {
  id: string;
  framework: CurriculumFramework;
  level: CBCLevel;
  subLevel?: CBCSubLevel;
  code: string;
  name: string;
  grades: string[]; // e.g. ["Grade 1", "Grade 2"] or ["Form 1", "Form 2", "Form 3", "Form 4"]
  isPracticalOption?: boolean;
  allowedPathways?: CBCPathway[];
  isCommonCore?: boolean;
  status: 'draft' | 'syllabus_verified' | 'active';
  syllabusPdfUrl?: string;
}

export interface CurriculumTopicDef {
  id: string;
  subjectId: string;
  gradeOrForm: string;
  title: string;
  code: string;
  sortOrder: number;
  objectives?: string[];
}

export interface CurriculumCompetenceDef {
  id: string;
  topicId: string;
  code: string;
  title: string;
  knowledgeDimension?: string[];
  skillsDimension?: string[];
  valuesDimension?: string[];
  sortOrder: number;
}
```

---

## 6. Official Verification Protocol

Before moving any subject from `draft` to `syllabus_verified` in Synapse:

1. **PDF Syllabus Cross-Reference:** Compare topic codes and specific learning outcomes against the signed CDC syllabus publication.
2. **Pathway Combination Validation:** Verify whether a subject is a compulsory core, a pathway-restricted core, or a general elective for Form 1–4 students.
3. **Encoding & Text Cleanliness:** Ensure extracted symbols, mathematical formulas, and Zambian orthographies (diacritics/digraphs) are cleanly preserved without artifact corruption.
4. **Grading & Assessment Model:** Verify whether the terminal assessment includes School-Based Assessment (SBA) / Continuous Assessment (CA) percentages alongside terminal examinations.

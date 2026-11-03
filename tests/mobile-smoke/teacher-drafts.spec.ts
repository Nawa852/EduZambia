import { test, expect } from '@playwright/test';
import { parseSchemeDraft, parseLessonDraft } from '../../src/lib/teacherDrafts';

const week = (wk: number) => ({ wk, topic: 'Algebra', subTopic: 'Expressions', specificOutcomes: 'Simplify expressions', content: 'Practice expressions', skills: 'Reasoning', values: 'Care', references: 'Draft curriculum' });

test('a term scheme contains exactly 13 ordered weeks', () => {
  const weeks = Array.from({ length: 13 }, (_, index) => week(index + 1));
  expect(parseSchemeDraft(JSON.stringify({ weeks }))).toHaveLength(13);
  expect(() => parseSchemeDraft(JSON.stringify({ weeks: weeks.slice(0, 12) }))).toThrow();
  expect(() => parseSchemeDraft(JSON.stringify({ weeks: weeks.map(() => week(1)) }))).toThrow();
});

test('lesson drafts require four outcomes and five populated activity stages', () => {
  const draft = { topic: 'Algebra', subTopic: '', specificOutcomes: ['Identify', 'Simplify', 'Explain', 'Apply'], rationale: '', prerequisiteKnowledge: '', teachingAids: '', activities: Array.from({ length: 5 }, () => ({ phase: 'Practice', teacherActivity: 'Model an example', pupilsActivity: 'Solve an example' })), conclusion: '', evaluation: '' };
  expect(parseLessonDraft(JSON.stringify(draft)).activities).toHaveLength(5);
  expect(() => parseLessonDraft(JSON.stringify({ ...draft, activities: draft.activities.slice(0, 4) }))).toThrow();
  expect(() => parseLessonDraft(JSON.stringify({ ...draft, specificOutcomes: ['One'] }))).toThrow();
});
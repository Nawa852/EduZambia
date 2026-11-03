import { z } from 'zod';

export const schemeWeekSchema = z.object({
  wk: z.number().int().min(1).max(13),
  topic: z.string(), subTopic: z.string(), specificOutcomes: z.string(),
  content: z.string(), skills: z.string(), values: z.string(), references: z.string(),
});
export const schemeDraftSchema = z.object({ weeks: z.array(schemeWeekSchema).length(13) })
  .refine(({ weeks }) => weeks.every((week, index) => week.wk === index + 1), 'Weeks must run from 1 to 13 in order');

export function parseSchemeDraft(text: string) {
  return schemeDraftSchema.parse(JSON.parse(text)).weeks;
}

export const lessonDraftSchema = z.object({
  topic: z.string().min(1), subTopic: z.string(), specificOutcomes: z.array(z.string().min(1)).length(4),
  rationale: z.string(), prerequisiteKnowledge: z.string(), teachingAids: z.string(),
  activities: z.array(z.object({ phase: z.string(), teacherActivity: z.string().min(1), pupilsActivity: z.string().min(1) })).length(5),
  conclusion: z.string(), evaluation: z.string(),
});

export function parseLessonDraft(text: string) {
  return lessonDraftSchema.parse(JSON.parse(text));
}
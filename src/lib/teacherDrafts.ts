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
import { supabase } from '@/integrations/supabase/client';

export interface CurriculumSubject { id: string; grade: string; code: string; name: string; framework: string; verification_status: string; syllabus_url: string | null; source_title: string | null }
export interface CurriculumTopic { id: string; subject_id: string; title: string; code: string | null; objectives: string[] | null; sort_order: number }
export interface CurriculumCompetence { id: string; topic_id: string; code: string; title: string; sort_order: number }

const db = supabase as any;

export async function listSubjects(): Promise<CurriculumSubject[]> {
  const { data, error } = await db.from('curriculum_subjects').select('id, grade, code, name, framework, verification_status, syllabus_url, source_title').order('grade').order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function listTopics(subjectId: string): Promise<CurriculumTopic[]> {
  const { data, error } = await db.from('curriculum_topics')
    .select('id, subject_id, title, code, objectives, sort_order')
    .eq('subject_id', subjectId).order('sort_order').order('title');
  if (error) throw error;
  return data ?? [];
}

export async function listCompetences(topicIds: string[]): Promise<CurriculumCompetence[]> {
  if (!topicIds.length) return [];
  const { data, error } = await db.from('curriculum_competences')
    .select('id, topic_id, code, title, sort_order').in('topic_id', topicIds).order('sort_order');
  if (error) throw error;
  return data ?? [];
}

/** "12" -> "Grade 12"; "Form 3" stays. */
export const gradeLabel = (g: string) => (/^\d+$/.test(g) ? `Grade ${g}` : g);

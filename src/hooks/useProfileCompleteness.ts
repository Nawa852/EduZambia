import { useMemo } from 'react';
import { useProfile } from './useProfile';

export interface MissingField {
  key: string;
  label: string;
  link: string;
  hint?: string;
}

interface CompletenessResult {
  percent: number;
  total: number;
  filled: number;
  missing: MissingField[];
  isComplete: boolean;
  role: string;
}

const SETUP = '/profile?tab=settings';
const PROFILE = '/profile?tab=settings';

function check(value: any) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function useProfileCompleteness(): CompletenessResult {
  const { profile } = useProfile();

  return useMemo(() => {
    const role = profile?.role || 'student';
    const p: any = profile || {};

    let fields: MissingField[] = [];

    // Universal
    fields.push({ key: 'full_name', label: 'Full name', link: PROFILE });
    fields.push({ key: 'phone', label: 'Phone number', link: PROFILE, hint: 'For account recovery' });
    fields.push({ key: 'province', label: 'Province', link: PROFILE });
    fields.push({ key: 'avatar_url', label: 'Profile photo', link: PROFILE });

    if (role === 'student') {
      fields.push({ key: 'education_level', label: 'Education level', link: SETUP });
      fields.push({ key: 'institution_name', label: 'School / institution', link: SETUP });
      fields.push({ key: 'grade', label: 'Grade or year', link: SETUP });
      fields.push({ key: 'subjects', label: 'Subjects of interest', link: SETUP });
      fields.push({ key: 'study_goals', label: 'Study goals', link: SETUP });
      fields.push({ key: 'learning_style', label: 'Preferred learning style', link: SETUP });
      fields.push({ key: 'preferred_language', label: 'Preferred language', link: SETUP });
    } else if (role === 'teacher') {
      fields.push({ key: 'school', label: 'School', link: SETUP });
      fields.push({ key: 'subjects_taught', label: 'Subjects taught', link: SETUP });
      fields.push({ key: 'grades_taught', label: 'Grades taught', link: SETUP });
      fields.push({ key: 'years_experience', label: 'Years of experience', link: SETUP });
      fields.push({ key: 'teacher_qualification', label: 'Qualification', link: SETUP });
    } else if (role === 'guardian') {
      fields.push({ key: 'relationship_to_child', label: 'Relationship to child', link: SETUP });
      fields.push({ key: 'num_children', label: 'Number of children', link: SETUP });
    } else if (role === 'doctor') {
      fields.push({ key: 'institution_name', label: 'Hospital / clinic', link: SETUP });
      fields.push({ key: 'program_of_study', label: 'Specialty', link: SETUP });
    } else if (role === 'cybersecurity') {
      fields.push({ key: 'career_interest', label: 'Cyber focus area', link: SETUP });
      fields.push({ key: 'learning_style', label: 'Learning style', link: SETUP });
    }

    const missing = fields.filter((f) => !check(p[f.key]));
    const total = fields.length;
    const filled = total - missing.length;
    const percent = total === 0 ? 100 : Math.round((filled / total) * 100);

    return { percent, total, filled, missing, isComplete: missing.length === 0, role };
  }, [profile]);
}

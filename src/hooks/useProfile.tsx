import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'student' | 'teacher' | 'guardian' | 'institution' | 'ministry' | 'doctor' | 'entrepreneur' | 'developer' | 'skills' | 'cybersecurity';

export interface Profile {
  id: string;
  email?: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  user_type?: string; // backward compat alias for role
  bio: string | null;
  phone: string | null;
  school: string | null;
  grade: string | null;
  grade_level?: string | null; // backward compat alias for grade
  province: string | null;
  onboarding_completed?: boolean;
  device_setup_complete?: boolean;
  // Extended profile fields
  education_level?: string | null;
  institution_name?: string | null;
  institution_type?: string | null;
  program_of_study?: string | null;
  year_of_study?: string | null;
  subjects?: string[] | null;
  exam_target?: string | null;
  exam_year?: number | null;
  study_goals?: string | null;
  date_of_birth?: string | null;
  guardian_contact?: string | null;
  career_interest?: string | null;
  learning_style?: string | null;
  preferred_language?: string | null;
  // Teacher
  subjects_taught?: string[] | null;
  grades_taught?: string[] | null;
  years_experience?: number | null;
  teacher_qualification?: string | null;
  // Parent
  relationship_to_child?: string | null;
  num_children?: number | null;
  created_at: string;
  updated_at: string;
}

const validRoles: AppRole[] = ['student', 'teacher', 'guardian', 'institution', 'ministry', 'doctor', 'entrepreneur', 'developer', 'skills', 'cybersecurity'];

function toAppRole(value: string | null | undefined): AppRole {
  if (value && validRoles.includes(value as AppRole)) return value as AppRole;
  return 'student';
}

const PROFILE_CACHE_KEY = 'edu-zambia-profile-cache';

function readCachedProfile(userId: string | undefined): Profile | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.id === userId ? parsed : null;
  } catch {
    return null;
  }
}

export const useProfile = () => {
  const { user, isDemo } = useAuth();
  const cached = readCachedProfile(user?.id);
  const [profile, setProfile] = useState<Profile | null>(cached);
  // If we already have a cached profile, render immediately and refresh in the background.
  const [loading, setLoading] = useState(!cached);



  const fetchProfile = useCallback(async () => {
    if (isDemo) {
      const demoRole = toAppRole(
        (typeof window !== 'undefined' && sessionStorage.getItem('demo_role')) || 'student'
      );
      const demoNames: Record<AppRole, string> = {
        student: 'Demo Student',
        teacher: 'Mrs. Mwansa (Demo Teacher)',
        guardian: 'Demo Parent',
        institution: 'Demo School Admin',
        ministry: 'Demo Ministry Officer',
        doctor: 'Dr. Chanda (Demo)',
        entrepreneur: 'Demo Entrepreneur',
        developer: 'Demo Developer',
        skills: 'Demo Skills Learner',
        cybersecurity: 'Demo Security Analyst',
      };
      setProfile({
        id: 'demo-user',
        full_name: demoNames[demoRole] || 'Demo User',
        avatar_url: null,
        role: demoRole,
        bio: null,
        phone: null,
        school: 'Demo School',
        grade: 'Grade 10',
        province: 'Lusaka',
        device_setup_complete: true,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Auto-create profile if missing (trigger may have failed)
      if (!data) {
        const role = toAppRole(user.user_metadata?.user_type || localStorage.getItem('edu-zambia-user-type'));
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
            avatar_url: user.user_metadata?.avatar_url || null,
            role,
          });

        if (!insertError) {
          const retry = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          data = retry.data;
          error = retry.error;
        }

        if (!data) {
          // Still no profile — use metadata fallback
          setProfile({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            avatar_url: user.user_metadata?.avatar_url || null,
            role,
            user_type: role,
            bio: null, phone: null, school: null, grade: null, grade_level: null, province: null,
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setLoading(false);
          return;
        }
      }

      if (data) {
        const role = toAppRole(data.role);
        const next: Profile = {
          ...data,
          role,
          email: user.email,
          user_type: role,
          grade_level: data.grade,
          onboarding_completed: !!data.full_name,
          device_setup_complete: data.device_setup_complete ?? false,
        };
        setProfile(next);
        localStorage.setItem('edu-zambia-user-type', role);
        try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(next)); } catch {}
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      // Map backward compat fields to real columns
      const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name;
      if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.school !== undefined) dbUpdates.school = updates.school;
      if (updates.province !== undefined) dbUpdates.province = updates.province;
      if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
      if (updates.grade_level !== undefined) dbUpdates.grade = updates.grade_level;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.user_type !== undefined) dbUpdates.role = toAppRole(updates.user_type);
      // Extended pass-through fields
      const passthrough = [
        'education_level','institution_name','institution_type','program_of_study','year_of_study',
        'subjects','exam_target','exam_year','study_goals','date_of_birth','guardian_contact',
        'career_interest','learning_style','preferred_language',
        'subjects_taught','grades_taught','years_experience','teacher_qualification',
        'relationship_to_child','num_children','device_setup_complete',
      ] as const;
      for (const k of passthrough) {
        if ((updates as any)[k] !== undefined) dbUpdates[k] = (updates as any)[k];
      }

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);

      if (updates.role || updates.user_type) {
        localStorage.setItem('edu-zambia-user-type', dbUpdates.role);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
};

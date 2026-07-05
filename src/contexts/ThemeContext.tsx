import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themes: { id: ThemeType; name: string; colors: string[] }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes: { id: ThemeType; name: string; colors: string[] }[] = [
  { id: 'dark', name: 'Dark', colors: ['#0D1117', '#1877F2', '#3FB950'] },
  { id: 'light', name: 'Light', colors: ['#F0F2F5', '#1877F2', '#42B72A'] },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('edu-zambia-theme') as ThemeType;
      return saved === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });

  const setTheme = useCallback(async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('edu-zambia-theme', newTheme);
    // Persist to profile if logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      supabase.from('profiles').update({ theme_preference: newTheme }).eq('id', user.id).then();
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  // Sync theme from profile on auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data } = await supabase.from('profiles').select('theme_preference').eq('id', session.user.id).single();
        if (data?.theme_preference && (data.theme_preference === 'light' || data.theme_preference === 'dark')) {
          setThemeState(data.theme_preference as ThemeType);
          localStorage.setItem('edu-zambia-theme', data.theme_preference);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

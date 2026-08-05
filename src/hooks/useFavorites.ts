import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface Favorite {
  id: string;
  label: string;
  url: string;
  icon: string | null;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setFavorites([]); setLoading(false); return; }
    const { data } = await supabase
      .from('user_favorites')
      .select('id, label, url, icon')
      .order('created_at', { ascending: true });
    setFavorites((data ?? []) as Favorite[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const isFavorite = (url: string) => favorites.some((f) => f.url === url);

  const toggleFavorite = async (fav: { label: string; url: string; icon?: string }) => {
    if (!user) return false;
    const existing = favorites.find((f) => f.url === fav.url);
    if (existing) {
      await supabase.from('user_favorites').delete().eq('id', existing.id);
      setFavorites((p) => p.filter((f) => f.id !== existing.id));
      return false;
    }
    const { data } = await supabase
      .from('user_favorites')
      .insert({ user_id: user.id, label: fav.label, url: fav.url, icon: fav.icon ?? null })
      .select('id, label, url, icon')
      .single();
    if (data) setFavorites((p) => [...p, data as Favorite]);
    return true;
  };

  return { favorites, loading, isFavorite, toggleFavorite, reload: load };
}

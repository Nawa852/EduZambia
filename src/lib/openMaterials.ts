import { supabase } from '@/integrations/supabase/client';

export interface OpenMaterial {
  id: string;
  title: string;
  source_url: string;
  provider: string;
  content: string | null;
  level: number | null;
  license_name: string | null;
  license_url: string | null;
  attribution: string | null;
  download_url: string | null;
  import_status: string;
}

export function canReadImportedMaterial(item: Pick<OpenMaterial, 'import_status' | 'content' | 'license_url' | 'attribution'>) {
  return item.import_status === 'imported' && !!item.content?.trim() && !!item.license_url && !!item.attribution?.trim();
}

export async function listOpenMaterials(): Promise<OpenMaterial[]> {
  const { data, error } = await supabase.from('open_learning_materials').select('*').eq('language', 'loz').order('title');
  if (error) throw error;
  return data ?? [];
}
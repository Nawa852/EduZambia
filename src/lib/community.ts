import { supabase } from '@/integrations/supabase/client';

export interface Contribution {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  subject: string | null;
  grade_level: string | null;
  link_url: string | null;
  resource_id: string | null;
  tags: string[];
  status: string;
  view_count: number;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null } | null;
  vote_count?: number;
  voted_by_me?: boolean;
}

export interface CommunityPage {
  id: string;
  owner_id: string;
  handle: string;
  name: string;
  page_type: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  website_url: string | null;
  youtube_url: string | null;
  location: string | null;
  subjects: string[];
  is_published: boolean;
  is_verified: boolean;
  follower_count: number;
  created_at: string;
}

export interface PagePost {
  id: string;
  page_id: string;
  author_id: string;
  content: string;
  media_url: string | null;
  link_url: string | null;
  post_type: string;
  created_at: string;
}

export const CONTRIBUTION_KINDS = ['tip', 'notes', 'past-paper', 'video', 'link', 'other'] as const;
export const SUBJECTS = [
  'Mathematics', 'English', 'Biology', 'Chemistry', 'Physics', 'Science',
  'History', 'Geography', 'Civic Education', 'ICT', 'Business Studies', 'Other',
];

/* ---------------- Contributions ---------------- */

export async function listContributions(opts: {
  search?: string; kind?: string; subject?: string; sort?: 'new' | 'top';
} = {}): Promise<Contribution[]> {
  let q = supabase.from('community_contributions').select('*').eq('status', 'published').limit(100);
  if (opts.kind && opts.kind !== 'all') q = q.eq('kind', opts.kind);
  if (opts.subject && opts.subject !== 'all') q = q.eq('subject', opts.subject);
  if (opts.search) q = q.ilike('title', `%${opts.search}%`);
  q = q.order('created_at', { ascending: false });

  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as unknown as Contribution[];
  if (!rows.length) return rows;

  const ids = rows.map(r => r.id);
  const userIds = [...new Set(rows.map(r => r.user_id))];
  const [{ data: votes }, { data: profiles }, { data: session }] = await Promise.all([
    supabase.from('contribution_votes').select('contribution_id,user_id').in('contribution_id', ids),
    supabase.from('profiles').select('id,full_name,avatar_url').in('id', userIds),
    supabase.auth.getSession(),
  ]);
  const me = session?.session?.user?.id;
  const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const enriched = rows.map(r => ({
    ...r,
    author: profMap.get(r.user_id) ?? null,
    vote_count: (votes ?? []).filter((v: any) => v.contribution_id === r.id).length,
    voted_by_me: (votes ?? []).some((v: any) => v.contribution_id === r.id && v.user_id === me),
  }));
  if (opts.sort === 'top') enriched.sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
  return enriched;
}

export async function createContribution(input: {
  kind: string; title: string; body?: string; subject?: string | null;
  grade_level?: string | null; link_url?: string | null; resource_id?: string | null; tags?: string[];
}): Promise<Contribution> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) throw new Error('Please sign in to contribute.');

  const { data, error } = await supabase.from('community_contributions').insert({
    user_id: user.id,
    kind: input.kind,
    title: input.title.trim(),
    body: input.body?.trim() || null,
    subject: input.subject || null,
    grade_level: input.grade_level || null,
    link_url: input.link_url || null,
    resource_id: input.resource_id || null,
    tags: input.tags ?? [],
  }).select('*').single();
  if (error) throw error;
  await logActivity('contribution_created', 'contribution', (data as any).id);
  return data as unknown as Contribution;
}

export async function toggleVote(contributionId: string, voted: boolean): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) throw new Error('Please sign in to vote.');
  if (voted) {
    await supabase.from('contribution_votes').delete().eq('contribution_id', contributionId).eq('user_id', user.id);
  } else {
    await supabase.from('contribution_votes').insert({ contribution_id: contributionId, user_id: user.id });
  }
}

/* ---------------- Pages ---------------- */

export async function listPages(search?: string, type?: string): Promise<CommunityPage[]> {
  let q = supabase.from('community_pages').select('*').eq('is_published', true).limit(100);
  if (type && type !== 'all') q = q.eq('page_type', type);
  if (search) q = q.ilike('name', `%${search}%`);
  const { data, error } = await q.order('follower_count', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CommunityPage[];
}

export async function myPages(): Promise<CommunityPage[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return [];
  const { data } = await supabase.from('community_pages').select('*').eq('owner_id', user.id).order('created_at');
  return (data ?? []) as unknown as CommunityPage[];
}

export async function getPageByHandle(handle: string): Promise<CommunityPage | null> {
  const { data } = await supabase.from('community_pages').select('*').eq('handle', handle).maybeSingle();
  return (data as unknown as CommunityPage) ?? null;
}

export async function createPage(input: {
  name: string; handle: string; page_type: string; bio?: string;
  location?: string; website_url?: string; youtube_url?: string; subjects?: string[];
}): Promise<CommunityPage> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) throw new Error('Please sign in to create a page.');
  const { data, error } = await supabase.from('community_pages').insert({
    owner_id: user.id,
    name: input.name.trim(),
    handle: input.handle.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    page_type: input.page_type,
    bio: input.bio?.trim() || null,
    location: input.location?.trim() || null,
    website_url: input.website_url?.trim() || null,
    youtube_url: input.youtube_url?.trim() || null,
    subjects: input.subjects ?? [],
    is_published: true,
  }).select('*').single();
  if (error) throw error;
  await logActivity('page_created', 'page', (data as any).id);
  return data as unknown as CommunityPage;
}

export async function updatePage(id: string, patch: Partial<CommunityPage>): Promise<void> {
  const { error } = await supabase.from('community_pages').update(patch as never).eq('id', id);
  if (error) throw error;
  await logActivity('page_updated', 'page', id);
}

export async function isFollowingPage(pageId: string): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return false;
  const { data } = await supabase.from('page_followers').select('id').eq('page_id', pageId).eq('user_id', user.id).maybeSingle();
  return !!data;
}

export async function togglePageFollow(pageId: string, following: boolean): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) throw new Error('Please sign in to follow pages.');
  if (following) {
    await supabase.from('page_followers').delete().eq('page_id', pageId).eq('user_id', user.id);
  } else {
    await supabase.from('page_followers').insert({ page_id: pageId, user_id: user.id });
    await logActivity('page_followed', 'page', pageId);
  }
}

/* ---------------- Page posts ---------------- */

export async function listPagePosts(pageId: string): Promise<PagePost[]> {
  const { data } = await supabase.from('page_posts').select('*').eq('page_id', pageId).order('created_at', { ascending: false }).limit(50);
  return (data ?? []) as unknown as PagePost[];
}

export async function createPagePost(pageId: string, input: { content: string; post_type?: string; link_url?: string; media_url?: string }): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) throw new Error('Please sign in.');
  const { error } = await supabase.from('page_posts').insert({
    page_id: pageId,
    author_id: user.id,
    content: input.content.trim(),
    post_type: input.post_type ?? 'update',
    link_url: input.link_url || null,
    media_url: input.media_url || null,
  });
  if (error) throw error;
  await logActivity('page_post_created', 'page', pageId);
}

export async function deletePagePost(id: string): Promise<void> {
  await supabase.from('page_posts').delete().eq('id', id);
}

/* ---------------- People follows ---------------- */

export async function listMyFollowing(): Promise<Set<string>> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return new Set();
  const { data } = await supabase.from('user_follows').select('following_id').eq('follower_id', user.id);
  return new Set((data ?? []).map((r: any) => r.following_id));
}

export async function toggleUserFollow(targetId: string, following: boolean): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) throw new Error('Please sign in to follow people.');
  if (following) {
    await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
  } else {
    const { error } = await supabase.from('user_follows').insert({ follower_id: user.id, following_id: targetId });
    if (error) throw error;
  }
}

/* ---------------- Activity ---------------- */

export async function logActivity(action: string, entityType?: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return;
  await supabase.from('community_activity').insert({
    user_id: user.id,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    metadata: metadata as never,
  });
}

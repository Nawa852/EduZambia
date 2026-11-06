import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const query = `select tablename, policyname, qual from pg_policies where schemaname='public' and cmd='SELECT' and tablename in ('profiles','video_rooms','video_room_participants','user_follows','study_group_members','event_attendees','social_comments')`;
type Policy = { tablename: string; policyname: string; qual: string };
const { rows } = JSON.parse(execFileSync('lovable', ['supabase', 'query', query, '--json'], { encoding: 'utf8' })) as { rows: Policy[] };

const rules = [
  ['video_rooms', 'host_id = auth.uid()'],
  ['video_room_participants', 'user_id = auth.uid()'],
  ['user_follows', '(follower_id = auth.uid()) OR (following_id = auth.uid())'],
  ['profiles', 'can_read_connected_profile(id)'],
  ['study_group_members', 'is_group_member(group_id, auth.uid())'],
  ['event_attendees', 'user_id = auth.uid()'],
  ['social_comments', 'user_id = auth.uid()'],
] as const;

for (const [table, predicate] of rules) {
  test(`${table} rejects unrestricted cross-account reads`, () => {
    const policies = rows.filter((row) => row.tablename === table);
    expect(policies.length).toBeGreaterThan(0);
    expect(policies.some((row) => row.qual.includes(predicate))).toBe(true);
    for (const row of policies) {
      expect(row.qual).not.toMatch(/^\s*\(?true\)?\s*$/i);
      // Every permissive read path must use the intended rule or protected admin check.
      expect(row.qual.includes(predicate) || (table === 'profiles' && row.qual === 'is_platform_admin(auth.uid())')).toBe(true);
    }
  });
}
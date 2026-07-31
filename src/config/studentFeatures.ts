/**
 * Student feature gating — "Consolidate, Hide, Pre-seed".
 *
 * Nothing here deletes code. Tier 2 features stay fully implemented and routable;
 * they are simply removed from student navigation until there is enough density
 * for them to feel alive. Flip a flag to `true` to bring one back.
 */

export type StudentFeatureKey =
  // Tier 1 — launch core
  | 'synapse_ai'
  | 'ecz_practice'
  | 'resources'
  | 'planner'
  | 'focus_mode'
  | 'profile'
  | 'family_link'
  // Tier 2 — paused until density
  | 'video_rooms'
  | 'video_library'
  | 'peers'
  | 'messages'
  | 'social_feed'
  | 'groups'
  | 'events'
  | 'mentors'
  | 'public_leaderboard'
  | 'world_class_courses'
  // Tier 3 — removed from the student experience
  | 'connect_hub'
  | 'standalone_goals'
  | 'separate_learn_tab';

export const STUDENT_FEATURES: Record<StudentFeatureKey, boolean> = {
  // Tier 1 — KEEP
  synapse_ai: true,
  ecz_practice: true,
  resources: true,
  planner: true,
  focus_mode: true,
  profile: true,
  family_link: true,

  // Tier 2 — PAUSE (re-enable at 5,000+ DAU in one province)
  video_rooms: false,
  video_library: false,
  peers: false,
  messages: false,
  social_feed: false,
  groups: false,
  events: false,
  mentors: false,
  public_leaderboard: false,
  world_class_courses: false,

  // Tier 3 — REMOVE from student navigation
  connect_hub: false,
  standalone_goals: false,
  separate_learn_tab: false,
};

export function isStudentFeature(key: StudentFeatureKey): boolean {
  return STUDENT_FEATURES[key];
}

/**
 * Route prefixes hidden from student navigation while their flag is off.
 * The routes still resolve — deep links and other roles are unaffected.
 */
const GATED_ROUTES: Array<{ prefix: string; key: StudentFeatureKey }> = [
  { prefix: '/connect', key: 'connect_hub' },
  { prefix: '/video-rooms', key: 'video_rooms' },
  { prefix: '/free-courses', key: 'world_class_courses' },
  { prefix: '/role-videos', key: 'video_library' },
  { prefix: '/student-videos', key: 'video_library' },
  { prefix: '/watch', key: 'video_library' },
  { prefix: '/peer-matching', key: 'peers' },
  { prefix: '/messenger', key: 'messages' },
  { prefix: '/direct-messages', key: 'messages' },
  { prefix: '/study-groups', key: 'groups' },
  { prefix: '/group', key: 'groups' },
  { prefix: '/community-events', key: 'events' },
  { prefix: '/mentor', key: 'mentors' },
  { prefix: '/learn', key: 'separate_learn_tab' },
];

/** True when a nav destination should be visible to a student. */
export function isStudentNavVisible(url: string): boolean {
  const path = url.split('?')[0];
  const tab = url.includes('?tab=') ? url.split('?tab=')[1] : '';

  if (tab === 'leaderboard' && !STUDENT_FEATURES.public_leaderboard) return false;
  if (tab === 'goals' && !STUDENT_FEATURES.standalone_goals) return false;

  const gate = GATED_ROUTES.find((g) => path === g.prefix || path.startsWith(`${g.prefix}/`));
  if (!gate) return true;
  return STUDENT_FEATURES[gate.key];
}

// Tiny in-memory cache so remounted tabs (chat/tutor, scroll positions, etc.)
// don't lose their state or jump back to the top on mobile tab switches.
type Entry = { messages?: any[]; scrollTop?: number; input?: string };
const store = new Map<string, Entry>();

export const getTabState = (key: string): Entry => store.get(key) ?? {};
export const setTabState = (key: string, patch: Entry) => {
  const cur = store.get(key) ?? {};
  store.set(key, { ...cur, ...patch });
};
export const clearTabState = (key: string) => { store.delete(key); };

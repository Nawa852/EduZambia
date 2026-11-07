# Architecture rules

- Keep the existing shared React theme and navigation components authoritative so visual updates remain consistent across stakeholder pages.
- Authentication callbacks must stay synchronous; defer database reads until after the callback to avoid authentication-lock deadlocks.
- Curriculum drafts must retain source provenance and review status; never present synthetic competence codes as verified CDC codes.
- Reuse the existing authenticated teacher generation function and validate structured drafts before applying them.
- Lesson-generator callers share a session-aware invoker: reject missing sessions locally, send the current user token explicitly, and refresh/retry a 401 only once to preserve authentication without retry loops.
- Teacher plans and schemes share a non-forced curriculum/setup → editable draft → export flow; preserve existing print formats and expose unverified source status.
- Retired social and video records remain owner-scoped; group rosters require membership, and profile reads require ownership, an active teaching/family connection, or protected admin authorization to preserve student privacy.
# Architecture rules

- Keep the existing shared React theme and navigation components authoritative so visual updates remain consistent across stakeholder pages.
- Authentication callbacks must stay synchronous; defer database reads until after the callback to avoid authentication-lock deadlocks.
- Curriculum drafts must retain source provenance and review status; never present synthetic competence codes as verified CDC codes.
- Reuse the existing authenticated teacher generation function and validate structured drafts before applying them.
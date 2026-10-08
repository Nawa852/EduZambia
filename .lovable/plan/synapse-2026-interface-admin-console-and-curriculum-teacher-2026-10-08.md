# Synapse 2026 interface, admin console, and curriculum teacher workspace

## Direction
Keep the existing Synapse palette, typography, and overall layout. Modernise the execution rather than rebrand: calmer surfaces, clearer hierarchy, refined symbols, a compact adaptive bottom bar, and fewer decorative effects.

## Build sequence

1. **Remove unsuitable onboarding**
   - Stop forcing signed-in users through setup wizards.
   - Remove dashboard tours, welcome banners, role-switch wizard links, and obsolete setup routes.
   - Keep only essential account details editable from Profile; keep role selection during account creation where required.

2. **Modernise the shared interface**
   - Refine the existing light/dark tokens without changing the chosen palette.
   - Update shared buttons, top bar, sidebar, loading states, and bottom navigation.
   - Use consistent outlined icons, stable touch targets, clearer active states, and reduced glass/gradient decoration.
   - Preserve the current page structure and typography.

3. **Open and verify Admin Console**
   - Add `/admin-console` behind authenticated server-verified administrator access.
   - Sign in with the existing administrator account, verify the console, upload a small test material, and confirm the displayed material count/list updates.
   - Improve empty/error/loading states encountered during the walkthrough.

4. **Build the curriculum-grounded teacher workflow**
   - Use official Zambian Ministry, CDC, and ECZ sources as the authority; do not scrape or copy PrepDesk’s protected content.
   - Recreate the useful workflow independently: curriculum → level/grade → subject → topic → competence → term/week → lesson plan or scheme.
   - Store source provenance, curriculum version, status, and syllabus references with every structured record.
   - Upgrade Lesson Planner and Scheme of Work to use verified curriculum records, simple curriculum pickers, editable generated sections, version history, school branding, and export/print.
   - Clearly label placeholder or unverified curriculum records until an official syllabus source is attached.

5. **Validation**
   - Check the signed-in administrator flow and representative student/teacher mobile and desktop screens.
   - Verify no forced wizard, no infinite loading state, correct navigation, successful upload, and curriculum-backed plan generation.

## Technical notes
- Frontend changes stay within the existing React design system and semantic theme tokens.
- Administrator access remains database-verified; no client-stored admin flag.
- Curriculum ingestion is source-aware and additive so old and new curriculum versions can coexist.
- Broad web collection is limited to lawful, attributable sources; official documents take priority over third-party copies.

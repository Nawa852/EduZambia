# Architecture rules

- Mount the platform admin console inside ProtectedRoute and MainLayout, outside learner onboarding and student feature gates; its server-backed admin check and data policies determine access.
- Only import official curriculum content with identifiable source and curriculum edition; inferred or generated codes must not masquerade as official outcomes.
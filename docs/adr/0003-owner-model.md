# ADR 0003: Adopt an Owner Abstraction (User Now, Org Later)

## Status
Accepted

## Context
Current product scope is user-owned private packages. A near-term requirement is adding organizations without rewriting ownership across package/context resources.

## Decision
- Introduce an `owners` table as canonical resource owner identity.
- `owners.kind` supports `user` and `org`.
- `packages` and `contexts` reference `owner_id` (not directly `user_id`).
- Keep user-first UX; each user gets a corresponding `owners` row.
- Add organization tables now (`organizations`, `organization_members`) to avoid schema churn later.

## Rationale
- Avoids fragile future migrations from `owner_user_id` to mixed ownership.
- Centralizes authorization checks around a single owner primitive.
- Supports gradual org rollout behind feature flags.

## Consequences
- Signup flow must create both `users` and corresponding `owners` rows.
- Authorization logic must resolve “acting principal” to one or more owner IDs.
- Resource APIs remain stable as org support is introduced.

## Follow-up
- Add owner resolution helper in backend auth middleware.
- Enforce owner-scoped uniqueness (`owner_id`, `package_name`).
- Implement org membership roles (`owner`, `admin`, `member`) in phase 4.

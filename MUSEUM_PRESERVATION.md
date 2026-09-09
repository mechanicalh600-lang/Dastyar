# NewRay Legacy Operational Preservation Contract

This repository is preserved as a fully operational historical NewRay application. It is not a screenshot, mock, disposable demo, or resettable sandbox.

## Immutable historical experience

Security, reliability, deployment, and data-protection work must not intentionally change the visible UI, visual styling, navigation structure, labels, branding, or historical interaction model.

## Operational requirement

The preserved application must continue to behave like real software:

- Database-backed users authenticate through the database-backed authentication flow.
- Roles and permissions have real server-side effects.
- Sessions are validated and revocable.
- Operational records are persisted and remain available after refresh and later visits.
- Normal workflows may create and update real application records according to authorization rules.
- CI, deployment, monitoring, migration history, recovery, and security controls are maintained.

## Historical data retention

Existing factory, personnel, equipment, work, report, message, and other historical application data is part of the preserved operational record and must be retained by default.

No bulk deletion, anonymization, synthetic replacement, periodic reset, or destructive cleanup of historical business data is permitted without an explicit preservation decision from the project owner.

Security work must prefer access control, authentication, authorization, encryption/hashing, secret management, auditability, and recovery over deleting historical data.

## Allowed invisible maintenance

- Authentication and session hardening
- Database permissions and RLS
- Password hashing and removal of plaintext credentials
- Secret/API-key removal from source control
- Dependency and security updates that do not alter the rendered experience
- CI/build/deployment reliability
- Backup, migration, recovery, audit, and observability improvements
- Performance fixes that preserve behavior
- Non-destructive constraints and indexes
- Per-user data ownership and role enforcement

## Configuration and secrets

Live service configuration must not be hardcoded in tracked source files. Local development uses ignored environment files. Hosted deployments inject configuration through the deployment environment or secret store.

A browser-side API key must not be treated as secret merely because it came from an environment variable at build time. Sensitive third-party API keys require a server-side proxy or equivalent protected boundary.

## Preservation rule

Any future change that materially alters the historical user experience, removes historical business data, changes the meaning of a historical record, or weakens the operational authenticity of the application requires an explicit preservation decision rather than being bundled into technical maintenance.

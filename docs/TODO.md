# TODO

## Production Hardening

- Add real secret encryption/key management for SMTP passwords.
- Add production-grade PDF styling for payslips and project reports.
- Add month-level payroll and attendance lock tables if business rules require global locks.
- Add broader integration tests with PostgreSQL and Redis test containers.
- Add object storage integration for project document file upload/download.
- Add CI workflow for Prisma validate, typecheck, tests, and production builds.

## Follow-Up Features

- Employee-specific monthly allowances, salary advances, manual bonuses, and project bonuses in payroll calculation.
- Project activity log table if audit-log-backed timeline becomes too limiting.
- Report filters and downloadable dashboards beyond the current foundation.
- SMTP delivery health checks and queue monitoring UI.

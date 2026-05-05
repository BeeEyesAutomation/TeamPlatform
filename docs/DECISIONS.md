# Decisions

## 2026-05-05 - Phase 0 Setup Decisions

### Monorepo Layout

Use an npm workspace monorepo with:

- `apps/web` for the Next.js frontend.
- `apps/api` for the Express API and Prisma schema.
- `packages/shared` for shared TypeScript types, constants, and permissions.

### Runtime Services

Use Docker Compose for local PostgreSQL 16.x and Redis services.

### Environment Variables

Keep the existing access/refresh JWT variables for the scaffold and also include generic `JWT_SECRET` and `JWT_EXPIRES_IN` keys required by Phase 0. The auth implementation phase should choose one canonical token configuration and remove duplication if appropriate.

### Validation Scope

Phase 0 is an audit and setup check only. Do not implement business modules or run the full test suite.

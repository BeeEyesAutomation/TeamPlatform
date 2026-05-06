# Setup Troubleshooting

## PostgreSQL Auth Errors

Symptoms include `password authentication failed`, `role does not exist`, or Prisma cannot connect.

Check that `.env` matches `docker-compose.yml`:

```powershell
docker compose up -d postgres
docker ps
```

Default local URL:

```txt
postgresql://team_platform:team_platform@localhost:5432/team_platform?schema=public
```

If the database volume was created with different credentials, recreate only when local data can be discarded:

```powershell
docker compose down
docker volume rm teamplatform_postgres_data
docker compose up -d postgres
```

## DATABASE_URL Missing

Prisma requires `DATABASE_URL`.

```powershell
cp .env.example .env
npx prisma validate --schema apps/api/prisma/schema.prisma
```

## Redis Not Running

BullMQ email jobs require Redis.

```powershell
docker compose up -d redis
docker ps
```

Default local URL:

```txt
redis://localhost:6379
```

## ESM/CommonJS Config Errors

The API uses ESM TypeScript with extensionless source imports. Keep `apps/api/tsconfig.json` on bundler-compatible module resolution and use package scripts rather than mixing direct `node` execution with TypeScript source files.

Recommended checks:

```powershell
npm run typecheck --workspace apps/api
npm run typecheck --workspace apps/web
```

## PowerShell npm/npx Execution Policy

If PowerShell blocks `npm.ps1` or `npx.ps1`, use one of:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
cmd /c npm run typecheck --workspace apps/api
cmd /c npx prisma validate --schema apps/api/prisma/schema.prisma
```

## GitHub CLI Missing

Phase 7 publishing was blocked because the `gh` command was not available in PowerShell.

Install and authenticate GitHub CLI before retrying the commit/push/PR update flow:

```powershell
winget install --id GitHub.cli
gh auth login
gh auth status
```

# Team Platform

Initial scaffold for a web-based HRM, Payroll, Project Management, Project Documents, Import/Export, Reporting, and Email Automation system.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL 16.x
- ORM: Prisma
- Auth: JWT with RBAC
- Queue: BullMQ with Redis
- Email: Nodemailer with SMTP
- Import/Export: ExcelJS and Puppeteer

## Structure

```txt
apps/
  api/    Express API, Prisma schema, module placeholders, workers
  web/    Next.js dashboard shell
packages/
  shared/ Shared constants, permissions, and TypeScript types
```

## Local Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:generate
npm run dev
```

The API listens on `http://localhost:4000` by default. The web app listens on `http://localhost:3000`.

## Current Scope

This commit intentionally contains only the foundation:

- Monorepo package layout
- API application shell
- Prisma PostgreSQL schema foundation
- Auth and RBAC placeholders
- Module route placeholders
- Email queue wiring placeholders
- Next.js dashboard layout placeholders

Business logic should be implemented module by module in later tasks.

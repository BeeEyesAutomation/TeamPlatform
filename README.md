# Team Platform

Web-based company management system for HR, attendance, payroll, projects, project documents, import/export, reporting, and SMTP email automation.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL 16.x with Prisma
- Auth: JWT with RBAC
- Queue: BullMQ with Redis
- Email: Nodemailer with configurable SMTP
- Import/Export: ExcelJS, CSV, and Puppeteer PDF foundation

## Local Setup

```powershell
cp .env.example .env
npm install
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Default URLs:

- API: `http://localhost:4000`
- Web: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Default seed admin values come from `.env`:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_FULL_NAME`

## Useful Commands

```powershell
npx prisma validate --schema apps/api/prisma/schema.prisma
npm run prisma:generate
npm run typecheck --workspace apps/api
npm run typecheck --workspace apps/web
npm run test --workspace apps/api
npm run build --workspace apps/api
npm run build --workspace apps/web
```

Run apps separately:

```powershell
npm run dev --workspace apps/api
npm run dev --workspace apps/web
```

## Implemented Modules

- Auth and RBAC
- Employees, departments, positions, and salary preview
- Manual attendance
- Payroll configuration, calculation, publishing, and payslips
- Project core management
- Project documents and document permissions
- SMTP email automation with BullMQ queue
- Import/export/reporting foundation

## Notes

- Do not commit real secrets. Use `.env` locally and keep `.env.example` as documentation only.
- SMTP passwords can be stored as an environment reference such as `env:SMTP_PASSWORD`.
- Import upload is currently JSON-row based; Excel template generation and error workbook export are implemented.
- PDF exports are foundation reports using generated HTML tables.

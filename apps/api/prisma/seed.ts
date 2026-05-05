import { PrismaClient } from "@prisma/client";
import { coreRoles, permissions } from "@team-platform/shared";

const prisma = new PrismaClient();

const documentTypes = [
  "contract",
  "quotation",
  "drawing",
  "meeting_minutes",
  "acceptance_minutes",
  "handover_minutes",
  "invoice",
  "payment_voucher",
  "site_image",
  "technical_document",
  "other"
];

const emailTemplates = [
  "task_assigned",
  "task_confirmed",
  "task_progress_updated",
  "task_deadline_reminder",
  "issue_created",
  "issue_resolved",
  "payroll_published",
  "attendance_locked",
  "payroll_locked",
  "project_document_pending_approval"
];

const titleCase = (value: string) =>
  value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

async function main() {
  for (const code of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: titleCase(code.replace(".", "_"))
      }
    });
  }

  for (const code of coreRoles) {
    await prisma.role.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: titleCase(code),
        status: "active"
      }
    });
  }

  for (const code of documentTypes) {
    await prisma.documentType.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: titleCase(code),
        status: "active"
      }
    });
  }

  for (const code of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: titleCase(code),
        subject: `[Team Platform] ${titleCase(code)}`,
        body: `Template placeholder for ${code}.`,
        isActive: true
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

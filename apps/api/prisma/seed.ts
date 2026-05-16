import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(seedDir, "../../../.env") });
dotenv.config({ path: path.resolve(seedDir, "../.env"), override: true });

const prisma = new PrismaClient();

const roles = [
  "admin",
  "director",
  "hr",
  "accountant",
  "project_manager",
  "team_leader",
  "project_employee",
  "employee",
  "customer_partner"
];

const permissions = [
  "auth.me",
  "users.manage",
  "roles.manage",
  "employees.view",
  "employees.manage",
  "employees.view_sensitive",
  "attendance.manage",
  "attendance.lock",
  "payroll.view",
  "payroll.configure",
  "payroll.manage",
  "payroll.publish",
  "projects.view",
  "projects.manage",
  "project_documents.view",
  "project_documents.upload",
  "project_documents.download",
  "project_documents.approve",
  "project_documents.manage",
  "imports.manage",
  "exports.manage",
  "inventory.view",
  "inventory.manage",
  "inventory.categories.manage",
  "inventory.suppliers.manage",
  "inventory.adjust_stock",
  "inventory.stock_in",
  "inventory.stock_out",
  "inventory.history.view",
  "inventory.import",
  "inventory.export",
  "inventory.view_cost",
  "quotations.view",
  "quotations.manage",
  "quotations.export",
  "quotations.delete",
  "email.manage",
  "audit_logs.view"
];

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
  "smtp_test",
  "attendance_locked",
  "payroll_locked",
  "project_document_pending_approval"
];

const taxBrackets = [
  { level: 1, incomeFrom: "0", incomeTo: "5000000", taxRate: "5" },
  { level: 2, incomeFrom: "5000000", incomeTo: "10000000", taxRate: "10" },
  { level: 3, incomeFrom: "10000000", incomeTo: "18000000", taxRate: "15" },
  { level: 4, incomeFrom: "18000000", incomeTo: "32000000", taxRate: "20" },
  { level: 5, incomeFrom: "32000000", incomeTo: "52000000", taxRate: "25" },
  { level: 6, incomeFrom: "52000000", incomeTo: "80000000", taxRate: "30" },
  { level: 7, incomeFrom: "80000000", incomeTo: null, taxRate: "35" }
];

const allowanceTypes = [
  {
    code: "MEAL_ALLOWANCE",
    name: "Meal Allowance",
    calculationType: "per_working_day" as const,
    amount: "50000",
    unit: "VND/day",
    isTaxable: false,
    isInsuranceBased: false,
    applyScope: "company" as const,
    status: "active" as const,
    metadata: {
      example: "50000 VND per actual present day"
    }
  },
  {
    code: "ATTENDANCE_BONUS",
    name: "Attendance Bonus",
    calculationType: "attendance_rate" as const,
    amount: "500000",
    unit: "VND/month",
    isTaxable: true,
    isInsuranceBased: false,
    applyScope: "company" as const,
    status: "active" as const,
    metadata: {
      minAttendancePercent: 80
    }
  },
  {
    code: "TRAVEL_ALLOWANCE",
    name: "Travel Allowance",
    calculationType: "fixed_monthly" as const,
    amount: "300000",
    unit: "VND/month",
    isTaxable: false,
    isInsuranceBased: false,
    applyScope: "company" as const,
    status: "active" as const,
    metadata: {}
  },
  {
    code: "PROJECT_BONUS",
    name: "Project Bonus",
    calculationType: "project_bonus" as const,
    amount: "0",
    unit: "VND",
    isTaxable: true,
    isInsuranceBased: false,
    applyScope: "employee" as const,
    status: "active" as const,
    metadata: {
      note: "Configured as a project bonus type; actual bonus amounts are assigned later."
    }
  }
];

const titleCase = (value: string) =>
  value
    .split(/[._]/)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
const adminFullName = process.env.ADMIN_FULL_NAME ?? "System Administrator";
const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

async function seedRolesAndPermissions() {
  for (const code of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: titleCase(code)
      }
    });
  }

  for (const code of roles) {
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

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { code: "admin" }
  });
  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id
      }
    });
  }

  for (const roleCode of ["hr", "accountant"]) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: roleCode }
    });

    for (const permissionCode of ["payroll.configure", "payroll.view", "payroll.manage", "payroll.publish"]) {
      const payrollPermission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode }
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: payrollPermission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: payrollPermission.id
        }
      });
    }
  }

  for (const roleCode of ["director", "project_manager", "team_leader"]) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: roleCode }
    });

    for (const permissionCode of ["projects.view", "projects.manage"]) {
      const projectPermission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode }
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: projectPermission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: projectPermission.id
        }
      });
    }
  }

  for (const roleCode of ["project_employee", "employee"]) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: roleCode }
    });
    const projectViewPermission = await prisma.permission.findUniqueOrThrow({
      where: { code: "projects.view" }
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: projectViewPermission.id
        }
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: projectViewPermission.id
      }
    });
  }

  const inventoryRolePermissions: Record<string, string[]> = {
    director: ["inventory.view", "inventory.export", "inventory.view_cost"],
    accountant: ["inventory.view", "inventory.export", "inventory.view_cost"],
    project_manager: ["inventory.view", "inventory.manage", "inventory.categories.manage", "inventory.suppliers.manage", "inventory.adjust_stock", "inventory.stock_in", "inventory.stock_out", "inventory.history.view", "inventory.import", "inventory.export", "inventory.view_cost"],
    team_leader: ["inventory.view", "inventory.adjust_stock", "inventory.stock_in", "inventory.stock_out", "inventory.history.view"],
    project_employee: ["inventory.view"]
  };

  for (const [roleCode, permissionCodes] of Object.entries(inventoryRolePermissions)) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: roleCode }
    });

    for (const permissionCode of permissionCodes) {
      const inventoryPermission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode }
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: inventoryPermission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: inventoryPermission.id
        }
      });
    }
  }
  const quotationRolePermissions: Record<string, string[]> = {
    director: ["quotations.view", "quotations.export"],
    accountant: ["quotations.view", "quotations.manage", "quotations.export"],
    project_manager: ["quotations.view", "quotations.manage", "quotations.export", "quotations.delete"],
    team_leader: ["quotations.view"],
    project_employee: ["quotations.view"]
  };

  for (const [roleCode, permissionCodes] of Object.entries(quotationRolePermissions)) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: roleCode }
    });

    for (const permissionCode of permissionCodes) {
      const quotationPermission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode }
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: quotationPermission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: quotationPermission.id
        }
      });
    }
  }
  const documentRolePermissions: Record<string, string[]> = {
    director: ["project_documents.view", "project_documents.download", "project_documents.approve", "project_documents.manage"],
    project_manager: ["project_documents.view", "project_documents.upload", "project_documents.download", "project_documents.approve", "project_documents.manage"],
    team_leader: ["project_documents.view", "project_documents.upload", "project_documents.download"],
    project_employee: ["project_documents.view", "project_documents.download"],
    customer_partner: ["project_documents.view", "project_documents.download"]
  };

  for (const [roleCode, permissionCodes] of Object.entries(documentRolePermissions)) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: roleCode }
    });

    for (const permissionCode of permissionCodes) {
      const documentPermission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode }
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: documentPermission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: documentPermission.id
        }
      });
    }
  }

  const passwordHash = await bcrypt.hash(adminPassword, bcryptSaltRounds);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: adminFullName,
      passwordHash,
      isActive: true
    },
    create: {
      email: adminEmail,
      fullName: adminFullName,
      passwordHash,
      isActive: true
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id
    }
  });
}

async function seedDocumentTypes() {
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
}

async function seedDocumentPermissions() {
  const allDocumentTypes = await prisma.documentType.findMany({
    where: { deletedAt: null }
  });
  const roleByCode = new Map((await prisma.role.findMany()).map((role) => [role.code, role]));
  const permissionSets = [
    {
      roleCode: "admin",
      securityLevel: null,
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
      canApprove: true
    },
    {
      roleCode: "project_manager",
      securityLevel: null,
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
      canApprove: true
    },
    {
      roleCode: "team_leader",
      securityLevel: "internal_company" as const,
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: false,
      canDownload: true,
      canApprove: false
    },
    {
      roleCode: "project_employee",
      securityLevel: "project_public" as const,
      canView: true,
      canUpload: false,
      canEdit: false,
      canDelete: false,
      canDownload: true,
      canApprove: false
    },
    {
      roleCode: "customer_partner",
      securityLevel: "client_shared" as const,
      canView: true,
      canUpload: false,
      canEdit: false,
      canDelete: false,
      canDownload: true,
      canApprove: false
    }
  ];

  for (const documentType of allDocumentTypes) {
    for (const permissionSet of permissionSets) {
      const role = roleByCode.get(permissionSet.roleCode);
      if (!role) {
        continue;
      }

      const existing = await prisma.documentPermission.findFirst({
        where: {
          documentTypeId: documentType.id,
          roleId: role.id,
          securityLevel: permissionSet.securityLevel
        }
      });
      const data = {
        documentTypeId: documentType.id,
        roleId: role.id,
        securityLevel: permissionSet.securityLevel,
        canView: permissionSet.canView,
        canUpload: permissionSet.canUpload,
        canEdit: permissionSet.canEdit,
        canDelete: permissionSet.canDelete,
        canDownload: permissionSet.canDownload,
        canApprove: permissionSet.canApprove
      };

      if (existing) {
        await prisma.documentPermission.update({
          where: { id: existing.id },
          data: {
            canView: permissionSet.canView,
            canUpload: permissionSet.canUpload,
            canEdit: permissionSet.canEdit,
            canDelete: permissionSet.canDelete,
            canDownload: permissionSet.canDownload,
            canApprove: permissionSet.canApprove
          }
        });
      } else {
        await prisma.documentPermission.create({
          data
        });
      }
    }
  }
}

async function seedEmailTemplates() {
  const templateDefaults: Record<string, { subject: string; body: string }> = {
    task_assigned: {
      subject: "[Team Platform] Task assigned: {{taskTitle}}",
      body: "Hello {{employeeName}},<br/>You have been assigned task <strong>{{taskTitle}}</strong>."
    },
    task_confirmed: {
      subject: "[Team Platform] Task confirmed: {{taskTitle}}",
      body: "Task <strong>{{taskTitle}}</strong> has been confirmed."
    },
    task_progress_updated: {
      subject: "[Team Platform] Task progress updated: {{taskTitle}}",
      body: "Task <strong>{{taskTitle}}</strong> progress is now {{progressPercent}}%."
    },
    issue_created: {
      subject: "[Team Platform] Issue created: {{issueTitle}}",
      body: "Issue <strong>{{issueTitle}}</strong> was created with severity {{severity}}."
    },
    issue_resolved: {
      subject: "[Team Platform] Issue resolved: {{issueTitle}}",
      body: "Issue <strong>{{issueTitle}}</strong> has been resolved or closed."
    },
    payroll_published: {
      subject: "[Team Platform] Payslip published for {{month}}",
      body: "Hello {{employeeName}},<br/>Your payslip for {{month}} has been published. Please sign in to view details."
    },
    project_document_pending_approval: {
      subject: "[Team Platform] Document pending approval: {{documentTitle}}",
      body: "Document <strong>{{documentTitle}}</strong> in project {{projectName}} is pending approval."
    },
    smtp_test: {
      subject: "[Team Platform] SMTP test",
      body: "{{message}}"
    }
  };

  for (const code of emailTemplates) {
    const defaults = templateDefaults[code] ?? {
      subject: `[Team Platform] ${titleCase(code)}`,
      body: `Template placeholder for ${code}.`
    };

    await prisma.emailTemplate.upsert({
      where: { code },
      update: {
        subject: defaults.subject,
        body: defaults.body
      },
      create: {
        code,
        name: titleCase(code),
        subject: defaults.subject,
        body: defaults.body,
        isActive: true
      }
    });
  }
}

async function seedTaxSetting() {
  const existing = await prisma.taxSetting.findFirst({
    where: { status: "active" },
    include: { taxBrackets: true }
  });

  const taxSetting =
    existing ??
    (await prisma.taxSetting.create({
      data: {
        personalDeduction: "11000000",
        dependentDeduction: "4400000",
        socialInsuranceRate: "8",
        healthInsuranceRate: "1.5",
        unemploymentInsuranceRate: "1",
        effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
        status: "active",
        metadata: {
          currency: "VND",
          note: "Default personal income tax and employee insurance contribution settings."
        }
      }
    }));

  if (existing?.taxBrackets.length) {
    return;
  }

  for (const bracket of taxBrackets) {
    await prisma.taxBracket.upsert({
      where: {
        taxSettingId_level: {
          taxSettingId: taxSetting.id,
          level: bracket.level
        }
      },
      update: {},
      create: {
        taxSettingId: taxSetting.id,
        level: bracket.level,
        incomeFrom: bracket.incomeFrom,
        incomeTo: bracket.incomeTo,
        taxRate: bracket.taxRate
      }
    });
  }
}

async function seedAllowanceTypes() {
  for (const allowanceType of allowanceTypes) {
    await prisma.allowanceType.upsert({
      where: {
        code: allowanceType.code
      },
      update: {
        name: allowanceType.name,
        calculationType: allowanceType.calculationType,
        amount: allowanceType.amount,
        unit: allowanceType.unit,
        isTaxable: allowanceType.isTaxable,
        isInsuranceBased: allowanceType.isInsuranceBased,
        applyScope: allowanceType.applyScope,
        status: allowanceType.status,
        metadata: allowanceType.metadata,
        deletedAt: null
      },
      create: allowanceType
    });
  }
}

async function main() {
  await seedRolesAndPermissions();
  await seedDocumentTypes();
  await seedDocumentPermissions();
  await seedEmailTemplates();
  await seedTaxSetting();
  await seedAllowanceTypes();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

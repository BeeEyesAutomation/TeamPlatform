import nodemailer from "nodemailer";
import type { Prisma } from "@prisma/client";
import { getEmailQueue } from "../../jobs/queues";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import { getPagination, getPaginationMeta } from "../hr/hr.utils";
import { renderTemplate, resolveSmtpPassword, sanitizePayrollEmailPayload } from "./email.renderer";
import type { z } from "zod";
import type { emailLogQuerySchema, emailSettingsSchema, emailTemplateUpdateSchema, testEmailSchema } from "./email.schemas";

type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;
type TestEmailInput = z.infer<typeof testEmailSchema>;
type EmailTemplateUpdate = z.infer<typeof emailTemplateUpdateSchema>;
type EmailLogQuery = z.infer<typeof emailLogQuerySchema>;

interface RequestContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface EmailJobData {
  emailLogId: string;
}

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 30_000
  }
};

function passwordValue(input: EmailSettingsInput) {
  return input.passwordEnvVar ? `env:${input.passwordEnvVar}` : input.password ?? "";
}

function createTransport(setting: NonNullable<Awaited<ReturnType<typeof getActiveEmailSetting>>>) {
  return nodemailer.createTransport({
    host: setting.host,
    port: setting.port,
    secure: setting.encryption === "ssl",
    requireTLS: setting.encryption === "starttls",
    auth: {
      user: setting.username,
      pass: resolveSmtpPassword(setting.passwordEncrypted)
    }
  });
}

export async function getActiveEmailSetting() {
  return prisma.emailSetting.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function getEmailSettings() {
  return prisma.emailSetting.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }]
  });
}

export async function saveEmailSettings(input: EmailSettingsInput, context: RequestContext) {
  const setting = await prisma.$transaction(async (tx) => {
    if (input.isActive) {
      await tx.emailSetting.updateMany({
        data: { isActive: false }
      });
    }

    return tx.emailSetting.create({
      data: {
        host: input.host,
        port: input.port,
        username: input.username,
        passwordEncrypted: passwordValue(input),
        fromEmail: input.fromEmail,
        fromName: input.fromName,
        encryption: input.encryption,
        isActive: input.isActive
      }
    });
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "save_email_settings",
    module: "email",
    targetType: "email_setting",
    targetId: setting.id,
    newValue: { ...setting, passwordEncrypted: "***" },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return { ...setting, passwordEncrypted: "***" };
}

export async function enqueueTestEmail(input: TestEmailInput, context: RequestContext) {
  return enqueueEmail({
    toEmail: input.toEmail,
    templateCode: "smtp_test",
    variables: {
      subject: "SMTP test",
      message: "This is a queued SMTP test email from Team Platform."
    },
    context
  });
}

export async function listEmailTemplates() {
  return prisma.emailTemplate.findMany({
    orderBy: { code: "asc" }
  });
}

export async function getEmailTemplate(id: string) {
  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) throw new AppError(404, "Email template not found");
  return template;
}

export async function updateEmailTemplate(id: string, input: EmailTemplateUpdate, context: RequestContext) {
  const existing = await getEmailTemplate(id);
  const template = await prisma.emailTemplate.update({
    where: { id },
    data: input
  });

  await createAuditLog({
    actorId: context.actorId,
    action: "update_email_template",
    module: "email",
    targetType: "email_template",
    targetId: id,
    oldValue: existing,
    newValue: template,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return template;
}

export async function listEmailLogs(query: EmailLogQuery) {
  const pagination = getPagination(query);
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.templateCode ? { templateCode: query.templateCode } : {}),
    ...(query.search
      ? {
          OR: [
            { toEmail: { contains: query.search, mode: "insensitive" as const } },
            { subject: { contains: query.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
  const [total, items] = await Promise.all([
    prisma.emailLog.count({ where }),
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...pagination
    })
  ]);

  return {
    items,
    meta: getPaginationMeta(query, total)
  };
}

export async function retryEmailLog(id: string) {
  const log = await prisma.emailLog.findUnique({ where: { id } });
  if (!log) throw new AppError(404, "Email log not found");

  const updated = await prisma.emailLog.update({
    where: { id },
    data: { status: "retrying", errorMessage: null }
  });

  try {
    await getEmailQueue().add("send", { emailLogId: id } satisfies EmailJobData, defaultJobOptions);
  } catch (error) {
    await prisma.emailLog.update({
      where: { id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Failed to enqueue email retry"
      }
    });
  }

  return updated;
}

export async function enqueueEmail(input: {
  toEmail?: string | null;
  templateCode: string;
  variables: Record<string, unknown>;
  context?: RequestContext;
}) {
  if (!input.toEmail) {
    return undefined;
  }

  const template = await prisma.emailTemplate.findUnique({
    where: { code: input.templateCode }
  });
  const subject = template?.subject ? renderTemplate(template.subject, input.variables) : String(input.variables.subject ?? input.templateCode);
  const variables = input.templateCode === "payroll_published" ? sanitizePayrollEmailPayload(input.variables) : input.variables;
  const metadata = {
    variables: variables as Prisma.InputJsonObject
  } satisfies Prisma.InputJsonObject;
  const log = await prisma.emailLog.create({
    data: {
      toEmail: input.toEmail,
      subject,
      templateCode: input.templateCode,
      status: "pending",
      metadata
    }
  });

  try {
    await getEmailQueue().add("send", { emailLogId: log.id } satisfies EmailJobData, defaultJobOptions);
  } catch (error) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Failed to enqueue email"
      }
    });
  }

  return log;
}

export async function processEmailJob(input: EmailJobData) {
  const log = await prisma.emailLog.findUnique({
    where: { id: input.emailLogId }
  });
  if (!log) {
    throw new AppError(404, "Email log not found");
  }

  const setting = await getActiveEmailSetting();
  if (!setting) {
    throw new AppError(400, "No active SMTP setting found");
  }

  const template = log.templateCode
    ? await prisma.emailTemplate.findUnique({ where: { code: log.templateCode } })
    : undefined;
  const variables = (log.metadata as { variables?: Record<string, unknown> } | null)?.variables ?? {};
  const html = template?.body ? renderTemplate(template.body, variables) : renderTemplate(String(variables.message ?? ""), variables);
  const subject = template?.subject ? renderTemplate(template.subject, variables) : log.subject;

  await prisma.emailLog.update({
    where: { id: log.id },
    data: { status: "retrying", errorMessage: null }
  });

  try {
    const transporter = createTransport(setting);
    await transporter.sendMail({
      to: log.toEmail,
      from: `"${setting.fromName}" <${setting.fromEmail}>`,
      subject,
      html
    });
    return prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "sent", sentAt: new Date(), errorMessage: null }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed";
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "failed", errorMessage: message }
    });
    throw error;
  }
}

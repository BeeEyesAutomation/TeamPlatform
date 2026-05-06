import { Router, type Request } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import {
  enqueueTestEmail,
  getEmailSettings,
  getEmailTemplate,
  listEmailLogs,
  listEmailTemplates,
  retryEmailLog,
  saveEmailSettings,
  updateEmailTemplate
} from "./email.service";
import { emailLogQuerySchema, emailSettingsSchema, emailTemplateUpdateSchema, idParamSchema, testEmailSchema } from "./email.schemas";

export const emailRouter = Router();

const contextFromRequest = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.header("user-agent")
});

emailRouter.use(requireAuth, requirePermission("email.manage"));

emailRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    res.json({ status: "ok", data: await getEmailSettings() });
  })
);

emailRouter.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const body = emailSettingsSchema.parse(req.body);
    res.json({ status: "ok", data: await saveEmailSettings(body, contextFromRequest(req)) });
  })
);

emailRouter.post(
  "/settings/test",
  asyncHandler(async (req, res) => {
    const body = testEmailSchema.parse(req.body);
    res.json({ status: "ok", data: await enqueueTestEmail(body, contextFromRequest(req)) });
  })
);

emailRouter.get(
  "/templates",
  asyncHandler(async (_req, res) => {
    res.json({ status: "ok", data: await listEmailTemplates() });
  })
);

emailRouter.get(
  "/templates/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await getEmailTemplate(id) });
  })
);

emailRouter.put(
  "/templates/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = emailTemplateUpdateSchema.parse(req.body);
    res.json({ status: "ok", data: await updateEmailTemplate(id, body, contextFromRequest(req)) });
  })
);

emailRouter.get(
  "/logs",
  asyncHandler(async (req, res) => {
    const query = emailLogQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listEmailLogs(query) });
  })
);

emailRouter.post(
  "/logs/:id/retry",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await retryEmailLog(id) });
  })
);

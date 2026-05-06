import { Router, type Request } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import { getImportErrorFile, getTemplate, listImportLogs, previewOrConfirmImport } from "./imports.service";
import { idParamSchema, importLogQuerySchema, importPreviewSchema, importTypeParamSchema } from "./imports.schemas";

export const importsRouter = Router();

const contextFromRequest = (req: Request) => ({
  actorId: req.user?.id
});

importsRouter.use(requireAuth, requirePermission("imports.manage"));

importsRouter.get(
  "/templates/:type",
  asyncHandler(async (req, res) => {
    const { type } = importTypeParamSchema.parse(req.params);
    const template = await getTemplate(type);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${template.fileName}"`);
    res.send(template.buffer);
  })
);

for (const type of ["employees", "attendance", "allowances", "projects", "project-plans", "project-tasks", "project-issues", "project-materials", "project-costs"]) {
  importsRouter.post(
    `/${type}`,
    asyncHandler(async (req, res) => {
      const body = importPreviewSchema.parse(req.body);
      const normalizedType = type.replace(/-/g, "_");
      res.json({ status: "ok", data: await previewOrConfirmImport(normalizedType, body, contextFromRequest(req)) });
    })
  );
}

importsRouter.get(
  "/logs",
  asyncHandler(async (req, res) => {
    const query = importLogQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listImportLogs(query) });
  })
);

importsRouter.get(
  "/logs/:id/error-file",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const file = await getImportErrorFile(id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
    res.send(file.buffer);
  })
);

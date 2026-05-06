import { Router, type Request } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import { exportLogQuerySchema, exportQuerySchema, idParamSchema } from "./exports.schemas";
import { generateExport, listExportLogs } from "./exports.service";

export const exportsRouter = Router();

const contextFromRequest = (req: Request) => ({ actorId: req.user?.id });

const contentType = (format: string) => {
  if (format === "excel") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (format === "pdf") return "application/pdf";
  return "text/csv; charset=utf-8";
};

exportsRouter.use(requireAuth, requirePermission("exports.manage"));

for (const type of ["employees", "attendance", "payroll", "projects", "project-progress", "project-costs", "project-issues", "project-materials", "project-performance"]) {
  exportsRouter.get(
    `/${type}`,
    asyncHandler(async (req, res) => {
      const query = exportQuerySchema.parse(req.query);
      const file = await generateExport(type.replace(/-/g, "_"), query, contextFromRequest(req));
      res.setHeader("Content-Type", contentType(file.format));
      res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
      res.send(file.buffer);
    })
  );
}

exportsRouter.get(
  "/projects/:id/full",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const query = exportQuerySchema.parse({ ...req.query, projectId: id });
    const file = await generateExport("project_full_report", query, contextFromRequest(req));
    res.setHeader("Content-Type", contentType(file.format));
    res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
    res.send(file.buffer);
  })
);

exportsRouter.get(
  "/logs",
  asyncHandler(async (req, res) => {
    const query = exportLogQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listExportLogs(query) });
  })
);

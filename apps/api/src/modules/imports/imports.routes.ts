import { Router, type Request } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";
import { getImportErrorFile, getTemplate, listImportLogs, previewOrConfirmImport, previewOrConfirmImportWorkbook } from "./imports.service";
import { idParamSchema, importLogQuerySchema, importPreviewSchema, importTypeParamSchema } from "./imports.schemas";

export const importsRouter = Router();

const contextFromRequest = (req: Request) => ({
  actorId: req.user?.id
});

async function readRequestBuffer(req: Request) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function parseMultipartUpload(contentType: string, body: Buffer) {
  const boundary = /boundary=([^;]+)/i.exec(contentType)?.[1]?.replace(/^"|"$/g, "");
  if (!boundary) throw new AppError(400, "Multipart boundary is missing");

  const delimiter = `--${boundary}`;
  const parts = body.toString("binary").split(delimiter);
  const fields: Record<string, string> = {};
  let fileName = "upload.xlsx";
  let fileBuffer: Buffer | undefined;

  for (const part of parts) {
    const trimmed = part.replace(/^\r\n/, "");
    if (!trimmed || trimmed === "--\r\n" || trimmed === "--") continue;

    const separatorIndex = trimmed.indexOf("\r\n\r\n");
    if (separatorIndex < 0) continue;

    const rawHeaders = trimmed.slice(0, separatorIndex);
    const rawContent = trimmed.slice(separatorIndex + 4).replace(/\r\n--$/, "").replace(/\r\n$/, "");
    const name = /name="([^"]+)"/i.exec(rawHeaders)?.[1];
    if (!name) continue;

    const uploadedFileName = /filename="([^"]*)"/i.exec(rawHeaders)?.[1];
    if (uploadedFileName !== undefined) {
      fileName = uploadedFileName || fileName;
      fileBuffer = Buffer.from(rawContent, "binary");
    } else {
      fields[name] = rawContent;
    }
  }

  if (!fileBuffer) throw new AppError(400, "Excel file is required");

  return {
    fileName,
    fileBuffer,
    confirm: fields.confirm === "true" || fields.confirm === "on" || fields.confirm === "1"
  };
}

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
      if (req.is("multipart/form-data")) {
        const upload = parseMultipartUpload(String(req.headers["content-type"] ?? ""), await readRequestBuffer(req));
        const normalizedType = type.replace(/-/g, "_");
        res.json({ status: "ok", data: await previewOrConfirmImportWorkbook(normalizedType, upload.fileName, upload.fileBuffer, upload.confirm, contextFromRequest(req)) });
        return;
      }

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

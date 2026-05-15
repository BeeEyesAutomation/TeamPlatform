import { Router, type Request } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { AppError } from "../../utils/app-error";
import { asyncHandler } from "../../utils/async-handler";
import {
  adjustmentSchema,
  batchStockInSchema,
  bulkMaterialDeactivateSchema,
  idParamSchema,
  inventoryCategoryCreateSchema,
  inventoryCategoryQuerySchema,
  inventoryCategoryUpdateSchema,
  inventoryItemCreateSchema,
  inventoryItemQuerySchema,
  inventoryItemUpdateSchema,
  inventorySupplierCreateSchema,
  inventorySupplierQuerySchema,
  inventorySupplierUpdateSchema,
  issueSchema,
  materialCodePreviewQuerySchema,
  receiptSchema,
  stockMovementCreateSchema,
  stockMovementQuerySchema,
  stockInOutSchema
} from "./inventory.schemas";
import {
  createInventoryItem,
  createInventoryMovement,
  createInventoryBatchStockIn,
  createInventoryStockIn,
  createInventoryStockOut,
  bulkDeactivateInventoryItems,
  deactivateInventoryCategory,
  deactivateInventoryItem,
  deactivateInventorySupplier,
  getInventoryItem,
  getInventorySummary,
  listInventoryCategories,
  listInventoryItems,
  listInventoryMovements,
  listInventorySuppliers,
  previewNextInventoryMaterialCode,
  saveInventoryCategory,
  saveInventorySupplier,
  updateInventoryItem,
  updateInventoryItemImage
} from "./inventory.service";

export const inventoryRouter = Router();

const routeDir = path.dirname(fileURLToPath(import.meta.url));
const materialUploadDir = path.resolve(routeDir, "../../../uploads/materials");
fs.mkdirSync(materialUploadDir, { recursive: true });

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, materialUploadDir),
    filename: (req, file, cb) => {
      const { id } = idParamSchema.parse(req.params);
      const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `${id}-${Date.now()}${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      cb(new AppError(400, "Only jpg, jpeg, png, and webp images are supported"));
      return;
    }
    cb(null, true);
  }
});

const contextFromRequest = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.header("user-agent")
});

inventoryRouter.use(requireAuth);

inventoryRouter.get(
  "/items",
  requirePermission("inventory.view"),
  asyncHandler(async (req, res) => {
    const query = inventoryItemQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listInventoryItems(query) });
  })
);

inventoryRouter.get(
  "/materials",
  requirePermission("inventory.view"),
  asyncHandler(async (req, res) => {
    const query = inventoryItemQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listInventoryItems(query) });
  })
);

inventoryRouter.post(
  "/items",
  requirePermission("inventory.manage"),
  asyncHandler(async (req, res) => {
    const body = inventoryItemCreateSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createInventoryItem(body, contextFromRequest(req)) });
  })
);

inventoryRouter.post(
  "/materials",
  requirePermission("inventory.manage"),
  asyncHandler(async (req, res) => {
    const body = inventoryItemCreateSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createInventoryItem(body, contextFromRequest(req)) });
  })
);

inventoryRouter.post(
  "/materials/bulk-deactivate",
  requirePermission("inventory.manage"),
  asyncHandler(async (req, res) => {
    const body = bulkMaterialDeactivateSchema.parse(req.body);
    res.json({ status: "ok", data: await bulkDeactivateInventoryItems(body, contextFromRequest(req)) });
  })
);

inventoryRouter.post(
  "/materials/bulk-delete",
  requirePermission("inventory.manage"),
  asyncHandler(async (req, res) => {
    const body = bulkMaterialDeactivateSchema.parse(req.body);
    res.json({ status: "ok", data: await bulkDeactivateInventoryItems(body, contextFromRequest(req)) });
  })
);

inventoryRouter.get(
  "/materials/next-code",
  requirePermission("inventory.view"),
  asyncHandler(async (req, res) => {
    const { categoryId } = materialCodePreviewQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await previewNextInventoryMaterialCode(categoryId) });
  })
);

inventoryRouter.get(
  "/items/:id",
  requirePermission("inventory.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await getInventoryItem(id) });
  })
);

inventoryRouter.get(
  "/materials/:id",
  requirePermission("inventory.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await getInventoryItem(id) });
  })
);

inventoryRouter.put(
  "/items/:id",
  requirePermission("inventory.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = inventoryItemUpdateSchema.parse(req.body);
    res.json({ status: "ok", data: await updateInventoryItem(id, body, contextFromRequest(req)) });
  })
);

inventoryRouter.put(
  "/materials/:id",
  requirePermission("inventory.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = inventoryItemUpdateSchema.parse(req.body);
    res.json({ status: "ok", data: await updateInventoryItem(id, body, contextFromRequest(req)) });
  })
);

inventoryRouter.delete(
  "/items/:id",
  requirePermission("inventory.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await deactivateInventoryItem(id, contextFromRequest(req)) });
  })
);

inventoryRouter.delete(
  "/materials/:id",
  requirePermission("inventory.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await deactivateInventoryItem(id, contextFromRequest(req)) });
  })
);

inventoryRouter.post(
  "/materials/:id/image",
  requirePermission("inventory.manage"),
  imageUpload.single("image"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    if (!req.file) throw new AppError(400, "Image file is required");
    const imageUrl = `/uploads/materials/${req.file.filename}`;
    res.json({ status: "ok", data: await updateInventoryItemImage(id, imageUrl, contextFromRequest(req)) });
  })
);

inventoryRouter.post(
  "/items/:id/movements",
  requirePermission("inventory.adjust_stock"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = stockMovementCreateSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createInventoryMovement(id, body, contextFromRequest(req)) });
  })
);

inventoryRouter.get(
  "/items/:id/movements",
  requirePermission("inventory.view"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const query = stockMovementQuerySchema.parse({ ...req.query, itemId: id });
    res.json({ status: "ok", data: await listInventoryMovements(query) });
  })
);

inventoryRouter.post(
  "/items/:id/receipts",
  requirePermission("inventory.adjust_stock"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = receiptSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createInventoryMovement(id, body, contextFromRequest(req)) });
  })
);

inventoryRouter.post(
  "/items/:id/issues",
  requirePermission("inventory.adjust_stock"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = issueSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createInventoryMovement(id, body, contextFromRequest(req)) });
  })
);

inventoryRouter.post(
  "/materials/:id/stock-in",
  requirePermission("inventory.stock_in"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = stockInOutSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createInventoryStockIn(id, body, contextFromRequest(req)) });
  })
);

inventoryRouter.post(
  "/stock-in",
  requirePermission("inventory.stock_in"),
  asyncHandler(async (req, res) => {
    const body = batchStockInSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createInventoryBatchStockIn(body, contextFromRequest(req)) });
  })
);

inventoryRouter.post(
  "/materials/:id/stock-out",
  requirePermission("inventory.stock_out"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = stockInOutSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createInventoryStockOut(id, body, contextFromRequest(req)) });
  })
);

inventoryRouter.post(
  "/items/:id/adjustments",
  requirePermission("inventory.adjust_stock"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = adjustmentSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await createInventoryMovement(id, body, contextFromRequest(req)) });
  })
);

inventoryRouter.get(
  "/categories",
  requirePermission("inventory.view"),
  asyncHandler(async (req, res) => {
    const query = inventoryCategoryQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listInventoryCategories(query) });
  })
);

inventoryRouter.post(
  "/categories",
  requirePermission("inventory.categories.manage"),
  asyncHandler(async (req, res) => {
    const body = inventoryCategoryCreateSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await saveInventoryCategory(body, undefined, contextFromRequest(req)) });
  })
);

inventoryRouter.put(
  "/categories/:id",
  requirePermission("inventory.categories.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = inventoryCategoryUpdateSchema.parse(req.body);
    res.json({ status: "ok", data: await saveInventoryCategory(body, id, contextFromRequest(req)) });
  })
);

inventoryRouter.delete(
  "/categories/:id",
  requirePermission("inventory.categories.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await deactivateInventoryCategory(id, contextFromRequest(req)) });
  })
);

inventoryRouter.get(
  "/suppliers",
  requirePermission("inventory.view"),
  asyncHandler(async (req, res) => {
    const query = inventorySupplierQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listInventorySuppliers(query) });
  })
);

inventoryRouter.post(
  "/suppliers",
  requirePermission("inventory.suppliers.manage"),
  asyncHandler(async (req, res) => {
    const body = inventorySupplierCreateSchema.parse(req.body);
    res.status(201).json({ status: "ok", data: await saveInventorySupplier(body, undefined, contextFromRequest(req)) });
  })
);

inventoryRouter.put(
  "/suppliers/:id",
  requirePermission("inventory.suppliers.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = inventorySupplierUpdateSchema.parse(req.body);
    res.json({ status: "ok", data: await saveInventorySupplier(body, id, contextFromRequest(req)) });
  })
);

inventoryRouter.delete(
  "/suppliers/:id",
  requirePermission("inventory.suppliers.manage"),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ status: "ok", data: await deactivateInventorySupplier(id, contextFromRequest(req)) });
  })
);

inventoryRouter.get(
  "/movements",
  requirePermission("inventory.view"),
  asyncHandler(async (req, res) => {
    const query = stockMovementQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listInventoryMovements(query) });
  })
);

inventoryRouter.get(
  "/transactions",
  requirePermission("inventory.history.view"),
  asyncHandler(async (req, res) => {
    const query = stockMovementQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listInventoryMovements(query) });
  })
);

inventoryRouter.get(
  "/reports/summary",
  requirePermission("inventory.view"),
  asyncHandler(async (_req, res) => {
    res.json({ status: "ok", data: await getInventorySummary() });
  })
);

inventoryRouter.get(
  "/reports/low-stock",
  requirePermission("inventory.view"),
  asyncHandler(async (req, res) => {
    const query = inventoryItemQuerySchema.parse({ ...req.query, lowStock: true });
    res.json({ status: "ok", data: await listInventoryItems(query) });
  })
);

inventoryRouter.get(
  "/reports/movements",
  requirePermission("inventory.view"),
  asyncHandler(async (req, res) => {
    const query = stockMovementQuerySchema.parse(req.query);
    res.json({ status: "ok", data: await listInventoryMovements(query) });
  })
);

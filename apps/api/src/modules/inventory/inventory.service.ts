import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import { getPagination, getPaginationMeta, handlePrismaError } from "../hr/hr.utils";
import type { z } from "zod";
import type {
  adjustmentSchema,
  inventoryCategoryCreateSchema,
  inventoryCategoryQuerySchema,
  inventoryCategoryUpdateSchema,
  inventoryItemCreateSchema,
  inventoryItemQuerySchema,
  inventoryItemUpdateSchema,
  inventorySupplierCreateSchema,
  inventorySupplierQuerySchema,
  inventorySupplierUpdateSchema,
  receiptSchema,
  issueSchema,
  stockMovementCreateSchema,
  stockMovementQuerySchema,
  bulkMaterialDeactivateSchema
} from "./inventory.schemas";

type ItemQuery = z.infer<typeof inventoryItemQuerySchema>;
type ItemCreate = z.infer<typeof inventoryItemCreateSchema>;
type ItemUpdate = z.infer<typeof inventoryItemUpdateSchema>;
type CategoryQuery = z.infer<typeof inventoryCategoryQuerySchema>;
type CategoryCreate = z.infer<typeof inventoryCategoryCreateSchema>;
type CategoryUpdate = z.infer<typeof inventoryCategoryUpdateSchema>;
type SupplierQuery = z.infer<typeof inventorySupplierQuerySchema>;
type SupplierCreate = z.infer<typeof inventorySupplierCreateSchema>;
type SupplierUpdate = z.infer<typeof inventorySupplierUpdateSchema>;
type MovementQuery = z.infer<typeof stockMovementQuerySchema>;
type MovementCreate = z.infer<typeof stockMovementCreateSchema>;
type ReceiptInput = z.infer<typeof receiptSchema>;
type IssueInput = z.infer<typeof issueSchema>;
type AdjustmentInput = z.infer<typeof adjustmentSchema>;
type BulkDeactivateInput = z.infer<typeof bulkMaterialDeactivateSchema>;

interface RequestContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const itemInclude = {
  category: { select: { id: true, code: true, name: true } },
  supplier: { select: { id: true, code: true, name: true } }
} satisfies Prisma.InventoryItemInclude;

const movementInclude = {
  item: { select: { id: true, materialCode: true, materialName: true, unit: true } }
} satisfies Prisma.InventoryStockMovementInclude;

const decimalData = (data: Partial<ItemCreate>) => ({
  ...(data.purchasePrice !== undefined ? { purchasePrice: data.purchasePrice.toString() } : {}),
  ...(data.sellingPrice !== undefined ? { sellingPrice: data.sellingPrice.toString() } : {}),
  ...(data.markupPercentage !== undefined ? { markupPercentage: data.markupPercentage.toString() } : {}),
  ...(data.stockQuantity !== undefined ? { stockQuantity: data.stockQuantity.toString() } : {}),
  ...(data.minimumStockQuantity !== undefined ? { minimumStockQuantity: data.minimumStockQuantity.toString() } : {})
});

const itemCreateData = (data: ItemCreate, actorId?: string): Prisma.InventoryItemUncheckedCreateInput => ({
  materialCode: data.materialCode,
  materialName: data.materialName,
  categoryId: data.categoryId,
  supplierId: data.supplierId,
  unit: data.unit,
  status: data.status,
  imageUrl: data.imageUrl,
  description: data.description,
  createdById: actorId,
  updatedById: actorId,
  ...decimalData(data)
});

const itemUpdateData = (data: ItemUpdate, actorId?: string): Prisma.InventoryItemUncheckedUpdateInput => ({
  ...(data.materialCode !== undefined ? { materialCode: data.materialCode } : {}),
  ...(data.materialName !== undefined ? { materialName: data.materialName } : {}),
  ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
  ...(data.supplierId !== undefined ? { supplierId: data.supplierId } : {}),
  ...(data.unit !== undefined ? { unit: data.unit } : {}),
  ...(data.status !== undefined ? { status: data.status } : {}),
  ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
  ...(data.description !== undefined ? { description: data.description } : {}),
  updatedById: actorId,
  ...decimalData(data)
});

function listWhere(query: ItemQuery): Prisma.InventoryItemWhereInput {
  return {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
    ...(query.search
      ? {
          OR: [
            { materialCode: { contains: query.search, mode: "insensitive" } },
            { materialName: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(query.lowStock || query.stockStatus === "low" ? { stockQuantity: { lte: prisma.inventoryItem.fields.minimumStockQuantity } } : {}),
    ...(query.stockStatus === "ok" ? { stockQuantity: { gt: prisma.inventoryItem.fields.minimumStockQuantity } } : {})
  };
}

export async function listInventoryItems(query: ItemQuery) {
  const pagination = getPagination(query);
  const where = listWhere(query);
  const [total, items] = await Promise.all([
    prisma.inventoryItem.count({ where }),
    prisma.inventoryItem.findMany({ where, include: itemInclude, orderBy: [{ materialName: "asc" }], ...pagination })
  ]);

  return { items, meta: getPaginationMeta(query, total) };
}

export async function getInventoryItem(id: string) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id, deletedAt: null },
    include: {
      ...itemInclude,
      movements: { include: movementInclude, orderBy: { createdAt: "desc" }, take: 20 }
    }
  });
  if (!item) throw new AppError(404, "Inventory item not found");
  return item;
}

export async function createInventoryItem(data: ItemCreate, context: RequestContext) {
  try {
    const item = await prisma.inventoryItem.create({ data: itemCreateData(data, context.actorId), include: itemInclude });
    await createAuditLog({
      actorId: context.actorId,
      action: "create",
      module: "inventory",
      targetType: "inventory_item",
      targetId: item.id,
      newValue: item,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
    return item;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateInventoryItem(id: string, data: ItemUpdate, context: RequestContext) {
  const existing = await getInventoryItem(id);
  try {
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: itemUpdateData(data, context.actorId),
      include: itemInclude
    });
    await createAuditLog({
      actorId: context.actorId,
      action: existing.materialName !== item.materialName ? "update_material_name" : "update",
      module: "inventory",
      targetType: "inventory_item",
      targetId: id,
      oldValue: existing,
      newValue: item,
      metadata: existing.materialName !== item.materialName ? { from: existing.materialName, to: item.materialName } : undefined,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
    return item;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deactivateInventoryItem(id: string, context: RequestContext) {
  const existing = await getInventoryItem(id);
  const item = await prisma.inventoryItem.update({
    where: { id },
    data: { status: "inactive", deletedAt: new Date(), updatedById: context.actorId },
    include: itemInclude
  });
  await createAuditLog({
    actorId: context.actorId,
    action: "deactivate",
    module: "inventory",
    targetType: "inventory_item",
    targetId: id,
    oldValue: existing,
    newValue: item,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });
  return item;
}

export async function updateInventoryItemImage(id: string, imageUrl: string, context: RequestContext) {
  const existing = await getInventoryItem(id);
  const item = await prisma.inventoryItem.update({
    where: { id },
    data: { imageUrl, updatedById: context.actorId },
    include: itemInclude
  });
  await createAuditLog({
    actorId: context.actorId,
    action: "update_image",
    module: "inventory",
    targetType: "inventory_item",
    targetId: id,
    oldValue: existing,
    newValue: item,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });
  return item;
}

export async function bulkDeactivateInventoryItems(data: BulkDeactivateInput, context: RequestContext) {
  const uniqueIds = Array.from(new Set(data.ids));
  const results = [];

  for (const id of uniqueIds) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { movements: true } } }
    });

    if (!existing) {
      results.push({ id, status: "skipped", reason: "Material not found or already inactive" });
      continue;
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { status: "inactive", deletedAt: new Date(), updatedById: context.actorId },
      include: itemInclude
    });

    results.push({ id, status: "deactivated", reason: existing._count.movements > 0 ? "Material has stock history; soft deactivated" : "Soft deactivated" });

    await createAuditLog({
      actorId: context.actorId,
      action: "bulk_deactivate",
      module: "inventory",
      targetType: "inventory_item",
      targetId: id,
      oldValue: existing,
      newValue: item,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
  }

  await createAuditLog({
    actorId: context.actorId,
    action: "bulk_deactivate",
    module: "inventory",
    targetType: "inventory_items",
    metadata: { results },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return { results };
}

export async function listInventoryCategories(query: CategoryQuery) {
  const pagination = getPagination(query);
  const where: Prisma.InventoryCategoryWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { OR: [{ code: { contains: query.search, mode: "insensitive" } }, { name: { contains: query.search, mode: "insensitive" } }] } : {})
  };
  const [total, items] = await Promise.all([
    prisma.inventoryCategory.count({ where }),
    prisma.inventoryCategory.findMany({ where, orderBy: { name: "asc" }, ...pagination })
  ]);
  return { items, meta: getPaginationMeta(query, total) };
}

export async function saveInventoryCategory(data: CategoryCreate | CategoryUpdate, id: string | undefined, context: RequestContext) {
  try {
    const existing = id ? await prisma.inventoryCategory.findFirst({ where: { id, deletedAt: null } }) : null;
    if (id && !existing) throw new AppError(404, "Inventory category not found");
    const category = id
      ? await prisma.inventoryCategory.update({ where: { id }, data })
      : await prisma.inventoryCategory.create({ data: data as CategoryCreate });
    await createAuditLog({
      actorId: context.actorId,
      action: id ? "update" : "create",
      module: "inventory",
      targetType: "inventory_category",
      targetId: category.id,
      oldValue: existing,
      newValue: category,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
    return category;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deactivateInventoryCategory(id: string, context: RequestContext) {
  const existing = await prisma.inventoryCategory.findFirst({
    where: { id, deletedAt: null },
    include: { _count: { select: { items: true } } }
  });
  if (!existing) throw new AppError(404, "Inventory category not found");

  const category = await prisma.inventoryCategory.update({
    where: { id },
    data: { status: "inactive", deletedAt: new Date() }
  });

  await createAuditLog({
    actorId: context.actorId,
    action: existing._count.items > 0 ? "deactivate_linked" : "deactivate",
    module: "inventory",
    targetType: "inventory_category",
    targetId: id,
    oldValue: existing,
    newValue: category,
    metadata: existing._count.items > 0 ? { reason: "Category has linked materials; soft deactivated" } : undefined,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return category;
}

export async function listInventorySuppliers(query: SupplierQuery) {
  const pagination = getPagination(query);
  const where: Prisma.InventorySupplierWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { OR: [{ code: { contains: query.search, mode: "insensitive" } }, { name: { contains: query.search, mode: "insensitive" } }] } : {})
  };
  const [total, items] = await Promise.all([
    prisma.inventorySupplier.count({ where }),
    prisma.inventorySupplier.findMany({ where, orderBy: { name: "asc" }, ...pagination })
  ]);
  return { items, meta: getPaginationMeta(query, total) };
}

export async function saveInventorySupplier(data: SupplierCreate | SupplierUpdate, id: string | undefined, context: RequestContext) {
  try {
    const existing = id ? await prisma.inventorySupplier.findFirst({ where: { id, deletedAt: null } }) : null;
    if (id && !existing) throw new AppError(404, "Inventory supplier not found");
    const supplier = id
      ? await prisma.inventorySupplier.update({ where: { id }, data })
      : await prisma.inventorySupplier.create({ data: data as SupplierCreate });
    await createAuditLog({
      actorId: context.actorId,
      action: id ? "update" : "create",
      module: "inventory",
      targetType: "inventory_supplier",
      targetId: supplier.id,
      oldValue: existing,
      newValue: supplier,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
    return supplier;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deactivateInventorySupplier(id: string, context: RequestContext) {
  const existing = await prisma.inventorySupplier.findFirst({
    where: { id, deletedAt: null },
    include: { _count: { select: { items: true } } }
  });
  if (!existing) throw new AppError(404, "Inventory supplier not found");

  const supplier = await prisma.inventorySupplier.update({
    where: { id },
    data: { status: "inactive", deletedAt: new Date() }
  });

  await createAuditLog({
    actorId: context.actorId,
    action: existing._count.items > 0 ? "deactivate_linked" : "deactivate",
    module: "inventory",
    targetType: "inventory_supplier",
    targetId: id,
    oldValue: existing,
    newValue: supplier,
    metadata: existing._count.items > 0 ? { reason: "Supplier has linked materials; soft deactivated" } : undefined,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return supplier;
}

export async function listInventoryMovements(query: MovementQuery) {
  const pagination = getPagination(query);
  const where: Prisma.InventoryStockMovementWhereInput = {
    ...(query.itemId ? { itemId: query.itemId } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.movementType ? { movementType: query.movementType } : {}),
    ...(query.search ? { OR: [{ item: { materialCode: { contains: query.search, mode: "insensitive" } } }, { item: { materialName: { contains: query.search, mode: "insensitive" } } }] } : {})
  };
  const [total, items] = await Promise.all([
    prisma.inventoryStockMovement.count({ where }),
    prisma.inventoryStockMovement.findMany({ where, include: movementInclude, orderBy: { createdAt: "desc" }, ...pagination })
  ]);
  return { items, meta: getPaginationMeta(query, total) };
}

function stockDelta(input: MovementCreate) {
  if (input.movementType === "receipt" || input.movementType === "return" || input.movementType === "release") return input.quantity;
  if (input.movementType === "issue" || input.movementType === "reservation") return -input.quantity;
  return input.direction === "decrease" ? -input.quantity : input.quantity;
}

export async function createInventoryMovement(itemId: string, data: MovementCreate | ReceiptInput | IssueInput | AdjustmentInput, context: RequestContext) {
  const item = await getInventoryItem(itemId);
  const delta = stockDelta(data);
  const previousStock = Number(item.stockQuantity);
  const resultingStock = previousStock + delta;
  if (resultingStock < 0) throw new AppError(400, "Insufficient stock quantity");

  const result = await prisma.$transaction(async (tx) => {
    const updatedItem = await tx.inventoryItem.update({
      where: { id: itemId },
      data: { stockQuantity: resultingStock.toString(), updatedById: context.actorId }
    });
    const movement = await tx.inventoryStockMovement.create({
      data: {
        itemId,
        movementType: data.movementType,
        quantity: data.quantity.toString(),
        unitCost: data.unitCost !== undefined ? data.unitCost.toString() : undefined,
        previousStock: previousStock.toString(),
        resultingStock: resultingStock.toString(),
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        projectId: data.projectId,
        note: data.note,
        metadata: data.movementType === "adjustment" ? { direction: data.direction ?? "increase" } : undefined,
        createdById: context.actorId
      },
      include: movementInclude
    });
    return { item: updatedItem, movement };
  });

  await createAuditLog({
    actorId: context.actorId,
    action: data.movementType,
    module: "inventory",
    targetType: "inventory_stock_movement",
    targetId: result.movement.id,
    oldValue: item,
    newValue: result,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return result.movement;
}

export async function getInventorySummary() {
  const [totalItems, lowStockItems, activeCategories, activeSuppliers, stockValue] = await Promise.all([
    prisma.inventoryItem.count({ where: { deletedAt: null } }),
    prisma.inventoryItem.count({ where: { deletedAt: null, stockQuantity: { lte: prisma.inventoryItem.fields.minimumStockQuantity } } }),
    prisma.inventoryCategory.count({ where: { deletedAt: null, status: "active" } }),
    prisma.inventorySupplier.count({ where: { deletedAt: null, status: "active" } }),
    prisma.inventoryItem.findMany({ where: { deletedAt: null }, select: { stockQuantity: true, purchasePrice: true } })
  ]);

  return {
    totalItems,
    lowStockItems,
    activeCategories,
    activeSuppliers,
    stockValue: stockValue.reduce((sum, item) => sum + Number(item.stockQuantity) * Number(item.purchasePrice), 0)
  };
}

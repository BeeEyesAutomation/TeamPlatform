import type { ListResponse } from "./hr";

export type InventoryItemStatus = "active" | "inactive" | "discontinued";
export type RecordStatus = "active" | "inactive";
export type InventoryMovementType = "receipt" | "issue" | "adjustment" | "return" | "reservation" | "release";

export type { ListResponse };

export interface InventoryCategory {
  id: string;
  code: string;
  name: string;
  department?: string | null;
  description?: string | null;
  status: RecordStatus;
}

export interface InventorySupplier {
  id: string;
  code: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  description?: string | null;
  status: RecordStatus;
}

export interface InventoryItem {
  id: string;
  materialCode: string;
  materialName: string;
  model?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  purchasePrice: string | number;
  sellingPrice: string | number;
  markupPercentage: string | number;
  stockQuantity: string | number;
  minimumStockQuantity: string | number;
  unit: string;
  status: InventoryItemStatus;
  imageUrl?: string | null;
  description?: string | null;
  category?: Pick<InventoryCategory, "id" | "code" | "name"> | null;
  supplier?: Pick<InventorySupplier, "id" | "code" | "name"> | null;
  movements?: InventoryStockMovement[];
}

export interface InventoryStockMovement {
  id: string;
  itemId: string;
  movementType: InventoryMovementType;
  quantity: string | number;
  unitCost?: string | number | null;
  previousStock: string | number;
  resultingStock: string | number;
  referenceType?: string | null;
  referenceId?: string | null;
  projectId?: string | null;
  note?: string | null;
  createdAt: string;
  item?: Pick<InventoryItem, "id" | "materialCode" | "materialName" | "unit">;
  createdBy?: { id: string; fullName: string; email: string } | null;
}

export interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  activeCategories: number;
  activeSuppliers: number;
  stockValue: number;
}

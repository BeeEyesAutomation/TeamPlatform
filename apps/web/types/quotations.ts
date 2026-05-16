import type { InventoryItem } from "./inventory";
import type { ListResponse, Project } from "./projects";

export type { ListResponse };

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "cancelled";

export interface QuotationItem {
  id: string;
  quotationId: string;
  lineIndex: number;
  materialId?: string | null;
  materialCodeSnapshot: string;
  materialNameSnapshot: string;
  unitSnapshot: string;
  quantity: string | number;
  unitPrice: string | number;
  amount: string | number;
}

export interface QuotationImage {
  id: string;
  quotationId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  uploadedById?: string | null;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quotationCode: string;
  projectId?: string | null;
  customerName: string;
  customerRequest?: string | null;
  quotationDate: string;
  numberOfSets: string | number;
  vatEnabled: boolean;
  vatRate: string | number;
  subtotalOneSet: string | number;
  totalBeforeVat: string | number;
  vatAmount: string | number;
  grandTotal: string | number;
  signatureImageUrl?: string | null;
  status: QuotationStatus;
  project?: Pick<Project, "id" | "projectCode" | "name" | "customerName"> | null;
  items: QuotationItem[];
  images: QuotationImage[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotationFormItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  quantity: string;
  unitPrice: string;
}

export type QuotationMaterial = Pick<InventoryItem, "id" | "materialCode" | "materialName" | "unit" | "sellingPrice">;

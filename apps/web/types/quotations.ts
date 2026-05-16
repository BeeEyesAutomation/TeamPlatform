import type { InventoryItem } from "./inventory";
import type { ListResponse, Project } from "./projects";

export type { ListResponse };

export type QuotationStatus = "draft" | "sent" | "approved" | "rejected" | "cancelled";
export type QuotationType = "commercial" | "project";

export interface QuotationItem {
  id: string;
  quotationId: string;
  lineIndex: number;
  materialId?: string | null;
  materialCodeSnapshot: string;
  materialNameSnapshot: string;
  modelSnapshot?: string | null;
  pictureUrlSnapshot?: string | null;
  unitSnapshot: string;
  quantity: string | number;
  unitPrice: string | number;
  amount: string | number;
}

export interface QuotationVersionItem extends QuotationItem {
  quotationVersionId: string;
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
  quotationType: QuotationType;
  projectId?: string | null;
  currentVersionId?: string | null;
  customerName: string;
  customerRequest?: string | null;
  content?: string | null;
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
  currentVersion?: QuotationVersion | null;
  versions?: QuotationVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotationVersion {
  id: string;
  quotationId: string;
  versionNumber: number;
  projectId?: string | null;
  customerName: string;
  customerRequest?: string | null;
  content?: string | null;
  quotationDate: string;
  numberOfSets: string | number;
  vatEnabled: boolean;
  vatRate: string | number;
  subtotalOneSet: string | number;
  totalBeforeVat: string | number;
  vatAmount: string | number;
  grandTotal: string | number;
  signatureImageUrl?: string | null;
  customerPoFileUrl?: string | null;
  customerPoFileName?: string | null;
  status: QuotationStatus;
  stockOutCreatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: QuotationVersionItem[];
  project?: Pick<Project, "id" | "projectCode" | "name" | "customerName"> | null;
}

export interface QuotationFormItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  model?: string;
  unit: string;
  quantity: string;
  unitPrice: string;
}

export type QuotationMaterial = Pick<InventoryItem, "id" | "materialCode" | "materialName" | "model" | "imageUrl" | "unit" | "sellingPrice">;

export interface QuotationTemplate {
  id: string;
  name: string;
  originalFileName: string;
  fileUrl: string;
  placeholderConfig?: Record<string, string> | null;
  isDefault: boolean;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface QuotationCompanySettings {
  id: string;
  companyName?: string | null;
  taxCode?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  updatedAt: string;
}

export interface QuotationPreview {
  quotation: Quotation;
  version: QuotationVersion;
  companySettings: QuotationCompanySettings | null;
  projectName: string;
}

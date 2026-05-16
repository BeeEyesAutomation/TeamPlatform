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
  originalFileName?: string;
  fileName?: string;
  fileUrl: string;
  defaultVersionId?: string | null;
  placeholderConfig?: Record<string, string> | null;
  detectedPlaceholders?: string[] | null;
  isDefault: boolean;
  status: "active" | "inactive";
  versions?: QuotationTemplateVersion[];
  createdAt: string;
  updatedAt: string;
}

export type QuotationLayoutBlockType =
  | "text"
  | "company_info"
  | "quotation_info"
  | "project_info"
  | "customer_info"
  | "content"
  | "specifications"
  | "material_table"
  | "image"
  | "logo"
  | "signature"
  | "notes"
  | "totals"
  | "vat_summary"
  | "divider"
  | "custom_field";

export interface QuotationBlockStyleConfig {
  fontSize?: number;
  fontWeight?: string;
  italic?: boolean;
  textAlign?: "left" | "center" | "right";
  textColor?: string;
  backgroundColor?: string;
  border?: boolean;
  padding?: number;
}

export interface QuotationLayoutBlock {
  id: string;
  blockType: QuotationLayoutBlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  content?: string;
  bindingKey?: string;
  styleConfig?: QuotationBlockStyleConfig;
  required?: boolean;
}

export interface QuotationLayoutConfig {
  blocks: QuotationLayoutBlock[];
}

export interface QuotationTableColumnConfig {
  key: string;
  label: string;
  width: number;
  visible: boolean;
  align: "left" | "center" | "right";
  custom?: boolean;
}

export interface QuotationTableConfig {
  columns: QuotationTableColumnConfig[];
}

export interface QuotationCanvasConfig {
  pageWidth: number;
  pageHeight: number;
  unit?: string;
  backgroundColor?: string;
}

export interface QuotationTemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  originalFileUrl?: string | null;
  sheetName?: string | null;
  layoutConfig?: QuotationLayoutConfig | null;
  placeholderConfig?: Record<string, string> | null;
  tableConfig?: QuotationTableConfig | null;
  canvasConfig?: QuotationCanvasConfig | null;
  status: "active" | "inactive";
  createdById?: string | null;
  createdAt: string;
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
  template?: QuotationTemplate | null;
  templateVersion?: QuotationTemplateVersion | null;
  layoutConfig?: QuotationLayoutConfig | null;
  tableConfig?: QuotationTableConfig | null;
  canvasConfig?: QuotationCanvasConfig | null;
  companySettings: QuotationCompanySettings | null;
  projectName: string;
}

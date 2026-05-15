export interface ImportLog {
  id: string;
  importType: string;
  fileName: string;
  status: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  createdAt: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  row: Record<string, unknown>;
  valid: boolean;
  errors: string[];
}

export interface ExportLog {
  id: string;
  exportType: string;
  fileName: string;
  format: string;
  createdAt: string;
}

export interface ListResponse<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

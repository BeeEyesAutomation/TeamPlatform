import ExcelJS from "exceljs";

export const importTemplates = {
  employees: ["employeeCode", "fullName", "email", "phone", "departmentId", "positionId", "salaryLevel", "startDate"],
  projects: ["projectCode", "name", "customerName", "managerId", "startDate", "endDate", "budgetEstimated"],
  project_plans: ["projectId", "name", "startDate", "endDate", "ownerId", "progressPercent", "status", "sortOrder"],
  project_tasks: ["projectId", "planId", "title", "assigneeId", "priority", "progressPercent", "deadline"],
  project_issues: ["projectId", "taskId", "title", "severity", "assignedToId", "deadline"],
  project_materials: ["projectId", "materialCode", "materialName", "unit", "plannedQuantity", "usedQuantity", "estimatedUnitPrice"],
  project_costs: ["projectId", "costType", "name", "amount", "costDate"],
  allowances: ["employeeId", "allowanceCode", "amount", "month", "note"]
} as const;

export type ImportType = keyof typeof importTemplates;

export function isImportType(value: string): value is ImportType {
  return value in importTemplates;
}

export async function buildTemplateWorkbook(type: ImportType) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(type);
  sheet.addRow([...importTemplates[type]]);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = importTemplates[type].map((header) => ({ header, key: header, width: Math.max(18, header.length + 2) }));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function cellValueToImportValue(value: ExcelJS.CellValue) {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return value.result ?? undefined;
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join("");
  }

  return value;
}

export async function parseRowsWorkbook(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  await workbook.xlsx.load(arrayBuffer as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers = headerRow.values;
  const normalizedHeaders = Array.isArray(headers)
    ? headers.slice(1).map((header) => String(header ?? "").trim())
    : [];
  const rows: Array<Record<string, unknown>> = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const item: Record<string, unknown> = {};
    for (const [index, header] of normalizedHeaders.entries()) {
      if (!header) continue;
      const value = cellValueToImportValue(row.getCell(index + 1).value);
      if (value !== undefined && value !== "") item[header] = value;
    }

    if (Object.keys(item).length > 0) rows.push(item);
  });

  return rows;
}

export function validateRows(type: ImportType, rows: Array<Record<string, unknown>>) {
  const required = importTemplates[type].filter((field) => !["email", "phone", "departmentId", "positionId", "managerId", "planId", "taskId", "ownerId", "note"].includes(field));

  return rows.map((row, index) => {
    const errors = required
      .filter((field) => row[field] === undefined || row[field] === null || row[field] === "")
      .map((field) => `${field} is required`);

    return {
      rowNumber: index + 2,
      row,
      valid: errors.length === 0,
      errors
    };
  });
}

export async function buildRowsWorkbook(sheetName: string, rows: Array<Record<string, unknown>>) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  sheet.columns = headers.map((header) => ({ header, key: header, width: Math.max(18, header.length + 2) }));
  for (const row of rows) {
    sheet.addRow(row);
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function rowsToCsv(rows: Array<Record<string, unknown>>) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

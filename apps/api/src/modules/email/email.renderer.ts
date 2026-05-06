export function renderTemplate(template: string, variables: Record<string, unknown>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function sanitizePayrollEmailPayload(payload: Record<string, unknown>) {
  const blockedKeys = new Set(["netSalary", "grossSalary", "positionSalary", "taxableIncome", "personalIncomeTax", "bankAccountNumber"]);
  return Object.fromEntries(Object.entries(payload).filter(([key]) => !blockedKeys.has(key)));
}

export function resolveSmtpPassword(passwordEncrypted: string, envLookup: NodeJS.ProcessEnv = process.env) {
  if (passwordEncrypted.startsWith("env:")) {
    const envName = passwordEncrypted.slice("env:".length);
    return envLookup[envName] ?? "";
  }

  return passwordEncrypted;
}

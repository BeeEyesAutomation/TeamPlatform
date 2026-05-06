"use client";

import { useEffect, useState } from "react";
import { fetchCostStatistics, fetchHrOverview, fetchIssueStatistics, fetchMaterialStatistics, fetchPayrollOverview, fetchProjectOverview } from "./reports-api";

export function ReportsDashboardClient() {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");

  async function load() {
    try {
      const [hr, payroll, projects, issues, materials, costs] = await Promise.all([
        fetchHrOverview(),
        fetchPayrollOverview(),
        fetchProjectOverview(),
        fetchIssueStatistics(),
        fetchMaterialStatistics(),
        fetchCostStatistics()
      ]);
      setData({ hr: hr.data, payroll: payroll.data, projects: projects.data, issues: issues.data, materials: materials.data, costs: costs.data });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load reports");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-semibold">Reports dashboard</h1>
        <p className="mt-2 text-sm text-muted">Tong quan HR, payroll, project, issue, material va cost.</p>
      </div>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="rounded-md border border-border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">{key}</h2>
            <pre className="max-h-80 overflow-auto rounded-md bg-surface p-3 text-xs">{JSON.stringify(value, null, 2)}</pre>
          </div>
        ))}
      </div>
    </section>
  );
}

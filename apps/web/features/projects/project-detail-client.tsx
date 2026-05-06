"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import { ProjectDocumentsPanel } from "../project-documents/project-documents-panel";
import type { Project, ProjectCost, ProjectDashboard, ProjectIssue, ProjectMaterial, ProjectMember, ProjectPlan, ProjectTask, ProjectTimelineEntry } from "../../types/projects";
import {
  approveTask,
  closeIssue,
  confirmTask,
  createCost,
  createIssue,
  createMaterial,
  createMember,
  createPlan,
  createTask,
  fetchCosts,
  fetchIssues,
  fetchMaterials,
  fetchMembers,
  fetchPlans,
  fetchProject,
  fetchProjectDashboard,
  fetchProjectTimeline,
  fetchTasks,
  saveProject,
  submitTask,
  updateTaskProgress
} from "./projects-api";

const tabs = ["overview", "profile", "plan", "tasks", "issues", "materials", "costs", "members", "documents", "timeline"] as const;
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function ProjectDetailClient({ id }: { id: string }) {
  const user = getStoredUser();
  const canManage = hasPermission(user, "projects.manage");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("overview");
  const [project, setProject] = useState<Project>();
  const [dashboard, setDashboard] = useState<ProjectDashboard>();
  const [plans, setPlans] = useState<ProjectPlan[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [materials, setMaterials] = useState<ProjectMaterial[]>([]);
  const [costs, setCosts] = useState<ProjectCost[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [timeline, setTimeline] = useState<ProjectTimelineEntry[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [projectResponse, dashboardResponse, plansResponse, tasksResponse, issuesResponse, materialsResponse, costsResponse, membersResponse, timelineResponse] = await Promise.all([
        fetchProject(id),
        fetchProjectDashboard(id),
        fetchPlans(id),
        fetchTasks(id),
        fetchIssues(id),
        fetchMaterials(id),
        fetchCosts(id),
        fetchMembers(id),
        fetchProjectTimeline(id)
      ]);
      setProject(projectResponse.data);
      setDashboard(dashboardResponse.data);
      setPlans(plansResponse.data);
      setTasks(tasksResponse.data);
      setIssues(issuesResponse.data);
      setMaterials(materialsResponse.data);
      setCosts(costsResponse.data);
      setMembers(membersResponse.data);
      setTimeline(timelineResponse.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load project");
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  const visibleTasks = useMemo(() => tasks.slice(0, 8), [tasks]);

  async function submitForm(event: FormEvent<HTMLFormElement>, action: (body: Record<string, unknown>) => Promise<unknown>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await action(body);
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save project data");
    }
  }

  async function run(action: () => Promise<unknown>) {
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot update project data");
    }
  }

  if (!project) {
    return <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">Dang tai du an...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-5">
        <div className="text-sm text-muted">{project.projectCode}</div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="mt-2 text-sm text-muted">{project.customerName ?? "Chua co khach hang"} - {project.status}</p>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="flex gap-2 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "border-b-2 border-primary px-3 py-2 text-sm font-semibold text-primary" : "px-3 py-2 text-sm text-muted"} type="button" onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && dashboard ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="Tien do" value={`${Number(dashboard.progressSummary.projectProgressPercent)}%`} />
            <Metric label="Task hoan thanh" value={`${dashboard.taskSummary.completed}/${dashboard.taskSummary.total}`} />
            <Metric label="Issue mo" value={dashboard.issueSummary.open} />
            <Metric label="Chenhlech chi phi" value={money.format(Number(dashboard.costSummary.variance))} />
          </div>
          <SimpleTable headers={["Task", "Tien do", "Trang thai"]} rows={visibleTasks.map((task) => [task.title, `${Number(task.progressPercent)}%`, task.status])} />
        </div>
      ) : null}

      {activeTab === "profile" ? (
        <form className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-2" onSubmit={(event) => void submitForm(event, (body) => saveProject(body, id))}>
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="name" defaultValue={project.name} disabled={!canManage} />
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="customerName" defaultValue={project.customerName ?? ""} disabled={!canManage} />
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="location" defaultValue={project.location ?? ""} disabled={!canManage} />
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="progressPercent" type="number" min="0" max="100" defaultValue={Number(project.progressPercent)} disabled={!canManage} />
          <textarea className="min-h-24 rounded-md border border-border p-3 text-sm md:col-span-2" name="description" defaultValue={project.description ?? ""} disabled={!canManage} />
          {canManage ? <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white md:w-fit" type="submit">Luu ho so</button> : null}
        </form>
      ) : null}

      {activeTab === "plan" ? (
        <Collection title="Ke hoach" headers={["Ten", "Tien do", "Trang thai"]} rows={plans.map((plan) => [plan.name, `${Number(plan.progressPercent)}%`, plan.status])}>
          <MiniForm enabled={canManage} fields={["name", "progressPercent"]} submitLabel="Them ke hoach" onSubmit={(body) => createPlan(id, body)} reload={load} />
        </Collection>
      ) : null}

      {activeTab === "tasks" ? (
        <Collection title="Cong viec" headers={["Ten", "Tien do", "Trang thai", "Xu ly"]} rows={tasks.map((task) => [
          task.title,
          `${Number(task.progressPercent)}%`,
          task.status,
          canManage ? <TaskActions key={task.id} task={task} run={run} /> : "-"
        ])}>
          <MiniForm enabled={canManage} fields={["title", "assigneeId", "deadline"]} submitLabel="Them task" onSubmit={(body) => createTask(id, body)} reload={load} />
        </Collection>
      ) : null}

      {activeTab === "issues" ? (
        <Collection title="Van de" headers={["Ten", "Muc do", "Trang thai", "Xu ly"]} rows={issues.map((issue) => [
          issue.title,
          issue.severity ?? "-",
          issue.status,
          canManage ? <button key={issue.id} className="text-primary" type="button" onClick={() => void run(() => closeIssue(issue.id))}>Dong</button> : "-"
        ])}>
          <MiniForm enabled={canManage} fields={["title", "severity", "assignedToId"]} submitLabel="Them issue" onSubmit={(body) => createIssue(id, body)} reload={load} />
        </Collection>
      ) : null}

      {activeTab === "materials" ? (
        <Collection title="Vat tu" headers={["Ma", "Ten", "Ke hoach", "Da dung", "Trang thai"]} rows={materials.map((material) => [material.materialCode, material.materialName, `${material.plannedQuantity} ${material.unit}`, material.usedQuantity, material.status])}>
          <MiniForm enabled={canManage} fields={["materialCode", "materialName", "unit", "plannedQuantity"]} submitLabel="Them vat tu" onSubmit={(body) => createMaterial(id, body)} reload={load} />
        </Collection>
      ) : null}

      {activeTab === "costs" ? (
        <Collection title="Chi phi" headers={["Loai", "Ten", "So tien", "Ngay"]} rows={costs.map((cost) => [cost.costType, cost.name, money.format(Number(cost.amount)), cost.costDate.slice(0, 10)])}>
          <MiniForm enabled={canManage} fields={["costType", "name", "amount", "costDate"]} submitLabel="Them chi phi" onSubmit={(body) => createCost(id, body)} reload={load} />
        </Collection>
      ) : null}

      {activeTab === "members" ? (
        <Collection title="Thanh vien" headers={["Nhan vien", "Vai tro", "Trang thai"]} rows={members.map((member) => [member.employee?.fullName ?? member.employeeId, member.projectRole, member.status])}>
          <MiniForm enabled={canManage} fields={["employeeId", "projectRole", "joinedDate"]} submitLabel="Them thanh vien" onSubmit={(body) => createMember(id, body)} reload={load} />
        </Collection>
      ) : null}

      {activeTab === "documents" ? <ProjectDocumentsPanel projectId={id} /> : null}

      {activeTab === "timeline" ? (
        <SimpleTable headers={["Thoi gian", "Hanh dong", "Doi tuong"]} rows={timeline.map((entry) => [new Date(entry.createdAt).toLocaleString("vi-VN"), entry.action, entry.targetType ?? "-"])} />
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-md border border-border bg-white p-4"><div className="text-sm text-muted">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>;
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number | JSX.Element>> }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-white">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-surface text-left text-muted"><tr>{headers.map((header) => <th key={header} className="p-3">{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index} className="border-t border-border">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-3">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Collection({ title, headers, rows, children }: { title: string; headers: string[]; rows: Array<Array<string | number | JSX.Element>>; children?: React.ReactNode }) {
  return <div className="space-y-4"><h2 className="text-lg font-semibold">{title}</h2>{children}<SimpleTable headers={headers} rows={rows} /></div>;
}

function MiniForm({ enabled, fields, submitLabel, onSubmit, reload }: { enabled: boolean; fields: string[]; submitLabel: string; onSubmit: (body: Record<string, unknown>) => Promise<unknown>; reload: () => Promise<void> }) {
  if (!enabled) return null;
  return (
    <form className="grid gap-2 rounded-md border border-border bg-white p-3 md:grid-cols-5" onSubmit={async (event) => {
      event.preventDefault();
      await onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
      event.currentTarget.reset();
      await reload();
    }}>
      {fields.map((field) => <input key={field} className="h-10 rounded-md border border-border px-3 text-sm" name={field} placeholder={field} type={field.toLowerCase().includes("date") ? "date" : field.toLowerCase().includes("amount") || field.toLowerCase().includes("quantity") || field.toLowerCase().includes("percent") ? "number" : "text"} />)}
      <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white" type="submit">{submitLabel}</button>
    </form>
  );
}

function TaskActions({ task, run }: { task: ProjectTask; run: (action: () => Promise<unknown>) => Promise<void> }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button className="text-primary" type="button" onClick={() => void run(() => confirmTask(task.id))}>Nhan</button>
      <button className="text-primary" type="button" onClick={() => void run(() => updateTaskProgress(task.id, 50))}>50%</button>
      <button className="text-primary" type="button" onClick={() => void run(() => submitTask(task.id))}>Gui</button>
      <button className="text-primary" type="button" onClick={() => void run(() => approveTask(task.id))}>Duyet</button>
    </div>
  );
}

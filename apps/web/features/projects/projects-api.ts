import { apiGet, apiJson } from "../../lib/api-client";
import type {
  ListResponse,
  Project,
  ProjectCost,
  ProjectDashboard,
  ProjectIssue,
  ProjectMaterial,
  ProjectMember,
  ProjectPlan,
  ProjectTask,
  ProjectTimelineEntry
} from "../../types/projects";

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const fetchProjects = (params: Record<string, string | number | undefined> = {}) =>
  apiGet<ListResponse<Project>>(`/api/projects${buildQuery(params)}`);

export const fetchProject = (id: string) => apiGet<Project>(`/api/projects/${id}`);
export const saveProject = (body: Record<string, unknown>, id?: string) =>
  id ? apiJson<Project>(`/api/projects/${id}`, "PUT", body) : apiJson<Project>("/api/projects", "POST", body);
export const deleteProject = (id: string) => apiJson<Project>(`/api/projects/${id}`, "DELETE");
export const fetchProjectDashboard = (id: string) => apiGet<ProjectDashboard>(`/api/projects/${id}/dashboard`);
export const fetchProjectTimeline = (id: string) => apiGet<ProjectTimelineEntry[]>(`/api/projects/${id}/timeline`);

export const fetchPlans = (projectId: string) => apiGet<ProjectPlan[]>(`/api/projects/${projectId}/plans`);
export const createPlan = (projectId: string, body: Record<string, unknown>) => apiJson<ProjectPlan>(`/api/projects/${projectId}/plans`, "POST", body);

export const fetchTasks = (projectId: string) => apiGet<ProjectTask[]>(`/api/projects/${projectId}/tasks`);
export const createTask = (projectId: string, body: Record<string, unknown>) => apiJson<ProjectTask>(`/api/projects/${projectId}/tasks`, "POST", body);
export const confirmTask = (id: string) => apiJson<ProjectTask>(`/api/project-tasks/${id}/confirm`, "POST");
export const submitTask = (id: string) => apiJson<ProjectTask>(`/api/project-tasks/${id}/submit`, "POST");
export const approveTask = (id: string) => apiJson<ProjectTask>(`/api/project-tasks/${id}/approve`, "POST");
export const updateTaskProgress = (id: string, progressPercent: number) =>
  apiJson<ProjectTask>(`/api/project-tasks/${id}/progress`, "POST", { progressPercent });

export const fetchIssues = (projectId: string) => apiGet<ProjectIssue[]>(`/api/projects/${projectId}/issues`);
export const createIssue = (projectId: string, body: Record<string, unknown>) => apiJson<ProjectIssue>(`/api/projects/${projectId}/issues`, "POST", body);
export const closeIssue = (id: string) => apiJson<ProjectIssue>(`/api/project-issues/${id}/close`, "POST");

export const fetchMaterials = (projectId: string, params: Record<string, string | number | undefined> = {}) =>
  apiGet<ProjectMaterial[]>(`/api/projects/${projectId}/materials${buildQuery(params)}`);
export const createMaterial = (projectId: string, body: Record<string, unknown>) => apiJson<ProjectMaterial>(`/api/projects/${projectId}/materials`, "POST", body);

export const fetchCosts = (projectId: string) => apiGet<ProjectCost[]>(`/api/projects/${projectId}/costs`);
export const createCost = (projectId: string, body: Record<string, unknown>) => apiJson<ProjectCost>(`/api/projects/${projectId}/costs`, "POST", body);

export const fetchMembers = (projectId: string) => apiGet<ProjectMember[]>(`/api/projects/${projectId}/members`);
export const createMember = (projectId: string, body: Record<string, unknown>) => apiJson<ProjectMember>(`/api/projects/${projectId}/members`, "POST", body);

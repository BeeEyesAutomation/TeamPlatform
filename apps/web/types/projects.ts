export interface ListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListResponse<T> {
  items: T[];
  meta: ListMeta;
}

export type ProjectStatus = "planning" | "in_progress" | "paused" | "completed" | "cancelled";
export type ProjectPlanStatus = "planned" | "in_progress" | "completed" | "cancelled";
export type ProjectTaskStatus = "todo" | "confirmed" | "in_progress" | "pending_review" | "completed" | "cancelled";
export type ProjectIssueStatus = "new" | "in_progress" | "waiting_confirmation" | "resolved" | "closed";
export type MaterialStatus = "not_ordered" | "purchase_requested" | "purchasing" | "received" | "issued" | "shortage" | "cancelled";
export type RecordStatus = "active" | "inactive";

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  customerName?: string | null;
  customerContactName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerTaxCode?: string | null;
  description?: string | null;
  managerId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  actualCompletedDate?: string | null;
  location?: string | null;
  status: ProjectStatus;
  progressPercent: string | number;
  budgetEstimated?: string | number | null;
  budgetActual?: string | number | null;
  note?: string | null;
  _count?: {
    tasks: number;
    issues: number;
    members: number;
  };
}

export interface ProjectPlan {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  progressPercent: string | number;
  status: ProjectPlanStatus;
  sortOrder: number;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  planId?: string | null;
  title: string;
  assigneeId?: string | null;
  priority?: string | null;
  status: ProjectTaskStatus;
  progressPercent: string | number;
  deadline?: string | null;
}

export interface ProjectIssue {
  id: string;
  projectId: string;
  taskId?: string | null;
  title: string;
  severity?: string | null;
  assignedToId?: string | null;
  status: ProjectIssueStatus;
  deadline?: string | null;
}

export interface ProjectMaterial {
  id: string;
  projectId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  plannedQuantity: string | number;
  usedQuantity: string | number;
  remainingQuantity: string | number;
  estimatedUnitPrice?: string | number | null;
  actualUnitPrice?: string | number | null;
  status: MaterialStatus;
}

export interface ProjectCost {
  id: string;
  projectId: string;
  costType: string;
  name: string;
  amount: string | number;
  costDate: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  employeeId: string;
  projectRole: string;
  joinedDate: string;
  leftDate?: string | null;
  status: RecordStatus;
  employee?: {
    employeeCode: string;
    fullName: string;
  };
}

export interface ProjectDashboard {
  projectStatusCounts: Array<{ status: string; count: number }>;
  progressSummary: {
    projectProgressPercent: string | number;
    averageTaskProgressPercent: string | number;
  };
  taskSummary: {
    total: number;
    completed: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  issueSummary: {
    open: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  materialSummary: {
    estimatedCost: string | number;
    actualCost: string | number;
    byStatus: Array<{ status: string; count: number }>;
  };
  costSummary: {
    estimated: string | number;
    actual: string | number;
    variance: string | number;
  };
}

export interface ProjectTimelineEntry {
  id: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  createdAt: string;
}

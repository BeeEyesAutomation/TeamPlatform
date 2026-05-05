export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export type RecordStatus = "active" | "inactive";
export type EmployeeStatus = "probation" | "active" | "temporarily_inactive" | "resigned";
export type EmploymentType = "official" | "probation" | "seasonal" | "part_time";

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: RecordStatus;
}

export interface Position {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  baseSalary: string | number | null;
  salaryStepAmount: string | number | null;
  status: RecordStatus;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  citizenIdNumber?: string | null;
  citizenIdIssueDate?: string | null;
  citizenIdIssuePlace?: string | null;
  citizenIdFrontImageUrl?: string | null;
  citizenIdBackImageUrl?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  bankBranch?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  salaryLevel?: number | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  department?: Pick<Department, "id" | "code" | "name"> | null;
  position?: Position | null;
}

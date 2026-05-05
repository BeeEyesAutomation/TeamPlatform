export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  employeeId: string | null;
  roles: string[];
  permissions: string[];
}

export function getStoredUser(): CurrentUser | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw = window.localStorage.getItem("currentUser");
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return undefined;
  }
}

export function hasPermission(user: CurrentUser | undefined, permission: string) {
  return Boolean(user?.permissions.includes(permission));
}

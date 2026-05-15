export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface ApiEnvelope<T> {
  status: "ok";
  data: T;
}

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage.getItem("accessToken") ?? undefined;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const token = getStoredAccessToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<ApiEnvelope<T>>;
}

export async function apiGet<T>(path: string): Promise<ApiEnvelope<T>> {
  return apiRequest<T>(path);
}

export async function apiJson<T>(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown) {
  return apiRequest<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

export async function apiForm<T>(path: string, method: "POST" | "PUT", body: FormData) {
  const token = getStoredAccessToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (typeof payload?.message === "string") message = payload.message;
    } catch {
      // Keep fallback for non-JSON upload errors.
    }
    throw new Error(message);
  }

  return response.json() as Promise<ApiEnvelope<T>>;
}

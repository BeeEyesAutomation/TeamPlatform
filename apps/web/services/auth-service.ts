import { apiGet } from "../lib/api-client";

export async function getCurrentUser() {
  return apiGet("/api/auth/me");
}

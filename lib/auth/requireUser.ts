import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: "owner" | "admin" | "editor" | "viewer";
  orgId: string;
}

export async function requireUser(): Promise<SessionUser> {
  const cookieStore = cookies();
  const orgId = cookieStore.get("orgId")?.value ?? "demo-org";
  const userId = cookieStore.get("userId")?.value ?? "demo-user";
  return {
    id: userId,
    email: "demo@example.com",
    name: "Demo User",
    role: "admin",
    orgId
  };
}

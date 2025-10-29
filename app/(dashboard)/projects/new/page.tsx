import { createProject } from "@/lib/db/projects";
import { requireUser } from "@/lib/auth/requireUser";

async function createProjectAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const name = String(formData.get("name") ?? "Untitled project");
  const description = String(formData.get("description") ?? "");
  await createProject({ orgId: user.orgId, name, description, createdBy: user.id });
  return { success: true };
}

export default async function NewProjectPage() {
  await requireUser();
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Create project</h1>
      <form action={createProjectAction} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-neutral-700">
          Name
          <input
            name="name"
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          Description
          <textarea
            name="description"
            rows={4}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Create project
        </button>
      </form>
    </main>
  );
}

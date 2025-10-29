import Link from "next/link";
import { getOrgProjects } from "@/lib/db/projects";
import { requireUser } from "@/lib/auth/requireUser";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await getOrgProjects(user.orgId);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-neutral-600">Select a project to continue editing or create a new one.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/projects/import"
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Import data
          </Link>
          <Link
            href="/projects/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            New project
          </Link>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Link
            href={`/projects/${project.id}`}
            key={project.id}
            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{project.description ?? "No description"}</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-neutral-500">Last updated {project.updatedAt.toLocaleString()}</p>
          </Link>
        ))}
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
            <p className="text-neutral-600">No projects yet. Create one to start mapping.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

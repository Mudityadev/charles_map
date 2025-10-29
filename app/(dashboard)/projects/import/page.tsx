import { ImportWizard } from "@/components/map/ImportWizard";
import { requireUser } from "@/lib/auth/requireUser";

export default async function ProjectImportPage() {
  await requireUser();
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Import data</h1>
      <p className="mt-3 text-neutral-600">
        Upload vector or tabular data sources. Premium formats will be queued and processed by background workers.
      </p>
      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <ImportWizard />
      </div>
    </main>
  );
}

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MapCanvas } from "@/components/map/MapCanvas";
import { LayerPanel } from "@/components/map/LayerPanel";
import { StyleInspector } from "@/components/map/StyleInspector";
import { AnalyticsPanel } from "@/components/map/AnalyticsPanel";
import { Timeline } from "@/components/map/Timeline";
import { ExportDialog } from "@/components/map/ExportDialog";
import { getProjectById } from "@/lib/db/projects";
import { getOrgFlags } from "@/lib/flags/server";
import { requireUser } from "@/lib/auth/requireUser";

interface EditorPageProps {
  params: { id: string };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const user = await requireUser();
  const project = await getProjectById(params.id, user.orgId);
  if (!project) {
    notFound();
  }

  const flags = await getOrgFlags(user.orgId);

  return (
    <main className="grid h-[calc(100vh-64px)] grid-cols-[minmax(280px,340px)_1fr_minmax(300px,360px)] gap-4 bg-neutral-950 p-4 text-white">
      <section className="flex flex-col gap-4 overflow-y-auto rounded-xl bg-neutral-900 p-4">
        <LayerPanel projectId={project.id} plan={flags.planTier} />
        <ExportDialog projectId={project.id} plan={flags.planTier} />
      </section>
      <section className="relative overflow-hidden rounded-xl bg-neutral-800">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-neutral-300">Loading map…</div>}>
          <MapCanvas project={project} flags={flags} />
        </Suspense>
      </section>
      <section className="flex flex-col gap-4 overflow-y-auto rounded-xl bg-neutral-900 p-4">
        <StyleInspector projectId={project.id} plan={flags.planTier} />
        <AnalyticsPanel projectId={project.id} flags={flags} />
        {flags.features.includes("timeline") ? <Timeline projectId={project.id} /> : null}
      </section>
    </main>
  );
}

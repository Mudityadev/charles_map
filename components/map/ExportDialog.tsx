"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { requestExportJob } from "@/lib/jobs/client";

const formats = [
  { id: "png", label: "PNG" },
  { id: "jpeg", label: "JPEG" },
  { id: "svg", label: "SVG", tier: "STANDARD" },
  { id: "pdf", label: "PDF", tier: "STANDARD" },
  { id: "geotiff", label: "GeoTIFF", tier: "PREMIUM" },
  { id: "shp", label: "Shapefile", tier: "PREMIUM" }
] as const;

interface ExportDialogProps {
  projectId: string;
  plan: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
}

export function ExportDialog({ projectId, plan }: ExportDialogProps) {
  const [format, setFormat] = useState<typeof formats[number]["id"]>("png");
  const [dpi, setDpi] = useState(150);

  const mutation = useMutation({
    mutationFn: () => requestExportJob({ projectId, format, dpi })
  });

  const allowedFormats = formats.filter((item) => {
    if (!item.tier) return true;
    const tiers = ["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"] as const;
    return tiers.indexOf(plan) >= tiers.indexOf(item.tier as typeof plan);
  });

  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-4 text-sm text-white">
      <h2 className="text-lg font-semibold">Export</h2>
      <p className="mt-1 text-xs text-white/70">Generate cartographic outputs via async jobs.</p>
      <label className="mt-4 block text-xs uppercase">
        Format
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value as typeof format)}
          className="mt-1 w-full rounded border border-white/20 bg-white/10 px-2 py-2"
        >
          {allowedFormats.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block text-xs uppercase">
        DPI
        <input
          type="number"
          min={72}
          max={600}
          value={dpi}
          onChange={(event) => setDpi(Number(event.target.value))}
          className="mt-1 w-full rounded border border-white/20 bg-white/10 px-2 py-2"
        />
      </label>
      <button
        type="button"
        onClick={() => mutation.mutate()}
        className="mt-4 w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        disabled={mutation.isLoading}
      >
        {mutation.isLoading ? "Queued…" : "Queue export"}
      </button>
      {mutation.isSuccess ? (
        <p className="mt-2 text-xs text-emerald-300">Export job submitted. Track progress in Notifications.</p>
      ) : null}
    </div>
  );
}

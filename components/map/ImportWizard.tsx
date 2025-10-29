"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createImportJob } from "@/lib/jobs/client";

const sources = [
  { id: "geojson", label: "GeoJSON" },
  { id: "kml", label: "KML" },
  { id: "csv", label: "CSV", tier: "STANDARD" },
  { id: "excel", label: "Excel", tier: "STANDARD" },
  { id: "gpx", label: "GPX", tier: "STANDARD" },
  { id: "shapefile", label: "Shapefile", tier: "PREMIUM" },
  { id: "geotiff", label: "GeoTIFF", tier: "PREMIUM" }
] as const;

export function ImportWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<typeof sources[number]["id"]>("geojson");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select a file first");
      return createImportJob({ file, sourceType });
    }
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <label className="block text-sm font-medium text-neutral-700">
        Source type
        <select
          value={sourceType}
          onChange={(event) => setSourceType(event.target.value as typeof sourceType)}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.label}
              {source.tier ? ` (${source.tier})` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-neutral-700">
        Upload file
        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        disabled={mutation.isLoading}
      >
        {mutation.isLoading ? "Uploading…" : "Start import"}
      </button>
      {mutation.isError ? (
        <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
      ) : null}
      {mutation.isSuccess ? (
        <p className="text-sm text-emerald-600">Import job queued. Check activity for progress.</p>
      ) : null}
    </form>
  );
}

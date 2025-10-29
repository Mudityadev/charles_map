"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { runSpatialAnalysis } from "@/lib/geo/analytics";

interface AnalyticsPanelProps {
  projectId: string;
  flags: { planTier: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE"; features: string[] };
}

const analyticsOptions = [
  { id: "buffer", label: "Buffer", minimum: "PREMIUM" },
  { id: "union", label: "Union", minimum: "PREMIUM" },
  { id: "intersect", label: "Intersect", minimum: "PREMIUM" },
  { id: "isochrone", label: "Isochrone", minimum: "PREMIUM" }
];

export function AnalyticsPanel({ projectId, flags }: AnalyticsPanelProps) {
  const [selected, setSelected] = useState<string>("buffer");
  const [output, setOutput] = useState<string>("");

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await runSpatialAnalysis({ projectId, operation: selected });
      setOutput(result.summary);
    }
  });

  const hasPremium = flags.planTier === "PREMIUM" || flags.planTier === "ENTERPRISE";

  return (
    <div className="space-y-4 text-sm text-white">
      <header>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="mt-1 text-xs text-white/70">Run spatial operations and capture insights.</p>
      </header>
      <select
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        className="w-full rounded border border-white/20 bg-white/10 px-2 py-2 text-sm"
      >
        {analyticsOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.minimum === "PREMIUM" ? " (Premium)" : ""}
          </option>
        ))}
      </select>
      {!hasPremium ? (
        <p className="rounded border border-dashed border-white/30 p-3 text-xs text-white/60">
          Upgrade to Premium to unlock analytics and routing.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => mutation.mutate()}
          className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          disabled={mutation.isLoading}
        >
          {mutation.isLoading ? "Processing…" : "Run analysis"}
        </button>
      )}
      {output ? (
        <div className="rounded border border-white/20 bg-white/5 p-3 text-xs">
          <p className="font-semibold text-white">Results</p>
          <pre className="mt-2 whitespace-pre-wrap text-white/80">{output}</pre>
        </div>
      ) : null}
    </div>
  );
}

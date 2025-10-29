"use client";

import { useEffect, useState } from "react";
import { getProjectLayers } from "@/lib/db/clientActions";
import { useQuery } from "@tanstack/react-query";

interface LayerPanelProps {
  projectId: string;
  plan: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
}

export function LayerPanel({ projectId, plan }: LayerPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(plan !== "BASIC");
  const { data: layers } = useQuery({
    queryKey: ["layers", projectId],
    queryFn: () => getProjectLayers(projectId),
    staleTime: 1000 * 30
  });

  useEffect(() => {
    setShowAdvanced(plan !== "BASIC");
  }, [plan]);

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Layers</h2>
        <button
          type="button"
          className="rounded border border-white/20 px-2 py-1 text-xs uppercase text-white"
        >
          Add layer
        </button>
      </header>
      <ul className="space-y-2">
        {(layers ?? []).map((layer) => (
          <li key={layer.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>{layer.name ?? layer.id}</span>
              <span className="text-xs uppercase text-white/60">{layer.type === "threeD" ? "3D" : layer.type}</span>
            </div>
          </li>
        ))}
      </ul>
      {!showAdvanced ? (
        <div className="mt-6 rounded-lg border border-dashed border-white/30 bg-white/5 p-4 text-xs text-white/70">
          Organize layers into folders with Standard tier.
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateLayerStyle } from "@/lib/db/clientActions";

interface StyleInspectorProps {
  projectId: string;
  plan: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
}

export function StyleInspector({ projectId, plan }: StyleInspectorProps) {
  const [style, setStyle] = useState({
    fill: "#2563eb",
    stroke: "#1d4ed8",
    opacity: 0.8,
    ruleProperty: "",
    ruleValue: ""
  });

  const mutation = useMutation({
    mutationFn: () => updateLayerStyle(projectId, style)
  });

  const ruleBased = plan === "PREMIUM" || plan === "ENTERPRISE";

  return (
    <form
      className="space-y-4 text-sm text-white"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <header>
        <h2 className="text-lg font-semibold">Style inspector</h2>
        <p className="mt-1 text-xs text-white/70">Adjust fills, strokes, and typography for selected layers.</p>
      </header>
      <label className="block text-xs uppercase">
        Fill
        <input
          type="color"
          value={style.fill}
          onChange={(event) => setStyle((prev) => ({ ...prev, fill: event.target.value }))}
          className="mt-1 h-10 w-full rounded border border-white/20 bg-transparent"
        />
      </label>
      <label className="block text-xs uppercase">
        Stroke
        <input
          type="color"
          value={style.stroke}
          onChange={(event) => setStyle((prev) => ({ ...prev, stroke: event.target.value }))}
          className="mt-1 h-10 w-full rounded border border-white/20 bg-transparent"
        />
      </label>
      <label className="block text-xs uppercase">
        Opacity ({Math.round(style.opacity * 100)}%)
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={style.opacity}
          onChange={(event) => setStyle((prev) => ({ ...prev, opacity: Number(event.target.value) }))}
          className="mt-1 w-full"
        />
      </label>
      {ruleBased ? (
        <div className="rounded border border-white/20 p-3">
          <p className="text-xs uppercase text-white/70">Rule-based symbology</p>
          <div className="mt-2 flex gap-2">
            <input
              placeholder="Property"
              value={style.ruleProperty}
              onChange={(event) => setStyle((prev) => ({ ...prev, ruleProperty: event.target.value }))}
              className="flex-1 rounded border border-white/20 bg-white/5 px-2 py-1"
            />
            <input
              placeholder="Value"
              value={style.ruleValue}
              onChange={(event) => setStyle((prev) => ({ ...prev, ruleValue: event.target.value }))}
              className="flex-1 rounded border border-white/20 bg-white/5 px-2 py-1"
            />
          </div>
          <p className="mt-2 text-[11px] text-white/60">Apply dynamic styling to Premium and Enterprise layers.</p>
        </div>
      ) : (
        <div className="rounded border border-dashed border-white/30 p-3 text-xs text-white/60">
          Unlock rule-based symbology with Premium.
        </div>
      )}
      <button
        type="submit"
        className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        disabled={mutation.isLoading}
      >
        {mutation.isLoading ? "Saving…" : "Save style"}
      </button>
    </form>
  );
}

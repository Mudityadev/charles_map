"use client";

import { useState } from "react";

interface TimelineProps {
  projectId: string;
}

const ticks = ["2020", "2021", "2022", "2023", "2024"];

export function Timeline({ projectId }: TimelineProps) {
  const [value, setValue] = useState("2024");
  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-4 text-sm text-white">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <span className="text-xs text-white/60">Premium</span>
      </header>
      <input
        type="range"
        min={0}
        max={ticks.length - 1}
        value={ticks.indexOf(value)}
        onChange={(event) => setValue(ticks[Number(event.target.value)])}
        className="w-full"
      />
      <p className="mt-2 text-xs text-white/80">Showing temporal data for {value}</p>
      <p className="mt-2 text-[11px] text-white/50">
        Use the timeline to scrub through temporal datasets and animate deck.gl layers.
      </p>
    </div>
  );
}

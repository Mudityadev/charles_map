"use client";

import { createStore } from "zustand/vanilla";
import { devtools } from "zustand/middleware";
import type { FeatureCollection } from "geojson";

interface ViewState {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

interface EditorState {
  projectId: string;
  baseMap: keyof typeof basemapOptions;
  draftFeatures: FeatureCollection | null;
  measurement: number;
  viewState: ViewState | null;
  cursor?: { lng: number; lat: number };
  setBaseMap: (baseMap: keyof typeof basemapOptions) => void;
  setDraftFeatures: (features: FeatureCollection) => void;
  setMeasurement: (value: number) => void;
  setViewState: (view: ViewState) => void;
  setCursor: (coords: { lng: number; lat: number }) => void;
}

export const basemapOptions = {
  osm: {
    id: "osm",
    label: "OpenStreetMap"
  },
  dark: {
    id: "dark",
    label: "Carto Dark"
  }
} as const;

const stores = new Map<string, ReturnType<typeof createStore<EditorState>>>();

export function createEditorStore(projectId: string) {
  if (stores.has(projectId)) {
    return stores.get(projectId)!;
  }

  const store = createStore<EditorState>()(
    devtools((set) => ({
      projectId,
      baseMap: "osm",
      draftFeatures: null,
      measurement: 0,
      viewState: null,
      setBaseMap: (baseMap) => set({ baseMap }),
      setDraftFeatures: (features) => set({ draftFeatures: features }),
      setMeasurement: (value) => set({ measurement: value }),
      setViewState: (view) => set({ viewState: view }),
      setCursor: (coords) => set({ cursor: coords })
    }), {
      name: `editor-${projectId}`
    })
  );

  stores.set(projectId, store);
  return store;
}

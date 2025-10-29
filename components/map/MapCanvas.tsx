"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import MapboxDraw from "maplibre-gl-draw";
import "maplibre-gl/dist/maplibre-gl.css";
import "maplibre-gl-draw/dist/mapbox-gl-draw.css";
import proj4 from "proj4";
import * as turf from "@turf/turf";
import { createEditorStore } from "@/lib/geo/editorStore";
import { useStore } from "zustand";
import { FeatureCollection } from "geojson";

export interface EditorProject {
  id: string;
  name: string;
  mapStyleJson: any;
  projection: string;
}

export interface OrgFlags {
  planTier: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
  features: string[];
}

interface MapCanvasProps {
  project: EditorProject;
  flags: OrgFlags;
}

const basemaps: Record<string, string> = {
  osm: "https://demotiles.maplibre.org/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
};

export function MapCanvas({ project, flags }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [styleUrl, setStyleUrl] = useState<string>(() => basemaps.osm);

  const editorStore = useMemo(() => createEditorStore(project.id), [project.id]);
  const selectedBaseMap = useStore(editorStore, (state) => state.baseMap);
  const setDraftFeatures = useStore(editorStore, (state) => state.setDraftFeatures);

  useEffect(() => {
    if (selectedBaseMap && basemaps[selectedBaseMap]) {
      setStyleUrl(basemaps[selectedBaseMap]);
    }
  }, [selectedBaseMap]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl ?? project.mapStyleJson ?? basemaps.osm,
      attributionControl: true,
      interactive: true,
      preserveDrawingBuffer: true,
      hash: true
    });

    mapRef.current = map;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        point: true,
        line_string: true,
        polygon: true,
        trash: true,
        combine_features: false,
        uncombine_features: false
      }
    });

    drawRef.current = draw;

    map.addControl(draw, "top-left");
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const handleUpdate = () => {
      const featureCollection = draw.getAll() as FeatureCollection;
      setDraftFeatures(featureCollection);
    };

    map.on("draw.create", handleUpdate);
    map.on("draw.update", handleUpdate);
    map.on("draw.delete", handleUpdate);

    map.once("load", () => {
      if (flags.features.includes("snap-to-grid")) {
        map.on("mousemove", (event) => {
          const snapped = {
            lng: Math.round(event.lngLat.lng * 10) / 10,
            lat: Math.round(event.lngLat.lat * 10) / 10
          };
          editorStore.getState().setCursor(snapped);
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
  }, [flags.features, project.mapStyleJson, setDraftFeatures, editorStore, styleUrl]);

  useEffect(() => {
    if (!mapRef.current || !styleUrl) {
      return;
    }
    mapRef.current.setStyle(styleUrl);
  }, [styleUrl]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    const map = mapRef.current;
    const handler = () => {
      const center = map.getCenter();
      editorStore.getState().setViewState({
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        center: [center.lng, center.lat]
      });
    };
    map.on("moveend", handler);
    return () => {
      map.off("moveend", handler);
    };
  }, [editorStore]);

  const reproject = (collection: FeatureCollection) => {
    if (!flags.features.includes("advanced-projections")) {
      return collection;
    }
    try {
      const targetCrs = project.projection || "EPSG:3857";
      return {
        ...collection,
        features: collection.features.map((feature) => {
          if (!feature.geometry) return feature;
          const reprojectCoords = (coords: any): any => {
            if (typeof coords[0] === "number") {
              const [x, y] = proj4("EPSG:4326", targetCrs, coords as [number, number]);
              return [x, y];
            }
            return (coords as any[]).map(reprojectCoords);
          };
          return {
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates: reprojectCoords(feature.geometry.coordinates as any)
            }
          };
        })
      };
    } catch (error) {
      console.error("Failed to reproject", error);
      return collection;
    }
  };

  const handleMeasure = () => {
    if (!drawRef.current) return;
    const collection = drawRef.current.getSelected() as FeatureCollection;
    const data = reproject(collection);
    const stats = data.features.map((feature) => {
      if (feature.geometry?.type === "Polygon") {
        return turf.area(feature);
      }
      if (feature.geometry?.type === "LineString") {
        return turf.length(feature);
      }
      return 0;
    });
    editorStore.getState().setMeasurement(stats.reduce((acc, value) => acc + value, 0));
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute bottom-4 right-4 rounded bg-black/70 px-3 py-2 text-xs">
        <button
          type="button"
          onClick={handleMeasure}
          className="pointer-events-auto text-white underline"
        >
          Measure selection
        </button>
      </div>
    </div>
  );
}

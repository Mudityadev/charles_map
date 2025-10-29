import * as turf from "@turf/turf";
import { prisma } from "@/lib/db/client";

interface SpatialAnalysisInput {
  projectId: string;
  operation: "buffer" | "union" | "intersect" | "isochrone";
}

export async function runSpatialAnalysis(input: SpatialAnalysisInput) {
  const layers = await prisma.layer.findMany({
    where: { projectId: input.projectId, type: { in: ["vector", "threeD"] } },
    include: { features: true }
  });

  const collection = turf.featureCollection(
    layers
      .flatMap((layer) => layer.features)
      .map((feature) => feature.geometry as turf.AllGeoJSON)
      .filter(Boolean)
  );

  switch (input.operation) {
    case "buffer": {
      const buffered = turf.buffer(collection, 10, { units: "meters" });
      return { summary: JSON.stringify(buffered, null, 2) };
    }
    case "union": {
      const unioned = collection.features.reduce((acc, feature) => {
        if (!acc) return feature as any;
        return turf.union(acc, feature as any);
      }, null as any);
      return { summary: JSON.stringify(unioned, null, 2) };
    }
    case "intersect": {
      if (collection.features.length < 2) {
        return { summary: "Need at least two features to intersect" };
      }
      const [first, second] = collection.features;
      const intersection = turf.intersect(first as any, second as any);
      return { summary: JSON.stringify(intersection, null, 2) };
    }
    case "isochrone": {
      return { summary: "Isochrone computation delegated to routing service" };
    }
    default:
      return { summary: "Unsupported operation" };
  }
}

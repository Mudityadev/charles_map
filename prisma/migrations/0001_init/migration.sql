CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Geometry storage tables handled via Prisma JSON placeholders. Add GIST indexes via raw SQL.
CREATE TABLE IF NOT EXISTS "SpatialFeatures" (
    "id" TEXT PRIMARY KEY,
    "layerId" TEXT NOT NULL,
    "geometry" geometry(GEOMETRY, 4326) NOT NULL,
    "properties" JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "SpatialFeatures_geometry_idx" ON "SpatialFeatures" USING GIST ("geometry");

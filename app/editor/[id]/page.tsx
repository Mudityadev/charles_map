'use client';

import { useState, useCallback, useMemo, useEffect, startTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMaps } from '@/hooks/useMaps';
import { MapData } from '@/types/map';
import { MapEditor } from '@/components/MapEditor';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { getMap, saveMap } = useMaps();
  const mapId = useMemo(() => params.id as string, [params.id]);
  /**
   * Generates a base map object used when opening a fresh project.
   */
  const buildDefaultMap = useCallback((): MapData => ({
    id: mapId,
    name: 'Untitled Map',
    createdAt: Date.now(),
    lastModified: Date.now(),
    annotations: [],
    width: 800,
    height: 600,
    backgroundColor: '#0f172a',
  }), [mapId]);
  const [map, setMap] = useState<MapData>(() => {
    const existingMap = getMap(mapId);
    return existingMap ?? buildDefaultMap();
  });

  useEffect(() => {
    const existingMap = getMap(mapId);
    startTransition(() => {
      if (existingMap) {
        setMap(existingMap);
      } else {
        const draft = buildDefaultMap();
        setMap(draft);
        saveMap(draft);
      }
    });
  }, [buildDefaultMap, getMap, mapId, saveMap]);

  /**
   * Persists map changes through the storage-backed hook.
   */
  const handleSave = useCallback((updatedMap: MapData) => {
    saveMap(updatedMap);
    setMap(updatedMap);
  }, [saveMap]);

  /**
   * Returns to the dashboard view.
   */
  const handleBack = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <MapEditor key={map.id} map={map} onSave={handleSave} onBack={handleBack} />
  );
}


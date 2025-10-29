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
  const [map, setMap] = useState<MapData>(() => {
    const existingMap = getMap(mapId);
    if (existingMap) {
      return existingMap;
    }

    return {
      id: mapId,
      name: 'Untitled Map',
      createdAt: Date.now(),
      lastModified: Date.now(),
      annotations: [],
      width: 800,
      height: 600,
      backgroundColor: '#0f172a',
    };
  });

  useEffect(() => {
    const existingMap = getMap(mapId);
    startTransition(() => {
      if (existingMap) {
        setMap(existingMap);
      } else {
        setMap({
          id: mapId,
          name: 'Untitled Map',
          createdAt: Date.now(),
          lastModified: Date.now(),
          annotations: [],
          width: 800,
          height: 600,
          backgroundColor: '#0f172a',
        });
      }
    });
  }, [getMap, mapId]);

  const handleSave = useCallback((updatedMap: MapData) => {
    saveMap(updatedMap);
    setMap(updatedMap);
  }, [saveMap]);

  const handleBack = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <MapEditor key={map.id} map={map} onSave={handleSave} onBack={handleBack} />
  );
}


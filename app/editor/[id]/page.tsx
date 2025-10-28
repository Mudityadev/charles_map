'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMaps } from '@/hooks/useMaps';
import { MapData, Annotation } from '@/types/map';
import { MapEditor } from '@/components/MapEditor';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { getMap, saveMap } = useMaps();
  const [map, setMap] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapId = useMemo(() => params.id as string, [params.id]);

  useEffect(() => {
    const existingMap = getMap(mapId);
    
    if (!existingMap) {
      // Create new map
      const newMap: MapData = {
        id: mapId,
        name: 'Untitled Map',
        createdAt: Date.now(),
        lastModified: Date.now(),
        annotations: [],
        width: 800,
        height: 600,
      };
      setMap(newMap);
    } else {
      setMap(existingMap);
    }
    setIsLoading(false);
  }, [mapId, getMap]);

  const handleSave = useCallback((updatedMap: MapData) => {
    saveMap(updatedMap);
    setMap(updatedMap);
  }, [saveMap]);

  const handleBack = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  if (isLoading || !map) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <MapEditor map={map} onSave={handleSave} onBack={handleBack} />
  );
}


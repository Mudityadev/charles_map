import { useState, useEffect, useCallback } from 'react';
import { MapData } from '@/types/map';

export function useMaps() {
  const [maps, setMaps] = useState<MapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load maps from localStorage
    const storedMaps = localStorage.getItem('charles_map_maps');
    if (storedMaps) {
      setMaps(JSON.parse(storedMaps));
    }
    setIsLoading(false);
  }, []);

  const saveMap = useCallback((map: MapData) => {
    setMaps((prevMaps) => {
      const updatedMaps = [...prevMaps];
      const existingIndex = updatedMaps.findIndex(m => m.id === map.id);
      
      if (existingIndex >= 0) {
        updatedMaps[existingIndex] = map;
      } else {
        updatedMaps.push(map);
      }
      
      localStorage.setItem('charles_map_maps', JSON.stringify(updatedMaps));
      return updatedMaps;
    });
  }, []);

  const deleteMap = useCallback((id: string) => {
    setMaps((prevMaps) => {
      const updatedMaps = prevMaps.filter(m => m.id !== id);
      localStorage.setItem('charles_map_maps', JSON.stringify(updatedMaps));
      return updatedMaps;
    });
  }, []);

  const getMap = useCallback((id: string) => {
    return maps.find(m => m.id === id);
  }, [maps]);

  return {
    maps,
    isLoading,
    saveMap,
    deleteMap,
    getMap,
  };
}


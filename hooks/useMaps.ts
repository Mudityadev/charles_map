import { useState, useCallback } from 'react';
import { MapData } from '@/types/map';

export function useMaps() {
  const [maps, setMaps] = useState<MapData[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const storedMaps = window.localStorage.getItem('charles_map_maps');
    if (!storedMaps) {
      return [];
    }

    try {
      return JSON.parse(storedMaps) as MapData[];
    } catch (error) {
      console.warn('Failed to parse stored maps', error);
      return [];
    }
  });
  const isLoading = false;

  const saveMap = useCallback((map: MapData) => {
    setMaps((prevMaps) => {
      const updatedMaps = [...prevMaps];
      const existingIndex = updatedMaps.findIndex(m => m.id === map.id);

      if (existingIndex >= 0) {
        updatedMaps[existingIndex] = map;
      } else {
        updatedMaps.push(map);
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('charles_map_maps', JSON.stringify(updatedMaps));
      }
      return updatedMaps;
    });
  }, []);

  const deleteMap = useCallback((id: string) => {
    setMaps((prevMaps) => {
      const updatedMaps = prevMaps.filter(m => m.id !== id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('charles_map_maps', JSON.stringify(updatedMaps));
      }
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


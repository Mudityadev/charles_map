import { useState, useCallback, useEffect } from 'react';
import { MapData } from '@/types/map';

const STORAGE_KEY = 'charles_map_maps';

/**
 * Parses stored JSON data and gracefully handles corrupted payloads.
 */
function parseStoredMaps(payload: string | null): MapData[] {
  if (!payload) {
    return [];
  }

  try {
    const parsed = JSON.parse(payload) as MapData[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to parse stored maps', error);
    return [];
  }
}

/**
 * Serialises maps to localStorage, catching quota exceptions and surfacing a
 * helpful console warning so QA teams can diagnose state persistence issues.
 */
function persistMaps(maps: MapData[]) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
  } catch (error) {
    console.warn('Failed to persist maps to localStorage', error);
  }
}

/**
 * SaaS-friendly map hook that keeps local state in sync with browser storage and
 * exposes CRUD helpers. Consumers receive instant updates thanks to optimistic
 * writes which mirror how a production API would acknowledge success.
 */
export function useMaps() {
  const [maps, setMaps] = useState<MapData[]>(() =>
    typeof window === 'undefined' ? [] : parseStoredMaps(window.localStorage.getItem(STORAGE_KEY)),
  );
  const isLoading = false;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setMaps(parseStoredMaps(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  /**
   * Generates a new map scaffold ready for editing and persists it immediately
   * so other tabs/devices stay in sync via the storage listener.
   */
  const createMap = useCallback(() => {
    const timestamp = Date.now();
    const newMap: MapData = {
      id: `map_${timestamp}`,
      name: 'Untitled Map',
      createdAt: timestamp,
      lastModified: timestamp,
      annotations: [],
      width: 800,
      height: 600,
      backgroundColor: '#0f172a',
    };

    setMaps((previous) => {
      const next = [...previous, newMap];
      persistMaps(next);
      return next;
    });

    return newMap;
  }, []);

  /**
   * Upserts a map and keeps the persisted cache aligned.
   */
  const saveMap = useCallback((map: MapData) => {
    setMaps((previous) => {
      const existingIndex = previous.findIndex((entry) => entry.id === map.id);
      const next = [...previous];

      if (existingIndex >= 0) {
        next[existingIndex] = map;
      } else {
        next.push(map);
      }

      persistMaps(next);
      return next;
    });
  }, []);

  /**
   * Removes a map from both state and storage.
   */
  const deleteMap = useCallback((id: string) => {
    setMaps((previous) => {
      const next = previous.filter((entry) => entry.id !== id);
      persistMaps(next);
      return next;
    });
  }, []);

  /**
   * Looks up a map by id. This helper is memoised so components only re-render
   * when the maps collection changes.
   */
  const getMap = useCallback(
    (id: string) => maps.find((entry) => entry.id === id),
    [maps],
  );

  return {
    maps,
    isLoading,
    createMap,
    saveMap,
    deleteMap,
    getMap,
  };
}


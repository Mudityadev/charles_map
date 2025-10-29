import { useCallback, useRef, useState } from 'react';
import { Annotation } from '@/types/map';

/**
 * Creates a lightweight deep clone of an annotation array so history snapshots
 * never share mutable references. Arrays are intentionally copied manually to
 * avoid the cost of JSON serialization when annotations contain geometry
 * arrays.
 */
function cloneAnnotations(source: Annotation[]): Annotation[] {
  return source.map((annotation) => ({
    ...annotation,
    points: annotation.points ? [...annotation.points] : undefined,
  }));
}

interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

interface SetOptions {
  /**
   * When true the new annotation state is recorded in the undo stack. When
   * false we simply replace the active annotations without mutating history.
   */
  recordHistory?: boolean;
}

interface AnnotationHistoryApi {
  annotations: Annotation[];
  setAnnotations: (
    updater: Annotation[] | ((prev: Annotation[]) => Annotation[]),
    options?: SetOptions,
  ) => void;
  reset: (nextAnnotations: Annotation[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Small, framework-agnostic undo/redo manager for annotation collections. The
 * hook stores history in mutable refs to avoid re-rendering the component when
 * snapshots are pushed or popped, and exposes imperative undo and redo helpers.
 */
export function useAnnotationHistory(initialAnnotations: Annotation[]): AnnotationHistoryApi {
  const [annotations, setAnnotationsState] = useState<Annotation[]>(() => cloneAnnotations(initialAnnotations));
  const historyRef = useRef<Annotation[][]>([cloneAnnotations(initialAnnotations)]);
  const historyIndexRef = useRef(0);
  const [historyState, setHistoryState] = useState<HistoryState>({ canUndo: false, canRedo: false });

  const updateHistoryState = useCallback(() => {
    const canUndo = historyIndexRef.current > 0;
    const canRedo = historyIndexRef.current < historyRef.current.length - 1;
    setHistoryState({ canUndo, canRedo });
  }, []);

  const setAnnotations = useCallback<AnnotationHistoryApi['setAnnotations']>(
    (updater, options = {}) => {
      const { recordHistory = true } = options;
      setAnnotationsState((previous) => {
        const next = typeof updater === 'function' ? (updater as (prev: Annotation[]) => Annotation[])(previous) : updater;
        const cloned = cloneAnnotations(next);

        if (recordHistory) {
          const limitedHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
          limitedHistory.push(cloned);
          historyRef.current = limitedHistory;
          historyIndexRef.current = historyRef.current.length - 1;
        }

        updateHistoryState();
        return cloned;
      });
    },
    [updateHistoryState],
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current === 0) {
      return;
    }
    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    setAnnotationsState(cloneAnnotations(snapshot));
    updateHistoryState();
  }, [updateHistoryState]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }
    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    setAnnotationsState(cloneAnnotations(snapshot));
    updateHistoryState();
  }, [updateHistoryState]);

  const reset = useCallback((nextAnnotations: Annotation[]) => {
    const cloned = cloneAnnotations(nextAnnotations);
    historyRef.current = [cloned];
    historyIndexRef.current = 0;
    setAnnotationsState(cloned);
    updateHistoryState();
  }, [updateHistoryState]);

  return {
    annotations,
    setAnnotations,
    reset,
    undo,
    redo,
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
  };
}


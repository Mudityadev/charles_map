'use client';

import { useState, useRef, useEffect, useMemo, useCallback, ChangeEvent, startTransition } from 'react';
import { MapData, Annotation, AnnotationType } from '@/types/map';
import { useAnnotationHistory } from '@/hooks/useAnnotationHistory';
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Image as KonvaImage,
  Group,
  Transformer,
  Line,
  Arrow,
} from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import KonvaErrorBoundary from '@/components/KonvaErrorBoundary';

interface MapEditorProps {
  map: MapData;
  onSave: (map: MapData) => void;
  onBack: () => void;
}

const GRID_SIZE = 50;
const MIN_RECT_SIZE = 32;
const MIN_RADIUS = 16;
const MIN_CONNECTOR_LENGTH = 24;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;

/**
 * Renders the imported map background image with Konva while keeping the stage
 * event pipeline passive so pointer interaction is delegated to annotations.
 */
function MapBackgroundImage({ src, width, height }: { src: string; width: number; height: number }) {
  const [image] = useImage(src, 'anonymous');
  return image ? <KonvaImage image={image} width={width} height={height} listening={false} /> : null;
}

/**
 * Provides a semantic icon for every annotation tool option displayed in the
 * toolbar. Icons are intentionally lightweight inline SVGs to avoid additional
 * bundle weight.
 */
function toolIcon(tool: AnnotationType) {
  switch (tool) {
    case 'marker':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'text':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'rectangle':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm3 2v8h8V6H6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'circle':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
        </svg>
      );
    case 'arrow':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 10h10l-3.5-3.5L11 5l6 5-6 5-1.5-1.5L13 10H3z" />
        </svg>
      );
    case 'line':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4.293 4.293a1 1 0 011.414 0l10 10a1 1 0 01-1.414 1.414l-10-10a1 1 0 010-1.414z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * High-level editor responsible for orchestrating map rendering, annotation tooling,
 * exporting, and persistence integrations. The component intentionally keeps
 * rendering logic declarative while delegating mutation tracking to dedicated
 * helpers so we can deliver desktop-class interactions in a browser.
 */
export function MapEditor({ map, onSave, onBack }: MapEditorProps) {
  const { annotations, setAnnotations, reset: resetAnnotations, undo, redo, canUndo, canRedo } = useAnnotationHistory(
    map.annotations || [],
  );
  const [activeTool, setActiveTool] = useState<AnnotationType | null>(null);
  const [mapName, setMapName] = useState(map.name);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(map.imageData || null);
  const [backgroundColor, setBackgroundColor] = useState(map.backgroundColor || '#0f172a');
  const [stageSize, setStageSize] = useState({ width: map.width || 800, height: map.height || 600 });
  const [isModified, setIsModified] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [pendingConnectorStart, setPendingConnectorStart] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const markDirty = useCallback(() => setIsModified(true), []);

  useEffect(() => {
    resetAnnotations(map.annotations || []);
    startTransition(() => {
      setIsModified(false);
    });
  }, [map.annotations, map.id, map.lastModified, resetAnnotations]);

  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedAnnotationId) || null,
    [annotations, selectedAnnotationId],
  );

  /**
   * Imperatively triggers an undo action and flags the editor as dirty so
   * reverted states are eligible for persistence.
   */
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    undo();
    markDirty();
  }, [canUndo, markDirty, undo]);

  /**
   * Imperatively triggers a redo action and flags the editor as dirty so
   * resurrected states are eligible for persistence.
   */
  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    redo();
    markDirty();
  }, [canRedo, markDirty, redo]);

  /**
   * Updates the active drawing tool and cancels any partially constructed
   * connector when switching modes.
   */
  const handleToolSelection = useCallback((tool: AnnotationType | null) => {
    setActiveTool(tool);
    setPendingConnectorStart(null);
  }, []);

  /**
   * Global keyboard shortcuts enabling users to escape tool selection, delete
   * annotations, and leverage undo/redo workflows consistent with desktop SaaS
   * tools.
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || e.key === 'Z')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key === 'Escape') {
        handleToolSelection(null);
        setSelectedAnnotationId(null);
        setPendingConnectorStart(null);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotation) {
        setAnnotations((prev) => prev.filter((annot) => annot.id !== selectedAnnotation.id));
        setSelectedAnnotationId(null);
        markDirty();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleRedo, handleToolSelection, handleUndo, markDirty, selectedAnnotation, setAnnotations]);

  /**
   * Utility helper that updates a single annotation by id using a mutation
   * callback. All updates are piped through the undo stack automatically.
   */
  const updateAnnotation = useCallback(
    (id: string, updater: (annotation: Annotation) => Annotation) => {
      setAnnotations((prev) => {
        let didUpdate = false;
        const updated = prev.map((annotation) => {
          if (annotation.id !== id) {
            return annotation;
          }
          didUpdate = true;
          return updater(annotation);
        });
        if (didUpdate) {
          markDirty();
        }
        return updated;
      });
    },
    [markDirty, setAnnotations],
  );

  /**
   * Serialises the editor state and delegates persistence to the caller. We do
   * not reset annotations so the undo stack still allows navigating to unsaved
   * states until the user continues editing.
   */
  const handleSave = () => {
    const updatedMap: MapData = {
      ...map,
      name: mapName,
      annotations,
      imageData: backgroundImage || map.imageData,
      lastModified: Date.now(),
      width: stageSize.width,
      height: stageSize.height,
      backgroundColor,
    };
    onSave(updatedMap);
    setIsModified(false);
  };

  /**
   * Reads an imported image and dynamically resizes the stage to match its
   * native dimensions, guaranteeing pixel perfect exports.
   */
  const handleImageImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setBackgroundImage(dataUrl);
        markDirty();

        const img = new window.Image();
        img.onload = () => {
          setStageSize({ width: img.width, height: img.height });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Converts the stage to a high quality JPEG blob and streams it to the user
   * via an ephemeral anchor element. The operation is synchronous for snappy
   * UX and avoids server round-trips.
   */
  const handleExportJPG = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const dataURL = stage.toDataURL({
      mimeType: 'image/jpeg',
      quality: 0.95,
    });

    const link = document.createElement('a');
    link.download = `${mapName}.jpg`;
    link.href = dataURL;
    link.click();
  };

  /**
   * Applies snapping logic when grid snapping is toggled, ensuring the geometry
   * aligns perfectly with rendered guides. The computation is intentionally
   * memoised to avoid re-render thrash.
   */
  const applyGridSnap = useCallback(
    (value: number) => {
      if (!snapToGrid) return value;
      return Math.round(value / GRID_SIZE) * GRID_SIZE;
    },
    [snapToGrid],
  );

  /**
   * Translates pointer coordinates into stage-space while respecting zoom so
   * placement logic remains resolution independent.
   */
  const getRelativePointerPosition = useCallback((stage: Konva.Stage) => {
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) {
      return null;
    }
    const scale = stage.scaleX() || 1;
    return {
      x: pointerPosition.x / scale,
      y: pointerPosition.y / scale,
    };
  }, []);

  /**
   * Handles placement of new annotations or selection clearing when the user
   * interacts with empty canvas areas.
   */
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPos = getRelativePointerPosition(stage);
    if (!pointerPos) return;

    const clickedOnEmpty = e.target === stage || e.target.getClassName() === 'Rect';

    if (!activeTool) {
      if (clickedOnEmpty) {
        setSelectedAnnotationId(null);
      }
      return;
    }

    if (e.target !== stage && e.target.getClassName() !== 'Rect') {
      return;
    }

    const placement = {
      x: applyGridSnap(pointerPos.x),
      y: applyGridSnap(pointerPos.y),
    };

    const newAnnotationBase: Annotation = {
      id: `annot_${Date.now()}`,
      type: activeTool,
      x: placement.x,
      y: placement.y,
      color: activeTool === 'text' ? '#0f172a' : '#ef4444',
      opacity: activeTool === 'rectangle' || activeTool === 'circle' ? 0.35 : 1,
      strokeWidth: 4,
    };

    if (activeTool === 'text') {
      const text = prompt('Enter text for annotation:', 'New note');
      if (text !== null && text.trim() !== '') {
        const annotation: Annotation = {
          ...newAnnotationBase,
          text,
          fontSize: 18,
        };
        setAnnotations((prev) => [...prev, annotation]);
        setSelectedAnnotationId(annotation.id);
        markDirty();
      }
      return;
    }

    if (activeTool === 'rectangle') {
      const annotation: Annotation = {
        ...newAnnotationBase,
        width: 160,
        height: 110,
      };
      setAnnotations((prev) => [...prev, annotation]);
      setSelectedAnnotationId(annotation.id);
      markDirty();
      return;
    }

    if (activeTool === 'circle') {
      const annotation: Annotation = {
        ...newAnnotationBase,
        radius: 70,
      };
      setAnnotations((prev) => [...prev, annotation]);
      setSelectedAnnotationId(annotation.id);
      markDirty();
      return;
    }

    if (activeTool === 'marker') {
      const annotation: Annotation = {
        ...newAnnotationBase,
        color: '#f97316',
      };
      setAnnotations((prev) => [...prev, annotation]);
      setSelectedAnnotationId(annotation.id);
      markDirty();
      return;
    }

    if (activeTool === 'arrow' || activeTool === 'line') {
      if (!pendingConnectorStart) {
        setPendingConnectorStart(placement);
        return;
      }

      const dx = placement.x - pendingConnectorStart.x;
      const dy = placement.y - pendingConnectorStart.y;
      if (Math.abs(dx) < MIN_CONNECTOR_LENGTH && Math.abs(dy) < MIN_CONNECTOR_LENGTH) {
        setPendingConnectorStart(null);
        return;
      }

      const annotation: Annotation = {
        ...newAnnotationBase,
        x: pendingConnectorStart.x,
        y: pendingConnectorStart.y,
        points: [0, 0, dx, dy],
        strokeWidth: 4,
        pointerLength: 18,
        pointerWidth: 14,
      };

      setAnnotations((prev) => [...prev, annotation]);
      setSelectedAnnotationId(annotation.id);
      setPendingConnectorStart(null);
      markDirty();
      return;
    }
  };

  /**
   * Enables inline text editing for textual annotations via a simple prompt.
   */
  const handleAnnotationDoubleClick = (annot: Annotation) => {
    if (annot.type === 'text') {
      const newText = prompt('Edit text:', annot.text || '');
      if (newText !== null) {
        updateAnnotation(annot.id, (prev) => ({ ...prev, text: newText }));
      }
    }
  };

  /**
   * Applies snapping to dragged annotations and records the new position.
   */
  const handleAnnotationDragEnd = (annot: Annotation, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newPosition = {
      x: applyGridSnap(node.x()),
      y: applyGridSnap(node.y()),
    };
    node.position(newPosition);
    updateAnnotation(annot.id, (prev) => ({ ...prev, ...newPosition }));
  };

  /**
   * Normalises Konva's transform output into width/height/rotation deltas for
   * rectangle annotations.
   */
  const handleRectangleTransform = (annot: Annotation, node: Konva.Rect) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const width = Math.max(MIN_RECT_SIZE, node.width() * scaleX);
    const height = Math.max(MIN_RECT_SIZE, node.height() * scaleY);
    const x = applyGridSnap(node.x());
    const y = applyGridSnap(node.y());
    node.position({ x, y });
    updateAnnotation(annot.id, (prev) => ({
      ...prev,
      width,
      height,
      x,
      y,
      rotation: node.rotation(),
    }));
  };

  /**
   * Normalises Konva's transform output for circle annotations and enforces the
   * minimum radius.
   */
  const handleCircleTransform = (annot: Annotation, node: Konva.Circle) => {
    const scaleX = node.scaleX();
    node.scaleX(1);
    node.scaleY(1);
    const radius = Math.max(MIN_RADIUS, node.radius() * scaleX);
    const x = applyGridSnap(node.x());
    const y = applyGridSnap(node.y());
    node.position({ x, y });
    updateAnnotation(annot.id, (prev) => ({
      ...prev,
      radius,
      x,
      y,
      rotation: node.rotation(),
    }));
  };

  /**
   * Converts Konva transform data to new bounds for text annotations so users
   * can resize content blocks.
   */
  const handleTextTransform = (annot: Annotation, node: Konva.Text) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const width = node.width() * scaleX;
    const height = node.height() * scaleY;
    const x = applyGridSnap(node.x());
    const y = applyGridSnap(node.y());
    node.position({ x, y });
    updateAnnotation(annot.id, (prev) => ({
      ...prev,
      width,
      height,
      x,
      y,
      rotation: node.rotation(),
    }));
  };

  /**
   * Updates connector geometries after drag/scale interactions while maintaining
   * their mathematical orientation.
   */
  const handleConnectorTransform = (annot: Annotation, node: Konva.Line | Konva.Arrow) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const points = (node.points() || []).map((point, index) =>
      index % 2 === 0 ? point * scaleX : point * scaleY,
    );
    node.scaleX(1);
    node.scaleY(1);
    const x = applyGridSnap(node.x());
    const y = applyGridSnap(node.y());
    node.position({ x, y });
    updateAnnotation(annot.id, (prev) => ({
      ...prev,
      points,
      x,
      y,
      rotation: node.rotation(),
    }));
  };

  /**
   * Smooth zoom handler that clamps the zoom range for predictable viewport
   * control on both desktop trackpads and mobile pinch gestures.
   */
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const direction = e.evt.deltaY > 0 ? -0.08 : 0.08;
    setZoom((prev) => {
      const nextZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((prev + direction).toFixed(2))));
      return nextZoom;
    });
  };

  useEffect(() => {
    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!stage || !transformer) return;

    if (!selectedAnnotationId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const selectedNode = stage.findOne(`.${selectedAnnotationId}`);
    if (selectedNode) {
      transformer.nodes([selectedNode as Konva.Node]);
      transformer.getLayer()?.batchDraw();
    }
  }, [annotations, selectedAnnotationId]);

  /**
   * Creates an offset clone of the selected annotation to accelerate repetitive
   * layout tasks.
   */
  const duplicateSelected = () => {
    if (!selectedAnnotation) return;
    const duplicated: Annotation = {
      ...selectedAnnotation,
      id: `annot_${Date.now()}`,
      x: selectedAnnotation.x + 24,
      y: selectedAnnotation.y + 24,
    };
    setAnnotations((prev) => [...prev, duplicated]);
    setSelectedAnnotationId(duplicated.id);
    markDirty();
  };

  /**
   * Removes the currently selected annotation.
   */
  const deleteSelected = () => {
    if (!selectedAnnotation) return;
    setAnnotations((prev) => prev.filter((annot) => annot.id !== selectedAnnotation.id));
    setSelectedAnnotationId(null);
    markDirty();
  };

  /**
   * Moves the selected annotation to the end of the render array, effectively
   * bringing it to the front of the canvas.
   */
  const bringToFront = () => {
    if (!selectedAnnotation) return;
    setAnnotations((prev) => {
      const remaining = prev.filter((annot) => annot.id !== selectedAnnotation.id);
      return [...remaining, selectedAnnotation];
    });
    markDirty();
  };

  /**
   * Moves the selected annotation to the beginning of the render array so it
   * renders behind all other shapes.
   */
  const sendToBack = () => {
    if (!selectedAnnotation) return;
    setAnnotations((prev) => {
      const remaining = prev.filter((annot) => annot.id !== selectedAnnotation.id);
      return [selectedAnnotation, ...remaining];
    });
    markDirty();
  };

  /**
   * Applies targeted updates to the selected annotation without needing the
   * caller to know the annotation id.
   */
  const updateSelectedAnnotation = (changes: Partial<Annotation>) => {
    if (!selectedAnnotation) return;
    updateAnnotation(selectedAnnotation.id, (prev) => ({ ...prev, ...changes }));
  };

  /**
   * Resets the zoom level to 1, ensuring a quick way to re-centre the stage.
   */
  const resetView = () => {
    setZoom(1);
  };

  const toolOptions: AnnotationType[] = ['marker', 'text', 'rectangle', 'circle', 'arrow', 'line'];

  const gridLines = useMemo(() => {
    if (!gridEnabled) return null;
    const verticalLines = Array.from({ length: Math.floor(stageSize.width / GRID_SIZE) + 1 }, (_, index) => (
      <Line
        key={`v-${index}`}
        points={[index * GRID_SIZE, 0, index * GRID_SIZE, stageSize.height]}
        stroke="rgba(148, 163, 184, 0.25)"
        strokeWidth={1}
        listening={false}
      />
    ));
    const horizontalLines = Array.from({ length: Math.floor(stageSize.height / GRID_SIZE) + 1 }, (_, index) => (
      <Line
        key={`h-${index}`}
        points={[0, index * GRID_SIZE, stageSize.width, index * GRID_SIZE]}
        stroke="rgba(148, 163, 184, 0.25)"
        strokeWidth={1}
        listening={false}
      />
    ));
    return (
      <>
        {verticalLines}
        {horizontalLines}
      </>
    );
  }, [gridEnabled, stageSize.height, stageSize.width]);

  const formatNumber = useCallback((value: number) => {
    if (!Number.isFinite(value)) return '0';
    return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }, []);

  /**
   * Derives geometric insights for the selected annotation so power users can
   * iterate precisely.
   */
  const selectedAnnotationMetrics = useMemo(() => {
    if (!selectedAnnotation) return null;
    const metrics: { label: string; value: string }[] = [
      { label: 'Position X', value: `${formatNumber(selectedAnnotation.x)} px` },
      { label: 'Position Y', value: `${formatNumber(selectedAnnotation.y)} px` },
    ];

    if (selectedAnnotation.type === 'rectangle') {
      const width = selectedAnnotation.width ?? 0;
      const height = selectedAnnotation.height ?? 0;
      metrics.push({ label: 'Width', value: `${formatNumber(width)} px` });
      metrics.push({ label: 'Height', value: `${formatNumber(height)} px` });
      metrics.push({ label: 'Area', value: `${formatNumber(width * height)} px²` });
      metrics.push({ label: 'Perimeter', value: `${formatNumber(2 * (width + height))} px` });
    } else if (selectedAnnotation.type === 'circle') {
      const radius = selectedAnnotation.radius ?? 0;
      const diameter = radius * 2;
      metrics.push({ label: 'Radius', value: `${formatNumber(radius)} px` });
      metrics.push({ label: 'Diameter', value: `${formatNumber(diameter)} px` });
      metrics.push({ label: 'Area', value: `${formatNumber(Math.PI * radius * radius)} px²` });
      metrics.push({ label: 'Circumference', value: `${formatNumber(2 * Math.PI * radius)} px` });
    } else if (selectedAnnotation.type === 'arrow' || selectedAnnotation.type === 'line') {
      const points = selectedAnnotation.points ?? [];
      if (points.length >= 4) {
        const dx = points[points.length - 2] ?? 0;
        const dy = points[points.length - 1] ?? 0;
        const length = Math.hypot(dx, dy);
        const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        metrics.push({ label: 'Length', value: `${formatNumber(length)} px` });
        metrics.push({ label: 'Angle', value: `${formatNumber(angle)}°` });
      }
      metrics.push({ label: 'Stroke', value: `${formatNumber(selectedAnnotation.strokeWidth ?? 0)} px` });
    } else if (selectedAnnotation.type === 'text') {
      const contentLength = selectedAnnotation.text?.trim().length ?? 0;
      metrics.push({ label: 'Characters', value: contentLength.toString() });
      metrics.push({ label: 'Font size', value: `${formatNumber(selectedAnnotation.fontSize ?? 18)} px` });
    }

    return metrics;
  }, [formatNumber, selectedAnnotation]);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh_-_3rem)] max-w-[1400px] flex-col gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.5)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={onBack}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:border-white/25 hover:bg-white/20"
                title="Back to dashboard"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={mapName}
                  onChange={(e) => {
                    setMapName(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-lg font-semibold text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                  placeholder="Untitled premium map"
                />
                {isModified && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-amber-100">
                    Unsaved
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageImport} className="hidden" />
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-200/40 hover:bg-slate-100/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                title="Undo (⌘/Ctrl + Z)"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5H8m0 0l4-4m-4 4l4 4M4 12a8 8 0 1113.856 5.856" />
                </svg>
                Undo
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-200/40 hover:bg-slate-100/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                title="Redo (⌘/Ctrl + Shift + Z)"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5h4m0 0l-4-4m4 4l-4 4M20 12a8 8 0 10-13.856 5.856" />
                </svg>
                Redo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-sky-200/40 hover:bg-sky-400/20 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                </svg>
                Import image
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
                Save project
              </button>
              <button
                onClick={handleExportJPG}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5h6m-3-3v12m-7 4h14" />
                </svg>
                Export JPG
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur sm:flex-row">
          <aside className="w-full border-b border-white/10 bg-white/5 p-5 text-slate-200 sm:w-80 sm:border-b-0 sm:border-r">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Toolbox</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
                Studio
              </span>
            </div>
            {activeTool ? (
              <div className="mt-4 rounded-2xl border border-indigo-400/40 bg-indigo-500/15 px-3 py-2 text-sm font-medium text-indigo-100">
                Active tool: {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                Select a tool to start placing annotations.
              </div>
            )}

            {pendingConnectorStart && (
              <div className="mt-3 rounded-2xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                Choose an end point for your connector.
              </div>
            )}

            <div className="mt-6 space-y-2">
              {toolOptions.map((tool) => (
                <button
                  key={tool}
                  onClick={() => handleToolSelection(tool)}
                  className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    activeTool === tool
                      ? 'border-indigo-400/70 bg-indigo-500/25 text-white shadow-[0_15px_40px_rgba(79,70,229,0.4)]'
                      : 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-indigo-400/40 hover:bg-indigo-500/15 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sky-200">
                      {toolIcon(tool)}
                    </span>
                    <span className="capitalize">{tool}</span>
                  </span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}

              <button
                onClick={() => handleToolSelection(null)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <span>Select (ESC)</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-[0.3em]">ESC</span>
              </button>
            </div>

            {annotations.length > 0 && (
              <div className="mt-8 space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Annotations</h4>
                <div className="space-y-2">
                  {annotations.map((annot, index) => {
                    const isSelected = annot.id === selectedAnnotationId;
                    return (
                      <div
                        key={annot.id}
                        className={`rounded-2xl border px-4 py-2 text-sm ${
                          isSelected
                            ? 'border-sky-400/60 bg-sky-500/20 text-white shadow-[0_12px_35px_rgba(56,189,248,0.35)]'
                            : 'border-white/10 bg-slate-900/50 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => {
                              setSelectedAnnotationId(annot.id);
                              handleToolSelection(null);
                            }}
                            className="flex flex-1 items-center gap-2 text-left"
                          >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: annot.color }} />
                            <span className="capitalize">{annot.type}</span>
                            <span className="text-xs text-slate-400">#{index + 1}</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setAnnotations((prev) => prev.filter((a) => a.id !== annot.id));
                                markDirty();
                                if (selectedAnnotationId === annot.id) {
                                  setSelectedAnnotationId(null);
                                }
                              }}
                              className="rounded-full border border-white/10 bg-white/10 p-1 text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-500/20 hover:text-rose-100"
                              title="Remove annotation"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedAnnotation && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Inspector</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={duplicateSelected}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200 transition hover:border-sky-300/40 hover:bg-sky-500/20 hover:text-white"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16h8m-4-4h4m-8 0h2M6 20h12a2 2 0 002-2V8a2 2 0 00-2-2h-5l-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Duplicate
                    </button>
                    <button
                      onClick={deleteSelected}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-500/20 hover:text-rose-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>

                {selectedAnnotationMetrics && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200">
                    <h5 className="text-xs uppercase tracking-[0.25em] text-slate-400">Geometry</h5>
                    <div className="mt-2 space-y-2">
                      {selectedAnnotationMetrics.map((metric) => (
                        <div key={metric.label} className="flex items-center justify-between text-xs text-slate-300">
                          <span>{metric.label}</span>
                          <span className="font-mono text-sky-200">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3">
                  <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Color</label>
                  <input
                    type="color"
                    value={selectedAnnotation.color}
                    onChange={(e) => updateSelectedAnnotation({ color: e.target.value })}
                    className="h-10 w-full cursor-pointer rounded-2xl border border-white/10 bg-slate-900/40"
                  />

                  {(selectedAnnotation.type === 'rectangle' || selectedAnnotation.type === 'circle') && (
                    <>
                      <label className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">Opacity</label>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={selectedAnnotation.opacity ?? 0.35}
                        onChange={(e) => updateSelectedAnnotation({ opacity: Number(e.target.value) })}
                      />
                    </>
                  )}

                  {selectedAnnotation.type === 'text' && (
                    <>
                      <label className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">Text</label>
                      <textarea
                        value={selectedAnnotation.text || ''}
                        onChange={(e) => updateSelectedAnnotation({ text: e.target.value })}
                        className="min-h-[80px] rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                      />
                      <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Font size</label>
                      <input
                        type="number"
                        min={10}
                        max={96}
                        value={selectedAnnotation.fontSize ?? 18}
                        onChange={(e) => updateSelectedAnnotation({ fontSize: Number(e.target.value) })}
                        className="rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                      />
                    </>
                  )}

                  {selectedAnnotation.type === 'rectangle' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Width</label>
                        <input
                          type="number"
                          min={MIN_RECT_SIZE}
                          value={Math.round(selectedAnnotation.width ?? 0)}
                          onChange={(e) => updateSelectedAnnotation({ width: Number(e.target.value) })}
                          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Height</label>
                        <input
                          type="number"
                          min={MIN_RECT_SIZE}
                          value={Math.round(selectedAnnotation.height ?? 0)}
                          onChange={(e) => updateSelectedAnnotation({ height: Number(e.target.value) })}
                          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {selectedAnnotation.type === 'circle' && (
                    <div>
                      <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Radius</label>
                      <input
                        type="number"
                        min={MIN_RADIUS}
                        value={Math.round(selectedAnnotation.radius ?? 0)}
                        onChange={(e) => updateSelectedAnnotation({ radius: Number(e.target.value) })}
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                  )}

                  {(selectedAnnotation.type === 'arrow' || selectedAnnotation.type === 'line') && (
                    <div className="grid gap-3">
                      <div>
                        <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Stroke width</label>
                        <input
                          type="number"
                          min={1}
                          value={Math.round(selectedAnnotation.strokeWidth ?? 2)}
                          onChange={(e) => updateSelectedAnnotation({ strokeWidth: Number(e.target.value) })}
                          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                        />
                      </div>
                      {selectedAnnotation.type === 'arrow' && (
                        <>
                          <div>
                            <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Pointer length</label>
                            <input
                              type="number"
                              min={8}
                              value={Math.round(selectedAnnotation.pointerLength ?? 18)}
                              onChange={(e) => updateSelectedAnnotation({ pointerLength: Number(e.target.value) })}
                              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Pointer width</label>
                            <input
                              type="number"
                              min={6}
                              value={Math.round(selectedAnnotation.pointerWidth ?? 14)}
                              onChange={(e) => updateSelectedAnnotation({ pointerWidth: Number(e.target.value) })}
                              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={bringToFront}
                      className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/20 hover:text-white"
                    >
                      Bring front
                    </button>
                    <button
                      onClick={sendToBack}
                      className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/20 hover:text-white"
                    >
                      Send back
                    </button>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Rotation</label>
                    <input
                      type="number"
                      value={Math.round(selectedAnnotation.rotation ?? 0)}
                      onChange={(e) => updateSelectedAnnotation({ rotation: Number(e.target.value) })}
                      className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Canvas controls</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Width</label>
                  <input
                    type="number"
                    min={320}
                    value={Math.round(stageSize.width)}
                    onChange={(e) => {
                      setStageSize((prev) => ({ ...prev, width: Number(e.target.value) }));
                      markDirty();
                    }}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Height</label>
                  <input
                    type="number"
                    min={320}
                    value={Math.round(stageSize.height)}
                    onChange={(e) => {
                      setStageSize((prev) => ({ ...prev, height: Number(e.target.value) }));
                      markDirty();
                    }}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Background color</label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    markDirty();
                  }}
                  className="mt-1 h-10 w-full cursor-pointer rounded-2xl border border-white/10 bg-slate-900/40"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Zoom</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min={ZOOM_MIN}
                    max={ZOOM_MAX}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200">{(zoom * 100).toFixed(0)}%</span>
                  <button
                    onClick={resetView}
                    className="rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-slate-200 transition hover:border-sky-300/40 hover:bg-sky-500/20 hover:text-white"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setGridEnabled((prev) => !prev)}
                  className={`rounded-2xl border px-3 py-2 text-xs font-medium transition ${
                    gridEnabled
                      ? 'border-sky-400/60 bg-sky-500/20 text-white'
                      : 'border-white/10 bg-white/10 text-slate-200 hover:border-sky-300/40 hover:bg-sky-500/15 hover:text-white'
                  }`}
                >
                  {gridEnabled ? 'Hide grid' : 'Show grid'}
                </button>
                <button
                  onClick={() => setSnapToGrid((prev) => !prev)}
                  className={`rounded-2xl border px-3 py-2 text-xs font-medium transition ${
                    snapToGrid
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-white'
                      : 'border-white/10 bg-white/10 text-slate-200 hover:border-emerald-300/40 hover:bg-emerald-500/15 hover:text-white'
                  }`}
                >
                  {snapToGrid ? 'Disable snap' : 'Enable snap to grid'}
                </button>
              </div>
            </div>
          </aside>

          <div className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-6">
            <div className="relative flex h-full min-h-[60vh] w-full items-center justify-center overflow-auto rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-[0_30px_100px_rgba(15,23,42,0.55)]">
              <KonvaErrorBoundary>
                <Stage
                  ref={stageRef}
                  width={stageSize.width * zoom}
                  height={stageSize.height * zoom}
                  scaleX={zoom}
                  scaleY={zoom}
                  onClick={handleStageClick}
                  onTap={handleStageClick}
                  onWheel={handleWheel}
                >
                  <Layer listening={true}>
                    <Rect
                      x={0}
                      y={0}
                      width={stageSize.width}
                      height={stageSize.height}
                      fill={backgroundColor}
                      listening={false}
                    />
                    {gridLines}
                    {backgroundImage && (
                      <MapBackgroundImage src={backgroundImage} width={stageSize.width} height={stageSize.height} />
                    )}
                    {annotations.map((annot) => {
                      if (annot.type === 'marker') {
                        return (
                          <Group
                            key={annot.id}
                            name={annot.id}
                            x={annot.x}
                            y={annot.y}
                            draggable
                            onDragEnd={(event) => handleAnnotationDragEnd(annot, event)}
                            onClick={(event) => {
                              event.cancelBubble = true;
                              setSelectedAnnotationId(annot.id);
                              handleToolSelection(null);
                            }}
                            listening={true}
                          >
                            <Circle radius={12} fill={annot.color} stroke="white" strokeWidth={2} listening={true} />
                            <Circle radius={4} fill="white" listening={true} />
                          </Group>
                        );
                      }
                      if (annot.type === 'text') {
                        return (
                          <Text
                            key={annot.id}
                            name={annot.id}
                            x={annot.x}
                            y={annot.y}
                            text={annot.text || 'Text'}
                            fontSize={annot.fontSize ?? 18}
                            fill={annot.color}
                            padding={10}
                            align="center"
                            fontFamily="Arial"
                            fontStyle="bold"
                            draggable
                            rotation={annot.rotation ?? 0}
                            onDblClick={() => handleAnnotationDoubleClick(annot)}
                            onDragEnd={(event) => handleAnnotationDragEnd(annot, event)}
                            onTransformEnd={(event) => handleTextTransform(annot, event.target as Konva.Text)}
                            onClick={(event) => {
                              event.cancelBubble = true;
                              setSelectedAnnotationId(annot.id);
                              handleToolSelection(null);
                            }}
                            listening={true}
                          />
                        );
                      }
                      if (annot.type === 'rectangle') {
                        return (
                          <Rect
                            key={annot.id}
                            name={annot.id}
                            x={annot.x}
                            y={annot.y}
                            width={annot.width ?? 120}
                            height={annot.height ?? 80}
                            fill={annot.color}
                            opacity={annot.opacity ?? 0.35}
                            stroke={annot.color}
                            strokeWidth={2}
                            draggable
                            rotation={annot.rotation ?? 0}
                            onDragEnd={(event) => handleAnnotationDragEnd(annot, event)}
                            onTransformEnd={(event) => handleRectangleTransform(annot, event.target as Konva.Rect)}
                            onClick={(event) => {
                              event.cancelBubble = true;
                              setSelectedAnnotationId(annot.id);
                              handleToolSelection(null);
                            }}
                            listening={true}
                          />
                        );
                      }
                      if (annot.type === 'circle') {
                        return (
                          <Circle
                            key={annot.id}
                            name={annot.id}
                            x={annot.x}
                            y={annot.y}
                            radius={annot.radius ?? 60}
                            fill={annot.color}
                            opacity={annot.opacity ?? 0.35}
                            stroke={annot.color}
                            strokeWidth={2}
                            draggable
                            rotation={annot.rotation ?? 0}
                            onDragEnd={(event) => handleAnnotationDragEnd(annot, event)}
                            onTransformEnd={(event) => handleCircleTransform(annot, event.target as Konva.Circle)}
                            onClick={(event) => {
                              event.cancelBubble = true;
                              setSelectedAnnotationId(annot.id);
                              handleToolSelection(null);
                            }}
                            listening={true}
                          />
                        );
                      }
                      if (annot.type === 'arrow') {
                        return (
                          <Arrow
                            key={annot.id}
                            name={annot.id}
                            x={annot.x}
                            y={annot.y}
                            points={annot.points ?? [0, 0, 120, 0]}
                            stroke={annot.color}
                            fill={annot.color}
                            strokeWidth={annot.strokeWidth ?? 4}
                            pointerLength={annot.pointerLength ?? 18}
                            pointerWidth={annot.pointerWidth ?? 14}
                            draggable
                            rotation={annot.rotation ?? 0}
                            onDragEnd={(event) => handleAnnotationDragEnd(annot, event)}
                            onTransformEnd={(event) => handleConnectorTransform(annot, event.target as Konva.Arrow)}
                            onClick={(event) => {
                              event.cancelBubble = true;
                              setSelectedAnnotationId(annot.id);
                              handleToolSelection(null);
                            }}
                            listening={true}
                          />
                        );
                      }
                      if (annot.type === 'line') {
                        return (
                          <Line
                            key={annot.id}
                            name={annot.id}
                            x={annot.x}
                            y={annot.y}
                            points={annot.points ?? [0, 0, 160, 0]}
                            stroke={annot.color}
                            strokeWidth={annot.strokeWidth ?? 4}
                            draggable
                            rotation={annot.rotation ?? 0}
                            onDragEnd={(event) => handleAnnotationDragEnd(annot, event)}
                            onTransformEnd={(event) => handleConnectorTransform(annot, event.target as Konva.Line)}
                            onClick={(event) => {
                              event.cancelBubble = true;
                              setSelectedAnnotationId(annot.id);
                              handleToolSelection(null);
                            }}
                            listening={true}
                          />
                        );
                      }
                      return null;
                    })}
                    <Transformer
                      ref={transformerRef}
                      rotateEnabled
                      anchorFill="#38bdf8"
                      anchorStroke="#0ea5e9"
                      anchorSize={10}
                      borderStroke="#38bdf8"
                    />
                  </Layer>
                </Stage>
              </KonvaErrorBoundary>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { MapData, Annotation } from '@/types/map';
import { Stage, Layer, Rect, Circle, Text, Image as KonvaImage, Group } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import KonvaErrorBoundary from '@/components/KonvaErrorBoundary';

interface MapEditorProps {
  map: MapData;
  onSave: (map: MapData) => void;
  onBack: () => void;
}

function MapBackgroundImage({ src, width, height }: { src: string; width: number; height: number }) {
  const [image] = useImage(src, 'anonymous');
  return image ? <KonvaImage image={image} width={width} height={height} listening={false} /> : null;
}

export function MapEditor({ map, onSave, onBack }: MapEditorProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(map.annotations);
  const [activeTool, setActiveTool] = useState<'marker' | 'text' | 'rectangle' | 'circle' | null>(null);
  const [mapName, setMapName] = useState(map.name);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(map.imageData || null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isModified, setIsModified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const hasInitialized = useRef(false);

  // Initialize on mount only
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      if (map.imageData) {
        setBackgroundImage(map.imageData);
        
        // Load image dimensions
        const img = new window.Image();
        img.onload = () => {
          setStageSize({ width: img.width, height: img.height });
        };
        img.src = map.imageData;
      }
    }
  }, [map.imageData]);

  // Add keyboard shortcut for ESC
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTool(null);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSave = () => {
    const updatedMap: MapData = {
      ...map,
      name: mapName,
      annotations,
      imageData: backgroundImage || map.imageData,
      lastModified: Date.now(),
    };
    onSave(updatedMap);
    setIsModified(false);
  };

  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setBackgroundImage(dataUrl);
        setIsModified(true);
        
        // Load image to get dimensions
        const img = new window.Image();
        img.onload = () => {
          setStageSize({ width: img.width, height: img.height });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!activeTool) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Check if we clicked on an annotation (not the background)
    const clickedOnAnnotation = annotations.some(annot => {
      // Simple click detection based on annotation bounds
      const dist = Math.sqrt(Math.pow(pointerPos.x - annot.x, 2) + Math.pow(pointerPos.y - annot.y, 2));
      
      if (annot.type === 'marker') {
        return dist < 25; // 25px radius for markers
      } else if (annot.type === 'text') {
        // Text annotations take more space, check larger radius
        return dist < 60;
      } else if (annot.type === 'rectangle') {
        return pointerPos.x >= annot.x && pointerPos.x <= (annot.x + (annot.width || 100)) &&
               pointerPos.y >= annot.y && pointerPos.y <= (annot.y + (annot.height || 60));
      } else if (annot.type === 'circle') {
        const radius = annot.radius || 50;
        return dist <= radius;
      }
      return false;
    });

    if (clickedOnAnnotation) return;

    const newAnnotation: Annotation = {
      id: `annot_${Date.now()}`,
      type: activeTool,
      x: pointerPos.x,
      y: pointerPos.y,
      // Use black for text annotations by default, other tools keep the red marker color
      color: activeTool === 'text' ? '#000000' : '#FF0000',
    };

    if (activeTool === 'text') {
      const text = prompt('Enter text for annotation:', 'Text');
      if (text !== null && text.trim() !== '') {
        newAnnotation.text = text;
        setAnnotations([...annotations, newAnnotation]);
      }
    } else if (activeTool === 'rectangle') {
      setAnnotations([...annotations, { ...newAnnotation, width: 100, height: 60 }]);
    } else if (activeTool === 'circle') {
      setAnnotations([...annotations, { ...newAnnotation, radius: 50 }]);
    } else {
      setAnnotations([...annotations, newAnnotation]);
    }

    setIsModified(true);
  };

  const handleAnnotationDoubleClick = (annot: Annotation) => {
    if (annot.type === 'text') {
      const newText = prompt('Edit text:', annot.text || '');
      if (newText !== null) {
        setAnnotations(annotations.map(a => 
          a.id === annot.id ? { ...a, text: newText } : a
        ));
        setIsModified(true);
      }
    }
  };

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
                    setIsModified(true);
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageImport}
                className="hidden"
              />
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
          <aside className="w-full border-b border-white/10 bg-white/5 p-5 text-slate-200 sm:w-72 sm:border-b-0 sm:border-r">
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

            <div className="mt-6 space-y-2">
              {(['marker', 'text', 'rectangle', 'circle'] as Array<'marker' | 'text' | 'rectangle' | 'circle'>).map((tool) => (
                <button
                  key={tool}
                  onClick={() => setActiveTool(tool)}
                  className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    activeTool === tool
                      ? 'border-indigo-400/70 bg-indigo-500/25 text-white shadow-[0_15px_40px_rgba(79,70,229,0.4)]'
                      : 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-indigo-400/40 hover:bg-indigo-500/15 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sky-200">
                      {tool === 'marker' && (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {tool === 'text' && (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                      {tool === 'rectangle' && (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {tool === 'circle' && (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    <span className="capitalize">{tool}</span>
                  </span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}

              <button
                onClick={() => setActiveTool(null)}
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
                  {annotations.map((annot, index) => (
                    <div
                      key={annot.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-2 text-sm text-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-sky-300" />
                        {annot.type} #{index + 1}
                      </span>
                      <button
                        onClick={() => {
                          setAnnotations(annotations.filter(a => a.id !== annot.id));
                          setIsModified(true);
                        }}
                        className="rounded-full border border-white/10 bg-white/10 p-1 text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-500/20 hover:text-rose-100"
                        title="Remove annotation"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-6">
            <div className="relative flex h-full min-h-[60vh] w-full items-center justify-center overflow-auto rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-[0_30px_100px_rgba(15,23,42,0.55)]">
              <KonvaErrorBoundary>
                <Stage
                  ref={stageRef}
                  width={stageSize.width}
                  height={stageSize.height}
                  onClick={handleStageClick}
                  onTap={handleStageClick}
                >
                  <Layer listening={true}>
                    {backgroundImage && (
                      <MapBackgroundImage
                        src={backgroundImage}
                        width={stageSize.width}
                        height={stageSize.height}
                      />
                    )}
                    {annotations.map((annot) => {
                      if (annot.type === 'marker') {
                        return (
                          <Group
                            key={annot.id}
                            x={annot.x}
                            y={annot.y}
                            draggable
                            onDragEnd={(e) => {
                              setAnnotations(annotations.map(a =>
                                a.id === annot.id ? { ...a, x: e.target.x(), y: e.target.y() } : a
                              ));
                              setIsModified(true);
                            }}
                            onClick={(e) => {
                              e.cancelBubble = true;
                            }}
                            listening={true}
                          >
                            <Circle
                              radius={10}
                              fill={annot.color}
                              stroke="white"
                              strokeWidth={2}
                              listening={true}
                            />
                            <Circle
                              radius={3}
                              fill="white"
                              listening={true}
                            />
                          </Group>
                        );
                      }
                      if (annot.type === 'text') {
                        return (
                          <Group
                            key={annot.id}
                            x={annot.x}
                            y={annot.y}
                            draggable
                            onDragEnd={(e) => {
                              setAnnotations(annotations.map(a =>
                                a.id === annot.id ? { ...a, x: e.target.x(), y: e.target.y() } : a
                              ));
                              setIsModified(true);
                            }}
                            onDblClick={() => handleAnnotationDoubleClick(annot)}
                            onClick={(e) => {
                              e.cancelBubble = true;
                            }}
                            listening={true}
                          >
                            <Text
                              text={annot.text || 'Text'}
                              fontSize={18}
                              fill="#000000"
                              padding={10}
                              align="center"
                              fontFamily="Arial"
                              fontStyle="bold"
                              listening={true}
                            />
                          </Group>
                        );
                      }
                      if (annot.type === 'rectangle') {
                        const width = annot.width || 100;
                        const height = annot.height || 60;
                        return (
                          <Rect
                            key={annot.id}
                            x={annot.x}
                            y={annot.y}
                            width={width}
                            height={height}
                            fill={annot.color}
                            opacity={0.3}
                            stroke={annot.color}
                            strokeWidth={2}
                            draggable
                            onDragEnd={(e) => {
                              setAnnotations(annotations.map(a =>
                                a.id === annot.id ? { ...a, x: e.target.x(), y: e.target.y() } : a
                              ));
                              setIsModified(true);
                            }}
                            onClick={(e) => {
                              e.cancelBubble = true;
                            }}
                            listening={true}
                          />
                        );
                      }
                      if (annot.type === 'circle') {
                        const radius = annot.radius || 50;
                        return (
                          <Circle
                            key={annot.id}
                            x={annot.x}
                            y={annot.y}
                            radius={radius}
                            fill={annot.color}
                            opacity={0.3}
                            stroke={annot.color}
                            strokeWidth={2}
                            draggable
                            onDragEnd={(e) => {
                              setAnnotations(annotations.map(a =>
                                a.id === annot.id ? { ...a, x: e.target.x(), y: e.target.y() } : a
                              ));
                              setIsModified(true);
                            }}
                            onClick={(e) => {
                              e.cancelBubble = true;
                            }}
                            listening={true}
                          />
                        );
                      }
                      return null;
                    })}
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



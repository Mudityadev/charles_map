'use client';

import { useState, useRef, useEffect } from 'react';
import { MapData, Annotation } from '@/types/map';
import { Stage, Layer, Rect, Circle, Text, Image as KonvaImage, Group } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';

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
    console.log('Stage clicked, active tool:', activeTool);
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
      color: '#FF0000',
    };

    if (activeTool === 'text') {
      console.log('Text tool active, showing prompt');
      const text = prompt('Enter text for annotation:', 'Text');
      console.log('User entered text:', text);
      if (text !== null && text.trim() !== '') {
        newAnnotation.text = text;
        console.log('Adding text annotation:', newAnnotation);
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
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <input
            type="text"
            value={mapName}
            onChange={(e) => {
              setMapName(e.target.value);
              setIsModified(true);
            }}
            className="text-lg font-semibold bg-transparent border-none outline-none focus:outline-none px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          />
          {isModified && (
            <span className="text-sm text-gray-500 dark:text-gray-400">Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Import Image
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleExportJPG}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Export JPG
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Toolbar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-md p-4 overflow-y-auto">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Tools</h3>
          {activeTool && (
            <div className="mb-4 p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-sm text-indigo-900 dark:text-indigo-100">
              Active: {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
            </div>
          )}
          {!activeTool && (
            <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              No tool selected - click a tool to start
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => setActiveTool('marker')}
              className={`w-full p-3 rounded-lg transition-all ${
                activeTool === 'marker'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Marker
              </div>
            </button>

            <button
              onClick={() => setActiveTool('text')}
              className={`w-full p-3 rounded-lg transition-all ${
                activeTool === 'text'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Text
              </div>
            </button>

            <button
              onClick={() => setActiveTool('rectangle')}
              className={`w-full p-3 rounded-lg transition-all ${
                activeTool === 'rectangle'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Rectangle
              </div>
            </button>

            <button
              onClick={() => setActiveTool('circle')}
              className={`w-full p-3 rounded-lg transition-all ${
                activeTool === 'circle'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Circle
              </div>
            </button>

            <button
              onClick={() => setActiveTool(null)}
              className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-all"
            >
              Select (ESC)
            </button>
          </div>

          {annotations.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Annotations ({annotations.length})</h4>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {annotations.map((annot, index) => (
                  <div
                    key={annot.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {annot.type} #{index + 1}
                    </span>
                    <button
                      onClick={() => {
                        setAnnotations(annotations.filter(a => a.id !== annot.id));
                        setIsModified(true);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-200 dark:bg-gray-900 p-4 overflow-auto flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 shadow-2xl">
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
                {console.log('Rendering annotations:', annotations)}
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
                  } else if (annot.type === 'text') {
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
                          fill={annot.color}
                          padding={10}
                          align="center"
                          fontFamily="Arial"
                          fontStyle="bold"
                          stroke="white"
                          strokeWidth={4}
                          listening={true}
                        />
                      </Group>
                    );
                  } else if (annot.type === 'rectangle') {
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
                  } else if (annot.type === 'circle') {
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
          </div>
        </div>
      </div>
    </div>
  );
}



export type AnnotationType = 'marker' | 'text' | 'rectangle' | 'circle' | 'arrow' | 'line';

export interface MapData {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
  imageData?: string; // Base64 image data
  annotations: Annotation[];
  width: number;
  height: number;
  backgroundColor?: string;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  x: number;
  y: number;
  text?: string;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  color: string;
  opacity?: number;
  strokeWidth?: number;
  rotation?: number;
  fontSize?: number;
  pointerLength?: number;
  pointerWidth?: number;
}


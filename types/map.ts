export interface MapData {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
  imageData?: string; // Base64 image data
  annotations: Annotation[];
  width: number;
  height: number;
}

export interface Annotation {
  id: string;
  type: 'marker' | 'text' | 'rectangle' | 'circle';
  x: number;
  y: number;
  text?: string;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
}


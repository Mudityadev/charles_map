# Charles Map - Mapping Platform

A modern mapping platform built with Next.js that allows users to create, edit, and export maps with annotations.

## Features

- **Dashboard**: View all your maps in a beautiful grid layout
- **Image Import**: Import images in any format as your map background
- **Annotations**: Add markers, text, rectangles, and circles to your maps
- **Interactive Editing**: Drag and drop annotations to reposition them
- **Export**: Export your maps as JPG files
- **Local Storage**: All maps are saved locally in your browser

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build

Build the production version:

```bash
npm run build
npm start
```

## Usage

1. **Create a Map**: Click "Create New Map" on the dashboard
2. **Import Background**: Click "Import Image" to upload an image as your map background
3. **Add Annotations**: Select a tool (Marker, Text, Rectangle, Circle) and click on the canvas to add annotations
4. **Edit Annotations**: Double-click text to edit, or drag annotations to reposition them
5. **Save**: Click "Save" to save your changes
6. **Export**: Click "Export JPG" to download your map as a JPG file

## Tech Stack

- **Next.js 16** - React framework
- **React Konva** - Canvas rendering
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Project Structure

```
charles_map/
├── app/
│   ├── dashboard/      # Dashboard page
│   ├── editor/[id]/    # Map editor page
│   └── layout.tsx      # Root layout
├── components/
│   └── MapEditor.tsx   # Main editor component
├── hooks/
│   └── useMaps.ts      # Maps state management
├── types/
│   └── map.ts          # Type definitions
```

## License

MIT

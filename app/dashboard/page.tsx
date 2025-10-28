'use client';

import { useMaps } from '@/hooks/useMaps';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Dashboard() {
  const { maps, isLoading, deleteMap } = useMaps();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateMap = () => {
    const newMapId = `map_${Date.now()}`;
    router.push(`/editor/${newMapId}`);
  };

  const handleDeleteMap = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this map?')) {
      deleteMap(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Mapping Platform
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create, edit, and export your maps
            </p>
          </div>
          <button
            onClick={handleCreateMap}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Map
          </button>
        </div>

        {maps.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No maps yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first map to get started
            </p>
            <button
              onClick={handleCreateMap}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Create Your First Map
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maps.map((map) => (
              <Link
                key={map.id}
                href={`/editor/${map.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden group"
              >
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {map.imageData ? (
                    <img
                      src={map.imageData}
                      alt={map.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteMap(e, map.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg"
                      title="Delete map"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {map.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(map.lastModified).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{map.annotations.length} annotations</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


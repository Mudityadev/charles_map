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
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-lg text-slate-200 shadow-2xl shadow-indigo-500/20 backdrop-blur">
          Loading your maps...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/80">
                Visionary Mapping
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                  Design the story of every location
                </h1>
                <p className="max-w-2xl text-base text-slate-300">
                  Build expressive map experiences with layered annotations, curated imagery, and effortless exports. Every project you create is saved instantly and ready for collaboration.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-slate-300 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Projects</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{maps.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-slate-300 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Canvas Quality</p>
                  <p className="mt-2 text-2xl font-semibold text-white">4K Ready</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-slate-300 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Exports</p>
                  <p className="mt-2 text-2xl font-semibold text-white">JPG Premium</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateMap}
              className="group relative inline-flex w-full max-w-xs items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-2xl shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur group-hover:bg-white/25">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </span>
              <span className="text-left">
                <span className="block text-xs uppercase tracking-[0.35em] text-white/70">New Project</span>
                <span className="block text-base font-semibold">Create premium map</span>
              </span>
            </button>
          </div>
        </section>

        {maps.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-3xl rounded-3xl border border-dashed border-white/20 bg-slate-900/40 p-16 text-center shadow-[0_20px_60px_rgba(59,130,246,0.25)] backdrop-blur">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-sky-200">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="mt-8 text-3xl font-semibold text-white">Craft your first signature map</h3>
              <p className="mt-4 text-base text-slate-300">
                Upload a custom backdrop or start annotating a fresh canvas to bring your spatial stories to life.
              </p>
              <button
                onClick={handleCreateMap}
                className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-300/70"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Begin a masterpiece
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {maps.map((map) => (
              <Link
                key={map.id}
                href={`/editor/${map.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-[0_25px_80px_rgba(15,23,42,0.45)] backdrop-blur transition-all duration-300 hover:border-indigo-400/70 hover:shadow-[0_28px_90px_rgba(79,70,229,0.45)]"
              >
                <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60">
                  {map.imageData ? (
                    <img
                      src={map.imageData}
                      alt={map.name}
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-slate-500">
                      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-white">{map.name}</h3>
                    <p className="text-sm text-slate-300">
                      Updated {new Date(map.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      <svg className="h-4 w-4 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-.9-1.2-2.2-2-3.7-2-2.5 0-4.5 2-4.5 4.5 0 4.5 8.2 9.5 8.2 9.5s8.3-5 8.3-9.5c0-2.5-2-4.5-4.5-4.5-1.5 0-2.8.8-3.8 2z" />
                      </svg>
                      {map.annotations.length} annotations
                    </span>
                    <button
                      onClick={(e) => handleDeleteMap(e, map.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-rose-200/80 transition hover:bg-rose-500/20 hover:text-rose-100"
                      title="Delete map"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove
                    </button>
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


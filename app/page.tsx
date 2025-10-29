'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  /**
   * Immediately reroutes visitors to the dashboard, mirroring a production
   * landing experience that funnels users into the project hub.
   */
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</div>
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/dashboard/live-map'), { ssr: false });

export default function HomePage() {
  return (
    <main>
      <h1 className="text-xl font-bold p-4">🚛 Real-time Vehicle Tracking (OpenLayers + Socket)</h1>
      <div className="w-full h-[calc(100vh-60px)]">
        <LiveMap />
      </div>
    </main>
  );
}

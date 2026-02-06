'use client';

import dynamic from 'next/dynamic';

const DashboardLayout = dynamic(
  () => import('@/components/DashboardLayout'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-[#1e3a5f]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    ),
  }
);

export default function Home() {
  return <DashboardLayout />;
}

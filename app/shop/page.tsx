'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ShopRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?view=shop');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wide text-gray-500">Loading footwear catalog...</p>
      </div>
    </div>
  );
}

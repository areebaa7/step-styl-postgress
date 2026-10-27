'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function KidsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to kids collection view
    router.replace('/?view=kids');
  }, [router]);

  return null;
}

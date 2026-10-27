'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MenPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?view=men');
  }, [router]);

  return null;
}

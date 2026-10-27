'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WomenPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?view=women');
  }, [router]);

  return null;
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MenPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/products?gender=MEN');
  }, [router]);

  return null;
}

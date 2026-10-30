'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function KidsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/products?gender=KIDS');
  }, [router]);

  return null;
}

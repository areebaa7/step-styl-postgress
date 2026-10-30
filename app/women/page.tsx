'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WomenPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/products?gender=WOMEN');
  }, [router]);

  return null;
}

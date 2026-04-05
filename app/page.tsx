'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getIdentity } from '@/lib/identity';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const identity = getIdentity();
    if (identity) {
      router.replace('/lobby');
    } else {
      router.replace('/identify');
    }
  }, [router]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center -mt-14">
      <div className="text-slate-400 text-lg">Loading...</div>
    </div>
  );
}

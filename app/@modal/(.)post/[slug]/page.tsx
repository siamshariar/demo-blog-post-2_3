'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PostModal from '@/app/components/PostModal';

export default function InterceptingPostModal({ params }: { params: Promise<{ slug: string }> | { slug?: string } }) {
  const router = useRouter();

  // `params` may be a Promise in client components — use React.use to unwrap when available
  const resolvedParams: { slug?: string } = (React as any).use
    ? (React as any).use(params)
    : (params as any);

  const slug = resolvedParams?.slug ?? (typeof window !== 'undefined' ? window.location.pathname.replace('/post/', '') : undefined);

  // ESC to close when modal is mounted via parallel route
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  const handleClose = () => router.back();
  const handleNavigate = (s: string) => router.push(`/post/${s}`);

  return <PostModal slug={String(slug)} onClose={handleClose} onNavigate={handleNavigate} />;
}

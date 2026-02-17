'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PostModal from '@/app/components/PostModal';

export default function InterceptingPostModal({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { slug } = params;

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

  return <PostModal slug={slug} onClose={handleClose} onNavigate={handleNavigate} />;
}

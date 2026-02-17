// app/@modal/(.)post/[slug]/page.tsx
'use client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import PostModal from '@/app/components/PostModal';

export default function InterceptedPostModal() {
  const router = useRouter();
  const { slug } = useParams() as { slug?: string };


  // Close on Escape to match PostModal UX
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  if (!slug) return null;

  // Reuse PostModal (implements: instant-from-cache + deferred background fetch)
  return (
    <PostModal
      slug={slug}
      onClose={() => router.back()}
      onNavigate={(s: string) => router.push(`/post/${s}`)}
    />
  );
}
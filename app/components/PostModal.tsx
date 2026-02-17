'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Post, PostsPage } from '@/lib/types';
import { useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import PostContainer from '@/app/components/PostContainer';

interface PostModalProps {
  slug: string;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}

// Client-side mock data generator - same as server
const generateMockPost = (id: number): Post => {
  return {
    id,
    slug: `post-${id}`,
    title: `Amazing Post #${id}: Exploring Modern Web Development`,
    shortDesc: `Discover the incredible insights about web development, performance optimization, and user experience in this comprehensive article. Learn how to build better applications.`,
    thumbnail: `https://picsum.photos/seed/${id}/800/600`,
    content: `
      <h2>Introduction</h2>
      <p>This is the full content of post #${id}. In a real application, this would contain rich HTML content with images, videos, and more.</p>
      
      <h3>Key Points</h3>
      <ul>
        <li>Performance optimization strategies</li>
        <li>Modern React patterns and best practices</li>
        <li>SEO-friendly architecture</li>
        <li>User experience improvements</li>
      </ul>
      
      <h3>Deep Dive</h3>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
      
      <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      
      <h3>Advanced Concepts</h3>
      <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
      
      <blockquote>
        "The best way to predict the future is to invent it." - Alan Kay
      </blockquote>
      
      <h3>Conclusion</h3>
      <p>By implementing these patterns, you can create incredibly fast and user-friendly applications that scale to millions of pages while maintaining excellent performance.</p>
    `,
    author: `Author ${id % 10}`,
    publishedAt: new Date(Date.now() - id * 3600000).toISOString(),
  };
};

// Helper: generate related post previews (used for instant fallback)
const generateRelatedMocks = (id: number, limit = 3): Post[] => {
  const relatedIds = [...new Set([
    Math.max(1, id - 2),
    Math.max(1, id - 1),
    Math.min(100000, id + 1),
    Math.min(100000, id + 2),
  ])]
    .filter((rid) => rid !== id)
    .slice(0, limit);

  return relatedIds.map((rid) => generateMockPost(rid));
};

export default function PostModal({ slug, onClose, onNavigate }: PostModalProps) {
  const queryClient = useQueryClient();
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const originalMetadataRef = useRef<{
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  } | null>(null);

  // If `slug` prop is missing for any reason, derive it from the pathname so
  // the modal can still render instantly (prevents `undefined` fetches).
  const effectiveSlug = typeof slug === 'string' && slug ? slug :
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/post/')
      ? window.location.pathname.replace('/post/', '')
      : undefined);

  if (!effectiveSlug) {
    // Defensive: render a fallback UI instead of attempting network calls
    // (this keeps the modal fast and avoids /api/post/undefined requests).
  }


  // Lock body scroll when modal is open - preserve scroll position
  useEffect(() => {
    // Add class for instant scroll
    document.documentElement.classList.add('modal-opening');
    
    // Save original metadata
    originalMetadataRef.current = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
    };
    
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Prevent layout shift by compensating for scrollbar
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.documentElement.classList.remove('modal-opening');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
      
      // Restore scroll position immediately
      window.scrollTo({ top: scrollY, behavior: 'instant' });
      
      // Restore original metadata
      if (originalMetadataRef.current) {
        document.title = originalMetadataRef.current!.title;
        updateMetaTag('name', 'description', originalMetadataRef.current!.description);
        updateMetaTag('property', 'og:title', originalMetadataRef.current!.ogTitle);
        updateMetaTag('property', 'og:description', originalMetadataRef.current!.ogDescription);
        updateMetaTag('property', 'og:image', originalMetadataRef.current!.ogImage);
      }
    };
  }, []);

  // Scroll modal to top when slug changes (related post clicked)
  useEffect(() => {
    if (modalContainerRef.current) {
      // use 'auto' for an immediate jump; fallback to setting scrollTop for older browsers
      try {
        modalContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
      } catch (err) {
        modalContainerRef.current.scrollTop = 0;
      }
    }
  }, [slug]);

  // Helper function to update meta tags
  const updateMetaTag = (attr: string, key: string, content: string) => {
    let element = document.querySelector(`meta[${attr}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 1. GET DATA FROM CACHE (Instant) - with generated content
  const cachedData = useMemo(() => {
    const s = effectiveSlug as string | undefined;
    if (!s) return undefined;

    const postsData = queryClient.getQueryData(['posts']) as { pages: PostsPage[] } | undefined;

    // 1) Try list cache
    const cachedPost = postsData?.pages?.flatMap((p) => p.items)?.find((item) => item.slug === s);
    if (cachedPost) {
      const id = parseInt(cachedPost.slug.replace('post-', ''));
      return {
        ...cachedPost,
        content: cachedPost.content || generateMockPost(id).content,
        relatedPosts: cachedPost.relatedPosts || generateRelatedMocks(id),
      } as Post;
    }

    // 2) Try single-post cache
    const singleCached = queryClient.getQueryData(['post', s]) as Post | undefined;
    if (singleCached) return singleCached;

    // 3) Fallback: synthesize a preview from the slug so the modal shows instantly
    const id = parseInt(String(s).replace('post-', ''));
    if (!Number.isNaN(id) && id > 0) {
      return {
        ...generateMockPost(id),
        relatedPosts: generateRelatedMocks(id),
      } as Post;
    }

    return undefined;
  }, [queryClient, effectiveSlug]);

  // 2. FETCH FULL DETAILS (Background) — use cached list item as `initialData` so the modal shows instantly
  const { data: fullPost, isFetching } = useQuery<Post>({
    queryKey: ['post', effectiveSlug],
    // Avoid running the query when slug is missing (prevents /api/post/undefined)
    enabled: Boolean(effectiveSlug),
    // Use the cached preview (if present) as initialData so UI is instant and avoids a loading state
    initialData: cachedData || undefined,
    initialDataUpdatedAt: cachedData ? Date.now() : undefined,
    queryFn: async () => {
      const s = effectiveSlug as string;
      console.log('🔄 Fetching post:', s);
      const res = await fetch(`/api/post/${s}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      const data = await res.json();
      console.log('✅ Post fetched:', data.slug, 'Related:', data.relatedPosts?.length);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Update metadata when post data loads
  useEffect(() => {
    if (fullPost) {
      // Update document title
      document.title = `${fullPost.title} | Blog`;
      
      // Update meta description
      updateMetaTag('name', 'description', fullPost.shortDesc || '');
      
      // Update Open Graph tags for social sharing
      updateMetaTag('property', 'og:title', fullPost.title);
      updateMetaTag('property', 'og:description', fullPost.shortDesc || '');
      updateMetaTag('property', 'og:image', fullPost.thumbnail);
      updateMetaTag('property', 'og:url', `${window.location.origin}/post/${fullPost.slug}`);
      updateMetaTag('property', 'og:type', 'article');
      
      // Update Twitter Card tags
      updateMetaTag('name', 'twitter:card', 'summary_large_image');
      updateMetaTag('name', 'twitter:title', fullPost.title);
      updateMetaTag('name', 'twitter:description', fullPost.shortDesc || '');
      updateMetaTag('name', 'twitter:image', fullPost.thumbnail);
    }
  }, [fullPost]);

  const postData = fullPost || cachedData;

  return (
    <div 
      ref={modalContainerRef}
      data-modal-open="true"
      className="modal-container fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-50 overflow-y-auto"
    >
      <PostContainer header={
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-black hover:text-black mb-6 group cursor-pointer"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      }>
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  🎭 Modal View
                </span>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  ⚡ Instant Cache
                </span>
                {/* Show background-loading badge only when we don't have a cached preview */}
                {!cachedData && isFetching && (
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-pulse">
                    🔄 Loading Details...
                  </span>
                )}
              </div>
              <h1 className="text-5xl font-bold mb-4 text-black leading-tight">
                {postData?.title || 'Loading...'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-black">
                {postData?.author && <span className="font-medium">By {postData.author}</span>}
                {postData?.publishedAt && (
                  <span>
                    {new Date(postData.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>

            <img 
              src={postData?.thumbnail} 
              alt={postData?.title}
              className="w-full h-96 object-cover rounded-lg mb-8 shadow-md" 
            />

            <div className="text-black text-xl leading-relaxed mb-8">
              {postData?.shortDesc}
            </div>

            {(postData?.content || fullPost?.content) && (
              <div 
                className="prose prose-lg max-w-none prose-headings:text-black prose-p:text-black prose-li:text-black"
                dangerouslySetInnerHTML={{ __html: postData?.content || fullPost?.content || '' }}
              />
            )}

      <div className="mt-12 border-t pt-8">
        <h3 className="font-bold text-2xl mb-6 text-black">Related Posts</h3>
        {postData?.relatedPosts && postData.relatedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {postData.relatedPosts
              .filter(related => related.slug !== postData.slug)
              .map((related) => (
              <button
                key={related.id}
                onClick={() => onNavigate(related.slug)}
                className="group text-left w-full cursor-pointer"
              >
                <article className="border rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden transform group-hover:-translate-y-1 mb-6">
                  <div className="relative h-32 overflow-hidden">
                    <img 
                      src={related.thumbnail} 
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-700 transition-colors">
                      {related.title}
                    </h4>
                  </div>
                </article>
              </button>
            ))}
          </div>
        ) : (!postData?.relatedPosts && isFetching) ? (
          <p className="text-gray-500">Loading related posts...</p>
        ) : (
          <p className="text-gray-500">No related posts available.</p>
        )}
      </div>
      </PostContainer>
    </div>
  );
}
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import type { PostsPage } from '@/lib/types';

export default function Providers({ children, initialPosts }: { children: ReactNode; initialPosts?: PostsPage }) {
  // Create a client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Critical: This keeps data in cache so modal can access it instantly
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
          },
        },
      })
  );

  // Seed the posts infinite-query cache when server provided `initialPosts`.
  useEffect(() => {
    if (initialPosts) {
      queryClient.setQueryData(['posts'], { pages: [initialPosts], pageParams: [1] });
    }
  }, [initialPosts, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

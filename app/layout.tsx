import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getTrendingPosts } from '@/lib/api';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next.js Blog Demo - Server-Side Rendering",
  description: "Fast blog with Next.js server-side rendering and page navigation",
  openGraph: {
    title: "Next.js Blog Demo - Server-Side Rendering",
    description: "Fast blog with Next.js server-side rendering and page navigation",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next.js Blog Demo - Server-Side Rendering",
    description: "Fast blog with Next.js server-side rendering and page navigation",
  },
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  // Prefetch first page of posts on the server so the Query cache is available
  // globally (this ensures intercepting modals can read the same cache).
  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['posts'],
    queryFn: () => getTrendingPosts({ pageParam: 1 }),
    initialPageParam: 1,
  });
  const dehydratedState = dehydrate(queryClient);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <HydrationBoundary state={dehydratedState}>
            {children}
            {modal}
          </HydrationBoundary>
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import OptimisticModal from '@/app/components/OptimisticModal';

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

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          {/* Optimistic overlay (shows instantly on click while intercepting modal mounts) */}
          {/* NOTE: loaded as a client component to run listeners and read cache.
              Keeps z-index lower than the real `PostModal` (z-50) so the real
              modal replaces the optimistic overlay when ready. */}
          <OptimisticModal />
          {modal}
        </Providers>
      </body>
    </html>
  );
}

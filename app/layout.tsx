import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navigation from "@/components/Navigation";

function NavigationFallback() {
  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 min-h-[44px] items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <Link
              href="/"
              className="cursor-pointer text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              BAV Abfuhrkalender
            </Link>
            <div className="hidden gap-1 md:flex">
              <Link
                href="/"
                className="flex min-h-[44px] cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"
              >
                Kalender
              </Link>
              <Link
                href="/playground"
                className="flex min-h-[44px] cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"
              >
                API Playground
              </Link>
            </div>
          </div>
          <div
            className="flex min-h-[44px] min-w-[44px] items-center justify-center md:hidden"
            aria-hidden
          >
            <svg className="h-6 w-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BAV Abfuhrkalender",
  description:
    "Abfuhrkalender für BAV-Gebiet – Ort und Straße eingeben.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={<NavigationFallback />}>
          <Navigation />
        </Suspense>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

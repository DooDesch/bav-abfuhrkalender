import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

function NavigationFallback() {
  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="cursor-pointer text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              BAV Abfuhrkalender
            </Link>
            <div className="flex gap-1">
              <Link
                href="/"
                className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"
              >
                Kalender
              </Link>
              <Link
                href="/playground"
                className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"
              >
                API Playground
              </Link>
            </div>
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
      </body>
    </html>
  );
}

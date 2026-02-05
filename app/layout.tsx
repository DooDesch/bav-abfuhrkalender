import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { getBaseUrl, getSeoKeywords, getCurrentYear, getProviderFullNames } from "@/lib/utils/seo";
import JsonLd from "@/components/JsonLd";
import CookieBanner from "@/components/CookieBanner";
import ConsentSettings from "@/components/ConsentSettings";
import ConditionalAnalytics from "@/components/ConditionalAnalytics";

function NavigationFallback() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-5 w-32 rounded-lg" />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl md:hidden" />
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

const baseUrl = getBaseUrl();
const currentYear = getCurrentYear();
const providerNames = getProviderFullNames().join(', ');

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `Abfuhrkalender ${currentYear} - Müllabfuhr-Termine online`,
    template: `%s | Abfuhrkalender ${currentYear}`,
  },
  description:
    `Abfuhrkalender ${currentYear}: Finde alle Müllabfuhr-Termine für deine Adresse. ${providerNames} und mehr. Restmüll, Gelber Sack, Papier, Glas und Biomüll – kostenlos als ICS-Kalender exportieren.`,
  keywords: getSeoKeywords(),
  authors: [{ name: "DooDesch" }],
  creator: "DooDesch",
  publisher: "Dein Abfuhrkalender",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: baseUrl,
    siteName: "Dein Abfuhrkalender",
    title: `Abfuhrkalender ${currentYear} - Müllabfuhr-Termine online`,
    description:
      `Abfuhrkalender ${currentYear}: Alle Abfuhrtermine für deine Adresse. Restmüll, Gelber Sack, Papier, Glas und Biomüll auf einen Blick.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Abfuhrkalender ${currentYear} - Müllabfuhr-Termine`,
    description:
      `Abfuhrkalender ${currentYear}: Finde alle Müllabfuhr-Termine für deine Adresse.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  category: "utilities",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0fdf4" },
    { media: "(prefers-color-scheme: dark)", color: "#052e16" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider delayDuration={300}>
          <Suspense fallback={<NavigationFallback />}>
            <Navigation />
          </Suspense>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Footer />
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </TooltipProvider>
        {/* Cookie consent banner - shows until user makes a choice */}
        <CookieBanner />
        {/* Floating button to reopen cookie settings (only visible after consent) */}
        <ConsentSettings variant="floating" />
        {/* Analytics only load after user consents to statistics cookies */}
        <ConditionalAnalytics />
      </body>
    </html>
  );
}

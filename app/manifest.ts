import type { MetadataRoute } from 'next';

/**
 * Web App Manifest for PWA support
 * Enables "Add to Home Screen" functionality
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dein Abfuhrkalender',
    short_name: 'Abfuhrkalender',
    description:
      'Müllabfuhr-Termine für das Bergische Land. Finde alle Abfuhrtermine für deine Adresse.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f0fdf4',
    theme_color: '#16a34a',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'de',
    categories: ['utilities', 'lifestyle'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}

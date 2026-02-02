import { ImageResponse } from 'next/og';
import {
  RecycleIconSvg,
  LOGO_COLORS,
  getLogoBorderRadius,
  getIconSize,
} from '@/lib/icons/recycle-icon';

// OpenGraph image metadata (1200x630 is the recommended size)
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const alt = 'Dein Abfuhrkalender - Müllabfuhr-Termine im Bergischen Land';

/**
 * OpenGraph image generation for social media sharing
 * Creates a branded 1200x630 PNG with logo and app name
 */
export default function OpenGraphImage() {
  const logoSize = 120;
  const logoBorderRadius = getLogoBorderRadius(logoSize);
  const iconSize = getIconSize(logoSize);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // Light green background matching the app theme
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: logoSize,
            height: logoSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: logoBorderRadius,
            background: `linear-gradient(to bottom right, ${LOGO_COLORS.gradientFrom}, ${LOGO_COLORS.gradientTo})`,
            boxShadow: '0 25px 50px -12px rgba(34, 197, 94, 0.4)',
            marginBottom: 40,
          }}
        >
          <RecycleIconSvg size={iconSize} />
        </div>

        {/* App Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: '#18181b', // zinc-900
            }}
          >
            Dein
          </span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 400,
              color: '#71717a', // zinc-500
            }}
          >
            Abfuhrkalender
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 28,
            color: '#52525b', // zinc-600
            marginTop: 20,
          }}
        >
          Müllabfuhr-Termine im Bergischen Land
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}

/**
 * Centralized Recycle Icon definition
 * Used across favicon, apple-icon, opengraph-image, and PWA icon generation
 *
 * Source: Lucide Icons (https://lucide.dev/icons/recycle)
 */

/**
 * SVG path data for the Recycle icon
 * Can be used in scripts that generate static images
 */
export const RECYCLE_ICON_PATHS = `
  <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
  <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
  <path d="m14 16-3 3 3 3" />
  <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
  <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
  <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
`;

/**
 * Logo colors used across all icon variants
 */
export const LOGO_COLORS = {
  gradientFrom: '#22c55e', // green-500
  gradientTo: '#059669', // emerald-600
  iconColor: '#ffffff', // white
} as const;

/**
 * Recycle Icon component for use in ImageResponse (Next.js OG image generation)
 * This is a JSX component that renders the SVG inline
 */
export function RecycleIconSvg({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={LOGO_COLORS.iconColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
      <path d="m14 16-3 3 3 3" />
      <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
      <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
      <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
    </svg>
  );
}

/**
 * Calculate border radius based on size
 * Consistent ratio used across all icon variants
 */
export function getLogoBorderRadius(size: number, variant: 'default' | 'apple' | 'pwa' = 'default'): number {
  // Apple and PWA icons use smaller radius since OS applies its own rounding
  const ratio = variant === 'default' ? 0.33 : 0.22;
  return Math.round(size * ratio);
}

/**
 * Calculate icon size relative to container
 */
export function getIconSize(containerSize: number): number {
  return Math.round(containerSize * 0.55);
}

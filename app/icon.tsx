import { ImageResponse } from 'next/og';
import {
  RecycleIconSvg,
  LOGO_COLORS,
  getLogoBorderRadius,
  getIconSize,
} from '@/lib/icons/recycle-icon';

// Icon metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

/**
 * Dynamic favicon generation
 * Creates a 32x32 PNG with the app logo
 */
export default function Icon() {
  const borderRadius = getLogoBorderRadius(size.width);
  const iconSize = getIconSize(size.width);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius,
          background: `linear-gradient(to bottom right, ${LOGO_COLORS.gradientFrom}, ${LOGO_COLORS.gradientTo})`,
        }}
      >
        <RecycleIconSvg size={iconSize} />
      </div>
    ),
    {
      ...size,
    }
  );
}

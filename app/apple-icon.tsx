import { ImageResponse } from 'next/og';
import {
  RecycleIconSvg,
  LOGO_COLORS,
  getLogoBorderRadius,
  getIconSize,
} from '@/lib/icons/recycle-icon';

// Apple touch icon metadata (180x180 is the standard size)
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

/**
 * Apple touch icon generation
 * Creates a 180x180 PNG for iOS home screen
 */
export default function AppleIcon() {
  const borderRadius = getLogoBorderRadius(size.width, 'apple');
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

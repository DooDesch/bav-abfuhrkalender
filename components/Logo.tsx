'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { Recycle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getLogoBorderRadius,
  getIconSize,
} from '@/lib/icons/recycle-icon';

// Re-export for backward compatibility
export { LOGO_COLORS } from '@/lib/icons/recycle-icon';

interface LogoProps {
  /** Size in pixels (default: 36) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Enable hover rotation animation (default: false) */
  animate?: boolean;
  /** Show shadow effect (default: true) */
  withShadow?: boolean;
}

/**
 * Reusable Logo component - Green gradient rounded square with Recycle icon
 * Used in navigation, favicon, PWA icons, and OpenGraph images
 */
export function Logo({
  size = 36,
  className,
  animate = false,
  withShadow = true,
}: LogoProps) {
  const iconSize = getIconSize(size);
  const borderRadius = getLogoBorderRadius(size);

  const containerProps: HTMLMotionProps<'div'> = animate
    ? {
        whileHover: { rotate: 360 },
        transition: { duration: 0.6, ease: 'easeInOut' },
      }
    : {};

  return (
    <div
      className={cn(
        'relative',
        withShadow && 'shadow-lg shadow-green-500/25',
        className
      )}
      style={{
        width: size,
        height: size,
        borderRadius,
      }}
    >
      <motion.div
        {...containerProps}
        className="flex h-full w-full items-center justify-center bg-linear-to-br from-green-500 to-emerald-600"
        style={{ borderRadius }}
      >
        <Recycle
          className="text-white"
          style={{ width: iconSize, height: iconSize }}
        />
      </motion.div>
    </div>
  );
}

export default Logo;

'use client';

import type { Fraktion } from '@/lib/types/bav-api.types';

interface FractionBadgeProps {
  fraction: Fraktion;
  className?: string;
}

export default function FractionBadge({
  fraction,
  className = '',
}: FractionBadgeProps) {
  const defaultColor = '#666666';
  const color = fraction.color || defaultColor;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {fraction.name}
    </span>
  );
}

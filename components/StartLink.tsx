'use client';

import Link from 'next/link';
import { useAddressStore } from '@/lib/stores/address.store';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StartLinkProps {
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
  /** When true, renders without default styling (useful for wrapping buttons) */
  unstyled?: boolean;
}

/**
 * Client component for navigating to the home page.
 * Sets wantsNewAddress flag to prevent automatic redirect to last calendar.
 */
export default function StartLink({
  className,
  showIcon = true,
  children,
  unstyled = false,
}: StartLinkProps) {
  const setWantsNewAddress = useAddressStore((s) => s.setWantsNewAddress);

  // When unstyled, render just the link wrapper
  if (unstyled) {
    return (
      <Link href="/" onClick={() => setWantsNewAddress(true)} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Link
      href="/"
      onClick={() => setWantsNewAddress(true)}
      className={cn(
        'hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1',
        className
      )}
    >
      {showIcon && <Home className="h-4 w-4" />}
      {children ?? <span>Start</span>}
    </Link>
  );
}

'use client';

import type { Fraction } from '@/lib/types/bav-api.types';
import { Trash2, Newspaper, Package, Wine, Leaf, Recycle, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FractionBadgeProps {
  fraction: Fraction;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Map fraction names to icons
function getFractionIcon(name: string) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('rest') || lowerName.includes('schwarz')) {
    return Trash2;
  }
  if (lowerName.includes('papier') || lowerName.includes('blau')) {
    return Newspaper;
  }
  if (lowerName.includes('gelb') || lowerName.includes('verpackung') || lowerName.includes('leicht')) {
    return Package;
  }
  if (lowerName.includes('glas') || lowerName.includes('grün') || lowerName.includes('weiß')) {
    return Wine;
  }
  if (lowerName.includes('bio') || lowerName.includes('grün') || lowerName.includes('kompost')) {
    return Leaf;
  }
  if (lowerName.includes('wertstoff') || lowerName.includes('recycl')) {
    return Recycle;
  }
  
  return HelpCircle;
}

// Get description for fraction types
function getFractionDescription(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('rest')) {
    return 'Nicht recycelbare Abfälle wie Hygieneartikel, Windeln, Staubsaugerbeutel';
  }
  if (lowerName.includes('papier')) {
    return 'Zeitungen, Kartons, Pappe, Büropapier (keine beschichteten Papiere)';
  }
  if (lowerName.includes('gelb') || lowerName.includes('verpackung')) {
    return 'Verpackungen aus Kunststoff, Metall und Verbundstoffen';
  }
  if (lowerName.includes('glas')) {
    return 'Flaschen und Gläser nach Farben getrennt (ohne Deckel)';
  }
  if (lowerName.includes('bio')) {
    return 'Organische Abfälle wie Essensreste, Gartenabfälle, Kaffeesatz';
  }
  
  return 'Bitte beachten Sie die lokalen Entsorgungshinweise';
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export default function FractionBadge({
  fraction,
  className = '',
  showIcon = true,
  size = 'md',
}: FractionBadgeProps) {
  const defaultColor = '#71717a';
  const color = fraction.color || defaultColor;
  const Icon = getFractionIcon(fraction.name);
  const description = getFractionDescription(fraction.name);

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all duration-200 cursor-default',
        'hover:scale-105 hover:shadow-lg',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${color}0d`,
        color: color,
        border: `1px solid ${color}20`,
        boxShadow: `0 2px 8px ${color}10`,
      }}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      {fraction.name}
    </span>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium mb-1">{fraction.name}</p>
        <p className="text-xs opacity-80">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

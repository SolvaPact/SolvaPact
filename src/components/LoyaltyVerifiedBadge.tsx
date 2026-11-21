import React from 'react';
import { LoyaltyTier } from '../types';

interface LoyaltyVerifiedBadgeProps {
  tier?: LoyaltyTier | null;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const TIER_CONFIG: Record<
  Exclude<LoyaltyTier, 'none' | 'standard'>,
  { fill: string; ring: string; label: string }
> = {
  bronze: {
    fill: '#C27848',
    ring: '#9A5A32',
    label: 'Membre Vérifié · Palier Bronze',
  },
  silver: {
    fill: '#94A3B8',
    ring: '#64748B',
    label: 'Membre Fidèle · Palier Silver',
  },
  gold: {
    fill: '#EAB308',
    ring: '#CA8A04',
    label: 'Membre Précieux · Palier Gold',
  },
  diamond: {
    fill: '#1D9BF0',
    ring: '#0284C7',
    label: 'Membre Prestigieux Officiel · Palier Diamond',
  },
};

export const LoyaltyVerifiedBadge: React.FC<LoyaltyVerifiedBadgeProps> = ({
  tier,
  size = 'sm',
  className = '',
}) => {
  if (!tier || tier === 'none' || tier === 'standard') return null;
  const config = TIER_CONFIG[tier];
  if (!config) return null;

  const sizeClass =
    size === 'xs' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-[18px] h-[18px]' : 'w-4 h-4';

  return (
    <span
      title={config.label}
      aria-label={config.label}
      className={`inline-flex items-center justify-center shrink-0 align-middle ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={sizeClass}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L14.6 4.1L17.9 3.8L19.1 6.9L21.9 8.7L21.2 12L21.9 15.3L19.1 17.1L17.9 20.2L14.6 19.9L12 22L9.4 19.9L6.1 20.2L4.9 17.1L2.1 15.3L2.8 12L2.1 8.7L4.9 6.9L6.1 3.8L9.4 4.1L12 2Z"
          fill={config.fill}
          stroke={config.ring}
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        <path
          d="M8.6 12.2L10.9 14.5L15.6 9.6"
          stroke="#FFFFFF"
          strokeWidth="2.15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

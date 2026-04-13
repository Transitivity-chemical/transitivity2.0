'use client';

import { memo } from 'react';

import { cn } from '@/lib/utils';

interface TransitivityLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  color?: string;
}

const sizes = {
  sm: { icon: 24, fontSize: '0.9rem', supSize: '0.55rem', gap: 6 },
  md: { icon: 32, fontSize: '1.15rem', supSize: '0.65rem', gap: 8 },
  lg: { icon: 40, fontSize: '1.55rem', supSize: '0.8rem', gap: 10 },
  xl: { icon: 56, fontSize: '2.15rem', supSize: '1rem', gap: 12 },
  '2xl': { icon: 80, fontSize: '3.25rem', supSize: '1.3rem', gap: 16 },
} as const;

const WORDMARK_FONT = "'Spectral', 'Charter', 'Times New Roman', serif";
const DATA_FONT = "'SF Pro Text', 'Segoe UI', 'Helvetica Neue', sans-serif";
const LOGO_LABEL = 'Transitivity 2.0';

const GammaIconComponent = memo(function GammaIcon({
  size = 32,
  color = 'currentColor',
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* γ (lowercase gamma) — traced from lab sketches */}
      <path
        d="M0.0,14.5 C0.3,12.7 0.9,10.0 1.5,8.2 C1.9,7.0 2.4,6.3 2.9,5.5 C3.4,4.8 3.9,4.2 4.4,3.6 C4.9,3.1 5.4,2.7 5.9,2.3 C6.4,2.0 6.9,1.8 7.4,1.5 C7.9,1.3 8.3,1.0 8.8,0.8 C9.3,0.6 9.8,0.5 10.3,0.4 C10.8,0.3 11.3,0.1 11.8,0.0 C12.3,-0.1 12.8,0.0 13.3,0.0 C13.8,0.0 14.2,-0.0 14.7,0.0 C15.2,0.0 15.7,0.1 16.2,0.2 C16.7,0.3 17.2,0.5 17.7,0.6 C18.2,0.8 18.7,0.9 19.2,1.1 C19.7,1.3 20.1,1.6 20.6,1.9 C21.1,2.2 21.6,2.5 22.1,2.9 C22.6,3.3 23.1,3.9 23.6,4.4 C24.1,4.9 24.6,5.4 25.1,6.1 C25.6,6.8 26.0,7.7 26.5,8.6 C27.0,9.6 27.5,10.6 28.0,11.8 C28.5,13.2 29.1,14.7 29.5,16.4 C30.0,18.5 30.4,20.8 30.9,23.2 C31.4,25.9 31.9,28.7 32.4,31.6 C32.9,34.7 33.3,39.8 33.9,41.3 C34.3,42.1 35.0,39.7 35.4,38.7 C35.9,37.6 36.3,36.2 36.8,34.9 C37.3,33.7 37.8,32.4 38.3,31.2 C38.8,29.9 39.3,28.7 39.8,27.4 C40.3,26.1 40.8,24.7 41.3,23.4 C41.8,22.1 42.2,20.7 42.7,19.4 C43.2,18.0 43.7,16.6 44.2,15.2 C44.7,13.7 45.2,12.2 45.7,10.7 C46.2,9.2 46.7,7.8 47.2,6.3 C47.7,4.8 48.0,2.9 48.6,1.7 C49.0,0.9 49.6,0.6 50.1,0.4 C50.6,0.2 51.1,0.4 51.6,0.4 C52.1,0.4 52.6,0.4 53.1,0.4 C53.6,0.4 54.0,0.4 54.5,0.4 C55.0,0.4 55.5,0.4 56.0,0.4 C56.5,0.4 57.0,0.4 57.5,0.4 C58.0,0.4 58.4,0.4 58.9,0.4 C59.4,0.4 59.9,0.4 60.4,0.4 C60.9,0.4 61.4,0.4 61.9,0.4 C62.4,0.4 63.0,0.3 63.4,0.4 C63.6,0.5 63.7,0.7 63.8,0.8 C63.8,0.8 63.8,0.8 63.8,0.8 C63.7,1.1 63.6,1.3 63.4,1.7 C63.0,2.4 62.4,3.2 61.9,4.0 C61.4,4.8 60.9,5.7 60.4,6.5 C59.9,7.3 59.4,8.0 58.9,8.8 C58.4,9.6 58.0,10.5 57.5,11.4 C57.0,12.2 56.5,13.1 56.0,13.9 C55.5,14.7 55.0,15.4 54.5,16.2 C54.0,17.0 53.6,17.9 53.1,18.7 C52.6,19.6 52.1,20.5 51.6,21.3 C51.1,22.1 50.6,22.8 50.1,23.6 C49.6,24.4 49.1,25.3 48.6,26.1 C48.1,26.9 47.7,27.8 47.2,28.6 C46.7,29.4 46.2,30.1 45.7,30.9 C45.2,31.7 44.7,32.6 44.2,33.5 C43.7,34.3 43.2,35.2 42.7,36.0 C42.2,36.8 41.8,37.7 41.3,38.5 C40.8,39.4 40.3,40.2 39.8,41.1 C39.3,41.9 38.8,42.8 38.3,43.6 C37.8,44.4 37.0,43.8 36.8,46.1 C36.1,52.7 36.1,63.5 35.4,70.1 C35.1,73.3 34.5,73.9 33.9,75.4 C33.5,76.5 32.9,77.2 32.4,77.9 C31.9,78.5 31.4,79.0 30.9,79.4 C30.5,79.7 30.0,79.9 29.5,80.0 C29.0,80.1 28.5,80.2 28.0,80.2 C27.5,80.2 27.0,80.3 26.5,80.2 C26.0,80.1 25.5,79.9 25.1,79.6 C24.6,79.2 23.8,81.4 23.6,78.1 C22.8,60.0 22.9,33.3 22.1,15.4 C21.9,11.5 21.1,13.6 20.6,12.8 C20.2,12.2 19.7,11.7 19.2,11.2 C18.7,10.7 18.2,10.3 17.7,9.9 C17.2,9.5 16.7,9.1 16.2,8.8 C15.7,8.5 15.2,8.3 14.7,8.2 C14.2,8.1 13.8,8.1 13.3,8.0 C12.8,7.9 12.3,7.8 11.8,7.8 C11.3,7.8 10.8,7.9 10.3,8.0 C9.8,8.1 9.3,8.3 8.8,8.4 C8.3,8.5 7.9,8.6 7.4,8.8 C6.9,9.1 6.4,9.5 5.9,9.9 C5.4,10.3 4.9,10.8 4.4,11.4 C3.9,12.2 3.4,13.1 2.9,14.1 C2.4,15.2 2.1,17.0 1.5,17.7 C1.1,18.1 0.2,17.8 0.0,17.3 C-0.3,16.7 -0.2,15.7 0.0,14.5 Z"
        fill={color}
      />
    </svg>
  );
});

function getContainerRole(showText: boolean) {
  return showText ? undefined : 'img';
}

export const TransitivityLogo = memo(function TransitivityLogo({
  size = 'md',
  showText = true,
  className,
  color,
}: TransitivityLogoProps) {
  const s = sizes[size];
  const label = showText ? undefined : LOGO_LABEL;
  const tone = color || 'currentColor';

  return (
    <div
      className={cn(
        'flex select-none',
        showText ? 'items-end leading-tight' : 'items-center',
        className,
      )}
      style={{ gap: s.gap, color: tone }}
      role={getContainerRole(showText)}
      aria-label={label}
    >
      <GammaIcon size={s.icon} color={tone} />
      {showText && (
        <span
          className="text-current"
          style={{
            fontFamily: WORDMARK_FONT,
            fontSize: s.fontSize,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 0.9,
          }}
        >
          Transitivity{' '}
          <span
            aria-hidden="true"
            style={{
              fontFamily: DATA_FONT,
              fontSize: s.supSize,
              fontWeight: 500,
              marginLeft: '0.35em',
              padding: '0.1em 0.55em',
              borderRadius: '6px',
              border: '1px solid currentColor',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0',
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 1,
            }}
          >
            2.0
          </span>
        </span>
      )}
    </div>
  );
});

export const GammaIcon = GammaIconComponent;

export const GammaIconRound = memo(function GammaIconRound({
  size = 40,
  bgColor = '#1e3a5f',
  iconColor = '#ffffff',
  className,
}: {
  size?: number;
  bgColor?: string;
  iconColor?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-center justify-center rounded-lg', className)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.min(8, size / 4),
        backgroundColor: bgColor,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <GammaIcon size={size * 0.6} color={iconColor} />
    </div>
  );
});

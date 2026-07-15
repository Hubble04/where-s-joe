'use client';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'amber' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-racing-600 text-ivory hover:bg-racing-700 active:bg-racing-800',
  secondary: 'bg-parchment text-racing-700 hover:bg-ivory-300',
  outline: 'border border-racing-200 text-racing-700 hover:bg-racing-50',
  ghost: 'text-racing-700 hover:bg-racing-50',
  amber: 'bg-amber text-ivory hover:bg-amber-dark',
  danger: 'bg-red-700 text-ivory hover:bg-red-800',
};
const SIZES: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-pill',
  md: 'text-sm px-4 py-2.5 rounded-pill',
  lg: 'text-base px-6 py-3 rounded-pill',
};

export function Button({
  variant = 'primary', size = 'md', className, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-mono font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant], SIZES[size], className,
      )}
      {...props}
    />
  );
}

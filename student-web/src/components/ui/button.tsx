import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'solid' | 'ghost' | 'danger';
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  small?: boolean;
}

const styles: Record<Variant, string> = {
  primary: 'btn-fill border border-brass text-pearl',
  solid: 'btn-fill solid border border-brass',
  ghost: 'border border-line text-pearl hover:border-brass hover:text-brass',
  danger: 'border border-red-400/60 text-red-300 hover:bg-red-400/10',
};

export function Button({ variant = 'primary', loading, small, className, children, disabled, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn('inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50', small ? 'px-4 py-2 text-sm' : 'px-7 py-3', styles[variant], className)}
      {...rest}
    >
      {loading && <span className="spinner" aria-hidden />}
      {children}
    </button>
  );
}

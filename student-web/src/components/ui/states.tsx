import { AlertTriangle, Inbox } from 'lucide-react';
import { ApiError } from '@/lib/networking/api-error';
import { Button } from './button';

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
      <Inbox className="text-brass" />
      <p className="font-display text-3xl">{title}</p>
      {hint && <p className="max-w-md text-mute">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const forbidden = error instanceof ApiError && error.status === 403;
  const message = error instanceof ApiError ? error.message : 'Something went wrong.';
  return (
    <div role="alert" className="grid place-items-center gap-3 rounded-3xl border border-red-400/30 px-6 py-14 text-center">
      <AlertTriangle className="text-red-300" />
      <p className="font-display text-3xl">{forbidden ? 'Access denied' : 'We could not load this'}</p>
      <p className="max-w-md text-mute">{message}</p>
      {onRetry && !forbidden && <Button variant="ghost" small onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton h-14" />)}
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => <div key={i} className="skeleton aspect-[3/4]" />)}
    </div>
  );
}

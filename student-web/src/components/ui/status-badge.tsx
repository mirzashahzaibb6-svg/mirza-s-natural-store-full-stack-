import { label } from '@/lib/format';
import { cn } from '@/lib/utils';

const tone: Record<string, string> = {
  PENDING: 'border-amber-300/50 text-amber-200', UNPAID: 'border-amber-300/50 text-amber-200', LOW_STOCK: 'border-amber-300/50 text-amber-200',
  CONFIRMED: 'border-sky-300/50 text-sky-200', PROCESSING: 'border-sky-300/50 text-sky-200', PAID: 'border-emerald-300/50 text-emerald-200',
  READY_FOR_PICKUP: 'border-violet-300/50 text-violet-200', READY_FOR_DELIVERY: 'border-violet-300/50 text-violet-200',
  DELIVERED: 'border-emerald-300/50 text-emerald-200', IN_STOCK: 'border-emerald-300/50 text-emerald-200',
  CANCELLED: 'border-red-300/50 text-red-200', FAILED: 'border-red-300/50 text-red-200', OUT_OF_STOCK: 'border-red-300/50 text-red-200',
  REFUND_PENDING: 'border-orange-300/50 text-orange-200', REFUNDED: 'border-slate-300/50 text-slate-200',
  ACTIVE: 'border-emerald-300/50 text-emerald-200', INACTIVE: 'border-red-300/50 text-red-200',
};

export function StatusBadge({ value }: { value: string }) {
  return <span className={cn('inline-block rounded-full border px-3 py-0.5 text-xs font-semibold', tone[value] ?? 'border-line text-mute')}>{label(value)}</span>;
}

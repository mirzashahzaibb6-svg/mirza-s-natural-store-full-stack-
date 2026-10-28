'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/status-badge';
import { dateTime, label, money } from '@/lib/format';
import { useMyOrders } from '@/services/orders/hooks';
import type { OrderStatus } from '@/services/types';

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_PENDING'];

function OrdersList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const orders = useMyOrders({ page, limit: 10, status: status || undefined });

  return (
    <>
      <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value as OrderStatus | ''); setPage(1); }} className="mb-6 rounded-full border border-line bg-wine-900 px-4 py-2.5">
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
      </select>
      {orders.isPending ? <TableSkeleton /> : orders.isError ? <ErrorState error={orders.error} onRetry={() => orders.refetch()} /> : orders.data.data.length === 0 ? (
        <EmptyState title="No orders yet" hint="When you place an order it will show up here." action={<Link href="/shop" className="rounded-full border border-brass px-6 py-2.5 font-semibold">Start shopping</Link>} />
      ) : (
        <>
          <ul className="space-y-4">
            {orders.data.data.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line p-5 transition hover:border-brass">
                  <div><p className="font-display text-2xl">{o.orderNumber}</p><p className="text-sm text-mute">{dateTime(o.createdAt)} · {o.items.length} item(s)</p></div>
                  <div className="flex items-center gap-3"><StatusBadge value={o.status} /><StatusBadge value={o.paymentStatus} /><b>{money(o.total)}</b></div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination meta={orders.data.meta} onPage={setPage} />
        </>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <AuthGuard roles={['CUSTOMER']}>
      <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
        <h1 className="mb-8 text-[clamp(48px,7vw,96px)]">Your orders</h1>
        <OrdersList />
      </div>
    </AuthGuard>
  );
}

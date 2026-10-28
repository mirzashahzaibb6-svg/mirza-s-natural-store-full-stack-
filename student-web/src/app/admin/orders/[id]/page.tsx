'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { CancelDialog } from '@/components/features/cancel-dialog';
import { DeliveryInfo, OrderItemsTable, OrderTimeline } from '@/components/features/order-parts';
import { AdminShell } from '@/components/layout/admin-shell';
import { Button } from '@/components/ui/button';
import { ErrorState, TableSkeleton } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/status-badge';
import { label } from '@/lib/format';
import { ApiError } from '@/lib/networking/api-error';
import { useAdminCancelOrder, useAdminOrder, useSetOrderStatus } from '@/services/admin/hooks';
import { ADMIN_CANCEL_REASONS } from '@/services/admin/types';

const CANCELLABLE = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY'];

function Detail({ id }: { id: string }) {
  const order = useAdminOrder(id);
  const setStatus = useSetOrderStatus();
  const cancel = useAdminCancelOrder();
  const [open, setOpen] = useState(false);
  if (order.isPending) return <TableSkeleton />;
  if (order.isError) return <ErrorState error={order.error} onRetry={() => order.refetch()} />;
  const o = order.data;
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed');

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3"><b className="font-display text-3xl">{o.orderNumber}</b><StatusBadge value={o.status} /><StatusBadge value={o.paymentStatus} />
        <span className="text-sm text-mute">{o.customer?.name} · {o.customer?.email}</span></div>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6"><OrderItemsTable order={o} /><DeliveryInfo order={o} /></div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-line p-6"><OrderTimeline order={o} /></div>
          <div className="flex flex-wrap gap-3">
            {o.nextStatuses?.map((s) => (
              <Button key={s} variant="solid" loading={setStatus.isPending} onClick={() => setStatus.mutate({ id: o.id, status: s }, { onSuccess: () => toast.success(`Moved to ${label(s)}`), onError: fail })}>Mark {label(s)}</Button>
            ))}
            {CANCELLABLE.includes(o.status) && <Button variant="danger" onClick={() => setOpen(true)}>Cancel order</Button>}
            {o.status === 'PENDING' && <p className="w-full text-xs text-mute">Waiting for payment. It moves to Confirmed automatically once paid.</p>}
          </div>
        </div>
      </div>
      <CancelDialog open={open} reasons={ADMIN_CANCEL_REASONS} loading={cancel.isPending} onClose={() => setOpen(false)}
        onSubmit={(v) => cancel.mutate({ id: o.id, reason: v.reason, note: v.note || undefined }, { onSuccess: () => { toast.success('Order cancelled'); setOpen(false); }, onError: fail })} />
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminShell title="Order details" action={<Link href="/admin/orders" className="text-sm text-mute underline">← All orders</Link>}>
      <Detail id={id} />
    </AdminShell>
  );
}

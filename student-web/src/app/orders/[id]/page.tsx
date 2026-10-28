'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { CancelDialog } from '@/components/features/cancel-dialog';
import { DeliveryInfo, OrderItemsTable, OrderTimeline } from '@/components/features/order-parts';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Button } from '@/components/ui/button';
import { ErrorState, TableSkeleton } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiError } from '@/lib/networking/api-error';
import { useCancelMyOrder, useMyOrder } from '@/services/orders/hooks';
import { CUSTOMER_CANCELLABLE, CUSTOMER_CANCEL_REASONS } from '@/services/orders/types';

function OrderDetail({ id }: { id: string }) {
  const order = useMyOrder(id);
  const cancel = useCancelMyOrder();
  const [open, setOpen] = useState(false);

  if (order.isPending) return <TableSkeleton />;
  if (order.isError) return <ErrorState error={order.error} onRetry={() => order.refetch()} />;
  const o = order.data;
  const canPay = o.status === 'PENDING' && o.paymentStatus === 'UNPAID';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3"><StatusBadge value={o.status} /><StatusBadge value={o.paymentStatus} />
        {o.status === 'REFUND_PENDING' && <span className="text-sm text-orange-200">Your refund is being processed.</span>}</div>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6"><OrderItemsTable order={o} /><DeliveryInfo order={o} /></div>
        <div className="space-y-6"><div className="rounded-3xl border border-line p-6"><OrderTimeline order={o} /></div>
          <div className="flex flex-wrap gap-3">
            {canPay && <Link href={`/checkout/payment?orderId=${o.id}`} className="btn-fill solid rounded-full border border-brass px-6 py-3 font-semibold">Pay now</Link>}
            {CUSTOMER_CANCELLABLE.includes(o.status) && <Button variant="danger" onClick={() => setOpen(true)}>Cancel order</Button>}
          </div>
        </div>
      </div>
      <CancelDialog
        open={open} reasons={CUSTOMER_CANCEL_REASONS} loading={cancel.isPending} onClose={() => setOpen(false)}
        onSubmit={(v) => cancel.mutate({ id: o.id, reason: v.reason, note: v.note || undefined }, {
          onSuccess: () => { toast.success('Order cancelled'); setOpen(false); },
          onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not cancel the order'),
        })}
      />
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AuthGuard roles={['CUSTOMER']}>
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
        <Link href="/orders" className="text-sm text-mute underline">← All orders</Link>
        <h1 className="mb-8 mt-2 text-[clamp(44px,6vw,88px)]">Order details</h1>
        <OrderDetail id={id} />
      </div>
    </AuthGuard>
  );
}

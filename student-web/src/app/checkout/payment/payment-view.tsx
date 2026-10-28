'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Button } from '@/components/ui/button';
import { ErrorState, TableSkeleton } from '@/components/ui/states';
import { money } from '@/lib/format';
import { ApiError } from '@/lib/networking/api-error';
import { useInitiatePayment, useMockComplete } from '@/services/orders/hooks';

function useCountdown(expiresAt?: string): number {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}

function Payment() {
  const router = useRouter();
  const orderId = useSearchParams().get('orderId') ?? '';
  const initiate = useInitiatePayment();
  const complete = useMockComplete();
  const started = useRef(false);
  const left = useCountdown(initiate.data?.orderExpiresAt);

  useEffect(() => {
    if (orderId && !started.current) { started.current = true; initiate.mutate(orderId); }
  }, [orderId, initiate]);

  if (!orderId) return <ErrorState error={new ApiError(400, 'No order selected.')} />;
  if (initiate.isError) return (
    <div className="space-y-4"><ErrorState error={initiate.error} /><Link href="/orders" className="inline-block rounded-full border border-brass px-6 py-2.5">Go to my orders</Link></div>
  );
  if (!initiate.data) return <TableSkeleton rows={3} />;

  const payment = initiate.data;
  const expired = left <= 0;
  const pay = (outcome: 'SUCCESS' | 'FAILURE') =>
    complete.mutate({ paymentId: payment.id, outcome }, {
      onSuccess: (r) => {
        if (r.result === 'CONFIRMED') { toast.success('Payment received. Your order is confirmed.'); router.replace(`/orders/${orderId}`); }
        else if (r.result === 'LATE') { toast.error('The payment window had closed. The amount will be refunded.'); router.replace(`/orders/${orderId}`); }
        else if (outcome === 'FAILURE') toast.error('The payment failed. You can try again.');
      },
      onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Payment error'),
    });

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-line p-8 text-center">
      <p className="text-mute">Amount due</p>
      <p className="my-2 font-display text-6xl text-brass">{money(payment.amount)}</p>
      <p className={expired ? 'text-red-300' : 'text-mute'} role="timer">
        {expired ? 'The payment window has expired. The order will be cancelled automatically.' : `Complete payment within ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}
      </p>
      <p className="mt-6 rounded-2xl border border-dashed border-line p-3 text-xs text-mute">Demo payment gateway. No real money is charged.</p>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="solid" loading={complete.isPending} disabled={expired} onClick={() => pay('SUCCESS')}>Pay now (simulate success)</Button>
        <Button variant="ghost" disabled={expired || complete.isPending} onClick={() => pay('FAILURE')}>Simulate a failed payment</Button>
        <Link href={`/orders/${orderId}`} className="text-sm text-mute underline">View order without paying</Link>
      </div>
    </div>
  );
}

export function PaymentView() {
  return (
    <AuthGuard roles={['CUSTOMER']}>
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
        <h1 className="mb-8 text-center text-[clamp(44px,6vw,88px)]">Payment</h1>
        <Payment />
      </div>
    </AuthGuard>
  );
}

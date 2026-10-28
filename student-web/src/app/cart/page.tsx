'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/status-badge';
import { money } from '@/lib/format';
import { ApiError } from '@/lib/networking/api-error';
import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from '@/services/cart/hooks';

function CartView() {
  const cart = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const clear = useClearCart();
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Could not update the basket');

  if (cart.isPending) return <TableSkeleton />;
  if (cart.isError) return <ErrorState error={cart.error} onRetry={() => cart.refetch()} />;
  const { items } = cart.data;
  if (items.length === 0) {
    return <EmptyState title="Your basket is empty" hint="Add something from the shelf." action={<Link href="/shop" className="rounded-full border border-brass px-6 py-2.5 font-semibold">Browse the shop</Link>} />;
  }
  const blocked = items.some((i) => !i.isAvailable);

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-3xl border border-line p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl">{item.name}</p>
                <p className="text-sm text-mute">{money(item.unitPrice)} each</p>
                {!item.isAvailable && <p role="alert" className="mt-1 text-sm text-red-300">Not enough stock for this quantity. Reduce it or remove the item.</p>}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge value={item.stockStatus} />
                <div className="flex items-center gap-2" aria-label={`Quantity of ${item.name}`}>
                  <button aria-label="Decrease" className="rounded-full border border-line p-2 hover:border-brass" onClick={() => update.mutate({ id: item.id, quantity: item.quantity - 1 < item.minimumOrderQuantity ? 0 : item.quantity - 1 }, { onError: fail })}><Minus size={14} /></button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button aria-label="Increase" disabled={item.quantity >= item.maxAllowedQuantity} className="rounded-full border border-line p-2 hover:border-brass disabled:opacity-40" onClick={() => update.mutate({ id: item.id, quantity: item.quantity + 1 }, { onError: fail })}><Plus size={14} /></button>
                </div>
                <span className="w-28 text-right font-semibold">{money(item.lineTotal)}</span>
                <button aria-label={`Remove ${item.name}`} className="rounded-full border border-line p-2 text-red-300 hover:border-red-300" onClick={() => remove.mutate(item.id, { onError: fail })}><Trash2 size={14} /></button>
              </div>
            </div>
          </li>
        ))}
        <Button variant="ghost" small loading={clear.isPending} onClick={() => clear.mutate(undefined, { onError: fail })}>Empty basket</Button>
      </ul>
      <aside className="h-fit rounded-3xl border border-line p-6">
        <h2 className="mb-4 text-3xl">Summary</h2>
        <dl className="space-y-2 text-mute">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(cart.data.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{money(cart.data.shippingCost)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-xl text-pearl"><dt>Total</dt><dd className="font-semibold">{money(cart.data.grandTotal)}</dd></div>
        </dl>
        <Link href={blocked ? '#' : '/checkout'} aria-disabled={blocked} className={`btn-fill solid mt-6 block rounded-full border border-brass py-3 text-center font-semibold ${blocked ? 'pointer-events-none opacity-50' : ''}`}>Checkout</Link>
      </aside>
    </div>
  );
}

export default function CartPage() {
  return (
    <AuthGuard roles={['CUSTOMER']}>
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
        <h1 className="mb-8 text-[clamp(48px,7vw,96px)]">Your basket</h1>
        <CartView />
      </div>
    </AuthGuard>
  );
}

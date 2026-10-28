'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Button } from '@/components/ui/button';
import { InputField, SelectField, TextAreaField } from '@/components/ui/input-field';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import { money } from '@/lib/format';
import { ApiError } from '@/lib/networking/api-error';
import { checkoutSchema, toOrderInput, type CheckoutValues } from '@/modules/zod/checkout';
import { useAddresses } from '@/services/addresses/hooks';
import { useCart } from '@/services/cart/hooks';
import { usePlaceOrder } from '@/services/orders/hooks';

function CheckoutForm() {
  const router = useRouter();
  const cart = useCart();
  const addresses = useAddresses();
  const place = usePlaceOrder();
  // One Idempotency-Key per distinct payload: a retry of the SAME request can never create a second order.
  const keyRef = useRef<{ payload: string; key: string } | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { deliveryType: 'DELIVERY', addressId: 'new' },
  });
  const type = watch('deliveryType');
  const addressId = watch('addressId');
  const defaultAddress = addresses.data?.find((a) => a.isDefault);

  if (cart.isPending || addresses.isPending) return <TableSkeleton />;
  if (cart.isError) return <ErrorState error={cart.error} onRetry={() => cart.refetch()} />;
  if (cart.data.items.length === 0) return <EmptyState title="Your basket is empty" action={<Link href="/shop" className="rounded-full border border-brass px-6 py-2.5 font-semibold">Browse the shop</Link>} />;

  const submit = (values: CheckoutValues) => {
    const input = toOrderInput(values);
    const payload = JSON.stringify(input);
    if (keyRef.current?.payload !== payload) keyRef.current = { payload, key: crypto.randomUUID() };
    place.mutate({ input, key: keyRef.current.key }, {
      onSuccess: (order) => { toast.success(`Order ${order.orderNumber} placed`); router.replace(`/checkout/payment?orderId=${order.id}`); },
      onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not place the order'),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <fieldset className="rounded-3xl border border-line p-6">
          <legend className="px-2 font-display text-2xl">How should we get it to you?</legend>
          <div className="mt-2 flex gap-4">
            {(['DELIVERY', 'PICKUP'] as const).map((t) => (
              <label key={t} className="flex flex-1 cursor-pointer items-center gap-3 rounded-2xl border border-line p-4 has-[:checked]:border-brass">
                <input type="radio" value={t} {...register('deliveryType')} className="accent-[#cfa95a]" />
                {t === 'DELIVERY' ? 'Delivery to my address' : 'I will pick it up'}
              </label>
            ))}
          </div>
        </fieldset>

        {type === 'DELIVERY' ? (
          <fieldset className="space-y-4 rounded-3xl border border-line p-6">
            <legend className="px-2 font-display text-2xl">Delivery address</legend>
            <SelectField label="Saved address" {...register('addressId')}>
              {addresses.data?.map((a) => <option key={a.id} value={a.id}>{a.addressLine}, {a.city}{a.isDefault ? ' (default)' : ''}</option>)}
              <option value="new">Enter a new address</option>
            </SelectField>
            {addressId === 'new' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><InputField label="Street address" error={errors.addressLine?.message} {...register('addressLine')} /></div>
                <InputField label="City" error={errors.city?.message} {...register('city')} />
                <InputField label="Province / county" error={errors.county?.message} {...register('county')} />
                <InputField label="Postal code" error={errors.postcode?.message} {...register('postcode')} />
              </div>
            )}
            {defaultAddress && addressId === 'new' && <p className="text-xs text-mute">Tip: your default address is {defaultAddress.addressLine}.</p>}
          </fieldset>
        ) : (
          <fieldset className="rounded-3xl border border-line p-6">
            <legend className="px-2 font-display text-2xl">Pickup time</legend>
            <InputField label="Date and time" type="datetime-local" error={errors.pickupScheduledAt?.message} {...register('pickupScheduledAt')} />
          </fieldset>
        )}
        <TextAreaField label="Notes for the store (optional)" error={errors.customerNotes?.message} {...register('customerNotes')} />
      </div>

      <aside className="h-fit rounded-3xl border border-line p-6">
        <h2 className="mb-4 text-3xl">Order summary</h2>
        <ul className="space-y-2 text-sm text-mute">
          {cart.data.items.map((i) => <li key={i.id} className="flex justify-between"><span>{i.quantity} × {i.name}</span><span>{money(i.lineTotal)}</span></li>)}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-3 text-xl"><span>Total</span><b>{money(cart.data.grandTotal)}</b></div>
        <p className="mt-3 text-xs text-mute">You will have 5 minutes to complete payment after placing the order.</p>
        <Button type="submit" variant="solid" loading={place.isPending} className="mt-5 w-full">Place order</Button>
      </aside>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard roles={['CUSTOMER']}>
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
        <h1 className="mb-8 text-[clamp(48px,7vw,96px)]">Checkout</h1>
        <CheckoutForm />
      </div>
    </AuthGuard>
  );
}

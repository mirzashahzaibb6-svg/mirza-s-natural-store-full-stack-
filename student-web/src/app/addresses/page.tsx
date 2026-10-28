'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { InputField } from '@/components/ui/input-field';
import { Modal } from '@/components/ui/modal';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import { ApiError } from '@/lib/networking/api-error';
import { addressSchema, type AddressValues } from '@/modules/zod/address';
import { useAddresses, useCreateAddress, useDeleteAddress, useSetDefaultAddress, useUpdateAddress } from '@/services/addresses/hooks';
import type { Address } from '@/services/addresses/types';

function AddressForm({ editing, onDone }: { editing: Address | null; onDone: () => void }) {
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressValues>({ resolver: zodResolver(addressSchema) });
  useEffect(() => { reset(editing ? { addressLine: editing.addressLine, city: editing.city, county: editing.county, postcode: editing.postcode } : { addressLine: '', city: '', county: '', postcode: '', isDefault: false }); }, [editing, reset]);
  const done = { onSuccess: () => { toast.success('Address saved'); onDone(); }, onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Could not save') };

  const submit = (v: AddressValues) => {
    const { isDefault, ...fields } = v;
    if (editing) update.mutate({ id: editing.id, data: fields }, done);
    else create.mutate({ ...fields, isDefault }, done);
  };
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <InputField label="Street address" error={errors.addressLine?.message} {...register('addressLine')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="City" error={errors.city?.message} {...register('city')} />
        <InputField label="Province / county" error={errors.county?.message} {...register('county')} />
      </div>
      <InputField label="Postal code" error={errors.postcode?.message} {...register('postcode')} />
      {!editing && <label className="flex items-center gap-2 text-sm text-mute"><input type="checkbox" className="accent-[#cfa95a]" {...register('isDefault')} />Make this my default address</label>}
      <div className="flex justify-end"><Button type="submit" variant="solid" small loading={create.isPending || update.isPending}>Save address</Button></div>
    </form>
  );
}

function AddressList() {
  const addresses = useAddresses();
  const setDefault = useSetDefaultAddress();
  const remove = useDeleteAddress();
  const [form, setForm] = useState<{ open: boolean; editing: Address | null }>({ open: false, editing: null });
  const [toDelete, setToDelete] = useState<Address | null>(null);

  return (
    <>
      <div className="mb-6 flex justify-end"><Button variant="solid" small onClick={() => setForm({ open: true, editing: null })}>Add address</Button></div>
      {addresses.isPending ? <TableSkeleton rows={3} /> : addresses.isError ? <ErrorState error={addresses.error} onRetry={() => addresses.refetch()} /> : addresses.data.length === 0 ? (
        <EmptyState title="No saved addresses" hint="Add one to check out faster." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.data.map((a) => (
            <li key={a.id} className="rounded-3xl border border-line p-5">
              <p className="font-display text-2xl">{a.addressLine}{a.isDefault && <span className="ml-2 rounded-full border border-brass px-2 py-0.5 align-middle font-sans text-xs text-brass">Default</span>}</p>
              <p className="text-mute">{a.city}, {a.county} {a.postcode}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="ghost" small onClick={() => setForm({ open: true, editing: a })}>Edit</Button>
                {!a.isDefault && <Button variant="ghost" small loading={setDefault.isPending} onClick={() => setDefault.mutate(a.id, { onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed') })}>Make default</Button>}
                <Button variant="danger" small onClick={() => setToDelete(a)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={form.open} title={form.editing ? 'Edit address' : 'New address'} onClose={() => setForm({ open: false, editing: null })}>
        <AddressForm editing={form.editing} onDone={() => setForm({ open: false, editing: null })} />
      </Modal>
      <ConfirmDialog open={!!toDelete} danger title="Delete this address?" description={toDelete ? `${toDelete.addressLine}, ${toDelete.city} will be removed. Past orders keep their own copy.` : ''} confirmLabel="Delete" loading={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => { toast.success('Address deleted'); setToDelete(null); }, onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed') })} />
    </>
  );
}

export default function AddressesPage() {
  return (
    <AuthGuard roles={['CUSTOMER']}>
      <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
        <h1 className="mb-8 text-[clamp(48px,7vw,96px)]">Addresses</h1>
        <AddressList />
      </div>
    </AuthGuard>
  );
}

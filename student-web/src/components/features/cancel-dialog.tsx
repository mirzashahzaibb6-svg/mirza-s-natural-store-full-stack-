'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { SelectField, TextAreaField } from '@/components/ui/input-field';
import { Modal } from '@/components/ui/modal';
import { label } from '@/lib/format';
import { cancelSchema, type CancelValues } from '@/modules/zod/admin';

interface Props {
  open: boolean;
  reasons: readonly string[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: CancelValues) => void;
}

/** Shared by the customer and admin "cancel order" flows. */
export function CancelDialog({ open, reasons, loading, onClose, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CancelValues>({ resolver: zodResolver(cancelSchema), defaultValues: { reason: '' } });
  return (
    <Modal open={open} title="Cancel this order" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <SelectField label="Reason" error={errors.reason?.message} {...register('reason')}>
          <option value="">Choose a reason…</option>
          {reasons.map((r) => <option key={r} value={r}>{label(r)}</option>)}
        </SelectField>
        <TextAreaField label="Note (required for “Other”)" error={errors.note?.message} {...register('note')} />
        <p className="text-xs text-mute">Stock is returned to the shelf. If the order was paid, a refund is started automatically.</p>
        <div className="flex justify-end gap-3"><Button variant="ghost" small onClick={onClose}>Keep order</Button><Button type="submit" variant="danger" small loading={loading}>Cancel order</Button></div>
      </form>
    </Modal>
  );
}

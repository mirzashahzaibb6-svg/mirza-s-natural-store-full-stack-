'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AdminShell } from '@/components/layout/admin-shell';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InputField, SelectField, TextAreaField } from '@/components/ui/input-field';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/status-badge';
import { dateTime, label } from '@/lib/format';
import { ApiError } from '@/lib/networking/api-error';
import { adjustSchema, inventoryCreateSchema, type AdjustValues, type InventoryCreateValues } from '@/modules/zod/admin';
import { useAdjustInventory, useAdminInventory, useAdminInventoryTx, useAdminProducts, useCreateInventory } from '@/services/admin/hooks';
import { ADJUSTMENT_REASONS, type InventoryRow } from '@/services/admin/types';
import type { StockStatus } from '@/services/types';

function CreateForm({ onDone }: { onDone: () => void }) {
  const create = useCreateInventory();
  const products = useAdminProducts({ limit: 100 });
  const { register, handleSubmit, formState: { errors } } = useForm<InventoryCreateValues>({ resolver: zodResolver(inventoryCreateSchema), defaultValues: { productId: '', qtyOnHand: 0, lowStockThreshold: 10 } });
  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit((v) => create.mutate(v, { onSuccess: () => { toast.success('Inventory created'); onDone(); }, onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed') }))}>
      <SelectField label="Product" error={errors.productId?.message} hint="Each product can have one inventory record." {...register('productId')}>
        <option value="">Choose…</option>{products.data?.data.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="Quantity on hand" type="number" error={errors.qtyOnHand?.message} {...register('qtyOnHand', { valueAsNumber: true })} />
        <InputField label="Low-stock threshold" type="number" error={errors.lowStockThreshold?.message} {...register('lowStockThreshold', { valueAsNumber: true })} />
      </div>
      <div className="flex justify-end"><Button type="submit" variant="solid" small loading={create.isPending}>Create</Button></div>
    </form>
  );
}

function AdjustForm({ row, onDone }: { row: InventoryRow; onDone: () => void }) {
  const adjust = useAdjustInventory();
  const { register, handleSubmit, formState: { errors } } = useForm<AdjustValues>({ resolver: zodResolver(adjustSchema), defaultValues: { reason: 'RECEIVED_STOCK', note: '' } });
  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit((v) => adjust.mutate({ inventoryId: row.id, quantity: v.quantity, reason: v.reason, note: v.note || undefined }, { onSuccess: () => { toast.success('Stock updated'); onDone(); }, onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed') }))}>
      <p className="text-sm text-mute">{row.productName}: {row.qtyOnHand} on hand</p>
      <InputField label="Change (+ adds, − removes)" type="number" error={errors.quantity?.message} {...register('quantity', { valueAsNumber: true })} />
      <SelectField label="Reason" error={errors.reason?.message} hint="Damage and return-to-supplier must be negative. Received stock must be positive." {...register('reason')}>
        {ADJUSTMENT_REASONS.map((r) => <option key={r} value={r}>{label(r)}</option>)}
      </SelectField>
      <TextAreaField label="Note (optional)" error={errors.note?.message} {...register('note')} />
      <div className="flex justify-end"><Button type="submit" variant="solid" small loading={adjust.isPending}>Apply</Button></div>
    </form>
  );
}

function History({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const tx = useAdminInventoryTx(id, { page, limit: 8 });
  if (tx.isPending) return <TableSkeleton rows={4} />;
  if (tx.isError) return <ErrorState error={tx.error} onRetry={() => tx.refetch()} />;
  if (tx.data.data.length === 0) return <EmptyState title="No movements yet" />;
  return (
    <>
      <DataTable rows={tx.data.data} rowKey={(t) => t.id} columns={[
        { header: 'When', cell: (t) => dateTime(t.createdAt) }, { header: 'Type', cell: (t) => label(t.type) },
        { header: 'Change', cell: (t) => <b className={t.quantity < 0 ? 'text-red-300' : 'text-emerald-300'}>{t.quantity > 0 ? '+' : ''}{t.quantity}</b> },
        { header: 'After', cell: (t) => t.quantityAfter }, { header: 'Reason', cell: (t) => (t.reason ? label(t.reason) : '-') },
      ]} />
      <Pagination meta={tx.data.meta} onPage={setPage} />
    </>
  );
}

export default function AdminInventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StockStatus | ''>('');
  const inventory = useAdminInventory({ page, limit: 10, search: search || undefined, stockStatus: status || undefined });
  const [modal, setModal] = useState<{ kind: 'create' | 'adjust' | 'history'; row?: InventoryRow } | null>(null);
  const onSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const close = () => setModal(null);

  return (
    <AdminShell title="Inventory" action={<Button variant="solid" small onClick={() => setModal({ kind: 'create' })}>Add inventory</Button>}>
      <div className="mb-6 grid gap-4 md:grid-cols-[2fr_1fr]">
        <SearchInput placeholder="Search product or SKU" onSearch={onSearch} />
        <select aria-label="Stock status" value={status} onChange={(e) => { setStatus(e.target.value as StockStatus | ''); setPage(1); }} className="rounded-full border border-line bg-wine-900 px-4 py-2.5">
          <option value="">All stock levels</option><option value="IN_STOCK">In stock</option><option value="LOW_STOCK">Low stock</option><option value="OUT_OF_STOCK">Out of stock</option>
        </select>
      </div>
      {inventory.isPending ? <TableSkeleton /> : inventory.isError ? <ErrorState error={inventory.error} onRetry={() => inventory.refetch()} /> : inventory.data.data.length === 0 ? <EmptyState title="No inventory records" hint="Create inventory for a product so customers can buy it." /> : (
        <>
          <DataTable rows={inventory.data.data} rowKey={(r) => r.id} columns={[
            { header: 'Product', cell: (r) => <div><b>{r.productName}</b><span className="block text-xs text-mute">{r.sku}</span></div> },
            { header: 'On hand', cell: (r) => <b>{r.qtyOnHand}</b> }, { header: 'Low at', cell: (r) => r.lowStockThreshold }, { header: 'Status', cell: (r) => <StatusBadge value={r.status} /> },
            { header: '', cell: (r) => <div className="flex gap-2"><Button variant="ghost" small onClick={() => setModal({ kind: 'adjust', row: r })}>Adjust</Button><Button variant="ghost" small onClick={() => setModal({ kind: 'history', row: r })}>History</Button></div> },
          ]} />
          <Pagination meta={inventory.data.meta} onPage={setPage} />
        </>
      )}
      <Modal open={modal?.kind === 'create'} title="Add inventory" onClose={close}><CreateForm onDone={close} /></Modal>
      <Modal open={modal?.kind === 'adjust'} title="Adjust stock" onClose={close}>{modal?.row && <AdjustForm row={modal.row} onDone={close} />}</Modal>
      <Modal open={modal?.kind === 'history'} title="Stock history" onClose={close}>{modal?.row && <History id={modal.row.id} />}</Modal>
    </AdminShell>
  );
}

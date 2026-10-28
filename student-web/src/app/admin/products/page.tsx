'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
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
import { money } from '@/lib/format';
import { ApiError } from '@/lib/networking/api-error';
import { productSchema, type ProductValues } from '@/modules/zod/admin';
import { useAdminCategories, useAdminProducts, useCreateProduct, useUpdateProduct } from '@/services/admin/hooks';
import type { Category, Product } from '@/services/catalog/types';

function ProductForm({ editing, categories, onDone }: { editing: Product | null; categories: Category[]; onDone: () => void }) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductValues>({ resolver: zodResolver(productSchema) });
  useEffect(() => {
    reset(editing
      ? { name: editing.name, description: editing.description ?? '', categoryId: editing.categoryId, price: Number(editing.price), minimumOrderQuantity: editing.minimumOrderQuantity, maximumOrderQuantity: editing.maximumOrderQuantity, isActive: editing.isActive }
      : { name: '', description: '', categoryId: '', price: 0, minimumOrderQuantity: 1, maximumOrderQuantity: 10, isActive: true });
  }, [editing, reset]);
  const cb = { onSuccess: () => { toast.success('Product saved'); onDone(); }, onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed') };

  const submit = (v: ProductValues) => {
    const data = { ...v, description: v.description || undefined };
    if (editing) update.mutate({ id: editing.id, data }, cb);
    else create.mutate(data, cb);
  };
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <InputField label="Name" error={errors.name?.message} {...register('name')} />
      <TextAreaField label="Description" error={errors.description?.message} {...register('description')} />
      <SelectField label="Category" error={errors.categoryId?.message} hint="Products live in a category that has no sub-categories." {...register('categoryId')}>
        <option value="">Choose…</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-3">
        <InputField label="Price" type="number" step="0.01" error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
        <InputField label="Min quantity" type="number" error={errors.minimumOrderQuantity?.message} {...register('minimumOrderQuantity', { valueAsNumber: true })} />
        <InputField label="Max quantity" type="number" error={errors.maximumOrderQuantity?.message} {...register('maximumOrderQuantity', { valueAsNumber: true })} />
      </div>
      <label className="flex items-center gap-2 text-sm text-mute"><input type="checkbox" className="accent-[#cfa95a]" {...register('isActive')} />Visible in the shop</label>
      <div className="flex justify-end"><Button type="submit" variant="solid" small loading={create.isPending || update.isPending}>Save product</Button></div>
    </form>
  );
}

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [active, setActive] = useState('');
  const products = useAdminProducts({ page, limit: 10, q: q || undefined, categoryId: categoryId || undefined, isActive: active === '' ? undefined : active === 'true' });
  const categories = useAdminCategories({ limit: 100 });
  const update = useUpdateProduct();
  const [form, setForm] = useState<{ open: boolean; editing: Product | null }>({ open: false, editing: null });
  const onSearch = useCallback((v: string) => { setQ(v); setPage(1); }, []);
  const leaf = (categories.data?.data ?? []).filter((c) => !categories.data?.data.some((x) => x.parentId === c.id));

  return (
    <AdminShell title="Products" action={<Button variant="solid" small onClick={() => setForm({ open: true, editing: null })}>New product</Button>}>
      <div className="mb-6 grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <SearchInput placeholder="Search products" onSearch={onSearch} />
        <select aria-label="Category" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="rounded-full border border-line bg-wine-900 px-4 py-2.5"><option value="">All categories</option>{categories.data?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select aria-label="Visibility" value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }} className="rounded-full border border-line bg-wine-900 px-4 py-2.5"><option value="">All</option><option value="true">Active</option><option value="false">Inactive</option></select>
      </div>
      {products.isPending ? <TableSkeleton /> : products.isError ? <ErrorState error={products.error} onRetry={() => products.refetch()} /> : products.data.data.length === 0 ? <EmptyState title="No products found" /> : (
        <>
          <DataTable
            rows={products.data.data} rowKey={(p) => p.id}
            columns={[
              { header: 'Product', cell: (p) => <div><b>{p.name}</b><span className="block text-xs text-mute">{p.sku}</span></div> }, { header: 'Category', cell: (p) => p.category.name },
              { header: 'Price', cell: (p) => money(p.price) }, { header: 'Order limits', cell: (p) => `${p.minimumOrderQuantity} – ${p.maximumOrderQuantity}` },
              { header: 'Stock', cell: (p) => <StatusBadge value={p.stockStatus} /> }, { header: 'Status', cell: (p) => <StatusBadge value={p.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
              { header: '', cell: (p) => (
                <div className="flex gap-2"><Button variant="ghost" small onClick={() => setForm({ open: true, editing: p })}>Edit</Button>
                  <Button variant="ghost" small loading={update.isPending && update.variables?.id === p.id} onClick={() => update.mutate({ id: p.id, data: { isActive: !p.isActive } }, { onSuccess: () => toast.success(p.isActive ? 'Product hidden' : 'Product visible'), onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed') })}>{p.isActive ? 'Deactivate' : 'Activate'}</Button></div>) },
            ]}
          />
          <Pagination meta={products.data.meta} onPage={setPage} />
        </>
      )}
      <Modal open={form.open} title={form.editing ? 'Edit product' : 'New product'} onClose={() => setForm({ open: false, editing: null })}>
        <ProductForm editing={form.editing} categories={leaf} onDone={() => setForm({ open: false, editing: null })} />
      </Modal>
    </AdminShell>
  );
}

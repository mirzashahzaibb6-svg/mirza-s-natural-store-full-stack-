'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AdminShell } from '@/components/layout/admin-shell';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { InputField, SelectField } from '@/components/ui/input-field';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiError } from '@/lib/networking/api-error';
import { categorySchema, type CategoryValues } from '@/modules/zod/admin';
import { useAdminCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/services/admin/hooks';
import type { Category } from '@/services/catalog/types';

function CategoryForm({ editing, roots, onDone }: { editing: Category | null; roots: Category[]; onDone: () => void }) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryValues>({ resolver: zodResolver(categorySchema) });
  useEffect(() => { reset({ name: editing?.name ?? '', parentId: editing?.parentId ?? '', isActive: editing?.isActive ?? true }); }, [editing, reset]);
  const cb = { onSuccess: () => { toast.success('Category saved'); onDone(); }, onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed') };

  const submit = (v: CategoryValues) => {
    if (editing) update.mutate({ id: editing.id, data: { name: v.name, isActive: v.isActive, parentId: v.parentId ? v.parentId : null } }, cb);
    else create.mutate({ name: v.name, isActive: v.isActive, ...(v.parentId ? { parentId: v.parentId } : {}) }, cb);
  };
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <InputField label="Name" error={errors.name?.message} {...register('name')} />
      <SelectField label="Parent category" hint="Only two levels are allowed. A category with products cannot become a parent." {...register('parentId')}>
        <option value="">None (top level)</option>
        {roots.filter((r) => r.id !== editing?.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </SelectField>
      <label className="flex items-center gap-2 text-sm text-mute"><input type="checkbox" className="accent-[#cfa95a]" {...register('isActive')} />Visible in the shop</label>
      <div className="flex justify-end"><Button type="submit" variant="solid" small loading={create.isPending || update.isPending}>Save</Button></div>
    </form>
  );
}

export default function AdminCategoriesPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const categories = useAdminCategories({ page, limit: 10, q: q || undefined });
  const all = useAdminCategories({ limit: 100 });
  const remove = useDeleteCategory();
  const [form, setForm] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null });
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const onSearch = useCallback((v: string) => { setQ(v); setPage(1); }, []);
  const nameOf = (id: string | null) => all.data?.data.find((c) => c.id === id)?.name ?? '-';

  return (
    <AdminShell title="Categories" action={<Button variant="solid" small onClick={() => setForm({ open: true, editing: null })}>New category</Button>}>
      <div className="mb-6 max-w-md"><SearchInput placeholder="Search categories" onSearch={onSearch} /></div>
      {categories.isPending ? <TableSkeleton /> : categories.isError ? <ErrorState error={categories.error} onRetry={() => categories.refetch()} /> : categories.data.data.length === 0 ? <EmptyState title="No categories yet" hint="Create the first one to organise your products." /> : (
        <>
          <DataTable
            rows={categories.data.data} rowKey={(c) => c.id}
            columns={[
              { header: 'Name', cell: (c) => <b>{c.name}</b> }, { header: 'Parent', cell: (c) => nameOf(c.parentId) }, { header: 'Level', cell: (c) => c.depth + 1 },
              { header: 'Status', cell: (c) => <StatusBadge value={c.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
              { header: '', cell: (c) => <div className="flex gap-2"><Button variant="ghost" small onClick={() => setForm({ open: true, editing: c })}>Edit</Button><Button variant="danger" small onClick={() => setToDelete(c)}>Delete</Button></div> },
            ]}
          />
          <Pagination meta={categories.data.meta} onPage={setPage} />
        </>
      )}
      <Modal open={form.open} title={form.editing ? 'Edit category' : 'New category'} onClose={() => setForm({ open: false, editing: null })}>
        <CategoryForm editing={form.editing} roots={all.data?.data.filter((c) => c.depth === 0) ?? []} onDone={() => setForm({ open: false, editing: null })} />
      </Modal>
      <ConfirmDialog open={!!toDelete} danger title="Delete category?" description={`“${toDelete?.name ?? ''}” can only be deleted when it has no products and no child categories.`} confirmLabel="Delete" loading={remove.isPending} onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => { toast.success('Category deleted'); setToDelete(null); }, onError: (e) => { toast.error(e instanceof ApiError ? e.message : 'Failed'); setToDelete(null); } })} />
    </AdminShell>
  );
}

'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { AdminShell } from '@/components/layout/admin-shell';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/status-badge';
import { dateTime, money } from '@/lib/format';
import { ApiError } from '@/lib/networking/api-error';
import { useAdminCustomers, useSetCustomerStatus } from '@/services/admin/hooks';
import type { UserDto } from '@/services/auth/types';

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [target, setTarget] = useState<UserDto | null>(null);
  const customers = useAdminCustomers({ page, limit: 10, search: search || undefined, isActive: active === '' ? undefined : active === 'true' });
  const setStatus = useSetCustomerStatus();
  const onSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);

  return (
    <AdminShell title="Customers">
      <div className="mb-6 grid gap-4 md:grid-cols-[2fr_1fr]">
        <SearchInput placeholder="Search name or email" onSearch={onSearch} />
        <select aria-label="Status" value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }} className="rounded-full border border-line bg-wine-900 px-4 py-2.5">
          <option value="">All customers</option><option value="true">Active</option><option value="false">Deactivated</option>
        </select>
      </div>
      {customers.isPending ? <TableSkeleton /> : customers.isError ? <ErrorState error={customers.error} onRetry={() => customers.refetch()} /> : customers.data.data.length === 0 ? <EmptyState title="No customers found" /> : (
        <>
          <DataTable
            rows={customers.data.data} rowKey={(u) => u.id}
            columns={[
              { header: 'Name', cell: (u) => <b>{u.name}</b> }, { header: 'Email', cell: (u) => u.email },
              { header: 'Orders', cell: (u) => u.totalOrders }, { header: 'Spent', cell: (u) => money(u.totalSpent) },
              { header: 'Joined', cell: (u) => dateTime(u.createdAt) }, { header: 'Status', cell: (u) => <StatusBadge value={u.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
              { header: '', cell: (u) => <Button variant={u.isActive ? 'danger' : 'ghost'} small onClick={() => setTarget(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</Button> },
            ]}
          />
          <Pagination meta={customers.data.meta} onPage={setPage} />
        </>
      )}
      <ConfirmDialog
        open={!!target} danger={!!target?.isActive} loading={setStatus.isPending} onClose={() => setTarget(null)}
        title={target?.isActive ? 'Deactivate customer?' : 'Activate customer?'}
        description={target?.isActive ? `${target.name} will be signed out of every device and blocked immediately.` : `${target?.name ?? ''} will be able to sign in again.`}
        confirmLabel={target?.isActive ? 'Deactivate' : 'Activate'}
        onConfirm={() => target && setStatus.mutate({ id: target.id, isActive: !target.isActive }, {
          onSuccess: () => { toast.success('Customer updated'); setTarget(null); },
          onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
        })}
      />
    </AdminShell>
  );
}

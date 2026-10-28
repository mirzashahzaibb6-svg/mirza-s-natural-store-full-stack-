'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { AdminShell } from '@/components/layout/admin-shell';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/status-badge';
import { dateTime, label, money } from '@/lib/format';
import { useAdminOrders } from '@/services/admin/hooks';
import type { OrderStatus, PaymentStatus } from '@/services/types';

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_PENDING'];
const PAYMENTS: PaymentStatus[] = ['UNPAID', 'PAID', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'];

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [payment, setPayment] = useState<PaymentStatus | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const orders = useAdminOrders({ page, limit: 10, search: search || undefined, status: status || undefined, paymentStatus: payment || undefined, dateFrom: from || undefined, dateTo: to || undefined });
  const onSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const sel = 'rounded-full border border-line bg-wine-900 px-4 py-2.5';

  return (
    <AdminShell title="Orders">
      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="md:col-span-2"><SearchInput placeholder="Order number, name or email" onSearch={onSearch} /></div>
        <select aria-label="Order status" className={sel} value={status} onChange={(e) => { setStatus(e.target.value as OrderStatus | ''); setPage(1); }}><option value="">Any status</option>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        <select aria-label="Payment status" className={sel} value={payment} onChange={(e) => { setPayment(e.target.value as PaymentStatus | ''); setPage(1); }}><option value="">Any payment</option>{PAYMENTS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        <div className="flex gap-2"><input aria-label="From date" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={`${sel} w-full`} /><input aria-label="To date" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={`${sel} w-full`} /></div>
      </div>
      {orders.isPending ? <TableSkeleton /> : orders.isError ? <ErrorState error={orders.error} onRetry={() => orders.refetch()} /> : orders.data.data.length === 0 ? <EmptyState title="No orders match" /> : (
        <>
          <DataTable rows={orders.data.data} rowKey={(o) => o.id} columns={[
            { header: 'Order', cell: (o) => <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brass underline">{o.orderNumber}</Link> },
            { header: 'Customer', cell: (o) => <div>{o.customer?.name}<span className="block text-xs text-mute">{o.customer?.email}</span></div> },
            { header: 'Placed', cell: (o) => dateTime(o.createdAt) }, { header: 'Type', cell: (o) => label(o.deliveryType) },
            { header: 'Status', cell: (o) => <StatusBadge value={o.status} /> }, { header: 'Payment', cell: (o) => <StatusBadge value={o.paymentStatus} /> },
            { header: 'Total', cell: (o) => <b>{money(o.total)}</b> },
          ]} />
          <Pagination meta={orders.data.meta} onPage={setPage} />
        </>
      )}
    </AdminShell>
  );
}

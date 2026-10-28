import { Check } from 'lucide-react';
import { dateTime, money } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Order } from '@/services/orders/types';

export function OrderItemsTable({ order }: { order: Order }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-line">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="border-b border-line text-mute"><tr><th className="px-4 py-3">Item</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.productId} className="border-b border-line/60"><td className="px-4 py-3">{i.productName}<span className="block text-xs text-mute">{i.sku}</span></td><td className="px-4 py-3">{money(i.unitPrice)}</td><td className="px-4 py-3">{i.quantity}</td><td className="px-4 py-3 text-right">{money(i.lineTotal)}</td></tr>
          ))}
        </tbody>
        <tfoot className="text-mute">
          <tr><td colSpan={3} className="px-4 pt-3 text-right">Subtotal</td><td className="px-4 pt-3 text-right">{money(order.subtotal)}</td></tr>
          <tr><td colSpan={3} className="px-4 text-right">Shipping</td><td className="px-4 text-right">{money(order.shippingCost)}</td></tr>
          <tr className="text-lg text-pearl"><td colSpan={3} className="px-4 py-3 text-right">Total</td><td className="px-4 py-3 text-right font-semibold">{money(order.total)}</td></tr>
        </tfoot>
      </table>
    </div>
  );
}

export function OrderTimeline({ order }: { order: Order }) {
  const steps = [
    { label: 'Placed', at: order.createdAt }, { label: 'Confirmed', at: order.confirmedAt }, { label: 'Processing', at: order.processedAt },
    { label: order.deliveryType === 'PICKUP' ? 'Ready for pickup' : 'Out for delivery', at: order.readyAt }, { label: 'Delivered', at: order.deliveredAt },
  ];
  return (
    <ol className="space-y-3">
      {steps.map((s) => (
        <li key={s.label} className={cn('flex items-center gap-3', s.at ? 'text-pearl' : 'text-mute/50')}>
          <span className={cn('grid h-6 w-6 place-items-center rounded-full border', s.at ? 'border-brass bg-brass text-wine-950' : 'border-line')}>{s.at && <Check size={14} />}</span>
          <span>{s.label}</span><span className="ml-auto text-xs text-mute">{dateTime(s.at)}</span>
        </li>
      ))}
      {order.cancelledAt && <li className="flex items-center gap-3 text-red-300"><span className="h-6 w-6 rounded-full border border-red-300" />Cancelled<span className="ml-auto text-xs">{dateTime(order.cancelledAt)}</span></li>}
    </ol>
  );
}

export function DeliveryInfo({ order }: { order: Order }) {
  return (
    <div className="space-y-1 text-sm text-mute">
      {order.deliveryType === 'DELIVERY' && order.address
        ? <p>Deliver to: <span className="text-pearl">{order.address.addressLine}, {order.address.city}, {order.address.county} {order.address.postcode}</span></p>
        : <p>Pickup at: <span className="text-pearl">{dateTime(order.pickupScheduledAt)}</span></p>}
      {order.customerNotes && <p>Notes: <span className="text-pearl">{order.customerNotes}</span></p>}
      {order.cancelReason && <p>Cancel reason: <span className="text-pearl">{order.cancelReason.replaceAll('_', ' ').toLowerCase()}{order.cancelNote ? ` (${order.cancelNote})` : ''}</span></p>}
    </div>
  );
}

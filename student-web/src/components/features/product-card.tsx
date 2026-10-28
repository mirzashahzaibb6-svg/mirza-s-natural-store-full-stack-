'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PointerEvent } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/networking/api-error';
import { money } from '@/lib/format';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAddToCart } from '@/services/cart/hooks';
import type { Product } from '@/services/catalog/types';
import { useAuthStore } from '@/store/auth-store';
import { ProductArt } from './product-art';

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const add = useAddToCart();
  const out = product.stockStatus === 'OUT_OF_STOCK';

  function onMove(e: PointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const s = e.currentTarget.style;
    s.setProperty('--px', `${x * 100}%`); s.setProperty('--py', `${y * 100}%`);
    s.setProperty('--tx', String(-(x - 0.5))); s.setProperty('--ty2', String(-(y - 0.5)));
  }

  function addToCart() {
    if (!token) { toast('Sign in to add items to your basket'); router.push('/login?next=/shop'); return; }
    if (user?.role === 'ADMIN') { toast.error('Admin accounts cannot place orders'); return; }
    add.mutate(
      { productId: product.id, quantity: product.minimumOrderQuantity },
      {
        onSuccess: () => toast.success(`${product.name} added`),
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not add to basket'),
      },
    );
  }

  return (
    <article className="arch-card p-3" onPointerMove={onMove}>
      <div className="arch-art"><ProductArt name={product.name} /></div>
      <div className="px-2 pb-4 pt-4 text-center">
        <h3 className="text-2xl">{product.name}</h3>
        <p className="mt-1 text-sm text-mute">{product.category.name}</p>
        <div className="mt-2"><StatusBadge value={product.stockStatus} /></div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <span className="font-semibold">{money(product.price)}</span>
          <button
            onClick={addToCart}
            disabled={out || add.isPending}
            aria-label={`Add ${product.name} to basket`}
            className="grid h-10 w-10 place-items-center rounded-full border border-brass transition hover:rotate-90 hover:bg-brass hover:text-wine-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {add.isPending ? <span className="spinner" /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}

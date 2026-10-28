'use client';

import Link from 'next/link';
import { Hero } from '@/components/features/hero';
import { LitStatement } from '@/components/features/lit-statement';
import { ProductCard } from '@/components/features/product-card';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { BRAND } from '@/lib/config';
import { useProducts } from '@/services/catalog/hooks';

export default function HomePage() {
  const products = useProducts({ limit: 8, sort: 'newest' });
  return (
    <>
      <Hero />
      <LitStatement text="Some things are worth waiting for. We source slowly, pack carefully and deliver to your door as if it were a gift." />
      <section className="mx-auto max-w-7xl px-5 pb-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[clamp(46px,7vw,104px)]">The collection</h2>
          <Link href="/shop" className="rounded-full border border-line px-5 py-2 transition hover:border-brass">See everything</Link>
        </div>
        {products.isPending ? <CardGridSkeleton /> : products.isError ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} />
        ) : products.data.data.length === 0 ? (
          <EmptyState title="The shelves are being stocked" hint="Products will appear here as soon as the admin adds them." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.data.data.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        )}
      </section>
      <footer className="border-t border-line bg-wine-950/80 px-6 py-24 text-center">
        <p className="font-display text-[clamp(40px,9vw,150px)] text-brass">{BRAND}</p>
        <p className="mt-4 text-mute">Fine groceries, delivered with care.</p>
      </footer>
    </>
  );
}

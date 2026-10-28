'use client';

import { useState } from 'react';
import { ProductCard } from '@/components/features/product-card';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { useCategories, useProducts } from '@/services/catalog/hooks';
import type { ProductFilters } from '@/services/catalog/types';

export default function ShopPage() {
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, limit: 12, sort: 'newest' });
  const categories = useCategories();
  const products = useProducts(filters);
  const set = (patch: Partial<ProductFilters>) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32">
      <h1 className="mb-8 text-[clamp(48px,7vw,104px)]">The shelf</h1>
      <div className="mb-10 grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <SearchInput placeholder="Search products" onSearch={(q) => setFilters((f) => (f.q === (q || undefined) ? f : { ...f, q: q || undefined, page: 1 }))} />
        <select aria-label="Category" value={filters.categoryId ?? ''} onChange={(e) => set({ categoryId: e.target.value || undefined })} className="rounded-full border border-line bg-wine-900 px-4 py-2.5">
          <option value="">All categories</option>
          {categories.data?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input aria-label="Minimum price" type="number" min={0} placeholder="Min price" onChange={(e) => set({ minPrice: e.target.value || undefined })} className="rounded-full border border-line bg-transparent px-4 py-2.5 placeholder:text-mute/60" />
        <input aria-label="Maximum price" type="number" min={0} placeholder="Max price" onChange={(e) => set({ maxPrice: e.target.value || undefined })} className="rounded-full border border-line bg-transparent px-4 py-2.5 placeholder:text-mute/60" />
        <select aria-label="Sort" value={filters.sort} onChange={(e) => set({ sort: e.target.value as ProductFilters['sort'] })} className="rounded-full border border-line bg-wine-900 px-4 py-2.5">
          <option value="newest">Newest</option><option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option><option value="name_asc">Name A-Z</option>
        </select>
      </div>

      {products.isPending ? <CardGridSkeleton /> : products.isError ? (
        <ErrorState error={products.error} onRetry={() => products.refetch()} />
      ) : products.data.data.length === 0 ? (
        <EmptyState title="Nothing matches" hint="Try a different search or clear the filters." />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.data.data.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          <Pagination meta={products.data.meta} onPage={(page) => set({ page })} />
        </>
      )}
    </div>
  );
}

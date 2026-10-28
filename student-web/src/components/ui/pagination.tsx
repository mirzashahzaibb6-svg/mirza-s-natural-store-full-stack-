import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageMeta } from '@/services/types';
import { Button } from './button';

export function Pagination({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
  if (meta.pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4">
      <Button variant="ghost" small disabled={!meta.hasPrevPage} onClick={() => onPage(meta.currentPage - 1)} aria-label="Previous page"><ChevronLeft size={16} />Prev</Button>
      <span className="text-sm text-mute">Page {meta.currentPage} of {meta.pages} ({meta.total} total)</span>
      <Button variant="ghost" small disabled={!meta.hasNextPage} onClick={() => onPage(meta.currentPage + 1)} aria-label="Next page">Next<ChevronRight size={16} /></Button>
    </nav>
  );
}

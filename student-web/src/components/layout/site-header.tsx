'use client';

import { Menu, ShoppingBag, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BRAND } from '@/lib/config';
import { cn } from '@/lib/utils';
import { useCart } from '@/services/cart/hooks';
import { useAuthStore } from '@/store/auth-store';

const customerLinks = [{ href: '/shop', label: 'Shop' }, { href: '/orders', label: 'Orders' }, { href: '/addresses', label: 'Addresses' }];
const adminLinks = [
  { href: '/admin/orders', label: 'Orders' }, { href: '/admin/products', label: 'Products' }, { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/inventory', label: 'Inventory' }, { href: '/admin/customers', label: 'Customers' },
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, hydrated, clear } = useAuthStore();
  const cart = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const links = user?.role === 'ADMIN' ? adminLinks : user ? customerLinks : [{ href: '/shop', label: 'Shop' }];
  const count = cart.data?.items.reduce((n, i) => n + i.quantity, 0) ?? 0;

  function logout() {
    clear();
    toast.success('Signed out');
    router.push('/');
  }

  return (
    <header className={cn('fixed inset-x-0 top-0 z-30 transition', scrolled || open ? 'bg-wine-950/80 backdrop-blur-md' : '')}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="font-display text-2xl">{BRAND}</Link>
        <nav className="hidden items-center gap-6 text-mute md:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={cn('transition hover:text-brass', pathname.startsWith(l.href) && 'text-brass')}>{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {hydrated && user?.role !== 'ADMIN' && (
            <Link href="/cart" className="relative rounded-full border border-line p-2.5 transition hover:border-brass" aria-label={`Basket, ${count} items`}>
              <ShoppingBag size={18} />
              {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brass px-1 text-xs font-bold text-wine-950">{count}</span>}
            </Link>
          )}
          {hydrated && token ? (
            <button onClick={logout} className="hidden rounded-full border border-line px-4 py-2 text-sm transition hover:border-brass sm:block">Sign out</button>
          ) : (
            <Link href="/login" className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-brass">Sign in</Link>
          )}
          <button className="rounded-full border border-line p-2.5 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-4 px-5 pb-6 md:hidden" aria-label="Mobile">
          {links.map((l) => <Link key={l.href} href={l.href} className="text-lg text-mute">{l.label}</Link>)}
          {token && <button onClick={logout} className="text-left text-lg text-mute">Sign out</button>}
        </nav>
      )}
    </header>
  );
}

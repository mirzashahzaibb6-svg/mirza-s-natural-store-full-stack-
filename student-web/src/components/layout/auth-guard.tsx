'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useMe } from '@/services/auth/hooks';
import { useAuthStore } from '@/store/auth-store';
import { TableSkeleton } from '@/components/ui/states';

type Role = 'ADMIN' | 'CUSTOMER';

/** Blocks a page until the stored session is known; redirects guests to /login and wrong roles to a friendly screen. */
export function AuthGuard({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const router = useRouter();
  const { token, user, hydrated, setUser } = useAuthStore();
  const me = useMe(hydrated && !!token);

  useEffect(() => {
    if (hydrated && !token) router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }, [hydrated, token, router]);

  useEffect(() => {
    if (me.data) setUser(me.data); // keeps role/isActive in sync with the server
  }, [me.data, setUser]);

  if (!hydrated || !token || !user) return <div className="mx-auto max-w-5xl px-6 pt-32"><TableSkeleton /></div>;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto grid max-w-xl place-items-center gap-3 px-6 pt-40 text-center">
        <h1 className="text-5xl">Not for this account</h1>
        <p className="text-mute">This page is only available to {roles.join(' / ').toLowerCase()} accounts.</p>
      </div>
    );
  }
  return <>{children}</>;
}

'use client';

import type { ReactNode } from 'react';
import { AuthGuard } from './auth-guard';

export function AdminShell({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <AuthGuard roles={['ADMIN']}>
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-32">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[clamp(44px,6vw,88px)]">{title}</h1>
          {action}
        </div>
        {children}
      </div>
    </AuthGuard>
  );
}

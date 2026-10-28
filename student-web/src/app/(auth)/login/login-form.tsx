'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/input-field';
import { BRAND } from '@/lib/config';
import { ApiError } from '@/lib/networking/api-error';
import { loginSchema, type LoginValues } from '@/modules/zod/auth';
import { useLogin } from '@/services/auth/hooks';

/** Only same-site relative paths are accepted as the post-login destination (no open redirect). */
const safeNext = (value: string | null): string | null => (value && value.startsWith('/') && !value.startsWith('//') ? value : null);

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const login = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const submit = (values: LoginValues) =>
    login.mutate(values, {
      onSuccess: (r) => {
        toast.success(`Welcome back, ${r.user.name}`);
        router.replace(next ?? (r.user.role === 'ADMIN' ? '/admin/orders' : '/shop'));
      },
      onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not sign in'),
    });

  return (
    <div className="mx-auto grid min-h-svh max-w-6xl items-center gap-12 px-6 pb-12 pt-28 lg:grid-cols-2">
      <div>
        <h1 className="text-[clamp(44px,6.5vw,100px)]">Welcome back<br />to {BRAND}</h1>
        <p className="mt-6 max-w-md text-mute">Sign in to see your basket, saved addresses and past orders.</p>
      </div>
      <div className="arch-box mx-auto box-border w-full max-w-md min-w-0 px-10 pb-9 pt-20 sm:px-14">
<form
  onSubmit={handleSubmit(submit)}
  noValidate
  className="w-full min-w-0 space-y-4"
>
          <InputField label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <InputField label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
          <Button type="submit" variant="solid" loading={login.isPending} className="w-full">Sign in</Button>
        </form>
        <p className="mt-5 text-center text-sm text-mute">New here? <Link href="/register" className="text-brass underline">Create an account</Link></p>
      </div>
    </div>
  );
}

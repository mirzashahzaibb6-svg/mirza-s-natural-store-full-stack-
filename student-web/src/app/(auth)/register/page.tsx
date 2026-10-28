'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/input-field';
import { ApiError } from '@/lib/networking/api-error';
import { registerSchema, type RegisterValues } from '@/modules/zod/auth';
import { useRegister } from '@/services/auth/hooks';

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useRegister();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const submit = ({ name, email, password }: RegisterValues) =>
    registerUser.mutate({ name, email, password }, {
      onSuccess: () => { toast.success('Account created'); router.replace('/shop'); },
      onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not create the account'),
    });

  return (
    <div className="mx-auto grid min-h-svh max-w-6xl items-center gap-12 px-6 pb-12 pt-28 lg:grid-cols-2">
      <div>
        <h1 className="text-[clamp(44px,6.5vw,100px)]">Join the<br />table</h1>
        <p className="mt-6 max-w-md text-mute">Create an account to order, track deliveries and keep your favourite addresses.</p>
      </div>
      <div className="arch-box mx-auto w-full max-w-md px-9 pb-9 pt-20">
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          <InputField label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
          <InputField label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <InputField label="Password" type="password" autoComplete="new-password" hint="8 to 72 characters" error={errors.password?.message} {...register('password')} />
          <InputField label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <Button type="submit" variant="solid" loading={registerUser.isPending} className="w-full">Create account</Button>
        </form>
        <p className="mt-5 text-center text-sm text-mute">Already a member? <Link href="/login" className="text-brass underline">Sign in</Link></p>
      </div>
    </div>
  );
}

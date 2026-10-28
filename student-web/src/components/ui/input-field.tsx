import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const base =
  'block w-full min-w-0 max-w-full box-border appearance-none rounded-2xl border bg-transparent px-4 py-3 text-pearl placeholder:text-mute/60 transition focus:border-brass focus:outline-none';

function Wrap({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block w-full min-w-0 text-sm">
      <span className="mb-1 block text-mute">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-mute/80">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

interface FieldProps { label: string; error?: string; hint?: string }

export const InputField = forwardRef<HTMLInputElement, FieldProps & InputHTMLAttributes<HTMLInputElement>>(function InputField({ label, error, hint, className, ...rest }, ref) {
  return (
    <Wrap label={label} error={error} hint={hint}>
      <input ref={ref} aria-invalid={!!error} className={cn(base, error ? 'border-red-400/70' : 'border-line', className)} {...rest} />
    </Wrap>
  );
});

export const TextAreaField = forwardRef<HTMLTextAreaElement, FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextAreaField({ label, error, hint, className, ...rest }, ref) {
  return (
    <Wrap label={label} error={error} hint={hint}>
      <textarea ref={ref} rows={3} aria-invalid={!!error} className={cn(base, error ? 'border-red-400/70' : 'border-line', className)} {...rest} />
    </Wrap>
  );
});

export const SelectField = forwardRef<HTMLSelectElement, FieldProps & SelectHTMLAttributes<HTMLSelectElement>>(function SelectField({ label, error, hint, className, children, ...rest }, ref) {
  return (
    <Wrap label={label} error={error} hint={hint}>
      <select ref={ref} aria-invalid={!!error} className={cn(base, 'bg-wine-900', error ? 'border-red-400/70' : 'border-line', className)} {...rest}>
        {children}
      </select>
    </Wrap>
  );
});

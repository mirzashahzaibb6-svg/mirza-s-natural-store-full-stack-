import { Transform } from 'class-transformer';

export const Trim = () => Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));
export const Lower = () => Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));
/** Query strings arrive as text: "true"/"false" -> boolean. */
export const ToBoolean = () =>
  Transform(({ value }: { value: unknown }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : value));

export const BCRYPT_COST = 12;
export const PAYMENT_WINDOW_MINUTES = 5;
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
// Rate limits (requests per minute), see notes/decisions.md D-18.
export const LIMIT_AUTH = { default: { limit: 10, ttl: 60_000 } };
export const LIMIT_PAYMENT = { default: { limit: 5, ttl: 60_000 } };
export const LIMIT_ORDER = { default: { limit: 20, ttl: 60_000 } };

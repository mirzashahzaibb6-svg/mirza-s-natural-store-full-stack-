export const qk = {
  me: ['me'] as const,
  categories: (p: unknown) => ['categories', p] as const,
  products: (p: unknown) => ['products', p] as const,
  cart: ['cart'] as const,
  addresses: ['addresses'] as const,
  orders: (p: unknown) => ['orders', p] as const,
  order: (id: string) => ['order', id] as const,
  admin: {
    customers: (p: unknown) => ['admin', 'customers', p] as const,
    categories: (p: unknown) => ['admin', 'categories', p] as const,
    products: (p: unknown) => ['admin', 'products', p] as const,
    inventory: (p: unknown) => ['admin', 'inventory', p] as const,
    transactions: (id: string, p: unknown) => ['admin', 'inventory', id, 'tx', p] as const,
    orders: (p: unknown) => ['admin', 'orders', p] as const,
    order: (id: string) => ['admin', 'order', id] as const,
  },
};

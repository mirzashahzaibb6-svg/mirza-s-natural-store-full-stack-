import type { Request } from 'express';
import type { Role } from '../database/prisma';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type AuthedRequest = Request & { user?: AuthUser };

export interface PageMeta {
  total: number;
  currentPage: number;
  limit: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

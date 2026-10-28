import { request } from '@/lib/networking/request';
import type { AuthResponse, UserDto } from './types';

export const registerUser = (body: { name: string; email: string; password: string }) =>
  request<AuthResponse>('/auth/register', { method: 'POST', body, auth: false });
export const loginUser = (body: { email: string; password: string }) =>
  request<AuthResponse>('/auth/login', { method: 'POST', body, auth: false });
export const fetchMe = () => request<UserDto>('/auth/me');

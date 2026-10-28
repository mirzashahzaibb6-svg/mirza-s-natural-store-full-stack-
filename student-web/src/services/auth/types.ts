export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  isActive: boolean;
  totalOrders: number;
  totalSpent: string;
  createdAt: string;
}
export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

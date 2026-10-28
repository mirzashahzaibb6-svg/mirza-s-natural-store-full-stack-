import type { UserResponse } from '../users/types';

export interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}

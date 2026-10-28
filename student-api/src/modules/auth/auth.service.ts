import { ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { BCRYPT_COST } from '../../common/constants';
import type { User } from '../../database/prisma';
import { toUserResponse } from '../users/user.mapper';
import { UsersDbService } from '../users/users.db.service';
import type { UserResponse } from '../users/types';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { AuthResponse } from './types';

// Used so unknown e-mails cost the same time as wrong passwords (no user enumeration).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);
export const INVALID_CREDENTIALS = 'Invalid email or password';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly users: UsersDbService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    const user = await this.users.createCustomer({ name: dto.name, email: dto.email, passwordHash });
    this.logger.log(`registered user=${user.id}`);
    return this.buildResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email);
    const matches = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !matches) throw new UnauthorizedException(INVALID_CREDENTIALS);
    if (!user.isActive) throw new ForbiddenException('Account is deactivated');
    this.logger.log(`login user=${user.id}`);
    return this.buildResponse(user);
  }

  async me(userId: string): Promise<UserResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid or expired token');
    return toUserResponse(user);
  }

  private async buildResponse(user: User): Promise<AuthResponse> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user: toUserResponse(user) };
  }
}

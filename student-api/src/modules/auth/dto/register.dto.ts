import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Lower, Trim } from '../../../common/decorators/transforms';
import { PASSWORD_MAX, PASSWORD_MIN } from '../../../common/constants';

// No "role" (or isActive/totalSpent...) here on purpose: forbidNonWhitelisted rejects them with 400.
export class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(100) @Trim()
  name!: string;

  @IsEmail() @MaxLength(255) @Lower()
  email!: string;

  @IsString() @MinLength(PASSWORD_MIN) @MaxLength(PASSWORD_MAX)
  password!: string;
}

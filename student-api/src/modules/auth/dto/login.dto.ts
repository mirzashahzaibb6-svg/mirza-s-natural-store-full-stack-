import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Lower } from '../../../common/decorators/transforms';
import { PASSWORD_MAX, PASSWORD_MIN } from '../../../common/constants';

export class LoginDto {
  @IsEmail() @MaxLength(255) @Lower()
  email!: string;

  @IsString() @MinLength(PASSWORD_MIN) @MaxLength(PASSWORD_MAX)
  password!: string;
}

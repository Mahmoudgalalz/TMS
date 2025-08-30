import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@service-ticket/types';

export class RegisterDto {
  @ApiProperty({
    description: 'User username',
    example: 'john.doe',
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@company.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.ASSOCIATE,
  })
  @IsEnum(UserRole)
  role: UserRole;
}

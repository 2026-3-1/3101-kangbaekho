import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: '이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '비밀번호 (최소 6자)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: '역할 (student | instructor | admin)', default: 'student' })
  @IsString()
  @IsOptional()
  @IsIn(['student', 'instructor', 'admin'])
  role?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['student', 'instructor', 'admin'] })
  @IsIn(['student', 'instructor', 'admin'])
  role: 'student' | 'instructor' | 'admin';
}

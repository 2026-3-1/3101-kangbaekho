import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ description: '사용자 ID' })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: '강의 ID' })
  @IsNumber()
  course_id: number;
}

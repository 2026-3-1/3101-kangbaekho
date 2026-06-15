import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class TossPrepareDto {
  @ApiProperty({ description: '결제할 강의 ID 목록', example: [1, 2] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  course_ids: number[];
}

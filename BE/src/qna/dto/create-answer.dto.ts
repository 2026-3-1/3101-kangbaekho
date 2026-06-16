import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAnswerDto {
  @ApiProperty({ description: '답변 본문' })
  @IsString()
  @IsNotEmpty()
  body: string;
}

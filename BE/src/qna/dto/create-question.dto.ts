import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ description: '제목' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '본문' })
  @IsString()
  @IsNotEmpty()
  body: string;
}

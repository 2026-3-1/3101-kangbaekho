import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ description: '강의 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '강의 설명' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '강사 이름' })
  @IsString()
  @IsNotEmpty()
  instructor: string;

  @ApiProperty({ description: '카테고리' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: '수강료' })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: '썸네일 URL' })
  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @ApiPropertyOptional({ description: '강의 영상 YouTube URL' })
  @IsString()
  @IsOptional()
  youtube_url?: string;

  @ApiProperty({ description: '최대 수강 인원' })
  @IsNumber()
  max_students: number;
}

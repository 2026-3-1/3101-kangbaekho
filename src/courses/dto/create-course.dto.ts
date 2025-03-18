import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  instructor: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @IsNumber()
  max_students: number;
}

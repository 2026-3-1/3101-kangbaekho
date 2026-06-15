import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiPropertyOptional({ description: '진도율 (0~100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress_percent?: number;

  @ApiPropertyOptional({ description: '마지막으로 시청한 영상의 초 위치' })
  @IsOptional()
  @IsInt()
  @Min(0)
  last_position_seconds?: number;
}

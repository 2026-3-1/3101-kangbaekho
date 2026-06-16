import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin-jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get('runs')
  @ApiOperation({ summary: '배치 작업 실행 이력 (관리자)' })
  listRuns(
    @Query('name') name?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.jobs.listRuns({
      name,
      status,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post(':name/run')
  @ApiOperation({ summary: '배치 작업 수동 실행 (관리자)' })
  run(@Param('name') name: string) {
    return this.jobs.runByName(name);
  }
}

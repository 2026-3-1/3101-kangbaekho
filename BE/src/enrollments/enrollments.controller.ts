import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
  id: number;
  email: string;
  role: string;
}

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '수강 등록 (관리자 전용 — 학생은 POST /payments 사용)' })
  @ApiResponse({ status: 201, description: '수강 등록 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음 (학생은 결제를 통해 수강 등록)' })
  @ApiResponse({ status: 404, description: '사용자 또는 강의를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 수강 신청된 강의' })
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '수강/진도 정보 조회 (본인 / 해당 강사 / 관리자)' })
  @ApiResponse({ status: 200, description: '수강/진도 정보' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '수강 신청 내역 없음' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enrollmentsService.findOneForViewer(id, user.id, user.role);
  }

  @Patch(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '진도율 업데이트 (수강 본인 또는 관리자)' })
  @ApiResponse({ status: 200, description: '진도율 업데이트 성공' })
  @ApiResponse({ status: 403, description: '본인의 진도만 업데이트 가능' })
  @ApiResponse({ status: 404, description: '수강 신청 내역 없음' })
  updateProgress(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enrollmentsService.updateProgress(id, user.id, user.role, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '수강 신청 취소 (본인 또는 관리자)' })
  @ApiResponse({ status: 204, description: '수강 신청 취소 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '타인의 수강 신청은 취소 불가' })
  @ApiResponse({ status: 404, description: '수강 신청 내역 없음' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enrollmentsService.remove(id, user.id, user.role);
  }
}

import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
  id: number;
  email: string;
  role: string;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: '사용자 단건 조회 (공개)' })
  @ApiResponse({ status: 200, description: '사용자 조회 성공' })
  @ApiResponse({ status: 404, description: '사용자 없음' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get(':id/enrollments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 수강 목록 조회 (본인 또는 관리자)' })
  @ApiResponse({ status: 200, description: '강의 정보와 함께 수강 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '타인의 수강 목록 조회 불가' })
  @ApiResponse({ status: 404, description: '사용자 없음' })
  findEnrollments(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    if (user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('본인의 수강 목록만 조회할 수 있습니다.');
    }
    return this.usersService.findEnrollments(id);
  }
}

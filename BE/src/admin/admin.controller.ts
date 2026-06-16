import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
  id: number;
  email: string;
  role: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AuditService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: '운영 통계 (관리자)' })
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  @ApiOperation({ summary: '사용자 목록 (관리자)' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listUsers(
    @Query('role') role?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listUsers({
      role,
      q,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: '사용자 권한 변경 (관리자)' })
  updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.admin.updateUserRole(id, dto.role, user);
  }

  @Get('payments')
  @ApiOperation({ summary: '결제 내역 전체 (관리자)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listPayments(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listPayments({
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('logs')
  @ApiOperation({ summary: '운영 로그 조회 (관리자)' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'actor_id', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listLogs(
    @Query('action') action?: string,
    @Query('actor_id') actorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.audit.list({
      action,
      actor_id: actorId ? Number(actorId) : undefined,
      from,
      to,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('logs/actions')
  @ApiOperation({ summary: '운영 로그의 액션 종류 목록 (필터용)' })
  listLogActions() {
    return this.audit.distinctActions();
  }
}

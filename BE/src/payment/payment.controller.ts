import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { TossPrepareDto } from './dto/toss-prepare.dto';
import { TossConfirmDto } from './dto/toss-confirm.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student', 'admin')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: '장바구니 결제 → 수강 등록 (레거시/관리자용)' })
  checkout(
    @CurrentUser() user: { id: number },
    @Body('course_ids') courseIds: number[],
  ) {
    return this.paymentService.checkout(user.id, courseIds);
  }

  @Post('toss/prepare')
  @HttpCode(201)
  @ApiOperation({ summary: 'Toss 결제 준비 (orderId, amount 발급)' })
  @ApiResponse({ status: 201, description: 'orderId, amount, orderName 반환' })
  @ApiResponse({ status: 409, description: '이미 수강 중인 강의 포함' })
  tossPrepare(
    @CurrentUser() user: { id: number },
    @Body() dto: TossPrepareDto,
  ) {
    return this.paymentService.tossPrepare(user.id, dto.course_ids);
  }

  @Post('toss/confirm')
  @HttpCode(201)
  @ApiOperation({ summary: 'Toss 결제 승인 → 수강 등록 완료' })
  @ApiResponse({ status: 201, description: '결제 승인 + 수강 등록 완료' })
  @ApiResponse({ status: 400, description: 'Toss 승인 실패 또는 금액 불일치' })
  @ApiResponse({ status: 403, description: '본인의 주문이 아님' })
  @ApiResponse({ status: 404, description: '주문 없음' })
  @ApiResponse({ status: 409, description: '이미 처리된 주문' })
  tossConfirm(
    @CurrentUser() user: { id: number },
    @Body() dto: TossConfirmDto,
  ) {
    return this.paymentService.tossConfirm(
      user.id,
      dto.paymentKey,
      dto.orderId,
      dto.amount,
    );
  }

  @Get()
  @ApiOperation({ summary: '결제 내역 조회' })
  getHistory(@CurrentUser() user: { id: number }) {
    return this.paymentService.getHistory(user.id);
  }

  @Get(':id/receipt')
  @ApiOperation({ summary: '결제 영수증 조회 (본인 또는 관리자)' })
  @ApiResponse({ status: 200, description: '영수증 데이터' })
  @ApiResponse({ status: 403, description: '본인의 영수증만 조회 가능' })
  @ApiResponse({ status: 404, description: '결제 내역 없음' })
  getReceipt(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.paymentService.getReceipt(id, user.id, user.role);
  }
}

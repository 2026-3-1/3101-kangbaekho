import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
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
  @ApiOperation({ summary: '장바구니 결제 → 수강 등록' })
  checkout(
    @CurrentUser() user: { id: number },
    @Body('course_ids') courseIds: number[],
  ) {
    return this.paymentService.checkout(user.id, courseIds);
  }

  @Get()
  @ApiOperation({ summary: '결제 내역 조회' })
  getHistory(@CurrentUser() user: { id: number }) {
    return this.paymentService.getHistory(user.id);
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class TossConfirmDto {
  @ApiProperty({ description: 'Toss가 발급한 paymentKey' })
  @IsString()
  @IsNotEmpty()
  paymentKey: string;

  @ApiProperty({ description: '클라이언트가 사용한 orderId' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: '결제 금액 (원)' })
  @IsInt()
  @Min(0)
  amount: number;
}

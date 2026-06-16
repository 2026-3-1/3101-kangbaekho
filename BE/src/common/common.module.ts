import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { IdempotencyService } from './idempotency.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([IdempotencyKey])],
  providers: [IdempotencyService],
  exports: [IdempotencyService],
})
export class CommonModule {}

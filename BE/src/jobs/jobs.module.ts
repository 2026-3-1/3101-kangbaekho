import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobRun } from '../entities/job-run.entity';
import { Payment } from '../entities/payment.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JobRun, Payment, IdempotencyKey])],
  providers: [JobsService],
  controllers: [JobsController],
  exports: [JobsService],
})
export class JobsModule {}

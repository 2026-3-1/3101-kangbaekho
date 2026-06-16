import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, Repository } from 'typeorm';
import { JobRun } from '../entities/job-run.entity';
import { Payment } from '../entities/payment.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';

export interface JobResult {
  processed: number;
  detail?: Record<string, unknown>;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(JobRun) private readonly runRepo: Repository<JobRun>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(IdempotencyKey)
    private readonly idemRepo: Repository<IdempotencyKey>,
  ) {}

  /**
   * 작업 실행 래퍼 — 시작/종료/실패를 job_runs 테이블에 기록한다.
   * 실패해도 cron 전체를 중단시키지 않는다.
   */
  async runTracked(name: string, fn: () => Promise<JobResult>): Promise<JobRun> {
    const startedAt = new Date();
    const run = await this.runRepo.save(
      this.runRepo.create({
        name,
        status: 'running',
        started_at: startedAt,
        processed: 0,
      }),
    );
    try {
      const result = await fn();
      const finished = new Date();
      run.status = 'success';
      run.finished_at = finished;
      run.duration_ms = finished.getTime() - startedAt.getTime();
      run.processed = result.processed;
      run.detail = result.detail ? JSON.stringify(result.detail) : null;
      return await this.runRepo.save(run);
    } catch (err) {
      const finished = new Date();
      run.status = 'failed';
      run.finished_at = finished;
      run.duration_ms = finished.getTime() - startedAt.getTime();
      run.error = (err as Error).message ?? String(err);
      await this.runRepo.save(run).catch(() => undefined);
      this.logger.error(`job=${name} failed: ${run.error}`);
      return run;
    }
  }

  // ─────────────────── Cron 작업 ───────────────────
  // 매 시간 정각 — 30분 이상 'pending' 상태로 남아있는 주문을 expired 처리
  @Cron(CronExpression.EVERY_HOUR, { name: 'expire-stale-pending-payments' })
  async expireStalePendingPayments() {
    await this.runTracked('expire-stale-pending-payments', async () => {
      const threshold = new Date(Date.now() - 30 * 60 * 1000);
      const stale = await this.paymentRepo.find({
        where: { status: 'pending', created_at: LessThan(threshold) },
      });
      for (const p of stale) {
        p.status = 'expired';
        await this.paymentRepo.save(p);
      }
      return { processed: stale.length, detail: { threshold: threshold.toISOString() } };
    });
  }

  // 매일 03:00 — 30일 지난 idempotency key 청소 + 90일 지난 job 로그 보관 회수
  @Cron('0 0 3 * * *', { name: 'cleanup-old-records' })
  async cleanupOldRecords() {
    await this.runTracked('cleanup-old-records', async () => {
      const idemBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const jobBefore = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const idemRes = await this.idemRepo.delete({
        created_at: LessThan(idemBefore),
      });
      const jobRes = await this.runRepo.delete({
        created_at: LessThan(jobBefore),
        status: Not('running'),
      });
      return {
        processed:
          (idemRes.affected ?? 0) + (jobRes.affected ?? 0),
        detail: {
          idempotency_purged: idemRes.affected ?? 0,
          job_runs_purged: jobRes.affected ?? 0,
        },
      };
    });
  }

  // 관리자 수동 실행용
  async runByName(name: string): Promise<JobRun> {
    switch (name) {
      case 'expire-stale-pending-payments':
        return this.runTracked(name, async () => {
          await this.expireStalePendingPayments();
          // 위는 자체 runTracked 를 호출하므로 여기선 thin wrapper
          return { processed: 0 };
        });
      case 'cleanup-old-records':
        return this.runTracked(name, async () => {
          await this.cleanupOldRecords();
          return { processed: 0 };
        });
      default:
        throw new Error(`Unknown job: ${name}`);
    }
  }

  async listRuns(query: { name?: string; status?: string; limit?: number }) {
    const limit = Math.min(200, Math.max(1, query.limit ?? 50));
    const qb = this.runRepo
      .createQueryBuilder('r')
      .orderBy('r.created_at', 'DESC')
      .take(limit);
    if (query.name) qb.andWhere('r.name = :n', { n: query.name });
    if (query.status) qb.andWhere('r.status = :s', { s: query.status });
    return qb.getMany();
  }
}

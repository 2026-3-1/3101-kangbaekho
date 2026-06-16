import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyKey } from '../entities/idempotency-key.entity';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly repo: Repository<IdempotencyKey>,
  ) {}

  /**
   * key + scope 단위로 작업을 1회만 수행한다.
   *  - 첫 호출: fn 실행 → 결과 캐싱 → 반환
   *  - 같은 key 재호출: 캐시된 결과 반환 (네트워크 재시도 안전)
   *  - 동시 다발 호출: unique 제약으로 conflict → 409 ConflictException
   */
  async runOnce<T>(
    scope: string,
    key: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    let row: IdempotencyKey | null = null;
    try {
      row = this.repo.create({ scope, key, status: 'pending' });
      row = await this.repo.save(row);
    } catch (err) {
      // unique 충돌 — 이미 같은 key 가 있다는 뜻
      const existing = await this.repo.findOne({ where: { scope, key } });
      if (!existing) throw err;
      if (existing.status === 'completed' && existing.response) {
        return JSON.parse(existing.response) as T;
      }
      throw new ConflictException(
        '동일한 요청이 이미 처리 중입니다. 잠시 후 다시 시도해주세요.',
      );
    }

    try {
      const result = await fn();
      row.status = 'completed';
      row.response = JSON.stringify(result ?? null);
      await this.repo.save(row);
      return result;
    } catch (err) {
      row.status = 'failed';
      row.response = JSON.stringify({
        message: (err as Error).message ?? 'unknown',
      });
      await this.repo.save(row).catch(() => undefined);
      throw err;
    }
  }
}

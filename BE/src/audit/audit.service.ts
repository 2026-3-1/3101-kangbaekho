import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

export interface AuditEntry {
  actor_id: number | null;
  actor_role?: string | null;
  action: string;
  target_type?: string | null;
  target_id?: number | null;
  detail?: string | Record<string, unknown> | null;
}

export interface AuditQuery {
  action?: string;
  actor_id?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      const detail =
        entry.detail == null
          ? null
          : typeof entry.detail === 'string'
            ? entry.detail
            : JSON.stringify(entry.detail);
      const log = this.repo.create({
        actor_id: entry.actor_id ?? null,
        actor_role: entry.actor_role ?? null,
        action: entry.action,
        target_type: entry.target_type ?? null,
        target_id: entry.target_id ?? null,
        detail,
      });
      await this.repo.save(log);
    } catch (err) {
      this.logger.warn(
        `audit log write failed: ${(err as Error).message ?? err}`,
      );
    }
  }

  async list(query: AuditQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(200, Math.max(1, query.limit ?? 50));

    const qb = this.repo
      .createQueryBuilder('log')
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.action) {
      qb.andWhere('log.action = :action', { action: query.action });
    }
    if (query.actor_id != null) {
      qb.andWhere('log.actor_id = :actor_id', { actor_id: query.actor_id });
    }
    if (query.from && query.to) {
      qb.andWhere('log.created_at BETWEEN :from AND :to', {
        from: query.from,
        to: query.to,
      });
    } else if (query.from) {
      qb.andWhere('log.created_at >= :from', { from: query.from });
    } else if (query.to) {
      qb.andWhere('log.created_at <= :to', { to: query.to });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async distinctActions(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('log')
      .select('DISTINCT log.action', 'action')
      .orderBy('log.action', 'ASC')
      .getRawMany<{ action: string }>();
    return rows.map((r) => r.action);
  }

  // 도우미 — 다른 모듈에서 의도를 명확히 표현하기 위해 사용
  static actions = {
    COURSE_CREATE: 'course.create',
    COURSE_UPDATE: 'course.update',
    COURSE_DELETE: 'course.delete',
    USER_REGISTER: 'user.register',
    USER_ROLE_CHANGE: 'user.role_change',
    ENROLLMENT_CANCEL: 'enrollment.cancel',
    PAYMENT_COMPLETE: 'payment.complete',
    QNA_QUESTION_CREATE: 'qna.question.create',
    QNA_ANSWER_CREATE: 'qna.answer.create',
  } as const;
}

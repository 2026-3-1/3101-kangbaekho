import { Controller, Get, Header, HttpCode } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { metrics } from '../common/metrics';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  checks: Record<string, { ok: boolean; detail?: string }>;
  version?: string;
}

@ApiTags('ops')
@Controller()
export class HealthController {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  /** 가벼운 liveness — 프로세스가 살아있는지만 본다. */
  @Get('healthz')
  @HttpCode(200)
  @ApiOperation({ summary: 'Liveness probe' })
  livez(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /** Readiness — 트래픽 받을 수 있는지(DB 접근 가능?). */
  @Get('readyz')
  @ApiOperation({ summary: 'Readiness probe (DB ping 포함)' })
  async readyz(): Promise<HealthStatus> {
    const checks: HealthStatus['checks'] = {};
    let ok = true;

    try {
      await this.db.query('SELECT 1');
      checks.database = { ok: true };
    } catch (err) {
      checks.database = { ok: false, detail: (err as Error).message };
      ok = false;
    }

    return {
      status: ok ? 'ok' : 'down',
      uptime: Math.round(process.uptime()),
      checks,
      version: process.env.APP_VERSION ?? 'dev',
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus 텍스트 메트릭' })
  @Header('Content-Type', 'text/plain; version=0.0.4')
  metrics(): string {
    return metrics.toPrometheusText();
  }

  @Get('metrics.json')
  @ApiOperation({ summary: '메트릭 JSON 스냅샷 (디버그용)' })
  metricsJson() {
    return metrics.snapshot();
  }
}

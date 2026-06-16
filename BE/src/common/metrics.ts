/**
 * 인-프로세스 카운터/히스토그램 — Prometheus 텍스트로 노출한다.
 *
 * 외부 라이브러리 의존 없이도 운영 가능한 최소 구현이다.
 * 더 정교한 라벨/델타가 필요하면 prom-client 로 교체.
 */
class MetricsRegistry {
  private requestCount = 0;
  private requestDurationSumMs = 0;
  private requestDurationBuckets: { le: number; count: number }[] = [
    { le: 50, count: 0 },
    { le: 100, count: 0 },
    { le: 250, count: 0 },
    { le: 500, count: 0 },
    { le: 1000, count: 0 },
    { le: 2500, count: 0 },
    { le: 5000, count: 0 },
    { le: Infinity, count: 0 },
  ];
  private statusCount: Record<string, number> = {};
  private errorCount = 0;
  private jobsByStatus: Record<string, number> = {};

  recordRequest(durationMs: number, status: number) {
    this.requestCount += 1;
    this.requestDurationSumMs += durationMs;
    const bucket = this.requestDurationBuckets.find((b) => durationMs <= b.le);
    if (bucket) bucket.count += 1;
    const klass = `${Math.floor(status / 100)}xx`;
    this.statusCount[klass] = (this.statusCount[klass] ?? 0) + 1;
  }

  incError() {
    this.errorCount += 1;
  }

  recordJob(status: 'success' | 'failed' | 'skipped' | 'running') {
    this.jobsByStatus[status] = (this.jobsByStatus[status] ?? 0) + 1;
  }

  snapshot() {
    return {
      request_count: this.requestCount,
      request_duration_sum_ms: this.requestDurationSumMs,
      request_duration_avg_ms:
        this.requestCount > 0
          ? Math.round(this.requestDurationSumMs / this.requestCount)
          : 0,
      status_class: { ...this.statusCount },
      error_count: this.errorCount,
      jobs_by_status: { ...this.jobsByStatus },
      process: {
        uptime_seconds: Math.round(process.uptime()),
        memory_rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    };
  }

  toPrometheusText(): string {
    const lines: string[] = [];
    const push = (s: string) => lines.push(s);

    push('# HELP http_requests_total Total HTTP requests served');
    push('# TYPE http_requests_total counter');
    push(`http_requests_total ${this.requestCount}`);

    push('# HELP http_request_errors_total Total error responses (4xx/5xx from interceptor)');
    push('# TYPE http_request_errors_total counter');
    push(`http_request_errors_total ${this.errorCount}`);

    push('# HELP http_request_duration_ms_sum Sum of HTTP request durations (ms)');
    push('# TYPE http_request_duration_ms_sum counter');
    push(`http_request_duration_ms_sum ${this.requestDurationSumMs}`);

    push('# HELP http_request_duration_ms_bucket Histogram of HTTP request durations (ms)');
    push('# TYPE http_request_duration_ms_bucket histogram');
    for (const b of this.requestDurationBuckets) {
      const le = b.le === Infinity ? '+Inf' : String(b.le);
      push(`http_request_duration_ms_bucket{le="${le}"} ${b.count}`);
    }

    for (const [klass, n] of Object.entries(this.statusCount)) {
      push(`http_responses_total{class="${klass}"} ${n}`);
    }

    for (const [status, n] of Object.entries(this.jobsByStatus)) {
      push(`jobs_total{status="${status}"} ${n}`);
    }

    push('# HELP process_uptime_seconds Process uptime in seconds');
    push('# TYPE process_uptime_seconds gauge');
    push(`process_uptime_seconds ${Math.round(process.uptime())}`);

    push('# HELP process_memory_rss_bytes Resident set size in bytes');
    push('# TYPE process_memory_rss_bytes gauge');
    push(`process_memory_rss_bytes ${process.memoryUsage().rss}`);

    return lines.join('\n') + '\n';
  }
}

export const metrics = new MetricsRegistry();

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { withRetry } from '../common/retry.util';

export interface MailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * 이메일 알림.
 *
 * - SMTP 설정(SMTP_HOST/PORT/USER/PASS)이 있으면 nodemailer 로 실전 송신.
 * - 없으면 stream transport 로 폴백(테스트/개발 환경) — 송신 내용은 로깅된다.
 * - 송신 실패는 재시도 정책(withRetry)에 위임한다.
 */
@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter!: nodemailer.Transporter;
  private fromAddress!: string;
  private liveTransport = false;
  private sent: { to: string; subject: string; at: string }[] = [];

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? '587');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.fromAddress =
      this.config.get<string>('MAIL_FROM') ?? 'no-reply@online-course.local';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.liveTransport = true;
      this.logger.log(`SMTP transport ready: ${host}:${port}`);
    } else {
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
      this.liveTransport = false;
      this.logger.warn(
        'SMTP 환경변수 미설정 — stream transport(드라이런)로 동작합니다.',
      );
    }
  }

  isLive(): boolean {
    return this.liveTransport;
  }

  /** 디버깅용 — dev 모드에서 보낸 메일을 조회 */
  recentSent(limit = 10) {
    return this.sent.slice(-limit);
  }

  async send(msg: MailMessage): Promise<{ accepted: boolean; messageId?: string }> {
    return withRetry(
      async (attempt) => {
        const info = await this.transporter.sendMail({
          from: this.fromAddress,
          to: msg.to,
          subject: msg.subject,
          text: msg.text,
          html: msg.html ?? (msg.text ? `<pre>${escapeHtml(msg.text)}</pre>` : undefined),
        });
        this.sent.push({
          to: msg.to,
          subject: msg.subject,
          at: new Date().toISOString(),
        });
        if (this.sent.length > 50) this.sent.shift();
        this.logger.log(
          `mail sent attempt=${attempt} to=${msg.to} subject="${msg.subject}" id=${info.messageId ?? '-'}`,
        );
        return { accepted: true, messageId: info.messageId };
      },
      {
        label: 'mail',
        maxAttempts: 3,
        initialDelayMs: 300,
      },
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

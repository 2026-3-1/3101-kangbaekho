import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Course } from './entities/course.entity';
import { User } from './entities/user.entity';
import { Enrollment } from './entities/enrollment.entity';
import { CartItem } from './entities/cart-item.entity';
import { Payment } from './entities/payment.entity';
import { PaymentItem } from './entities/payment-item.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { JobRun } from './entities/job-run.entity';
import { CoursesModule } from './courses/courses.module';
import { UsersModule } from './users/users.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { PaymentModule } from './payment/payment.module';
import { AuditModule } from './audit/audit.module';
import { QnaModule } from './qna/qna.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { HttpLogInterceptor } from './common/http-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [
          Course,
          User,
          Enrollment,
          CartItem,
          Payment,
          PaymentItem,
          AuditLog,
          Question,
          Answer,
          IdempotencyKey,
          JobRun,
        ],
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    NotificationsModule,
    CoursesModule,
    UsersModule,
    EnrollmentsModule,
    AuthModule,
    CartModule,
    PaymentModule,
    AuditModule,
    QnaModule,
    AdminModule,
    JobsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: HttpLogInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes({ path: '*splat', method: RequestMethod.ALL });
  }
}

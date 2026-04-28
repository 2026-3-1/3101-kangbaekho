import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Course } from './entities/course.entity';
import { User } from './entities/user.entity';
import { Enrollment } from './entities/enrollment.entity';
import { CartItem } from './entities/cart-item.entity';
import { Payment } from './entities/payment.entity';
import { PaymentItem } from './entities/payment-item.entity';
import { CoursesModule } from './courses/courses.module';
import { UsersModule } from './users/users.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [Course, User, Enrollment, CartItem, Payment, PaymentItem],
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
      }),
      inject: [ConfigService],
    }),
    CoursesModule,
    UsersModule,
    EnrollmentsModule,
    AuthModule,
    CartModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

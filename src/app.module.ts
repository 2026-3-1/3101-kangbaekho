import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Course } from './entities/course.entity';
import { User } from './entities/user.entity';
import { Enrollment } from './entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'online_course',
      entities: [Course, User, Enrollment],
      synchronize: true, // dev only
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

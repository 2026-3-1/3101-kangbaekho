import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../entities/question.entity';
import { Answer } from '../entities/answer.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { QnaController } from './qna.controller';
import { QnaService } from './qna.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Answer, Course, Enrollment]),
    AuditModule,
  ],
  controllers: [QnaController],
  providers: [QnaService],
})
export class QnaModule {}

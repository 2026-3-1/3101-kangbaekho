import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QnaService } from './qna.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
  id: number;
  email: string;
  role: string;
}

@ApiTags('qna')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class QnaController {
  constructor(private readonly qna: QnaService) {}

  @Get('courses/:id/questions')
  @ApiOperation({ summary: '강의 Q&A 목록 (수강생/강사/관리자)' })
  list(
    @Param('id', ParseIntPipe) courseId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.qna.listForCourse(courseId, user);
  }

  @Post('courses/:id/questions')
  @HttpCode(201)
  @ApiOperation({ summary: '질문 작성 (수강생/강사)' })
  createQuestion(
    @Param('id', ParseIntPipe) courseId: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.qna.createQuestion(courseId, user, dto);
  }

  @Get('questions/:id')
  @ApiOperation({ summary: '질문 상세 조회 (답변 포함)' })
  detail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.qna.getQuestion(id, user);
  }

  @Delete('questions/:id')
  @HttpCode(204)
  @ApiOperation({ summary: '질문 삭제 (작성자/해당 강사/관리자)' })
  deleteQuestion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.qna.deleteQuestion(id, user);
  }

  @Post('questions/:id/answers')
  @HttpCode(201)
  @ApiOperation({ summary: '답변 작성 (해당 강사/관리자만)' })
  addAnswer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAnswerDto,
  ) {
    return this.qna.addAnswer(id, user, dto);
  }

  @Delete('answers/:id')
  @HttpCode(204)
  @ApiOperation({ summary: '답변 삭제 (작성자/관리자)' })
  deleteAnswer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.qna.deleteAnswer(id, user);
  }
}

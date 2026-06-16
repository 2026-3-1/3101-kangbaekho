import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../entities/question.entity';
import { Answer } from '../entities/answer.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { AuditService } from '../audit/audit.service';

export interface ViewerContext {
  id: number;
  role: string;
}

@Injectable()
export class QnaService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answerRepo: Repository<Answer>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    private readonly audit: AuditService,
  ) {}

  private async getCourseOr404(id: number): Promise<Course> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다.');
    return course;
  }

  private async canViewCourseQna(
    course: Course,
    viewer: ViewerContext,
  ): Promise<boolean> {
    if (viewer.role === 'admin') return true;
    if (viewer.role === 'instructor' && course.instructor_id === viewer.id)
      return true;
    const enrolled = await this.enrollmentRepo.findOne({
      where: { user_id: viewer.id, course_id: course.id },
    });
    return !!enrolled;
  }

  private canAnswer(course: Course, viewer: ViewerContext): boolean {
    if (viewer.role === 'admin') return true;
    return viewer.role === 'instructor' && course.instructor_id === viewer.id;
  }

  async listForCourse(courseId: number, viewer: ViewerContext) {
    const course = await this.getCourseOr404(courseId);
    if (!(await this.canViewCourseQna(course, viewer))) {
      throw new ForbiddenException('이 강의의 Q&A를 볼 수 없습니다.');
    }

    const rows = await this.questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.author', 'author')
      .leftJoin('q.answers', 'a')
      .loadRelationCountAndMap('q.answers_count', 'q.answers')
      .where('q.course_id = :cid', { cid: courseId })
      .orderBy('q.created_at', 'DESC')
      .getMany();

    return rows.map((q) => ({
      id: q.id,
      title: q.title,
      author: q.author
        ? { id: q.author.id, name: q.author.name, role: q.author.role }
        : null,
      created_at: q.created_at,
      answers_count: (q as Question & { answers_count: number }).answers_count,
      is_answered:
        ((q as Question & { answers_count: number }).answers_count ?? 0) > 0,
    }));
  }

  async createQuestion(
    courseId: number,
    viewer: ViewerContext,
    dto: CreateQuestionDto,
  ) {
    const course = await this.getCourseOr404(courseId);
    if (!(await this.canViewCourseQna(course, viewer))) {
      throw new ForbiddenException(
        '이 강의를 수강 중이거나 강사여야 질문을 작성할 수 있습니다.',
      );
    }
    const q = this.questionRepo.create({
      course_id: courseId,
      author_id: viewer.id,
      title: dto.title.trim(),
      body: dto.body,
    });
    const saved = await this.questionRepo.save(q);
    await this.audit.record({
      actor_id: viewer.id,
      actor_role: viewer.role,
      action: AuditService.actions.QNA_QUESTION_CREATE,
      target_type: 'question',
      target_id: saved.id,
      detail: { course_id: courseId, title: saved.title },
    });
    return saved;
  }

  async getQuestion(questionId: number, viewer: ViewerContext) {
    const question = await this.questionRepo.findOne({
      where: { id: questionId },
      relations: ['author'],
    });
    if (!question) throw new NotFoundException('질문을 찾을 수 없습니다.');
    const course = await this.getCourseOr404(question.course_id);
    if (!(await this.canViewCourseQna(course, viewer))) {
      throw new ForbiddenException('Q&A 조회 권한이 없습니다.');
    }
    const answers = await this.answerRepo.find({
      where: { question_id: questionId },
      relations: ['author'],
      order: { created_at: 'ASC' },
    });
    return {
      id: question.id,
      course_id: question.course_id,
      title: question.title,
      body: question.body,
      created_at: question.created_at,
      author: question.author
        ? {
            id: question.author.id,
            name: question.author.name,
            role: question.author.role,
          }
        : null,
      answers: answers.map((a) => ({
        id: a.id,
        body: a.body,
        created_at: a.created_at,
        author: a.author
          ? {
              id: a.author.id,
              name: a.author.name,
              role: a.author.role,
            }
          : null,
      })),
    };
  }

  async deleteQuestion(questionId: number, viewer: ViewerContext) {
    const q = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!q) throw new NotFoundException('질문을 찾을 수 없습니다.');
    const isAuthor = q.author_id === viewer.id;
    const isAdmin = viewer.role === 'admin';
    const course = await this.getCourseOr404(q.course_id);
    const isCourseInstructor =
      viewer.role === 'instructor' && course.instructor_id === viewer.id;
    if (!isAuthor && !isAdmin && !isCourseInstructor) {
      throw new ForbiddenException('질문을 삭제할 권한이 없습니다.');
    }
    await this.questionRepo.remove(q);
  }

  async addAnswer(
    questionId: number,
    viewer: ViewerContext,
    dto: CreateAnswerDto,
  ) {
    const q = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!q) throw new NotFoundException('질문을 찾을 수 없습니다.');
    const course = await this.getCourseOr404(q.course_id);
    if (!this.canAnswer(course, viewer)) {
      throw new ForbiddenException(
        '해당 강의의 강사 또는 관리자만 답변할 수 있습니다.',
      );
    }
    const a = this.answerRepo.create({
      question_id: questionId,
      author_id: viewer.id,
      body: dto.body,
    });
    const saved = await this.answerRepo.save(a);
    await this.audit.record({
      actor_id: viewer.id,
      actor_role: viewer.role,
      action: AuditService.actions.QNA_ANSWER_CREATE,
      target_type: 'answer',
      target_id: saved.id,
      detail: { question_id: questionId, course_id: q.course_id },
    });
    return saved;
  }

  async deleteAnswer(answerId: number, viewer: ViewerContext) {
    const a = await this.answerRepo.findOne({ where: { id: answerId } });
    if (!a) throw new NotFoundException('답변을 찾을 수 없습니다.');
    const isAuthor = a.author_id === viewer.id;
    const isAdmin = viewer.role === 'admin';
    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('답변을 삭제할 권한이 없습니다.');
    }
    await this.answerRepo.remove(a);
  }
}

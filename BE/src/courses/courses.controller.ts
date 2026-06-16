import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: '강의 목록 조회 (공개)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: '페이지네이션 적용된 강의 목록' })
  findAll(
    @Query('category') category?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.coursesService.findAll(category, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '강의 단건 조회 (공개)' })
  @ApiResponse({ status: 200, description: '강의 조회 성공' })
  @ApiResponse({ status: 404, description: '강의 없음' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '강의 생성 (강사/관리자 전용)' })
  @ApiResponse({ status: 201, description: '강의 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.coursesService.create(
      { ...createCourseDto, instructor_id: user.id },
      { id: user.id, role: user.role },
    );
  }

  @Get(':id/enrollments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '강의 수강생 목록 (해당 강사/관리자 전용)' })
  getCourseEnrollments(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.coursesService.getCourseEnrollments(id, user.id, user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '강의 수정 (강사/관리자 전용)' })
  @ApiResponse({ status: 200, description: '강의 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '강의 없음' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.coursesService.update(id, updateCourseDto, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '강의 삭제 (강사/관리자 전용)' })
  @ApiResponse({ status: 204, description: '강의 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '강의 없음' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.coursesService.remove(id, user.id, user.role);
  }
}

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
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: '강의 목록 조회' })
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
  @ApiOperation({ summary: '강의 단건 조회' })
  @ApiResponse({ status: 200, description: '강의 조회 성공' })
  @ApiResponse({ status: 404, description: '강의 없음' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: '강의 생성' })
  @ApiResponse({ status: 201, description: '강의 생성 성공' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '강의 수정 (부분 수정)' })
  @ApiResponse({ status: 200, description: '강의 수정 성공' })
  @ApiResponse({ status: 404, description: '강의 없음' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: '강의 삭제' })
  @ApiResponse({ status: 204, description: '강의 삭제 성공' })
  @ApiResponse({ status: 404, description: '강의 없음' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: '수강 신청' })
  @ApiResponse({ status: 201, description: '수강 신청 성공' })
  @ApiResponse({ status: 409, description: '이미 수강 신청된 강의' })
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: '수강 신청 취소' })
  @ApiResponse({ status: 204, description: '수강 신청 취소 성공' })
  @ApiResponse({ status: 404, description: '수강 신청 내역 없음' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentsService.remove(id);
  }
}

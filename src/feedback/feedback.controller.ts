import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedbackService } from './feedback.service';

export class CreateFeedbackDto {
  @ApiProperty({ example: 'Great app!' })
  @IsNotEmpty()
  @IsString()
  message!: string;
}

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit feedback' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Request() req: any, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(
      req.user.id,
      req.user.email,
      dto.message,
    );
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GenerateHabitsDto } from './dto/generate-habits.dto';
import { GeneratedHabitsResponseDto } from './dto/generated-habits-response.dto';
import { HabitsService } from './habits.service';

@ApiTags('Habits')
@ApiBearerAuth()
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate habit suggestions using AI based on goal and categories' })
  @ApiResponse({
    status: 201,
    description: 'Habits successfully generated',
    type: GeneratedHabitsResponseDto,
  })
  async generateHabits(@Body() generateHabitsDto: GenerateHabitsDto): Promise<GeneratedHabitsResponseDto> {
    return this.habitsService.generateHabits(
      generateHabitsDto.goal,
      generateHabitsDto.categories,
    );
  }
}

import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HabitResponseDto } from './dto/create-bulk-habits-response.dto';
import { CreateBulkHabitsDto } from './dto/create-bulk-habits.dto';
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
  @ApiOperation({
    summary: 'Generate habit suggestions using AI based on goal and categories',
  })
  @ApiResponse({
    status: 201,
    description: 'Habits successfully generated',
    type: GeneratedHabitsResponseDto,
  })
  async generateHabits(
    @Body() generateHabitsDto: GenerateHabitsDto,
  ): Promise<GeneratedHabitsResponseDto> {
    return this.habitsService.generateHabits(
      generateHabitsDto.goal,
      generateHabitsDto.categories,
    );
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bulk create habits from categories' })
  @ApiResponse({
    status: 201,
    description: 'Habits successfully created',
    type: [HabitResponseDto],
  })
  async createBulkHabits(
    @Request() req,
    @Body() createBulkHabitsDto: CreateBulkHabitsDto,
  ): Promise<HabitResponseDto[]> {
    console.log('user:', req.user);
    const habits = await this.habitsService.createBulkHabits(
      req.user.id,
      createBulkHabitsDto,
    );
    return habits.map((habit) => ({
      ...habit,
      frequencyJson: habit.frequencyJson as Record<string, any>,
    }));
  }
}

import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('radar')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get radar chart data' })
  @ApiResponse({
    status: 200,
    description: 'Radar chart data retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['week', '1m', '3m', '6m', '1y'],
  })
  getRadar(
    @Request() req: any,
    @Query('range') range?: 'week' | '1m' | '3m' | '6m' | '1y',
  ) {
    return this.analyticsService.getRadarData(req.user.id, range);
  }
}

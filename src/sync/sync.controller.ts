import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PullInputDto, PushInputDto } from './dto/sync.dto';
import { SyncService } from './sync.service';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Push data changes' })
  @ApiResponse({ status: 201, description: 'Data pushed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  push(@Request() req: any, @Body() input: PushInputDto) {
    return this.syncService.push(req.user.id, input.changes);
  }

  @Post('pull')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Pull data changes' })
  @ApiResponse({ status: 201, description: 'Data pulled successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  pull(@Request() req: any, @Body() input: PullInputDto) {
    return this.syncService.pull(req.user.id, input.last_pulled_at);
  }
}

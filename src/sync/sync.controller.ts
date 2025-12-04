import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncInputDto } from './dto/sync.dto';
import { SyncService } from './sync.service';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('api/v1/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sync data (Push & Pull)' })
  @ApiResponse({ status: 201, description: 'Data synced successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  sync(@Request() req: any, @Body() input: SyncInputDto) {
    return this.syncService.sync(req.user.userId, input);
  }
}

import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExportService } from './export.service';

export class ExportDataDto {
  @ApiProperty({ example: 'excel', enum: ['excel'] })
  @IsNotEmpty()
  @IsIn(['excel'])
  format!: 'excel';

  @ApiProperty({
    example: 'week',
    enum: ['week', '1m', '3m', '6m', '1y', 'all'],
  })
  @IsNotEmpty()
  @IsString()
  range!: string;
}

@ApiTags('Export')
@ApiBearerAuth()
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Request data export' })
  @ApiResponse({ status: 202, description: 'Export request accepted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  requestExport(@Request() req: any, @Body() dto: ExportDataDto) {
    return this.exportService.requestExport(req.user.id, dto.format, dto.range);
  }
}

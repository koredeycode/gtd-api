import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ExportController } from './export.controller';
import { ExportProcessor } from './export.processor';
import { ExportService } from './export.service';

@Module({
  imports: [
    DbModule,
    BullModule.registerQueue({
      name: 'export',
    }),
  ],
  controllers: [ExportController],
  providers: [ExportService, ExportProcessor],
})
export class ExportModule {}

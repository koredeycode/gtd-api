import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ExportService {
  constructor(
    @InjectQueue('export') private exportQueue: Queue,
  ) {}

  async requestExport(userId: string, format: 'csv' | 'excel', range: string) {
    await this.exportQueue.add('export-data', {
      userId,
      format,
      range,
    });

    return { message: 'Export request received. You will receive an email when it is ready.' };
  }
}

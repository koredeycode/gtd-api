import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { stringify } from 'csv-stringify/sync';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { DB_CONNECTION } from '../db/db.module';
import * as schema from '../db/schema';
import { habits, logs } from '../db/schema';

@Processor('export')
export class ExportProcessor {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  @Process('export-data')
  async handleExport(job: Job) {
    const { userId, format, range } = job.data;
    console.log(`Processing export for user ${userId} (Format: ${format}, Range: ${range})...`);

    // 1. Fetch Data
    const userHabits = await this.db.select().from(habits).where(eq(habits.userId, userId));
    const userLogs = await this.db.select().from(logs).where(eq(logs.userId, userId));
    
    // TODO: Apply range filtering to logs if needed
    
    // Prepare data for export
    const exportData = userLogs.map(log => {
      const habit = userHabits.find(h => h.id === log.habitId);
      return {
        Date: log.date,
        Habit: habit ? habit.title : 'Unknown Habit',
        Type: habit ? habit.type : 'Unknown',
        Value: this.formatLogValue(log, habit?.type),
      };
    });

    // 2. Generate File
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `export_${userId}_${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    const filePath = path.join(exportDir, filename);

    if (format === 'csv') {
      const csvOutput = stringify(exportData, { header: true });
      fs.writeFileSync(filePath, csvOutput);
    } else {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('My Data');
      
      sheet.columns = [
        { header: 'Date', key: 'Date', width: 15 },
        { header: 'Habit', key: 'Habit', width: 30 },
        { header: 'Type', key: 'Type', width: 15 },
        { header: 'Value', key: 'Value', width: 20 },
      ];

      sheet.addRows(exportData);
      await workbook.xlsx.writeFile(filePath);
    }

    console.log(`Export generated successfully: ${filePath}`);

    // 3. Send Email (Mocked for now, or use EmailProcessor logic if shared)
    console.log(`Sending export email to user... (Mocked)`);
  }

  private formatLogValue(log: any, type: string | undefined) {
    if (!type) return 'N/A';
    switch (type) {
      case 'BOOLEAN': return log.valBool ? 'Yes' : 'No';
      case 'NUMERIC': return log.valNumeric;
      case 'TEXT': return log.valText;
      case 'RATING': return `${log.valNumeric}/10`;
      case 'DURATION': return `${log.valNumeric} mins`;
      default: return 'N/A';
    }
  }
}

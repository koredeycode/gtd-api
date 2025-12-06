import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { DB_CONNECTION } from '../db/db.module';
import * as schema from '../db/schema';
import { categories, habits, logs } from '../db/schema';

@Processor('export')
export class ExportProcessor {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  @Process('export-data')
  async handleExport(job: Job) {
    const { userId, format, range } = job.data;
    console.log(`Processing export for user ${userId} (Format: ${format}, Range: ${range})...`);

    if (format !== 'excel') {
      console.log('Only Excel format is supported.');
      return;
    }


    // 1. Fetch Data
    const allCategories = await this.db.select().from(categories);
    const userHabits = await this.db.select().from(habits).where(eq(habits.userId, userId));
    const userLogs = await this.db.select().from(logs).where(eq(logs.userId, userId));

    // 2. Organize Data
    // Map: HabitId -> { DateString -> LogValue }
    const logsMap = new Map<string, Map<string, string>>();
    let minDate = new Date();
    let maxDate = new Date(0); // Epoch

    if (userLogs.length > 0) {
        userLogs.forEach(log => {
            if (!logsMap.has(log.habitId)) {
                logsMap.set(log.habitId, new Map());
            }
            // Removed habit lookup as type is no longer needed
            const val = this.formatLogValue(log);
            logsMap.get(log.habitId)?.set(log.date, val);

            const logDate = new Date(log.date);
            if (logDate < minDate) minDate = logDate;
            if (logDate > maxDate) maxDate = logDate;
        });
    } else {
        // Default range if no logs
        minDate = new Date();
        minDate.setDate(minDate.getDate() - 30);
        maxDate = new Date();
    }

    // 3. Generate Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Habit Tracker');

    // Calculate Month Spans
    const months: { year: number; month: number; days: number; startCol: number }[] = [];
    let currentCol = 2; // Start after 'Habit' column

    const start = new Date(minDate);
    start.setDate(1); // Start from 1st of the min month
    const end = new Date(maxDate);
    end.setDate(1); // Start of max month

    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        const year = d.getFullYear();
        const month = d.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        months.push({
            year,
            month,
            days: daysInMonth,
            startCol: currentCol
        });
        currentCol += daysInMonth;
    }

    // Row 1: Years (Merged) - Simplified: Just putting Year-Month in Row 1 for now or Year then Month
    // Let's do: Row 1 = Year, Row 2 = Month, Row 3 = Day
    
    const yearRow = sheet.getRow(1);
    const monthRow = sheet.getRow(2);
    const dayRow = sheet.getRow(3);

    // Initial Headers
    yearRow.getCell(1).value = 'Category / Habit';
    sheet.mergeCells(1, 1, 3, 1); // Merge first column rows 1-3
    sheet.getColumn(1).width = 30;

    months.forEach(m => {
        // Year Header (Simplification: Merge per month block for now, or track year spans)
        // Let's just put Year-Month in Row 2 and merge Row 1 if same year?
        // User asked: "group into year, then month"
        
        const monthName = new Date(m.year, m.month).toLocaleString('default', { month: 'long' });
        
        // Set Month Header
        monthRow.getCell(m.startCol).value = `${monthName} ${m.year}`;
        sheet.mergeCells(2, m.startCol, 2, m.startCol + m.days - 1);
        monthRow.getCell(m.startCol).alignment = { horizontal: 'center' };
        monthRow.getCell(m.startCol).font = { bold: true };

        // Set Days
        for (let i = 1; i <= m.days; i++) {
            const colIdx = m.startCol + i - 1;
            dayRow.getCell(colIdx).value = i;
            sheet.getColumn(colIdx).width = 4; // Narrow columns for days
            dayRow.getCell(colIdx).alignment = { horizontal: 'center' };
        }
    });

    // Completion Rate Column
    const rateColIdx = currentCol;
    yearRow.getCell(rateColIdx).value = 'Completion Rate';
    sheet.mergeCells(1, rateColIdx, 3, rateColIdx);
    sheet.getColumn(rateColIdx).width = 15;
    yearRow.getCell(rateColIdx).font = { bold: true };

    // Iterate Categories & Habits
    let currentRowIdx = 4;
    for (const category of allCategories) {
        const catHabits = userHabits.filter(h => h.categoryId === category.id);
        
        if (catHabits.length > 0) {
            // Category Row
            const catRow = sheet.getRow(currentRowIdx++);
            catRow.getCell(1).value = category.name;
            catRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            catRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
            sheet.mergeCells(currentRowIdx - 1, 1, currentRowIdx - 1, rateColIdx);

            // Habit Rows
            for (const habit of catHabits) {
                const row = sheet.getRow(currentRowIdx++);
                row.getCell(1).value = habit.title;
                
                const habitLogs = logsMap.get(habit.id);
                let completedCount = 0;
                let totalDays = 0;

                months.forEach(m => {
                    for (let i = 1; i <= m.days; i++) {
                        const dateStr = new Date(Date.UTC(m.year, m.month, i)).toISOString().split('T')[0];
                        const val = habitLogs?.get(dateStr);
                        const colIdx = m.startCol + i - 1;

                        if (val) {
                            row.getCell(colIdx).value = val;
                            row.getCell(colIdx).alignment = { horizontal: 'center' };
                            completedCount++; // Assuming any log = complete for now
                        }
                        totalDays++;
                    }
                });

                // Calculate Rate
                const rate = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
                row.getCell(rateColIdx).value = `${rate}%`;
                row.getCell(rateColIdx).alignment = { horizontal: 'center' };
            }
        }
    }

    // 4. Save File
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `export_${userId}_${timestamp}.xlsx`;
    const filePath = path.join(exportDir, filename);

    await workbook.xlsx.writeFile(filePath);

    console.log(`Export generated successfully: ${filePath}`);

    // 5. Send Email (Mocked)
    console.log(`Sending export email to user... (Mocked)`);
  }

  private formatLogValue(log: any) {
    if (log.value) {
        return log.text ? `✓ (${log.text})` : '✓';
    }
    return ''; // Only showing completed habits
  }
}

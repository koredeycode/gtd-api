import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../db/db.module';
import * as schema from '../db/schema';
import { categories, habits, logs } from '../db/schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async getRadarData(userId: string, range: 'week' | '1m' | '3m' | '6m' | '1y' = 'week') {
    const now = new Date();
    let startDate = new Date();
    const endDate = new Date();

    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case '1m':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Fetch categories
    const allCategories = await this.db.select().from(categories);
    
    // Fetch habits
    const userHabits = await this.db.select().from(habits).where(eq(habits.userId, userId));

    // Fetch logs for the range
    const userLogs = await this.db.select().from(logs).where(
      and(
        eq(logs.userId, userId),
        gte(logs.date, startDate.toISOString().split('T')[0]),
        lte(logs.date, endDate.toISOString().split('T')[0])
      )
    );

    const labels: string[] = [];
    const data: number[] = [];

    for (const category of allCategories) {
      labels.push(category.name);
      
      const categoryHabits = userHabits.filter(h => h.categoryId === category.id);
      if (categoryHabits.length === 0) {
        data.push(0);
        continue;
      }

      let totalCompletion = 0;
      let habitCount = 0;

      for (const habit of categoryHabits) {
        const habitLogs = userLogs.filter(l => l.habitId === habit.id);
        let isCompleted = false;

        if (habit.type === 'BOOLEAN') {
          isCompleted = habitLogs.some(l => l.valBool === true);
        } else if (habit.type === 'NUMERIC') {
          isCompleted = habitLogs.some(l => (l.valNumeric || 0) >= (habit.targetValue || 0));
        } else if (habit.type === 'RATING') {
          // For rating, we might consider "completed" if a rating exists, or if it's above a threshold.
          // Let's assume simply logging a rating counts as completion for now.
          isCompleted = habitLogs.some(l => l.valNumeric !== null);
        } else if (habit.type === 'DURATION') {
          isCompleted = habitLogs.some(l => (l.valNumeric || 0) >= (habit.targetValue || 0));
        } else {
           isCompleted = habitLogs.length > 0;
        }

        if (isCompleted) {
          totalCompletion += 1;
        }
        habitCount++;
      }

      data.push(habitCount > 0 ? Math.round((totalCompletion / habitCount) * 100) : 0);
    }

    return { labels, data };
  }
}

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

        // Since all habits are now boolean, checks are simple:
        // if there is a log with value === true, it is completed.
        // Assuming logs usually mean completion in this new model.
        isCompleted = habitLogs.some(l => l.value === true);

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

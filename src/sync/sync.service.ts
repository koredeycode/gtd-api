import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../db/db.module';
import * as schema from '../db/schema';
import { habits, logs } from '../db/schema';
import { PushInputDto } from './dto/sync.dto';

@Injectable()
export class SyncService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async push(userId: string, changes: PushInputDto['changes']) {
    await this.db.transaction(async (tx) => {
      // Process Habits
      if (changes.habits) {
        const { created, updated, deleted } = changes.habits;
        const upserts = [...created, ...updated];

        for (const item of upserts) {
          await tx
            .insert(habits)
            .values({
              id: item.id,
              userId,
              categoryId: item.category_id,
              title: item.title,
              frequencyJson: item.frequency_json,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: habits.id,
              set: {
                categoryId: item.category_id,
                title: item.title,
                frequencyJson: item.frequency_json,
                updatedAt: new Date(),
              },
            });
        }

        if (deleted.length > 0) {
          await tx
            .update(habits)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(and(inArray(habits.id, deleted), eq(habits.userId, userId)));
        }
      }

      // Process Logs
      if (changes.logs) {
        const { created, updated, deleted } = changes.logs;
        const upserts = [...created, ...updated];

        for (const item of upserts) {
          await tx
            .insert(logs)
            .values({
              id: item.id,
              habitId: item.habit_id,
              userId,
              date: item.date,
              text: item.text,
              value: item.value,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: logs.id,
              set: {
                habitId: item.habit_id,
                date: item.date,
                text: item.text,
                value: item.value,
                updatedAt: new Date(),
              },
            });
        }

        if (deleted.length > 0) {
          await tx
            .update(logs)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(and(inArray(logs.id, deleted), eq(logs.userId, userId)));
        }
      }
    });

    return {
      changes,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  async pull(userId: string, lastPulledAtTimestamp: number) {
    const lastPulledAt = new Date(lastPulledAtTimestamp * 1000);

    const pulledHabits = await this.db
      .select()
      .from(habits)
      .where(
        and(eq(habits.userId, userId), gt(habits.updatedAt, lastPulledAt)),
      );

    const pulledLogs = await this.db
      .select()
      .from(logs)
      .where(and(eq(logs.userId, userId), gt(logs.updatedAt, lastPulledAt)));

    console.log(pulledLogs[1]);

    return {
      changes: {
        habits: {
          created: [],
          updated: pulledHabits
            .filter((h) => !h.deletedAt)
            .map((h) => ({
              id: h.id,
              user_id: h.userId,
              category_id: h.categoryId,
              title: h.title,
              frequency_json: h.frequencyJson,
              updated_at: h.updatedAt.toISOString(),
              deleted_at: h.deletedAt?.toISOString(),
            })),
          deleted: pulledHabits.filter((h) => h.deletedAt).map((h) => h.id),
        },
        logs: {
          created: [],
          updated: pulledLogs
            .filter((l) => !l.deletedAt)
            .map((l) => ({
              id: l.id,
              habit_id: l.habitId,
              user_id: l.userId,
              date: l.date,
              text: l.text || '',
              value: l.value || false,
              updated_at: l.updatedAt.toISOString(),
              deleted_at: l.deletedAt?.toISOString(),
            })),
          deleted: pulledLogs.filter((l) => l.deletedAt).map((l) => l.id),
        },
      },
      timestamp: Math.floor(Date.now() / 1000),
    };
  }
}

import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../db/db.module';
import * as schema from '../db/schema';
import { feedback } from '../db/schema';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async createFeedback(userId: string, email: string, message: string) {
    const [newFeedback] = await this.db.insert(feedback).values({
      userId,
      message,
    }).returning();

    // Trigger background email task
    await this.emailQueue.add('feedback-ack', {
      userId,
      email,
      feedbackId: newFeedback.id,
      message,
    });

    return newFeedback;
  }
}

import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { EmailProcessor } from './email.processor';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [
    DbModule,
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, EmailProcessor],
})
export class FeedbackModule {}

import { BullModule } from '@nestjs/bull';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { DbModule } from './db/db.module';
import { ExportModule } from './export/export.module';
import { FeedbackModule } from './feedback/feedback.module';
import { HabitsModule } from './habits/habits.module';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { SyncModule } from './sync/sync.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6380,
      },
    }),
    AuthModule,
    SyncModule,
    AnalyticsModule,
    CategoriesModule,
    UsersModule,
    FeedbackModule,
    ExportModule,
    HabitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';

@Module({
  imports: [ConfigModule],
  controllers: [HabitsController],
  providers: [HabitsService],
})
export class HabitsModule {}

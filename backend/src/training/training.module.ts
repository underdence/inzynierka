import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { TrainingSessionStore } from './training-session.store';

@Module({
  imports: [AuthModule],
  controllers: [TrainingController],
  providers: [TrainingService, TrainingSessionStore],
})
export class TrainingModule {}

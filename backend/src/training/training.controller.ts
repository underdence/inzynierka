import {
  Body,
  Controller,
  Header,
  Post,
  Get,
  Req,
  UseGuards,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PlayerAuthGuard } from '../auth/player-auth.guard';
import type { PlayerRequest } from '../auth/player-request';
import { StartTrainingDto } from './dto/start-training.dto';
import { TrainingService } from './training.service';
import type {
  StartTrainingResponse,
  TrainingAnswerResponse,
  TrainingQuestion,
  TrainingSummary,
} from './training.types';
import { SubmitTrainingAnswerDto } from './dto/submit-training-answer.dto';

@Controller('training')
@UseGuards(PlayerAuthGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post()
  @Header('Cache-Control', 'no-store')
  start(
    @Req() request: PlayerRequest,
    @Body() settings: StartTrainingDto,
  ): StartTrainingResponse {
    return this.trainingService.start(
      request.player.id,
      request.player.type,
      settings,
    );
  }
  @Post(':sessionId/answers')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  submitAnswer(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' }))
    sessionId: string,
    @Req() request: PlayerRequest,
    @Body() input: SubmitTrainingAnswerDto,
  ): TrainingAnswerResponse {
    return this.trainingService.submitAnswer(
      sessionId,
      request.player.id,
      request.player.type,
      input,
    );
  }

  @Get(':sessionId/question')
  @Header('Cache-Control', 'no-store')
  getCurrentQuestion(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' }))
    sessionId: string,
    @Req() request: PlayerRequest,
  ): TrainingQuestion {
    return this.trainingService.getCurrentQuestion(
      sessionId,
      request.player.id,
      request.player.type,
    );
  }

  @Get(':sessionId/summary')
  @Header('Cache-Control', 'no-store')
  getSummary(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' }))
    sessionId: string,
    @Req() request: PlayerRequest,
  ): TrainingSummary {
    return this.trainingService.getSummary(
      sessionId,
      request.player.id,
      request.player.type,
    );
  }
}

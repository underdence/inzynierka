import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
} from 'class-validator';
import type { Difficulty, Operation } from '../../math/math.types';
import type { TrainingDuration } from '../training.types';

export class StartTrainingDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsIn(['addition', 'subtraction', 'multiplication', 'division'], {
    each: true,
  })
  operations: Operation[];

  @IsIn(['easy', 'medium', 'hard'])
  difficulty: Difficulty;

  @IsInt()
  @IsIn([30, 60, 120])
  durationSeconds: TrainingDuration;
}

import { IsInt, IsUUID } from 'class-validator';

export class SubmitTrainingAnswerDto {
  @IsUUID('4')
  questionId: string;

  @IsInt()
  answer: number;
}

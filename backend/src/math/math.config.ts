import type { Difficulty } from './math.types';

interface NumberRange {
  min: number;
  max: number;
}

export const ADDITION_RANGES: Record<Difficulty, NumberRange> = {
  easy: { min: 0, max: 20 },
  medium: { min: 0, max: 100 },
  hard: { min: 0, max: 1000 },
};

interface SubtractionRange extends NumberRange {
  allowNegative: boolean;
}

export const SUBTRACTION_RANGES: Record<Difficulty, SubtractionRange> = {
  easy: { min: 0, max: 20, allowNegative: false },
  medium: { min: 0, max: 100, allowNegative: true },
  hard: { min: 0, max: 1000, allowNegative: true },
};

interface MultiplicationRanges {
  left: NumberRange;
  right: NumberRange;
}

export const MULTIPLICATION_RANGES: Record<Difficulty, MultiplicationRanges> = {
  easy: {
    left: { min: 1, max: 10 },
    right: { min: 1, max: 10 },
  },
  medium: {
    left: { min: 2, max: 12 },
    right: { min: 2, max: 12 },
  },
  hard: {
    left: { min: 2, max: 20 },
    right: { min: 2, max: 50 },
  },
};

interface DivisionRanges {
  divisor: NumberRange;
  answer: NumberRange;
}

export const DIVISION_RANGES: Record<Difficulty, DivisionRanges> = {
  easy: {
    divisor: { min: 1, max: 10 },
    answer: { min: 1, max: 10 },
  },
  medium: {
    divisor: { min: 2, max: 12 },
    answer: { min: 2, max: 12 },
  },
  hard: {
    divisor: { min: 2, max: 20 },
    answer: { min: 2, max: 50 },
  },
};

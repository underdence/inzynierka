export type Operator = '+' | '−' | '×' | '÷';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Question = { label: string; answer: number };
export type Attempt = { correct: boolean; durationMs: number };
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function generateQuestion(operator: Operator, difficulty: Difficulty): Question {
  const scale = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  if (operator === '+') {
    const a = random(2, scale === 1 ? 20 : scale === 2 ? 99 : 999);
    const b = random(2, scale === 1 ? 20 : scale === 2 ? 99 : 999);
    return { label: `${a} + ${b}`, answer: a + b };
  }
  if (operator === '−') {
    const a = random(5, scale === 1 ? 30 : scale === 2 ? 150 : 999);
    const b = random(1, a);
    return { label: `${a} − ${b}`, answer: a - b };
  }
  if (operator === '×') {
    const max = scale === 1 ? 10 : scale === 2 ? 15 : 30;
    const a = random(2, max), b = random(2, max);
    return { label: `${a} × ${b}`, answer: a * b };
  }
  const divisor = random(2, scale === 1 ? 9 : scale === 2 ? 15 : 25);
  const quotient = random(2, scale === 1 ? 10 : scale === 2 ? 15 : 25);
  return { label: `${divisor * quotient} ÷ ${divisor}`, answer: quotient };
}

export function generateSeries(operators: Operator[], difficulty: Difficulty, count: number): Question[] {
  return Array.from({ length: count }, (_, i) => generateQuestion(operators[i % operators.length], difficulty));
}

export function summarize(attempts: Attempt[]) {
  const correct = attempts.filter((a) => a.correct).length;
  const totalMs = attempts.reduce((sum, a) => sum + a.durationMs, 0);
  return { correct, incorrect: attempts.length - correct, totalMs, accuracy: attempts.length ? Math.round(correct * 100 / attempts.length) : 0, averageSeconds: attempts.length ? totalMs / attempts.length / 1000 : 0 };
}

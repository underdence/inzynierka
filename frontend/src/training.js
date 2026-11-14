
const random = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function generateQuestion(operator, difficulty) {
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
    const a = random(2, max);
    const b = random(2, max);
    return { label: `${a} × ${b}`, answer: a * b };
  }

  const divisor = random(2, scale === 1 ? 9 : scale === 2 ? 15 : 25);
  const quotient = random(2, scale === 1 ? 10 : scale === 2 ? 15 : 25);

  return {
    label: `${divisor * quotient} ÷ ${divisor}`,
    answer: quotient,
  };
}

export function generateSeries(operators, difficulty, count) {
  return Array.from(
    { length: count },
    (_, index) => generateQuestion(operators[index % operators.length], difficulty),
  );
}

export function summarize(attempts) {
  const correct = attempts.filter((attempt) => attempt.correct).length;

  const totalMs = attempts.reduce(
    (sum, attempt) => sum + attempt.durationMs,
    0,
  );

  return {
    correct,
    incorrect: attempts.length - correct,
    totalMs,
    accuracy: attempts.length
      ? Math.round((correct * 100) / attempts.length)
      : 0,
    averageSeconds: attempts.length
      ? totalMs / attempts.length / 1000
      : 0,
  };
}

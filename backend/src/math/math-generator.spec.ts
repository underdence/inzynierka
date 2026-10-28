import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { randomInt } from './random-int';
import { generateTask } from './generate-task';
import { generateTasks } from './generate-tasks';
import { getTaskKey } from './get-task-key';
import type { Difficulty, MathTask, Operation } from './math.types';

const operations: Operation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

const limits = {
  easy: { arithmeticMax: 20, min: 1, factorMax: 10, resultMax: 10 },
  medium: { arithmeticMax: 100, min: 2, factorMax: 12, resultMax: 12 },
  hard: { arithmeticMax: 1000, min: 2, factorMax: 20, resultMax: 50 },
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function expectIntegerInRange(value: number, min: number, max: number) {
  expect(Number.isInteger(value)).toBe(true);
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

function expectValidTask(
  task: MathTask,
  operation: Operation,
  difficulty: Difficulty,
) {
  const limit = limits[difficulty];

  expect(task.id).toMatch(uuidPattern);
  expect(task.operation).toBe(operation);
  expect(task.difficulty).toBe(difficulty);
  expect(Number.isInteger(task.answer)).toBe(true);

  if (operation === 'addition' || operation === 'subtraction') {
    expectIntegerInRange(task.left, 0, limit.arithmeticMax);
    expectIntegerInRange(task.right, 0, limit.arithmeticMax);

    if (operation === 'addition') {
      expect(task.answer).toBe(task.left + task.right);
    } else {
      expect(task.answer).toBe(task.left - task.right);

      if (difficulty === 'easy') {
        expect(task.answer).toBeGreaterThanOrEqual(0);
      }
    }
  } else if (operation === 'multiplication') {
    expectIntegerInRange(task.left, limit.min, limit.factorMax);
    expectIntegerInRange(task.right, limit.min, limit.resultMax);
    expect(task.answer).toBe(task.left * task.right);
  } else {
    expectIntegerInRange(task.right, limit.min, limit.factorMax);
    expectIntegerInRange(task.answer, limit.min, limit.resultMax);
    expectIntegerInRange(
      task.left,
      limit.min * limit.min,
      limit.factorMax * limit.resultMax,
    );
    expect(task.right).not.toBe(0);
    expect(task.left % task.right).toBe(0);
    expect(task.answer).toBe(task.left / task.right);
  }
}

beforeEach(() => {
  // Powtarzalny ciąg liczb zamiast losowości zależnej od uruchomienia.
  let seed = 123456789;

  jest.spyOn(Math, 'random').mockImplementation(() => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('randomInt', () => {
  it('includes the lower boundary', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    expect(randomInt(3, 7)).toBe(3);
  });

  it('includes the upper boundary', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999999);

    expect(randomInt(3, 7)).toBe(7);
  });

  it('returns the only available value', () => {
    expect(randomInt(5, 5)).toBe(5);
  });

  it('supports negative boundaries', () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.999999);

    expect(randomInt(-5, -2)).toBe(-5);
    expect(randomInt(-5, -2)).toBe(-2);
  });

  it('maps equal intervals to consecutive integers', () => {
    const random = jest.spyOn(Math, 'random');

    for (let index = 0; index < 5; index++) {
      random.mockReturnValueOnce((index + 0.5) / 5);
      expect(randomInt(3, 7)).toBe(3 + index);
    }
  });
});

describe.each(difficulties)('generateTask: %s', (difficulty) => {
  it.each(operations)('generates valid %s tasks', (operation) => {
    const ids = new Set<string>();

    for (let index = 0; index < 100; index++) {
      const task = generateTask(operation, difficulty);

      expectValidTask(task, operation, difficulty);
      ids.add(task.id);
    }

    expect(ids.size).toBe(100);
  });

  it.each([0, 0.999999])('handles boundary random value %s', (value) => {
    jest.spyOn(Math, 'random').mockReturnValue(value);

    const limit = limits[difficulty];
    const arithmetic = value === 0 ? 0 : limit.arithmeticMax;
    const factor = value === 0 ? limit.min : limit.factorMax;
    const result = value === 0 ? limit.min : limit.resultMax;

    expect(generateTask('addition', difficulty)).toMatchObject({
      left: arithmetic,
      right: arithmetic,
      answer: arithmetic * 2,
    });

    expect(generateTask('subtraction', difficulty)).toMatchObject({
      left: arithmetic,
      right: arithmetic,
      answer: 0,
    });

    expect(generateTask('multiplication', difficulty)).toMatchObject({
      left: factor,
      right: result,
      answer: factor * result,
    });

    expect(generateTask('division', difficulty)).toMatchObject({
      left: factor * result,
      right: factor,
      answer: result,
    });
  });

  it('applies the subtraction sign rule', () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.999999);

    const task = generateTask('subtraction', difficulty);
    const max = limits[difficulty].arithmeticMax;

    if (difficulty === 'easy') {
      expect(task).toMatchObject({ left: max, right: 0, answer: max });
    } else {
      expect(task).toMatchObject({ left: 0, right: max, answer: -max });
    }
  });
});

describe('getTaskKey', () => {
  function makeTask(
    operation: Operation,
    left: number,
    right: number,
  ): MathTask {
    return {
      id: 'test-id',
      operation,
      difficulty: 'medium',
      left,
      right,
      answer: 0,
    };
  }

  it.each<Operation>(['addition', 'multiplication'])(
    'ignores operand order for %s',
    (operation) => {
      const first = makeTask(operation, 3, 8);
      const second = makeTask(operation, 8, 3);

      expect(getTaskKey(first)).toBe(`${operation}:3:8`);
      expect(getTaskKey(second)).toBe(getTaskKey(first));
    },
  );

  it.each<Operation>(['subtraction', 'division'])(
    'preserves operand order for %s',
    (operation) => {
      expect(getTaskKey(makeTask(operation, 3, 8))).toBe(`${operation}:3:8`);
      expect(getTaskKey(makeTask(operation, 8, 3))).toBe(`${operation}:8:3`);
    },
  );

  it('distinguishes operations and operand pairs', () => {
    expect(getTaskKey(makeTask('addition', 3, 8))).not.toBe(
      getTaskKey(makeTask('multiplication', 3, 8)),
    );

    expect(getTaskKey(makeTask('addition', 3, 8))).not.toBe(
      getTaskKey(makeTask('addition', 4, 7)),
    );

    expect(getTaskKey(makeTask('addition', 1, 23))).not.toBe(
      getTaskKey(makeTask('addition', 12, 3)),
    );
  });

  it('ignores IDs and does not modify the task', () => {
    const task = makeTask('multiplication', 8, 3);
    const original = { ...task };

    expect(getTaskKey(task)).toBe(getTaskKey({ ...task, id: 'another-id' }));
    expect(task).toEqual(original);
  });
});

describe('generateTasks', () => {
  describe.each(difficulties)('difficulty: %s', (difficulty) => {
    it.each(operations)('creates 30 unique %s tasks', (operation) => {
      const tasks = generateTasks([operation], difficulty, 30);

      expect(tasks).toHaveLength(30);
      expect(new Set(tasks.map(getTaskKey)).size).toBe(30);
      expect(new Set(tasks.map((task) => task.id)).size).toBe(30);

      for (const task of tasks) {
        expectValidTask(task, operation, difficulty);
      }
    });
  });

  it.each([10, 20, 30])('supports a series of %s questions', (count) => {
    const tasks = generateTasks(operations, 'medium', count);

    expect(tasks).toHaveLength(count);
    expect(new Set(tasks.map(getTaskKey)).size).toBe(count);
  });

  it('rejects an empty operation list', () => {
    expect(() => generateTasks([], 'easy', 10)).toThrow(
      'Wybierz przynajmniej jedno działanie.',
    );
  });

  it.each([0, -1, 2.5, 15, 31, NaN, Infinity])(
    'rejects invalid question count %s',
    (count) => {
      expect(() => generateTasks(['addition'], 'easy', count)).toThrow(
        'Liczba pytań musi wynosić 10, 20 lub 30.',
      );
    },
  );

  it('selects each operation from its random interval', () => {
    let calls = 0;

    jest.spyOn(Math, 'random').mockImplementation(() => {
      const call = calls++;
      const attempt = Math.floor(call / 3);

      if (call % 3 === 0) {
        return ((attempt % 4) + 0.5) / 4;
      }

      return (attempt + 0.5) / 21;
    });

    const tasks = generateTasks(operations, 'easy', 10);

    expect(tasks.map((task) => task.operation)).toEqual([
      'addition',
      'subtraction',
      'multiplication',
      'division',
      'addition',
      'subtraction',
      'multiplication',
      'division',
      'addition',
      'subtraction',
    ]);
  });

  it('deduplicates selected operations without changing the input', () => {
    const selected: Operation[] = ['addition', 'addition', 'division'];
    let calls = 0;

    jest.spyOn(Math, 'random').mockImplementation(() => {
      const call = calls++;
      const attempt = Math.floor(call / 3);

      if (call % 3 === 0) {
        return attempt % 2 === 0 ? 0.25 : 0.75;
      }

      return (attempt + 0.5) / 21;
    });

    const tasks = generateTasks(selected, 'easy', 10);

    expect(tasks.map((task) => task.operation)).toEqual([
      'addition',
      'division',
      'addition',
      'division',
      'addition',
      'division',
      'addition',
      'division',
      'addition',
      'division',
    ]);
    expect(selected).toEqual(['addition', 'addition', 'division']);
  });

  it('skips repeated questions and adds the checked candidate', () => {
    const random = jest.spyOn(Math, 'random');

    // Pierwsze dwa losowania dają identyczne pytanie.
    for (let attempt = 0; attempt < 11; attempt++) {
      const value = Math.max(0, attempt - 1);

      random
        .mockReturnValueOnce(0)
        .mockReturnValueOnce((value + 0.5) / 21)
        .mockReturnValueOnce(0);
    }

    const tasks = generateTasks(['addition'], 'easy', 10);

    expect(tasks.map((task) => task.left)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(tasks.every((task) => task.right === 0)).toBe(true);
    expect(new Set(tasks.map(getTaskKey)).size).toBe(10);
  });

  it('stops when random draws cannot produce enough unique tasks', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    expect(() => generateTasks(['multiplication'], 'easy', 10)).toThrow(
      'Nie udało się wygenerować serii bez powtórzeń.',
    );
  });
});

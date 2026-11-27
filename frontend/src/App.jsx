
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from './api/client';
import {
  formatQuestion,
  getTrainingQuestion,
  getTrainingSummary,
  startTraining,
  submitTrainingAnswer,
} from './api/training';
import { usePlayerSession } from './hooks/usePlayerSession';
import styles from './App.module.scss';

const ops = ['+', '−', '×', '÷'];

const formatTime = (ms) => {
  const seconds = Math.floor(Math.max(0, ms) / 1000);

  return [
    String(Math.floor(seconds / 60)).padStart(2, '0'),
    String(seconds % 60).padStart(2, '0'),
  ].join(':');
};

const getErrorMessage = (error, fallback) =>
  error instanceof Error ? error.message : fallback;

export default function App() {
  const playerSession = usePlayerSession();
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  );

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', nextTheme === 'dark' ? '#101211' : '#f2f5f0',
    );
    try {
      localStorage.setItem('math-duel-theme', nextTheme);
    } catch {
    }
    setTheme(nextTheme);
  };

  const [view, setView] = useState('start');
  const [stage, setStage] = useState('setup');

  const [selected, setSelected] = useState(['+', '−', '×']);
  const [difficulty, setDifficulty] = useState('medium');
  const [duration, setDuration] = useState(60);

  const [training, setTraining] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');

  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const input = useRef(null);
  const requestLocked = useRef(false);
  const finishLocked = useRef(false);
  const runId = useRef(0);

  const active = stage === 'active';

  const correct = summary?.score ?? score;
  const totalAttempts = summary?.attempts ?? attempts;
  const incorrect = Math.max(0, totalAttempts - correct);

  const accuracy = totalAttempts
    ? Math.round((correct / totalAttempts) * 100)
    : 0;

  const sessionDuration = training
    ? training.endsAt - training.startedAt
    : duration * 1000;

  const remaining = Math.max(0, sessionDuration - elapsed);

  const progress = stage === 'result'
    ? 100
    : training
      ? Math.min(100, Math.round((elapsed / sessionDuration) * 100))
      : 0;

  const reset = () => {
    runId.current += 1;
    requestLocked.current = false;
    finishLocked.current = false;

    setStage('setup');
    setTraining(null);
    setQuestion(null);
    setAnswer('');
    setScore(0);
    setAttempts(0);
    setStreak(0);
    setElapsed(0);
    setSummary(null);
    setError('');
    setLoading(false);
  };

  const go = (nextView) => {
    reset();
    setView(nextView);
  };

  const finish = useCallback(async (currentTraining, currentRun) => {
    if (
      !currentTraining ||
      finishLocked.current ||
      runId.current !== currentRun
    ) {
      return;
    }

    finishLocked.current = true;
    setStage('result');
    setLoading(true);
    setError('');

    try {
      const result = await getTrainingSummary(
        currentTraining.sessionId,
      );

      if (runId.current !== currentRun) {
        return;
      }

      setSummary(result);
      setScore(result.score);
      setAttempts(result.attempts);
      setElapsed(result.endsAt - result.startedAt);
    } catch (caught) {
      if (runId.current === currentRun) {
        setError(
          getErrorMessage(
            caught,
            'Nie udało się pobrać wyniku treningu.',
          ),
        );
      }
    } finally {
      if (runId.current === currentRun) {
        setLoading(false);
        finishLocked.current = false;
      }
    }
  }, []);

  useEffect(() => {
    if (!active || !training) {
      return;
    }

    const currentRun = runId.current;

    const tick = () => {
      if (runId.current !== currentRun) {
        return;
      }

      const now = Date.now();
      const elapsedMs = Math.min(
        sessionDuration,
        Math.max(0, now - training.startedAt),
      );

      setElapsed(elapsedMs);

      if (now >= training.endsAt) {
        void finish(training, currentRun);
      }
    };

    tick();

    const interval = window.setInterval(tick, 100);

    return () => window.clearInterval(interval);
  }, [active, training, sessionDuration, finish]);

  useEffect(() => {
    if (active && !loading && question) {
      input.current?.focus();
    }
  }, [active, loading, question]);

  const start = async () => {
    if (
      !selected.length ||
      playerSession.status !== 'ready' ||
      loading
    ) {
      return;
    }

    reset();

    const currentRun = runId.current;
    setLoading(true);

    try {
      const result = await startTraining(
        selected,
        difficulty,
        duration,
      );

      if (runId.current !== currentRun) {
        return;
      }

      setTraining({
        sessionId: result.sessionId,
        startedAt: result.startedAt,
        endsAt: result.endsAt,
      });

      setQuestion(result.question);
      setScore(result.score);
      setStage('active');
    } catch (caught) {
      if (runId.current === currentRun) {
        setError(
          getErrorMessage(
            caught,
            'Nie udało się rozpocząć treningu.',
          ),
        );
      }
    } finally {
      if (runId.current === currentRun) {
        setLoading(false);
      }
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    if (
      !active ||
      !training ||
      !question ||
      requestLocked.current ||
      Date.now() >= training.endsAt
    ) {
      return;
    }

    const value = answer.trim();
    const numericAnswer = Number(value);

    if (
      !/^-?\d+$/.test(value) ||
      !Number.isSafeInteger(numericAnswer)
    ) {
      setError('Wpisz poprawną liczbę całkowitą.');
      return;
    }

    const currentRun = runId.current;

    requestLocked.current = true;
    setLoading(true);
    setError('');

    try {
      const result = await submitTrainingAnswer(
        training.sessionId,
        question.id,
        numericAnswer,
      );

      if (runId.current !== currentRun) {
        return;
      }

      setScore(result.score);
      setAttempts(result.attempts);
      setQuestion(result.question);
      setAnswer('');

      if (result.correct) {
        setStreak((previous) => previous + 1);
      } else {
        setStreak(0);
        setError('Niepoprawny wynik. Spróbuj ponownie.');
      }

      if (Date.now() >= training.endsAt) {
        await finish(training, currentRun);
      }
    } catch (caught) {
      if (runId.current !== currentRun) {
        return;
      }

      if (caught instanceof ApiError && caught.status === 410) {
        await finish(training, currentRun);
        return;
      }

      if (caught instanceof ApiError && caught.status === 409) {
        try {
          const updatedQuestion = await getTrainingQuestion(
            training.sessionId,
          );

          if (runId.current === currentRun) {
            setQuestion(updatedQuestion);
            setAnswer('');
            setError('Zadanie zostało odświeżone.');
          }
        } catch (refreshError) {
          if (runId.current !== currentRun) {
            return;
          }

          if (
            refreshError instanceof ApiError &&
            refreshError.status === 410
          ) {
            await finish(training, currentRun);
          } else {
            setError(
              getErrorMessage(
                refreshError,
                'Nie udało się odświeżyć zadania.',
              ),
            );
          }
        }

        return;
      }

      setError(
        getErrorMessage(
          caught,
          'Nie udało się sprawdzić odpowiedzi.',
        ),
      );
    } finally {
      if (runId.current === currentRun) {
        requestLocked.current = false;
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <button
            className={styles.brand}
            onClick={() => go('start')}
            aria-label="Math Duel — ekran startowy"
          >
            <span className={styles.mark} aria-hidden="true">
              <span className={styles.markPlus}>+</span>
              <span className={styles.markCross}>×</span>
            </span>

            <span className={styles.brandName}>
              math<span>duel</span>
              <span className={styles.brandPeriod}>.</span>
            </span>
          </button>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Włącz tryb jasny' : 'Włącz tryb ciemny'}
              title={theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}
            >
              <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
              <span>{theme === 'dark' ? 'Jasny' : 'Ciemny'}</span>
            </button>
            {view !== 'start' && (
              <button
                className={styles.backHome}
                onClick={() => go('start')}
              >
                ← Wróć na start
              </button>
            )}
          </div>
        </header>

        <main className={styles.main}>
          {view === 'start' && (
            <section className={styles.home}>
              <div className={styles.hero}>
                <span className={styles.homeEyebrow}>
                  Sprawdź swój umysł
                </span>

                <h1>SZYBKIE LICZENIE</h1>
                <p>Wybierz tryb i zaczynaj.</p>

                <div className={styles.choices}>
                  <button
                    type="button"
                    className={styles.choice}
                    onClick={() => go('training')}
                  >
                    <span
                      className={styles.choiceSymbol}
                      aria-hidden="true"
                    >
                      ∑
                    </span>

                    <span className={styles.choiceText}>
                      <strong>Trening</strong>
                      <small>Ćwicz we własnym tempie</small>
                    </span>

                    <span className={styles.choiceArrow}>↗</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.choice} ${styles.choiceDisabled}`}
                    disabled
                    aria-disabled="true"
                  >
                    <span
                      className={styles.choiceSymbol}
                      aria-hidden="true"
                    >
                      ⚡
                    </span>

                    <span className={styles.choiceText}>
                      <strong>Pojedynek 1v1</strong>
                      <small>Wkrótce dostępny</small>
                    </span>

                    <span className={styles.choiceArrow}>—</span>
                  </button>
                </div>
              </div>

              <div className={styles.homeArt} aria-hidden="true">
                <div className={styles.numberHalo}>
                  <span className={styles.haloNumber}>07</span>
                  <span className={styles.haloMath}>
                    9 × 8 = 72
                  </span>
                </div>

                <span className={styles.mathFloat}>+ − × ÷</span>
              </div>
            </section>
          )}

          {view === 'training' && (
            <section className={styles.workspace}>
              <aside className={styles.settings}>
                <div className={styles.panelTitle}>
                  <h2>Ustawienia</h2>
                </div>

                <label>RODZAJ DZIAŁAŃ</label>

                <div className={styles.operators}>
                  {ops.map((op) => (
                    <button
                      key={op}
                      type="button"
                      disabled={active || loading}
                      aria-pressed={selected.includes(op)}
                      className={
                        selected.includes(op) ? styles.chosen : ''
                      }
                      onClick={() =>
                        setSelected((previous) =>
                          previous.includes(op)
                            ? previous.filter((item) => item !== op)
                            : [...previous, op],
                        )
                      }
                    >
                      {op}
                    </button>
                  ))}
                </div>

                <label htmlFor="difficulty">
                  POZIOM TRUDNOŚCI
                </label>

                <select
                  id="difficulty"
                  disabled={active || loading}
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value)
                  }
                >
                  <option value="easy">Łatwy</option>
                  <option value="medium">Średni</option>
                  <option value="hard">Trudny</option>
                </select>

                <label htmlFor="duration">
                  CZAS TRENINGU
                </label>

                <select
                  id="duration"
                  disabled={active || loading}
                  value={duration}
                  onChange={(event) =>
                    setDuration(Number(event.target.value))
                  }
                >
                  <option value={30}>30 sekund</option>
                  <option value={60}>60 sekund</option>
                  <option value={120}>120 sekund</option>
                </select>

                {active ? (
                  <button
                    className={styles.secondary}
                    onClick={reset}
                  >
                    Przerwij trening
                  </button>
                ) : (
                  <button
                    className={styles.primary}
                    disabled={
                      !selected.length ||
                      loading ||
                      playerSession.status !== 'ready'
                    }
                    onClick={start}
                  >
                    {loading
                      ? 'Ładowanie...'
                      : stage === 'result'
                        ? 'Nowa sesja'
                        : 'Rozpocznij'}
                    <span>↗</span>
                  </button>
                )}

                {!selected.length && (
                  <p className={styles.notice}>
                    Wybierz co najmniej jedno działanie.
                  </p>
                )}

                {playerSession.status === 'error' && (
                  <p className={styles.notice} role="alert">
                    {playerSession.error}
                  </p>
                )}
              </aside>

              {stage === 'setup' && (
                <div className={styles.arenaCenter}>
                  <span className={styles.bigGlyph}>∑</span>

                  <h2>Gotowy na trening?</h2>

                  <p>
                    Wybierz działania, poziom trudności
                    i czas treningu.
                  </p>

                  <button
                    className={styles.primary}
                    disabled={
                      !selected.length ||
                      loading ||
                      playerSession.status !== 'ready'
                    }
                    onClick={start}
                  >
                    {loading ? 'Ładowanie...' : 'Start'}
                    <span>→</span>
                  </button>

                  {error && (
                    <small role="alert">{error}</small>
                  )}
                </div>
              )}

              {active && (
                <div className={styles.arenaCenter}>
                  <span className={styles.eyebrow}>
                    POZOSTAŁY CZAS: {formatTime(remaining)}
                  </span>

                  <div className={styles.equation}>
                    {formatQuestion(question)}{' '}
                    <span className={styles.accent}>= ?</span>
                  </div>

                  <form
                    className={styles.answerForm}
                    onSubmit={submit}
                  >
                    <input
                      ref={input}
                      aria-label="Wynik działania"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="Twój wynik"
                      value={answer}
                      disabled={loading}
                      onChange={(event) =>
                        setAnswer(event.target.value)
                      }
                    />

                    <button
                      type="submit"
                      disabled={!answer.trim() || loading}
                    >
                      {loading
                        ? 'Sprawdzanie...'
                        : 'Sprawdź ↗'}
                    </button>
                  </form>

                  <small role="status">
                    {error || 'ENTER ↵ ABY ZATWIERDZIĆ'}
                  </small>
                </div>
              )}

              {stage === 'result' && (
                <div className={styles.arenaCenter}>
                  <span className={styles.eyebrow}>
                    TRENING UKOŃCZONY
                  </span>

                  <h2>Sesja zakończona.</h2>

                  <div className={styles.finalScore}>
                    {correct}<span> pkt</span>
                  </div>

                  <p>
                    {correct} poprawnych odpowiedzi
                    na {totalAttempts} prób
                  </p>

                  {loading && (
                    <small role="status">
                      Pobieranie wyniku...
                    </small>
                  )}

                  {error && (
                    <small role="alert">{error}</small>
                  )}

                  {error && training && (
                    <button
                      className={styles.secondary}
                      disabled={loading}
                      onClick={() =>
                        void finish(training, runId.current)
                      }
                    >
                      Pobierz wynik ponownie
                    </button>
                  )}

                  <button
                    className={styles.primary}
                    disabled={loading}
                    onClick={start}
                  >
                    Jeszcze raz ↗
                  </button>
                </div>
              )}

              <div className={styles.progress}>
                <div>
                  <span>POSTĘP CZASU</span>
                  <span>{progress}%</span>
                </div>

                <div className={styles.track}>
                  <div style={{ width: `${progress}%` }} />
                </div>
              </div>

              <aside className={styles.stats}>
                <div className={styles.panelTitle}>
                  <h2>Na żywo</h2>
                </div>

                {[
                  ['CZAS', formatTime(elapsed)],
                  ['POPRAWNE', String(correct)],
                  ['BŁĘDNE', String(incorrect)],
                  ['SERIA', String(streak)],
                  ['SKUTECZNOŚĆ', `${accuracy}%`],
                ].map(([name, value]) => (
                  <div className={styles.stat} key={name}>
                    <span>{name}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </aside>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

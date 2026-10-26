import { useEffect, useRef, useState } from 'react';
import { generateSeries, summarize, type Attempt, type Difficulty, type Operator, type Question } from './training';
import styles from './App.module.scss';

type View = 'start' | 'training';
type Stage = 'setup' | 'active' | 'result';
const ops: Operator[] = ['+', '−', '×', '÷'];
const format = (ms: number) => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

export default function App() {
  const [view, setView] = useState<View>('start');
  const [stage, setStage] = useState<Stage>('setup');
  const [selected, setSelected] = useState<Operator[]>(['+', '−', '×']);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [limit, setLimit] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const sessionStart = useRef(0);
  const questionStart = useRef(0);
  const locked = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (stage !== 'active' || view !== 'training') return; const id = window.setInterval(() => setElapsed(performance.now() - sessionStart.current), 100); return () => window.clearInterval(id); }, [stage, view]);
  useEffect(() => { if (stage === 'active' && view === 'training') input.current?.focus(); }, [index, stage, view]);
  const summary = summarize(attempts);
  const streakIndex = [...attempts].reverse().findIndex((a) => !a.correct);
  const streak = streakIndex < 0 ? attempts.length : streakIndex;
  const progress = stage === 'result' ? 100 : stage === 'active' ? Math.round(index / limit * 100) : 0;
  const go = (v: View) => { setView(v); if (v !== 'training') setStage('setup'); };
  const start = () => {
    if (!selected.length) return;
    setQuestions(generateSeries(selected, difficulty, limit));
    setIndex(0); setAnswer(''); setAttempts([]); setElapsed(0); setError(''); locked.current = false;
    sessionStart.current = performance.now(); questionStart.current = sessionStart.current; setStage('active');
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (stage !== 'active' || locked.current) return;
    if (!/^-?\d+$/.test(answer.trim())) { setError('Wpisz poprawną liczbę całkowitą.'); return; }
    locked.current = true;
    const now = performance.now();
    const attempt = { correct: Number(answer) === questions[index].answer, durationMs: now - questionStart.current };
    setAttempts((previous) => [...previous, attempt]);
    setElapsed(now - sessionStart.current);
    setAnswer(''); setError('');
    if (index + 1 === questions.length) setStage('result'); else { setIndex(index + 1); questionStart.current = now; }
    locked.current = false;
  };
  return <div className={styles.shell}>
    <div className={styles.frame}>
      <header className={styles.header}>
        <button className={styles.brand} onClick={() => go('start')} aria-label="Math Duel — ekran startowy">
          <span className={styles.mark} aria-hidden="true"><span className={styles.markPlus}>+</span><span className={styles.markCross}>×</span></span>
          <span className={styles.brandName}>math<span>duel</span><span className={styles.brandPeriod}>.</span></span>
        </button>
        {view !== 'start' && <button className={styles.backHome} onClick={() => go('start')}>← Wróć na start</button>}
      </header>
      <main className={styles.main}>
        {view === 'start' && <section className={styles.home}>
          <div className={styles.hero}>
            <span className={styles.homeEyebrow}>Sprawdź swój umysł</span>
            <h1>SZYBKIE LICZENIE</h1>
            <p>Wybierz tryb i zaczynaj.</p>
            <div className={styles.choices}>
              <button type="button" className={styles.choice} onClick={() => go('training')}>
                <span className={styles.choiceSymbol} aria-hidden="true">∑</span>
                <span className={styles.choiceText}><strong>Trening</strong><small>Ćwicz we własnym tempie</small></span>
                <span className={styles.choiceArrow} aria-hidden="true">↗</span>
              </button>
              <button type="button" className={`${styles.choice} ${styles.choiceDisabled}`} disabled aria-disabled="true">
                <span className={styles.choiceSymbol} aria-hidden="true">⚡</span>
                <span className={styles.choiceText}><strong>Pojedynek 1v1</strong><small>Wkrótce dostępny</small></span>
                <span className={styles.choiceArrow} aria-hidden="true">—</span>
              </button>
            </div>
          </div>
          <div className={styles.homeArt} aria-hidden="true"><div className={styles.numberHalo}><span className={styles.haloNumber}>07</span><span className={styles.haloMath}>9 × 8 = 72</span></div><span className={styles.mathFloat}>+ − × ÷</span></div>
        </section>}
        {view === 'training' && <section className={styles.workspace}>
          <aside className={styles.settings}>
            <div className={styles.panelTitle}>
              <h2>Ustawienia</h2>
            </div>
            <label>RODZAJ DZIAŁAŃ</label>
            <div className={styles.operators}>
              {ops.map(op => <button key={op} disabled={stage === 'active'} aria-pressed={selected.includes(op)} className={selected.includes(op) ? styles.chosen : ''} onClick={() => setSelected(old => old.includes(op) ? old.filter(x => x !== op) : [...old, op])}>{op}</button>)}
            </div>
            <label htmlFor="difficulty">POZIOM TRUDNOŚCI</label>
            <select id="difficulty" disabled={stage === 'active'} value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
              <option value="easy">Łatwy</option>
              <option value="medium">Średni</option>
              <option value="hard">Trudny</option>
            </select>
            <label htmlFor="limit">LICZBA ZADAŃ</label>
            <select id="limit" disabled={stage === 'active'} value={limit} onChange={e => setLimit(Number(e.target.value))}>
              <option value={10}>10 działań</option>
              <option value={20}>20 działań</option>
              <option value={30}>30 działań</option>
            </select>
            {stage === 'active' ? <button className={styles.secondary} onClick={() => { setStage('setup'); setElapsed(0); }}>Przerwij trening</button> : <button className={styles.primary} disabled={!selected.length} onClick={start}>{stage === 'result' ? 'Nowa sesja' : 'Rozpocznij'} <span>↗</span></button>}
            {!selected.length && <p className={styles.notice}>Wybierz co najmniej jedno działanie.</p>}
          </aside>
          {stage === 'setup' && <div className={styles.arenaCenter}>
            <span className={styles.bigGlyph}>∑</span>
            <h2>Gotowy na trening?</h2>
            <p>Wybierz parametry aby rozpocząć.</p>
            <button className={styles.primary} disabled={!selected.length} onClick={start}>Start <span>→</span>
            </button>
          </div>}
          {stage === 'active' && <div className={styles.arenaCenter}>
            <span className={styles.eyebrow}>ZADANIE {String(index + 1).padStart(2, '0')} / {limit}</span>
            <div className={styles.equation}>{questions[index]?.label} <span className={styles.accent}>= ?</span>
            </div>
            <form className={styles.answerForm} onSubmit={submit}>
              <input ref={input} aria-label="Wynik działania" inputMode="numeric" autoComplete="off" placeholder="Twój wynik" value={answer} onChange={e => setAnswer(e.target.value)} />
              <button type="submit" disabled={!answer.trim()}>Sprawdź ↗</button>
            </form>
            <small role="status">{error || 'ENTER ↵ ABY ZATWIERDZIĆ'}</small>
          </div>}
          {stage === 'result' && <div className={styles.arenaCenter}>
            <span className={styles.eyebrow}>TRENING UKOŃCZONY</span>
            <h2>Sesja zakończona.</h2>
            <div className={styles.finalScore}>{summary.accuracy}<span>%</span>
            </div>
            <p>{summary.correct} poprawnych odpowiedzi na {attempts.length}</p>
            <button className={styles.primary} onClick={start}>Jeszcze raz ↗</button>
          </div>}
          <div className={styles.progress}>
            <div>
              <span>POSTĘP</span>
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
            {[['CZAS', format(elapsed)], ['POPRAWNE', String(summary.correct)], ['BŁĘDNE', String(summary.incorrect)], ['SERIA', String(streak)], ['SKUTECZNOŚĆ', `${summary.accuracy}%`], ...(stage === 'result' ? [['ŚREDNI CZAS', `${summary.averageSeconds.toFixed(1)} s`]] : [])].map(([name, value]) => <div className={styles.stat} key={name}><span>{name}</span><strong>{value}</strong></div>)}</aside>
        </section>}
      </main>
    </div>
  </div>;
}

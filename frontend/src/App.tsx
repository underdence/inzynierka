import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import styles from './App.module.scss';

function Home() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><span className={styles.pulse} /> TRENUJ UMYSŁ. WYGRYWAJ POJEDYNKI.</div>
          <h1>Liczy się <em>każda</em> sekunda.</h1>
          <p>Sprawdź swój refleks matematyczny. Ćwicz liczenie w pamięci i przygotuj się do pojedynków 1 na 1.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} to="/trening">Rozpocznij trening <span aria-hidden="true">↗</span></Link>
            <Link className={styles.secondaryButton} to="/pojedynek">Pojedynek 1v1 <span aria-hidden="true">→</span></Link>
          </div>
          <p className={styles.caption}>Wczesna wersja demonstracyjna interfejsu</p>
        </div>
        <div className={styles.visual} aria-label="Przykładowe działanie matematyczne">
          <div className={styles.visualTop}><span>PRZYKŁADOWE ZADANIE</span><span className={styles.live}>● LIVE PREVIEW</span></div>
          <div className={styles.equation}>17 <span>×</span> 6 <span>=</span> <strong>?</strong></div>
          <div className={styles.answerPreview}>Twoja odpowiedź <span>_</span></div>
          <div className={styles.visualBottom}><span><b>01</b> / 10</span><span>MYŚL SZYBKO. LICZ DOKŁADNIE.</span></div>
        </div>
      </section>
      <section className={styles.features} aria-label="Tryby aplikacji">
        <Link to="/trening" className={styles.featureCard}>
          <span className={styles.featureNumber}>01 / SOLO</span>
          <span className={styles.featureIcon}>＋</span>
          <h2>Trening</h2>
          <p>Rozwiązuj działania i rozwijaj szybkość liczenia w pamięci.</p>
          <span className={styles.cardLink}>Przejdź do treningu ↗</span>
        </Link>
        <Link to="/pojedynek" className={styles.featureCard}>
          <span className={styles.featureNumber}>02 / MULTIPLAYER</span>
          <span className={styles.featureIcon}>⚡</span>
          <h2>Pojedynek 1v1</h2>
          <p>Twórz prywatne pokoje i rywalizuj ze znajomymi online.</p>
          <span className={styles.cardLink}>Poznaj tryb ↗</span>
        </Link>
      </section>
    </>
  );
}
function Placeholder({ duel = false }: { duel?: boolean }) {
  return (
    <section className={styles.placeholder}>
      <Link to="/" className={styles.back}>← Wróć na start</Link>
      <span className={styles.featureNumber}>{duel ? 'TRYB 02 / MULTIPLAYER' : 'TRYB 01 / SOLO'}</span>
      <h1>{duel ? 'Pojedynek 1v1' : 'Trening matematyczny'}</h1>
      <p>{duel ? 'Tutaj pojawią się tworzenie pokoju, dołączanie kodem i lobby dla dwóch graczy.' : 'Tutaj pojawią się działania matematyczne, pole odpowiedzi, pomiar czasu i podsumowanie treningu.'}</p>
      <div className={styles.pending}>Ten moduł jest w przygotowaniu.</div>
    </section>
  );
}
export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}><span className={styles.brandMark}>∑</span><span>MATH<span className={styles.brandSlash}>/</span>DUEL</span></Link>
          <nav className={styles.nav} aria-label="Nawigacja główna">
            <NavLink end to="/" className={({ isActive }) => isActive ? styles.active : ''}>Start</NavLink>
            <NavLink to="/trening" className={({ isActive }) => isActive ? styles.active : ''}>Trening</NavLink>
            <NavLink to="/pojedynek" className={({ isActive }) => isActive ? styles.active : ''}>Pojedynek 1v1</NavLink>
          </nav>
          <span className={styles.version}>ALPHA / 0.1</span>
        </div>
      </header>
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trening" element={<Placeholder />} />
          <Route path="/pojedynek" element={<Placeholder duel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className={styles.footer}><span>© {new Date().getFullYear()} MATH / DUEL</span><span>SZYBKIE LICZENIE 1V1 · PROJEKT INŻYNIERSKI</span></footer>
    </div>
  );
}

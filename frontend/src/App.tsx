import styles from './App.module.scss';

export default function App() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.wordmark}>MATH<span>/</span>DUEL</span>
        <nav aria-label="Nawigacja główna">
          <span className={styles.active} aria-current="page">START</span>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.axis} aria-hidden="true" />
        <div className={styles.titleWrap}>
          <h1>Trening<br /><span>szybkiego liczenia<span className={styles.dot}>.</span></span></h1>
        </div>
        <div className={styles.orbit} aria-hidden="true">
          <span className={styles.symbolOne}>+</span>
          <span className={styles.symbolTwo}>×</span>
          <span className={styles.symbolThree}>÷</span>
          <span className={styles.symbolFour}>−</span>
        </div>
      </main>
    </div>
  );
}

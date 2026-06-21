import { useTasks } from "../hooks/useTasks";
import styles from "../styles/Header.module.css";

function Header() {
  const { tasks } = useTasks();

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>Gestor de Tareas</h1>
        <p className={styles.subtitle}>Administrá tus pendientes con calma</p>
      </div>
      <div className={styles.counters}>
        <span className={styles.counterItem}>
          <span className={styles.counterValue}>{pendingCount}</span>
          <span className={styles.counterLabel}>{pendingCount === 1 ? "pendiente" : "pendientes"}</span>
        </span>
      </div>
    </header>
  );
}

export default Header;

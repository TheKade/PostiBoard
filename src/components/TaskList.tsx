import { useMemo, useState } from "react";
import { useTasks } from "../hooks/useTasks";
import TaskItem from "./TaskItem";
import styles from "../styles/TaskList.module.css";
import type { TaskPriority } from "../types/Task";

interface TaskListProps {
  priorityFilter?: "all" | TaskPriority;
}

function TaskList({ priorityFilter = "all" }: TaskListProps) {
  const { tasks } = useTasks();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = tasks;
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    return result;
  }, [tasks, search, priorityFilter]);

  const pending = useMemo(() => filtered.filter((t) => !t.completed), [filtered]);
  const completed = useMemo(() => filtered.filter((t) => t.completed), [filtered]);

  return (
    <div className={styles.list}>
      <div className={styles.searchWrapper}>
        <input
          type="text"
          placeholder="Buscar tareas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        {search && (
          <button className={styles.searchClear} onClick={() => setSearch("")}>
            ✕
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <p className={styles.empty}>
          {search ? "No se encontraron tareas." : "No hay tareas todavía."}
        </p>
      )}

      {pending.length > 0 && (
        <>
          <div className={styles.listHeader}>
            <span className={styles.listTitle}>Pendientes</span>
            <span className={styles.count}>{pending.length}</span>
          </div>
          {pending.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </>
      )}

      {completed.length > 0 && (
        <>
          <div className={styles.listHeader} style={{ marginTop: "1rem" }}>
            <span className={styles.listTitle}>Completadas</span>
            <span className={styles.count}>{completed.length}</span>
          </div>
          {completed.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </>
      )}
    </div>
  );
}

export default TaskList;

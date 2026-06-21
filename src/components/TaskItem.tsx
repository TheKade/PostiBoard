import { memo, useCallback, useState, useRef, useEffect } from "react";
import type { Task } from "../types/Task";
import { useTasks } from "../hooks/useTasks";
import { useToast } from "../hooks/useToast";
import styles from "../styles/TaskItem.module.css";

const CONFIRM_DELAY = 2500;

interface TaskItemProps {
  task: Task;
}

const badgeClass: Record<Task["priority"], string> = {
  low: styles.low,
  medium: styles.medium,
  high: styles.high,
};

const badgeLabel: Record<Task["priority"], string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

function TaskItem({ task }: TaskItemProps) {
  const { toggleTask, deleteTask, editTask, addSubItem, toggleSubItem, removeSubItem } = useTasks();
  const { addToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [showSubInput, setShowSubInput] = useState(false);
  const [subInputValue, setSubInputValue] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (showSubInput) subInputRef.current?.focus();
  }, [showSubInput]);

  useEffect(() => {
    return () => {
      if (confirmTimer.current != null) clearTimeout(confirmTimer.current);
    };
  }, []);

  const handleToggle = useCallback(() => {
    toggleTask(task.id);
  }, [toggleTask, task.id]);

  const handleDelete = useCallback(() => {
    if (confirmingDelete) {
      if (confirmTimer.current != null) clearTimeout(confirmTimer.current);
      deleteTask(task.id);
      addToast(`"${task.title}" eliminada`, "error");
      setConfirmingDelete(false);
    } else {
      setConfirmingDelete(true);
      confirmTimer.current = window.setTimeout(() => setConfirmingDelete(false), CONFIRM_DELAY);
    }
  }, [confirmingDelete, deleteTask, task.id, addToast, task.title]);

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
    setTitleValue(task.title);
  }, [task.title]);

  const handleSubmit = useCallback(() => {
    if (titleValue.trim() && titleValue.trim() !== task.title) {
      editTask(task.id, titleValue.trim());
    }
    setEditing(false);
  }, [editTask, task.id, titleValue, task.title]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") setEditing(false);
  }, [handleSubmit]);

  const handleSubToggle = useCallback((id: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSubItem(task.id, id);
  }, [toggleSubItem, task.id]);

  const handleSubRemove = useCallback((id: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    removeSubItem(task.id, id);
  }, [removeSubItem, task.id]);

  const handleAddSub = useCallback(() => {
    setShowSubInput(true);
  }, []);

  const handleSubInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && subInputValue.trim()) {
      addSubItem(task.id, subInputValue.trim());
      setSubInputValue("");
      setShowSubInput(false);
    }
    if (e.key === "Escape") {
      setSubInputValue("");
      setShowSubInput(false);
    }
  }, [addSubItem, task.id, subInputValue]);

  const handleSubInputBlur = useCallback(() => {
    if (!subInputValue.trim()) {
      setShowSubInput(false);
      return;
    }
    addSubItem(task.id, subInputValue.trim());
    setSubInputValue("");
    setShowSubInput(false);
  }, [addSubItem, task.id, subInputValue]);

  const subItems = task.subItems || [];

  return (
    <div className={styles.card} style={{ backgroundColor: task.color }}>
      <div className={styles.item}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggle}
          className={styles.checkbox}
          aria-label={`Marcar "${task.title}" como ${task.completed ? "pendiente" : "completada"}`}
        />
        <div className={styles.content}>
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSubmit}
              className={styles.editInput}
              aria-label="Editar título"
            />
          ) : (
            <span
              className={`${styles.title} ${task.completed ? styles.titleDone : ""}`}
              onDoubleClick={handleDoubleClick}
            >
              {task.title}
            </span>
          )}
          <span className={`${styles.badge} ${badgeClass[task.priority]}`}>
            {badgeLabel[task.priority]}
          </span>
        </div>
        <button
          onClick={handleDelete}
          className={`${styles.deleteButton} ${confirmingDelete ? styles.deleteConfirm : ""}`}
          aria-label={confirmingDelete ? "Confirmar eliminar" : `Eliminar "${task.title}"`}
        >
          {confirmingDelete ? "¿Seguro?" : "Borrar"}
        </button>
      </div>

      {subItems.length > 0 && (
        <ul className={styles.subList} aria-label="Sub-ítems">
          {subItems.map((si) => (
            <li key={si.id} className={styles.subItem}>
              <input
                type="checkbox"
                checked={si.completed}
                onChange={() => {}}
                onClick={handleSubToggle(si.id)}
                className={styles.subCheckbox}
                aria-label={si.title}
              />
              <span className={`${styles.subText} ${si.completed ? styles.subDone : ""}`}>
                {si.title}
              </span>
              <button className={styles.subDelete} onClick={handleSubRemove(si.id)} aria-label={`Eliminar ${si.title}`}>✕</button>
            </li>
          ))}
        </ul>
      )}

      {showSubInput ? (
        <input
          ref={subInputRef}
          type="text"
          value={subInputValue}
          onChange={(e) => setSubInputValue(e.target.value)}
          onKeyDown={handleSubInputKeyDown}
          onBlur={handleSubInputBlur}
          className={styles.subInput}
          placeholder="Nuevo ítem..."
          aria-label="Nuevo sub-ítem"
        />
      ) : (
        <button className={styles.addSubBtn} onClick={handleAddSub} aria-label="Agregar sub-ítem">
          + Agregar ítem
        </button>
      )}
    </div>
  );
}

export default memo(TaskItem);

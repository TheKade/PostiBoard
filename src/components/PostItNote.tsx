import { memo, useCallback, useState, useRef, useEffect } from "react";
import type { Task, NoteSize } from "../types/Task";
import { useTasks } from "../hooks/useTasks";
import { useToast } from "../hooks/useToast";
import styles from "../styles/PostItNote.module.css";

const COLLAPSE_LIMIT = 3;
const CONFIRM_DELAY = 2500;

const NOTE_SIZES: NoteSize[] = ["small", "medium", "large"];

const SIZE_WIDTH: Record<NoteSize, number> = {
  small: 160,
  medium: 200,
  large: 260,
};

interface PostItNoteProps {
  task: Task;
  isDragging: boolean;
  isConnectSource: boolean;
  isConnectTarget: boolean;
  onDragStart: (e: MouseEvent | TouchEvent, id: number) => void;
  onConnectClick: (id: number) => void;
}

const pinColorClass: Record<Task["priority"], string> = {
  low: styles.pinLow,
  medium: styles.pinMedium,
  high: styles.pinHigh,
};

const sizeClass: Record<NoteSize, string> = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

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

function PostItNote({ task, isDragging, isConnectSource, isConnectTarget, onDragStart, onConnectClick }: PostItNoteProps) {
  const { deleteTask, editTask, resizeNote, addSubItem, toggleSubItem, removeSubItem } = useTasks();
  const { addToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput) inputRef.current?.focus();
  }, [showInput]);

  useEffect(() => {
    if (editingTitle) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    return () => {
      if (confirmTimer.current != null) clearTimeout(confirmTimer.current);
    };
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isConnectTarget) return;
    e.stopPropagation();
    const native = e.nativeEvent as MouseEvent | TouchEvent;
    onDragStart(native, task.id);
  }, [isConnectTarget, onDragStart, task.id]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitle(true);
    setTitleValue(task.title);
  }, [task.title]);

  const handleTitleSubmit = useCallback(() => {
    if (titleValue.trim() && titleValue.trim() !== task.title) {
      editTask(task.id, titleValue.trim());
    }
    setEditingTitle(false);
  }, [editTask, task.id, titleValue, task.title]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter") handleTitleSubmit();
    if (e.key === "Escape") setEditingTitle(false);
  }, [handleTitleSubmit]);

  const handleResize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = NOTE_SIZES.indexOf(task.size);
    const next = NOTE_SIZES[(idx + 1) % NOTE_SIZES.length];
    resizeNote(task.id, next);
  }, [resizeNote, task.id, task.size]);

  const handleConnect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onConnectClick(task.id);
  }, [onConnectClick, task.id]);

  const handleNoteClick = useCallback((e: React.MouseEvent) => {
    if (isConnectTarget) {
      e.stopPropagation();
      onConnectClick(task.id);
    }
  }, [isConnectTarget, onConnectClick, task.id]);

  const handleToggleSubItem = useCallback((subItemId: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSubItem(task.id, subItemId);
  }, [toggleSubItem, task.id]);

  const handleRemoveSubItem = useCallback((subItemId: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    removeSubItem(task.id, subItemId);
  }, [removeSubItem, task.id]);

  const handleAddSubItem = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInput(true);
  }, []);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter" && inputValue.trim()) {
      addSubItem(task.id, inputValue.trim());
      setInputValue("");
      setShowInput(false);
    }
    if (e.key === "Escape") {
      setInputValue("");
      setShowInput(false);
    }
  }, [addSubItem, task.id, inputValue]);

  const handleInputBlur = useCallback(() => {
    if (!inputValue.trim()) {
      setShowInput(false);
      return;
    }
    addSubItem(task.id, inputValue.trim());
    setInputValue("");
    setShowInput(false);
  }, [addSubItem, task.id, inputValue]);

  const rotation = ((task.id % 7) - 3) * 0.8;
  const subItems = task.subItems || [];
  const visibleItems = expanded ? subItems : subItems.slice(0, COLLAPSE_LIMIT);
  const hasMore = subItems.length > COLLAPSE_LIMIT;
  const width = SIZE_WIDTH[task.size];
  const connClasses = [
    isConnectSource ? styles.connectSource : "",
    isConnectTarget ? styles.connectTarget : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={`${styles.note} ${sizeClass[task.size]} ${task.completed ? styles.completed : ""} ${isDragging ? styles.dragging : ""} ${connClasses}`}
      style={{
        left: task.position?.x ?? 0,
        top: task.position?.y ?? 0,
        transform: `rotate(${rotation}deg)`,
        background: task.color,
        width,
      }}
      onMouseDown={isConnectTarget ? undefined : handlePointerDown}
      onTouchStart={isConnectTarget ? undefined : handlePointerDown}
      onClick={handleNoteClick}
      onDoubleClick={handleDoubleClick}
      role="article"
      aria-label={`Tarea: ${task.title}`}
    >
      <div className={`${styles.pin} ${pinColorClass[task.priority]}`} aria-hidden="true">
        <div className={styles.pinHead} />
      </div>

      {editingTitle ? (
        <input
          ref={titleRef}
          type="text"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onKeyDown={handleTitleKeyDown}
          onBlur={handleTitleSubmit}
          className={styles.editInput}
          onClick={(e) => e.stopPropagation()}
          aria-label="Editar título"
        />
      ) : (
        <span className={styles.title}>{task.title}</span>
      )}

      {subItems.length > 0 && (
        <ul className={styles.subList} aria-label="Sub-ítems">
          {visibleItems.map((si) => (
            <li key={si.id} className={styles.subItem}>
              <input
                type="checkbox"
                checked={si.completed}
                onChange={() => {}}
                onClick={handleToggleSubItem(si.id)}
                className={styles.subCheckbox}
                aria-label={si.title}
              />
              <span className={`${styles.subText} ${si.completed ? styles.subDone : ""}`}>
                {si.title}
              </span>
              <button className={styles.subDelete} onClick={handleRemoveSubItem(si.id)} aria-label={`Eliminar ${si.title}`}>✕</button>
            </li>
          ))}
          {hasMore && !expanded && (
            <li className={styles.subToggle}>
              <button className={styles.subToggleBtn} onClick={(e) => { e.stopPropagation(); setExpanded(true); }} aria-label="Mostrar más">
                +{subItems.length - COLLAPSE_LIMIT} más ▾
              </button>
            </li>
          )}
          {hasMore && expanded && (
            <li className={styles.subToggle}>
              <button className={styles.subToggleBtn} onClick={(e) => { e.stopPropagation(); setExpanded(false); }} aria-label="Mostrar menos">
                Mostrar menos ▴
              </button>
            </li>
          )}
        </ul>
      )}

      {showInput ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          className={styles.subInput}
          placeholder="Nuevo ítem..."
          onClick={(e) => e.stopPropagation()}
          aria-label="Nuevo sub-ítem"
        />
      ) : (
        <button className={styles.addSubBtn} onClick={handleAddSubItem} aria-label="Agregar sub-ítem">
          + Agregar ítem
        </button>
      )}

      <div className={styles.footer}>
        <span className={`${styles.badge} ${badgeClass[task.priority]}`}>
          {badgeLabel[task.priority]}
        </span>
        <div className={styles.footerRight}>
          <button className={styles.connectBtn} onClick={handleConnect} title="Conectar Post-it" aria-label="Conectar Post-it">
            📌
          </button>
          <button className={styles.resizeBtn} onClick={handleResize} title="Cambiar tamaño" aria-label="Cambiar tamaño">
            {task.size === "small" ? "S" : task.size === "medium" ? "M" : "L"}
          </button>
          <button className={`${styles.deleteButton} ${confirmingDelete ? styles.deleteConfirm : ""}`} onClick={handleDelete} aria-label={confirmingDelete ? "Confirmar eliminar" : `Eliminar "${task.title}"`}>
            {confirmingDelete ? "¿Seguro?" : "Borrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(PostItNote);

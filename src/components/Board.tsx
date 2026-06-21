import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTasks } from "../hooks/useTasks";
import { useToast } from "../hooks/useToast";
import PostItNote from "./PostItNote";
import TaskList from "./TaskList";
import styles from "../styles/Board.module.css";
import type { TaskPriority, NoteSize } from "../types/Task";

const CASCADE_OFFSET_X = 30;
const CASCADE_OFFSET_Y = 40;
const NOTE_WIDTH = 200;
const NOTE_HEIGHT = 180;
const PIN_OFFSET_Y = 11;

const NOTE_SIZE_WIDTH: Record<NoteSize, number> = {
  small: 160,
  medium: 200,
  large: 260,
};

type ViewMode = "board" | "list";

const BG_KEY = "task-manager-bg";
const BG_OPTIONS = [
  { id: "dots", label: "Puntos" },
  { id: "lines", label: "Rayas" },
  { id: "cork", label: "Corcho" },
  { id: "chalkboard", label: "Pizarra" },
  { id: "gradient", label: "Gradiente" },
] as const;

type BgId = (typeof BG_OPTIONS)[number]["id"];

const BG_CLASS_MAP: Record<BgId, string> = {
  dots: styles.bgDots,
  lines: styles.bgLines,
  cork: styles.bgCork,
  chalkboard: styles.bgChalkboard,
  gradient: styles.bgGradient,
};

const PRIORITY_OPTIONS = [
  { id: "all", label: "Todas" },
  { id: "low", label: "Baja" },
  { id: "medium", label: "Media" },
  { id: "high", label: "Alta" },
] as const;

type PriorityFilter = (typeof PRIORITY_OPTIONS)[number]["id"];

function loadBg(): BgId {
  try {
    const stored = localStorage.getItem(BG_KEY) as BgId | null;
    if (stored && BG_OPTIONS.some((o) => o.id === stored)) return stored;
  } catch {
    /* ignore */
  }
  return "dots";
}

function getClientPos(e: MouseEvent | TouchEvent): { clientX: number; clientY: number } {
  if ("touches" in e && e.touches.length > 0) {
    return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
  }
  return { clientX: (e as MouseEvent).clientX, clientY: (e as MouseEvent).clientY };
}

function getPinCenter(
  task: { position?: { x: number; y: number }; size?: NoteSize }
): { x: number; y: number } | null {
  if (!task.position) return null;
  const w = NOTE_SIZE_WIDTH[task.size ?? "medium"];
  return { x: task.position.x + w / 2, y: task.position.y + PIN_OFFSET_Y };
}

function Board() {
  const { tasks, connections, addTask, moveTask, addConnection, removeConnection, loadState } = useTasks();
  const { addToast } = useToast();
  const [view, setView] = useState<ViewMode>("board");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<number | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [bgId, setBgId] = useState<BgId>(loadBg);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  const dragOffset = useRef({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const tasksRef = useRef(tasks);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "/" && document.activeElement === document.body) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const persistBg = useCallback((id: BgId) => {
    setBgId(id);
    try { localStorage.setItem(BG_KEY, id); } catch { /* ignore */ }
  }, []);

  const toggleDark = useCallback(() => {
    document.documentElement.classList.toggle("dark");
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title, priority);
    addToast(`Tarea "${title.trim()}" creada`, "success");
    setTitle("");
    setPriority("medium");
  };

  const handleDragStart = useCallback((e: MouseEvent | TouchEvent, id: number) => {
    e.stopPropagation();
    const task = tasksRef.current.find((t) => t.id === id);
    if (!task) return;
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;
    const pos = getClientPos(e);
    dragOffset.current = {
      x: pos.clientX - boardRect.left - (task.position?.x ?? 0),
      y: pos.clientY - boardRect.top - (task.position?.y ?? 0),
    };
    setDraggingId(id);
  }, []);

  useEffect(() => {
    if (draggingId === null) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const boardRect = boardRef.current?.getBoundingClientRect();
      if (!boardRect) return;
      const pos = getClientPos(e);
      const x = Math.max(0, pos.clientX - boardRect.left - dragOffset.current.x);
      const y = Math.max(0, pos.clientY - boardRect.top - dragOffset.current.y);
      moveTask(draggingId, { x, y });
    };
    const handleEnd = () => setDraggingId(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [draggingId, moveTask]);

  const handleConnectClick = useCallback((id: number) => {
    if (connectSourceId === null) {
      setConnectSourceId(id);
      return;
    }
    if (connectSourceId === id) {
      setConnectSourceId(null);
      return;
    }
    addConnection(connectSourceId, id);
    addToast("Conexión creada", "success");
    setConnectSourceId(null);
  }, [connectSourceId, addConnection, addToast]);

  const handleCanvasClick = useCallback(() => {
    setSelectedConnection(null);
    setConnectSourceId(null);
  }, []);

  const handleConnectionClick = useCallback((connId: number) => {
    setSelectedConnection((prev) => (prev === connId ? null : connId));
  }, []);

  const handleConnectionDelete = useCallback((connId: number) => {
    removeConnection(connId);
    setSelectedConnection(null);
    addToast("Conexión eliminada", "info");
  }, [removeConnection, addToast]);

  const handleAutoOrder = useCallback(() => {
    window.scrollTo(0, 0);
    tasks.forEach((task, index) => {
      const cols = Math.floor((window.innerWidth - 40) / (NOTE_WIDTH + CASCADE_OFFSET_X)) || 1;
      moveTask(task.id, {
        x: 20 + (index % cols) * (NOTE_WIDTH + CASCADE_OFFSET_X),
        y: 20 + Math.floor(index / cols) * (NOTE_HEIGHT + CASCADE_OFFSET_Y),
      });
    });
  }, [tasks, moveTask]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify({ tasks, connections }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "task-manager-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    addToast("Backup exportado", "success");
  }, [tasks, connections, addToast]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.tasks) {
          loadState({ tasks: data.tasks, connections: data.connections ?? [] });
          addToast("Backup importado", "success");
        } else {
          addToast("Archivo inválido", "error");
        }
      } catch {
        addToast("Error al leer archivo", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [loadState, addToast]);

  const filteredTasks = useMemo(() => {
    if (priorityFilter === "all") return tasks;
    return tasks.filter((t) => t.priority === priorityFilter);
  }, [tasks, priorityFilter]);

  const displayTasks = useMemo(() => {
    const cols = Math.max(1, Math.floor((window.innerWidth - 40) / (NOTE_WIDTH + CASCADE_OFFSET_X)));
    return filteredTasks.map((task, index) => {
      if (task.position) return task;
      return {
        ...task,
        position: {
          x: 20 + (index % cols) * (NOTE_WIDTH + CASCADE_OFFSET_X),
          y: 20 + Math.floor(index / cols) * (NOTE_HEIGHT + CASCADE_OFFSET_Y),
        },
      };
    });
  }, [filteredTasks]);

  const tasksMap = useMemo(() => {
    const map = new Map<number, (typeof tasks)[number]>();
    for (const t of displayTasks) map.set(t.id, t);
    return map;
  }, [displayTasks]);

  const connectionPaths = useMemo(() => {
    return connections.map((conn) => {
      const from = tasksMap.get(conn.from);
      const to = tasksMap.get(conn.to);
      if (!from?.position || !to?.position) return null;
      const p1 = getPinCenter(from);
      const p2 = getPinCenter(to);
      if (!p1 || !p2) return null;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dy = Math.abs(p2.y - p1.y);
      const sag = Math.max(dy * 0.5, 30);
      return {
        id: conn.id,
        color: conn.color,
        d: `M ${p1.x} ${p1.y + 4} Q ${midX} ${midY + sag} ${p2.x} ${p2.y + 4}`,
        midX,
        midY: midY + sag,
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }, [connections, tasksMap]);

  const connectSourceTask = connectSourceId ? tasksMap.get(connectSourceId) : null;

  return (
    <div className={`${styles.board} ${BG_CLASS_MAP[bgId]}`} ref={boardRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleImport}
      />

      <div className={styles.topBar}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Nueva idea... (Ctrl+K)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            aria-label="Nueva tarea"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className={styles.select}
            aria-label="Prioridad"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
          <button type="submit" className={styles.addButton}>Agregar</button>
        </form>
        <div className={styles.topBarGroup}>
          <button
            className={`${styles.topBtn} ${view === "board" ? styles.topBtnActive : ""}`}
            onClick={() => setView("board")}
            aria-label="Vista tablero"
          >
            Tablero
          </button>
          <button
            className={`${styles.topBtn} ${view === "list" ? styles.topBtnActive : ""}`}
            onClick={() => setView("list")}
            aria-label="Vista lista"
          >
            Lista
          </button>
          <span className={styles.topSep} />
          {view === "board" && (
            <button className={styles.topBtn} onClick={handleAutoOrder} aria-label="Ordenar Post-its">
              ⊞ Ordenar
            </button>
          )}
          <span className={styles.topSep} />
          <button className={styles.topBtn} onClick={handleExport} title="Exportar backup" aria-label="Exportar backup">
            📤
          </button>
          <button className={styles.topBtn} onClick={() => fileInputRef.current?.click()} title="Importar backup" aria-label="Importar backup">
            📥
          </button>
          <span className={styles.topSep} />
          <button className={styles.topBtn} onClick={toggleDark} title="Modo oscuro" aria-label="Alternar modo oscuro">
            🌙
          </button>
          <span className={styles.topSep} />
          {BG_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={`${styles.bgSwatch} ${bgId === opt.id ? styles.bgSwatchActive : ""} ${styles["bgSwatch" + opt.id.charAt(0).toUpperCase() + opt.id.slice(1)]}`}
              onClick={() => persistBg(opt.id)}
              title={opt.label}
              aria-label={`Fondo ${opt.label}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>Filtrar:</span>
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`${styles.filterBtn} ${priorityFilter === opt.id ? styles.filterBtnActive : ""}`}
            onClick={() => setPriorityFilter(opt.id)}
            aria-label={`Filtrar por ${opt.label}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {connectSourceTask && (
        <div className={styles.connectHint} role="status">
          Conectando desde: <strong>{connectSourceTask.title}</strong>
          <button className={styles.connectHintClose} onClick={() => setConnectSourceId(null)}>
            ✕ Cancelar
          </button>
        </div>
      )}

      {view === "list" ? (
        <TaskList priorityFilter={priorityFilter} />
      ) : (
        <div className={styles.canvas} onClick={handleCanvasClick}>
          <svg className={styles.svg} aria-hidden="true">
            {connectionPaths.map((conn) => (
              <g key={conn.id}>
                <path
                  d={conn.d}
                  className={styles.threadHitArea}
                  onClick={(e) => { e.stopPropagation(); handleConnectionClick(conn.id); }}
                />
                <path d={conn.d} className={styles.threadLine} style={{ stroke: conn.color }} />
                {selectedConnection === conn.id && (
                  <>
                    <circle cx={conn.midX} cy={conn.midY} r={12} className={styles.threadDeleteBg} />
                    <text
                      x={conn.midX}
                      y={conn.midY + 1}
                      className={styles.threadDeleteX}
                      onClick={(e) => { e.stopPropagation(); handleConnectionDelete(conn.id); }}
                    >
                      ✕
                    </text>
                  </>
                )}
              </g>
            ))}
          </svg>

          {displayTasks.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon} aria-hidden="true">📝</div>
              <p>{priorityFilter !== "all" ? "No hay tareas con esa prioridad." : "Agregá tu primera idea"}</p>
            </div>
          )}

          {displayTasks.map((task) => (
            <PostItNote
              key={task.id}
              task={task}
              isDragging={draggingId === task.id}
              isConnectSource={connectSourceId === task.id}
              isConnectTarget={connectSourceId !== null && connectSourceId !== task.id}
              onDragStart={handleDragStart}
              onConnectClick={handleConnectClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Board;

import { useReducer, useCallback, useEffect, useRef, type PropsWithChildren } from "react";
import type { Task, TaskPriority, Position, NoteSize, Connection, SubItem } from "../types/Task";
import { taskReducer, type TaskState } from "../reducers/taskReducer";
import { TaskContext } from "./TaskContext";

const STORAGE_KEY = "task-manager-tasks";

const THREAD_COLORS = ["#8B7355", "#b85450", "#4a7c59", "#5b7fa5", "#9b6b9b", "#c9793a"];

const PASTEL_COLORS = [
  "#fef9d7", "#fce4ec", "#e8f5e9", "#e3f2fd",
  "#fff3e0", "#f3e5f5", "#e0f7fa", "#fbe9e7",
];

function pickColor(tasks: Task[]): string {
  const used = new Set(tasks.map((t) => t.color));
  const free = PASTEL_COLORS.filter((c) => !used.has(c));
  if (free.length > 0) return free[Math.floor(Math.random() * free.length)];
  return PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
}

function loadInitialState(): TaskState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: TaskState = JSON.parse(stored);
      return {
        tasks: parsed.tasks.map((t) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          color: t.color ?? "#fef9d7",
          subItems: t.subItems ?? [],
          size: t.size ?? "medium",
        })),
        connections: parsed.connections?.map((c) => ({
          ...c,
          color: c.color ?? THREAD_COLORS[Math.floor(Math.random() * THREAD_COLORS.length)],
        })) ?? [],
      };
    }
  } catch {
    /* ignore */
  }
  return { tasks: [], connections: [] };
}

let connIdCounter = Date.now();

export function TaskProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(taskReducer, undefined, loadInitialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const addTask = useCallback((title: string, priority: TaskPriority) => {
    const { tasks } = stateRef.current;
    const newTask: Task = {
      id: Date.now(),
      title,
      completed: false,
      priority,
      createdAt: new Date(),
      color: pickColor(tasks),
      subItems: [],
      size: "medium",
    };
    dispatch({ type: "ADD_TASK", payload: newTask });
  }, []);

  const toggleTask = useCallback((id: number) => {
    dispatch({ type: "TOGGLE_TASK", payload: id });
  }, []);

  const deleteTask = useCallback((id: number) => {
    dispatch({ type: "DELETE_TASK", payload: id });
  }, []);

  const moveTask = useCallback((id: number, position: Position) => {
    dispatch({ type: "MOVE_TASK", payload: { id, position } });
  }, []);

  const editTask = useCallback((id: number, title: string) => {
    if (!title.trim()) return;
    dispatch({ type: "EDIT_TASK", payload: { id, title: title.trim() } });
  }, []);

  const resizeNote = useCallback((id: number, size: NoteSize) => {
    dispatch({ type: "RESIZE_NOTE", payload: { id, size } });
  }, []);

  const addConnection = useCallback((from: number, to: number) => {
    if (from === to) return;
    const { connections } = stateRef.current;
    const exists = connections.some(
      (c) => (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );
    if (exists) return;
    connIdCounter += 1;
    const color = THREAD_COLORS[Math.floor(Math.random() * THREAD_COLORS.length)];
    const connection: Connection = { id: connIdCounter, from, to, color };
    dispatch({ type: "ADD_CONNECTION", payload: connection });
  }, []);

  const removeConnection = useCallback((id: number) => {
    dispatch({ type: "REMOVE_CONNECTION", payload: id });
  }, []);

  const loadState = useCallback((newState: TaskState) => {
    dispatch({ type: "LOAD_STATE", payload: newState });
  }, []);

  const addSubItem = useCallback((taskId: number, title: string) => {
    if (!title.trim()) return;
    const subItem: SubItem = { id: Date.now(), title: title.trim(), completed: false };
    dispatch({ type: "ADD_SUB_ITEM", payload: { taskId, subItem } });
  }, []);

  const toggleSubItem = useCallback((taskId: number, subItemId: number) => {
    dispatch({ type: "TOGGLE_SUB_ITEM", payload: { taskId, subItemId } });
  }, []);

  const removeSubItem = useCallback((taskId: number, subItemId: number) => {
    dispatch({ type: "REMOVE_SUB_ITEM", payload: { taskId, subItemId } });
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks: state.tasks,
        connections: state.connections,
        addTask,
        toggleTask,
        deleteTask,
        moveTask,
        editTask,
        resizeNote,
        addConnection,
        removeConnection,
        loadState,
        addSubItem,
        toggleSubItem,
        removeSubItem,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}
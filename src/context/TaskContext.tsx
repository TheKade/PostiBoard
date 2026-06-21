import { createContext } from "react";
import type { Task, TaskPriority, Position, NoteSize, Connection } from "../types/Task";
import type { TaskState } from "../reducers/taskReducer";

export interface TaskContextType {
  tasks: Task[];
  connections: Connection[];
  addTask: (title: string, priority: TaskPriority) => void;
  toggleTask: (id: number) => void;
  deleteTask: (id: number) => void;
  moveTask: (id: number, position: Position) => void;
  editTask: (id: number, title: string) => void;
  resizeNote: (id: number, size: NoteSize) => void;
  addConnection: (from: number, to: number) => void;
  removeConnection: (id: number) => void;
  addSubItem: (taskId: number, title: string) => void;
  toggleSubItem: (taskId: number, subItemId: number) => void;
  removeSubItem: (taskId: number, subItemId: number) => void;
  loadState: (state: TaskState) => void;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);
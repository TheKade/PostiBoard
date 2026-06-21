export type TaskPriority =
  | "low"
  | "medium"
  | "high";

export type NoteSize = "small" | "medium" | "large";

export interface Position {
  x: number;
  y: number;
}

export interface SubItem {
  id: number;
  title: string;
  completed: boolean;
}

export interface Connection {
  id: number;
  from: number;
  to: number;
  color: string;
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  createdAt: Date;
  position?: Position;
  color: string;
  subItems: SubItem[];
  size: NoteSize;
}
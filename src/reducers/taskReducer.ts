import type { Task, Position, SubItem, NoteSize, Connection } from "../types/Task";

export interface TaskState {
  tasks: Task[];
  connections: Connection[];
}

export type TaskAction =
  | { type: "ADD_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: number }
  | { type: "TOGGLE_TASK"; payload: number }
  | { type: "MOVE_TASK"; payload: { id: number; position: Position } }
  | { type: "ADD_SUB_ITEM"; payload: { taskId: number; subItem: SubItem } }
  | { type: "TOGGLE_SUB_ITEM"; payload: { taskId: number; subItemId: number } }
  | { type: "REMOVE_SUB_ITEM"; payload: { taskId: number; subItemId: number } }
  | { type: "EDIT_TASK"; payload: { id: number; title: string } }
  | { type: "RESIZE_NOTE"; payload: { id: number; size: NoteSize } }
  | { type: "ADD_CONNECTION"; payload: Connection }
  | { type: "REMOVE_CONNECTION"; payload: number }
  | { type: "LOAD_STATE"; payload: TaskState };

export const initialState: TaskState = {
  tasks: [],
  connections: [],
};

function allSubItemsDone(task: Task): boolean {
  return task.subItems.length > 0 && task.subItems.every((s) => s.completed);
}

export function taskReducer(
  state: TaskState,
  action: TaskAction
): TaskState {
  switch (action.type) {
    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, action.payload] };

    case "DELETE_TASK": {
      const connections = state.connections.filter(
        (c) => c.from !== action.payload && c.to !== action.payload
      );
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload), connections };
    }

    case "TOGGLE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? { ...task, completed: !task.completed }
            : task
        ),
      };

    case "MOVE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id
            ? { ...task, position: action.payload.position }
            : task
        ),
      };

    case "EDIT_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id
            ? { ...task, title: action.payload.title }
            : task
        ),
      };

    case "RESIZE_NOTE":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id
            ? { ...task, size: action.payload.size }
            : task
        ),
      };

    case "ADD_CONNECTION":
      return { ...state, connections: [...state.connections, action.payload] };

    case "REMOVE_CONNECTION":
      return {
        ...state,
        connections: state.connections.filter((c) => c.id !== action.payload),
      };

    case "ADD_SUB_ITEM":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, subItems: [...task.subItems, action.payload.subItem] }
            : task
        ),
      };

    case "TOGGLE_SUB_ITEM":
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.payload.taskId) return task;
          const subItems = task.subItems.map((s) =>
            s.id === action.payload.subItemId ? { ...s, completed: !s.completed } : s
          );
          const updated = { ...task, subItems };
          if (allSubItemsDone(updated)) {
            updated.completed = true;
          } else if (task.completed) {
            updated.completed = false;
          }
          return updated;
        }),
      };

    case "REMOVE_SUB_ITEM":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, subItems: task.subItems.filter((s) => s.id !== action.payload.subItemId) }
            : task
        ),
      };

    case "LOAD_STATE":
      return action.payload;

    default:
      return state;
  }
}
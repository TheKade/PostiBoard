import { useContext } from "react";
import { TaskContext } from "../context/TaskContext"; // Apunta al archivo puro

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks debe ser usado dentro de un TaskProvider");
  }
  return context;
}
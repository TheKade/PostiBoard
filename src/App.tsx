import { useEffect } from "react";
import { TaskProvider } from "./context/TaskProvider";
import { ToastProvider } from "./context/ToastProvider";
import Header from "./components/Header";
import Board from "./components/Board";

const DARK_KEY = "task-manager-dark";

function App() {
  useEffect(() => {
    try {
      const dark = localStorage.getItem(DARK_KEY);
      if (dark === "true") {
        document.documentElement.classList.add("dark");
      }
    } catch { /* ignore */ }

    const observer = new MutationObserver(() => {
      try {
        localStorage.setItem(DARK_KEY, document.documentElement.classList.contains("dark") ? "true" : "false");
      } catch { /* ignore */ }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <TaskProvider>
      <ToastProvider>
        <Header />
        <Board />
      </ToastProvider>
    </TaskProvider>
  );
}

export default App;

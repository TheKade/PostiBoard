# PostiBoard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vite.dev)

A visual Post-it note board for task management. Drag notes freely, connect them with threads, add checklists, switch between board and list views, and customize the background — all persisted in your browser.

## Features

- **Board view** — Post-it notes with free drag (mouse + touch), random rotation, and cascade auto-layout
- **List view** — grouped by pending / completed with live search and priority filter
- **Sub-items** — inline checklists with auto-complete of the parent task, collapsible after 3 items
- **Thread connections** — click the 📌 button on a note, then click another note to draw a curved SVG thread; click a thread to reveal its delete button
- **Note sizing** — cycle through Small / Medium / Large per note
- **Inline title editing** — double-click any title to edit it
- **Priority filter** — filter tasks by All / Low / Medium / High in both views
- **5 board backgrounds** — Dots, Lines, Cork, Chalkboard, Gradient
- **Dark mode** — toggle 🌙 with localStorage persistence
- **Export / Import** — full JSON backup via 📤 / 📥 buttons
- **Keyboard shortcut** — `Ctrl+K` or `/` focuses the "new task" input
- **Delete confirmation** — first click shows "¿Seguro?" with a 2.5s timeout before deletion
- **Toast notifications** — non-intrusive feedback for create, delete, and connect actions
- **Responsive** — adapts to viewports ≤480px
- **Persistence** — tasks, connections, positions, backgrounds, and theme survive page reload via localStorage

## Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 |
| Language | TypeScript ~6 |
| Build | Vite 8 |
| Package manager | pnpm |
| Styling | CSS Modules + CSS custom properties |
| State | useReducer + React Context |

## Getting started

```bash
pnpm install
pnpm run dev
```

### Build for production

```bash
pnpm run build
```

Output goes to the `dist/` directory.

## Project structure

```
src/
├── types/           # TypeScript interfaces
├── reducers/        # useReducer logic
├── context/         # React Context providers
├── hooks/           # Custom hooks
├── components/      # UI components
└── styles/          # CSS Modules
```

## License

MIT — see [LICENSE](LICENSE).

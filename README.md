# Excalibur IDE ⚔️

**The AI-First, Multi-Agent Desktop IDE.**

Excalibur is a next-generation integrated development environment built from the ground up to treat AI agents as first-class citizens. Designed with a minimalist "Antigravity" aesthetic, it combines a high-performance local LLM backend with a sophisticated multi-agent orchestration layer to automate complex coding tasks while maintaining a developer-centric, data-dense interface.

![Excalibur Preview](https://via.placeholder.com/1200x600.png?text=Excalibur+IDE+Interface+Preview)

## ✨ Key Features

- **Autonomous Multi-Agent Orchestration**: Native support for specialized agents (**Planner**, **Coder**, **Debugger**, and **Verifier**) that work together to solve complex architectural challenges.
- **Local-First LLM Execution**: Integrated `llama.cpp` server support for private, high-performance inference using state-of-the-art models like Qwen2.5-Coder.
- **The "Antigravity" Design System**: A pixel-perfect, minimalist dark interface designed to reduce cognitive load while maximizing information density.
- **Professional IDE Suite**:
  - **Monaco Editor**: High-fidelity code editing with intelligent syntax highlighting.
  - **XTerm Terminal**: Fully functional integrated terminal for local execution.
  - **Real-time Trace Viewer**: Inspect agent thought processes and event logs in real-time.
  - **Native Git Integration**: Visual source control and diff management.
- **Secure by Design**: Workspace boundary enforcement ensures AI agents only interact with the files you authorize.

## 🏗️ Architecture

Excalibur utilizes a robust **Tri-Architecture** to ensure performance and stability:

1.  **Frontend (React/Vite)**: A high-performance renderer for the Antigravity UI.
2.  **Electron Main Process**: Manages system-level bindings, file system security, and window management.
3.  **Core AI Backend**: The orchestration engine for multi-agent loops, session management, and LLM communication.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher.
- **Local Model**: A GGUF-formatted model (e.g., `qwen2.5-coder-7b-instruct-q4_k_m.gguf`) placed in the `models/` directory.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Arthurs-excalibur/Excalibur-.git
    cd Excalibur-
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Binaries**:
    Ensure the `llama-server.exe` and necessary DLLs are in the `bin/` directory (ignored by git).

### Running in Development

```bash
npm run dev:electron
```

## 🛠️ Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/) + [React](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Terminal**: [XTerm.js](https://xtermjs.org/)
- **AI Core**: [llama.cpp](https://github.com/ggerganov/llama.cpp)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ⚔️ by Arthur & The Excalibur Team.**

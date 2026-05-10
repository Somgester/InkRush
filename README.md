# INKRUSH 🎨⚡

**Inkrush** is a high-performance, real-time multiplayer drawing and guessing game built with a modern tech stack. Inspired by Skribbl.io, it offers a seamless, interactive experience where players compete to draw and guess words in a fast-paced, social environment.

## 🚀 Key Features

### 🎮 Gameplay & Social
*   **Real-time Multiplayer:** Instant synchronization across all players using Socket.io.
*   **Smart Room Management:** Create private rooms and invite friends via Skribbl-style direct links (`?ROOM_ID`).
*   **Live Interactive Chat:** A unified system for social messaging and word guessing with proximity detection ("Close!" notifications).
*   **Dynamic Leaderboard:** Real-time scoring based on guess speed and artist performance.
*   **Podium Finish:** A celebratory finale showing the top players at the end of the game.

### 🖌️ Advanced Drawing Tools
*   **Ghost Cursor:** An immersive drawing experience where the tool (Pencil/Bucket/Eraser) follows your movement.
*   **Paint Bucket (Flood Fill):** A high-performance algorithm to instantly fill enclosed shapes with color.
*   **Custom Assets:** Fully themed drawing toolbar with dedicated icons and synchronized brush sizes.
*   **Real-time Canvas Sync:** Zero-latency stroke broadcasting to all participants.

### ⚙️ Host Control (Lobby Settings)
*   **Customizable Rounds:** Set game length from 2 to 20 rounds.
*   **Adjustable Timers:** Configure drawing time from 30s to 180s.
*   **Player Limits:** Manage room capacity (up to 20 players).
*   **Custom Word Pools:** Hosts can input their own comma-separated word lists to prioritize during the game.

---

## 🛠️ Tech Stack

### Frontend
*   **React 19 (TypeScript)** - Component-based UI with strict type safety.
*   **Vite** - Lightning-fast build tool and development server.
*   **Tailwind CSS 4** - Modern, utility-first styling for a playful and responsive UI.
*   **Socket.io Client** - Real-time event-based communication.

### Backend
*   **Node.js & Express** - Robust and scalable server architecture.
*   **Socket.io** - WebSocket management for real-time game state synchronization.
*   **TypeScript** - Ensuring structural integrity across the entire application.

---

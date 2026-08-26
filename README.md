<div align="center">

<img src="assets/banner.svg" alt="InkRush — real-time multiplayer drawing and guessing" width="880">

**A real-time draw-and-guess party game where one Node server owns every rule — turn order, timers, scoring and near-miss detection — while the browser only captures ink and renders what it is told.**

![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-adapter--pg-4169e1?logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-regression%20suite-6e9f18?logo=vitest&logoColor=white)

</div>

## What it does

Players join a room by code, by a `?ROOM_ID` invite link, or by leaving the code blank and letting **Quick Join** drop them into the fullest public room that still has space. Each turn the server picks an artist who has not drawn yet, offers three words — the host's custom pack first, then a shuffled deck of 203 — and starts the clock. The artist's strokes and bucket fills stream to every other tab as they happen; everyone else races to type the word into the event log. Guess first and you score the most, every player who guesses after you scores less, and the artist banks a bonus for each person who works it out. When every player has drawn the round advances, and when the rounds run out the game drops into a podium.

The recording below is a real three-player match driven end to end through the running app — the artist outlines a house, colours it in with the fill bucket, a one-letter typo comes back as *very close*, and the correct guess reorders the scoreboard.

<div align="center">
<img src="assets/gameplay.gif" alt="Live match: outline strokes and bucket fills syncing to a guesser's canvas, a near-miss nudge, then a correct guess reordering the scoreboard" width="840">
</div>

The neatest idea in the codebase is how little goes on the wire. A stroke is sent as the two endpoints of one segment expressed as *fractions* of the canvas — `{ x: 0.62, y: 0.31, prevX: 0.58, prevY: 0.28, color, width }` — and each receiver multiplies them back out by its own canvas size, so a 4K monitor and a phone in portrait draw geometrically identical pictures. A bucket fill goes further: `draw_fill` carries only `{ x, y, color }`, and every client re-runs the same scanline flood fill locally. Colouring in half the canvas costs three values on the wire — and it works precisely *because* every client's bitmap was built from the same resolution-independent strokes in the first place.

## By the numbers

| Metric | Value | Measured from |
|---|---|---|
| Game server | **712 lines** of TypeScript across 8 files | `backend/src` |
| Client | **1,924 lines** across 9 components | `frontend/src` |
| Word deck | **203 words**, 5 of them multi-word, plus per-room custom packs | `words.ts` |
| Socket protocol | **10 inbound**, **8 outbound** events | `server.ts` + `gameEngine.ts` |
| Tunable rules | **16 env knobs** (all defaulted) + 5 per-room settings | `config.ts`, `LobbySettings.tsx` |
| Engine tests | **12 Vitest tests** across 2 files, passing in 2.15 s | `npm test` in `backend/` |
| Client bundle | **273.34 kB** JS (**83.56 kB** gzipped) + 14.74 kB CSS | `vite build`, 1,844 modules |
| Production build | **1.18 s** for the Vite pass, 16 s including `tsc -b` | timed clean build |
| Recorded match | 3 players × 2 rounds = **6 turns**, final 1400 / 1360 / 1320 | the session in the GIF |

## Highlights

- **Server-authoritative by construction.** One `Room` object per room holds status, players, scores, settings, timer and artist. Clients emit intent (`join_room`, `choose_word`, `send_message`, `update_settings`) and re-render whatever `room_data` comes back — no score, timer or turn decision is ever made in the browser.
- **A real state machine, not a pile of booleans.** `GameStatus` is a five-value union and `GameEngine` is the only thing allowed to move between them, each transition owning a `setInterval` that is always cleared before the next one starts.
- **Three numbers repaint a region.** A scanline flood fill with an explicit stack (no recursion, `willReadFrequently` on the context) runs identically on every client from a single `draw_fill` event.
- **Word pools that don't repeat themselves.** Each game shuffles the whole deck once and drains it three at a time instead of re-rolling per turn, so a word can't come up twice in a game. Host-supplied custom words drain first, and the two the artist *didn't* pick go back into the pool for later turns.
- **Near-miss detection that doesn't leak the answer.** A hand-written Levenshtein distance flags guesses exactly one edit from the word. The *"'hause' is very close!"* nudge goes only to the socket that typed it; the guess itself appears in the log like any other message.
- **Decay scoring.** The first correct guesser takes the full award, each later guesser takes less down to a floor, and the artist banks a bonus per solver — so drawing well pays and guessing fast pays more. The turn ends the moment the room has solved it rather than waiting out the clock.
- **Fair rotation.** `drawnPlayerIds` guarantees every player draws before the round counter moves, which is why a 3-player, 2-round game is six turns rather than two.
- **A drawing surface that feels like a tool.** Twenty-colour palette, brush sizes 1–30, pencil / fill bucket / eraser, and a ghost cursor — the native pointer is hidden and the active tool's icon tracks the mouse instead.
- **Optional persistence, not required persistence.** Google sign-in adds a Postgres-backed profile with games played, wins, total points and words guessed — but every database write is individually `.catch()`-guarded, so the game runs end to end with no database attached at all.
- **Graceful disconnects.** Losing the artist ends the turn instead of hanging it, host status migrates to the next player, rooms delete themselves when the last player leaves, and a room dropping below the minimum ends the game rather than stalling.

## Architecture

```mermaid
flowchart LR
    A["Artist tab<br/>React 19"]
    G1["Guesser tab"]
    G2["Guesser tab"]
    IO{{"Socket.IO + Express<br/>Node"}}
    GE["GameEngine<br/>timers · scoring · rotation"]
    RM[("rooms Map<br/>roomId → Room, in memory")]
    DB[("PostgreSQL via Prisma<br/>profiles only")]

    A -->|"draw_move · draw_fill · choose_word"| IO
    G1 -->|"send_message"| IO
    G2 -->|"quick_join · update_settings"| IO
    IO --> GE
    GE <--> RM
    GE -.->|"stats, best effort"| DB
    GE -->|"room_data · timer_update · new_message"| IO
    IO -.->|broadcast| A
    IO -.->|broadcast| G1
    IO -.->|broadcast| G2
```

`draw_move` and `draw_fill` are relayed straight to the other sockets in the room so ink stays smooth, while everything that affects the outcome — who draws, what the clock says, who scored — round-trips through `GameEngine` and comes back as a single `room_data` broadcast. Live game state lives only in memory; Postgres holds nothing but long-term player profiles, and the game is fully playable without it.

```mermaid
stateDiagram-v2
    [*] --> LOBBY
    LOBBY --> WORD_SELECTION: host starts · 2+ players
    WORD_SELECTION --> DRAWING: artist picks · or 15s auto-picks the first
    DRAWING --> ROUND_END: everyone guessed · or the room's drawing timer expires
    ROUND_END --> WORD_SELECTION: next artist · round++ once all have drawn
    ROUND_END --> GAME_OVER: all have drawn and currentRound == totalRounds
    GAME_OVER --> LOBBY: 10s, scores reset
```

## Quick start

Node 20.19+ or 22.12+ (Vite 8's requirement) and two terminals.

```bash
# terminal 1 — game server on http://localhost:5000
cd backend
npm install
npx prisma generate      # required: src/db.ts imports the generated client
npm run dev

# terminal 2 — client on http://localhost:5173
cd frontend
npm install
npm run dev
```

Open the client in two or more tabs, use the same room code in each, and the host tab gets **Start Engine** once a second player joins.

<div align="center">
<img src="assets/shot-landing.png" alt="InkRush join screen with Google sign-in, leaderboard button, name and room code" width="620">
</div>

All of that works with no database and no OAuth credentials — sign-in, the global leaderboard and career stats are the only features that need them:

```ini
# backend/.env — every game rule has a built-in default
DATABASE_URL=postgresql://user:pass@localhost:5432/inkrush   # profiles only
TOTAL_ROUNDS=3
DRAWING_SECONDS=60

# frontend/.env
VITE_BACKEND_URL=http://localhost:5000    # only if the server isn't on :5000
VITE_GOOGLE_CLIENT_ID=...                 # only for Google sign-in
```

Tests: `npm test` in either folder (Vitest). Production builds: `npm run build` in each — `backend` compiles to `dist/` and runs with `npm start`; `frontend` emits a static bundle with relative asset paths, so it drops onto any static host.

## Configuration

Server defaults, all overridable from `backend/.env`:

| Variable | Default | What it controls |
|---|---|---|
| `BACKEND_PORT` | `5000` | HTTP + WebSocket port |
| `FRONTEND_URL` | `*` | CORS origin for both Express and Socket.IO |
| `MAX_PLAYERS_PER_ROOM` | `12` | Seeds a new room's capacity; joining is refused past it |
| `MIN_PLAYERS_TO_START` | `2` | Also the floor below which a live game ends |
| `TOTAL_ROUNDS` | `10` | Seeds a new room's round count |
| `WORD_SELECTION_SECONDS` | `15` | Artist's pick timer; on timeout the first word is taken |
| `DRAWING_SECONDS` | `30` | Seeds a new room's drawing timer |
| `ROUND_END_SECONDS` | `5` | Reveal screen between turns |
| `GAME_END_SECONDS` | `10` | Podium hold before returning to the lobby |
| `GUESS_PROXIMITY_THRESHOLD` | `1` | Edit distance that counts as "very close" |
| `MIN_GUESS_POINTS` | `100` | Award floor for a late correct guess |
| `MAX_GUESS_POINTS` | `500` | Award for the first correct guess |
| `POINT_DEDUCTION_PER_GUESSER` | `50` | Subtracted per player who already solved it |
| `ARTIST_BONUS_POINTS` | `50` | Paid to the artist per correct guess |
| `SYSTEM_MESSAGE_SENDER` | `System` | Display name on system log lines |
| `NODE_ENV`, `DATABASE_URL` | — | Standard Node flag; Postgres connection for profiles |

The host overrides the room-level ones live from the lobby: **max players** (2–20), **total rounds** (2–20), **drawing time** (30–180 s), **public room** (whether Quick Join can find it), and a comma-separated **custom word pack**.

## Project layout

```
InkRush/
├─ backend/
│  ├─ prisma/schema.prisma     User model: games, wins, points, words guessed
│  ├─ src/
│  │  ├─ server.ts             HTTP + socket wiring, room lifecycle, chat fan-out
│  │  ├─ gameEngine.ts         state machine, timers, scoring, rotation, word pools
│  │  ├─ users.ts              POST /api/users/login · GET /api/users/leaderboard
│  │  ├─ db.ts                 Prisma client over the pg adapter
│  │  ├─ words.ts              the 203-word deck
│  │  ├─ utils.ts              Levenshtein distance · Quick Join room picker
│  │  ├─ config.ts             16 env-tunable rules, all defaulted
│  │  └─ types.ts              Room · RoomSettings · Player · Message · GameStatus
│  └─ tests/regression/        12 Vitest tests over the engine and utils
├─ frontend/src/
│  ├─ index.css                design tokens: raw palette → semantic mapping
│  ├─ App.tsx                  socket listeners, layout, invite links, keep-alive
│  ├─ components/
│  │  ├─ Canvas.tsx            strokes, scanline flood fill, 20-colour palette
│  │  ├─ Chat.tsx              the event log and guess input
│  │  ├─ PlayerList.tsx        live scoreboard with correct-guess highlight
│  │  ├─ LobbySettings.tsx     host-only room configuration
│  │  ├─ WordSelection.tsx     the artist's three-word picker
│  │  ├─ Podium.tsx            end-of-game standings
│  │  ├─ Leaderboard.tsx       global top ten
│  │  ├─ Profile.tsx           per-player career stats
│  │  └─ JoinRoom.tsx          name, room code, Google sign-in
│  └─ tests/regression/        component regression suites
└─ assets/                     banner, gameplay GIF, screenshots
```

## Technical notes

<details>
<summary><b>Why a fill costs three numbers</b></summary>

`getRelativeCoordinates` divides the pointer position by the canvas's own `getBoundingClientRect()`, so what goes on the wire is `(clientX - rect.left) / rect.width` — a number between 0 and 1. `drawOnCanvas` multiplies back out by `canvas.width`/`canvas.height` on the receiving side. Clients never have to agree on a canvas size, which matters because the canvas is sized to its flex parent and every player's layout is different.

The fill bucket rides on that guarantee. `floodFillOnCanvas` is a scanline fill with an explicit stack — pop a seed, walk left and right to the span boundaries, paint the span, then push the pixels above and below that still match the target colour. No recursion, so a large region can't blow the call stack, and the context is acquired with `willReadFrequently: true` because `getImageData` runs on every fill.

Crucially the *result* is never transmitted. `draw_fill` sends `{ x, y, color }` and every client re-runs the same fill against its own bitmap. That only produces the same picture because the bitmap was itself built from resolution-independent strokes — and because the canvas is explicitly painted white on mount and on `clear_canvas`, so the fill always has a defined target colour to match against.

Resizing snapshots the bitmap to a data URL, resets `canvas.width`/`height` (which clears it), and redraws the snapshot once the `Image` loads.
</details>

<details>
<summary><b>Word pools, and why words don't repeat</b></summary>

The naive version of this game picks three random words per turn, which means duplicates within a single game. `startGame` instead shuffles two pools once: `customWordsPool` from the host's pack, and `defaultWordsPool` from the entire deck. `startWordSelection` then `shift()`s three words off the front — custom first, falling back to the deck — and only reshuffles when the deck runs dry.

`chooseWord` closes the loop: the custom words the artist passed over are pushed back onto the custom pool, so a small pack keeps circulating instead of being burned in one turn. In the recorded match the host set `house, sailboat, flower`; all three were offered on turn one, and the two that weren't drawn came back around on turns two and three before the default deck took over.
</details>

<details>
<summary><b>Turn rotation vs. round counting</b></summary>

`drawnPlayerIds` is the room's memory of who has already had the brush this round. `selectRandomArtist` only picks from players not in that list, so nobody draws twice while someone else is still waiting.

The round counter is deliberately decoupled. `endRound` checks `drawnPlayerIds.length >= players.length`; only when that is true does it increment `currentRound`, clear the list, and re-check `currentRound >= totalRounds` for game over. A three-player game with two rounds therefore runs six turns — exactly what the recorded match did. Disconnects remove the leaver from `drawnPlayerIds` so the remaining rotation stays consistent.
</details>

<details>
<summary><b>Timers are owned, never orphaned</b></summary>

`GameEngine` keeps a private `Map<string, NodeJS.Timeout>` keyed by room id, and `startTimer` calls `stopTimer` before installing a new interval, so a room can never accumulate two clocks. Each tick decrements `room.timer` and emits `timer_update`; hitting zero clears the interval before firing the transition callback.

That is what makes the disconnect paths safe: `handlePlayerDisconnect` can call `endRound` directly, knowing it will stop the drawing clock rather than race it.
</details>

<details>
<summary><b>The design token layer</b></summary>

`index.css` carries 56 custom-property declarations in two tiers. The first names raw values — `--t-void`, `--t-obsidian`, `--t-cyan`, `--t-amber` — and the second maps them to roles: `--t-bg-root`, `--t-border-strong`, `--t-text-emphasis`, `--t-accent-bg`, `--t-danger`. Components only ever reference the second tier.

The payoff is the `[data-mode="light"]` block, which redefines the raw palette and nothing else — the entire semantic layer, and every component reading it, inverts for free. The utility classes built on those tokens (`.t-card`, `.t-badge`, `.btn`, `.mono`, `.t-table`, `.t-modal-*`) are why the lobby, the modals and the podium all read as one system.
</details>

## Screens

| Host configures the room | Artist picks a word |
|---|---|
| <img src="assets/shot-lobby.png" alt="Lobby with room configuration: max players, rounds, drawing time, public toggle and a custom word pack"> | <img src="assets/shot-word-selection.png" alt="Word selection dialog offering three words"> |
| **Outline, then fill** | **Final standings** |
| <img src="assets/shot-artist.png" alt="Artist view with the palette, fill bucket and a coloured-in drawing"> | <img src="assets/shot-podium.png" alt="Podium with trophy, medal and award for the top three"> |

## Where it goes next

Masking the word server-side rather than blanking it in the client, rejoining a room after a refresh, undo on the canvas, and wiring the light palette to a visible theme toggle are the obvious next moves.

InkRush is a small codebase that takes the hard part of multiplayer seriously: one authority, one state machine, one wire format, and a client that never has to guess what is true.

# King Me - Checkers Game

**Tagline:** Earn the crown.

A production-quality checkers game built with React and TypeScript. Clean, modern, and competitive - not cartoonish. The kinging moment is the emotional payoff.

## Features

### Core Gameplay
- **Local Play (Pass-and-Play)**: Two players on one device
- **Single Player vs AI**: Two difficulty levels (Casual and Crown Match)
- Standard 8×8 checkers board with dark squares playable
- Red vs Black pieces
- Mandatory captures enforced (configurable)
- Multi-jump capture sequences
- King promotion with special "Crowned" animation
- Kings move diagonally in all directions
- Highlight valid moves and required captures
- Smooth animations for moves, captures, and promotions

### User Experience
- Minimal, modern UI with confident tone
- Charcoal theme with muted red accents (default)
- High-contrast theme option for accessibility
- Move hints (toggleable)
- Sound effects (toggleable)
- Undo moves in both local and AI modes
- Tutorial/Rules screen
- Settings persistence via localStorage

## Architecture

### Project Structure

```
Checkers-App/
├── public/
│   └── crown.svg              # Crown icon for kings and branding
├── src/
│   ├── engine/                # Pure game logic (no UI dependencies)
│   │   ├── __tests__/         # Unit tests for game engine
│   │   │   ├── gameState.test.ts
│   │   │   ├── moveGeneration.test.ts
│   │   │   └── gameEngine.test.ts
│   │   ├── types.ts           # TypeScript type definitions
│   │   ├── gameState.ts       # Board setup, state management utilities
│   │   ├── moveGeneration.ts  # Legal move generation, validation
│   │   ├── gameEngine.ts      # Apply moves, win detection, undo
│   │   └── ai.ts              # AI with minimax algorithm
│   ├── components/            # Reusable UI components
│   │   ├── Board.tsx          # Game board with pieces and interactions
│   │   ├── Board.module.css
│   │   ├── Button.tsx         # Reusable button component
│   │   ├── Button.module.css
│   │   ├── Modal.tsx          # Modal for results and dialogs
│   │   └── Modal.module.css
│   ├── screens/               # Full-page views
│   │   ├── Splash.tsx         # Landing/splash screen
│   │   ├── Home.tsx           # Main menu
│   │   ├── Game.tsx           # Game screen with board and controls
│   │   ├── DifficultySelect.tsx # AI difficulty selection
│   │   ├── Rules.tsx          # Rules and tutorial
│   │   ├── Settings.tsx       # Settings screen
│   │   └── *.module.css       # Scoped styles for each screen
│   ├── styles/
│   │   └── index.css          # Global styles and CSS variables
│   ├── App.tsx                # Main app component, routing logic
│   └── main.tsx               # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Core Design Principles

#### 1. Separation of Concerns
The game engine (`src/engine/`) is **completely independent** from the UI. It's pure TypeScript with no React dependencies.

- **GameState**: Immutable state representation
- **Move Generation**: Pure functions that generate legal moves
- **Game Engine**: Reducer-style `applyMove` function returns new state
- **AI Module**: Consumes state, returns chosen move

This architecture makes the engine:
- Easy to test
- Reusable in different contexts (web, mobile, server)
- Debuggable independently from UI

#### 2. Immutable State
All state transformations return new objects rather than mutating existing state. This makes:
- Undo functionality trivial
- Time-travel debugging possible
- State changes predictable and traceable

#### 3. Type Safety
Full TypeScript coverage with strict mode enabled. Critical types:

```typescript
type Player = 'red' | 'black';
type PieceType = 'normal' | 'king';

interface Position {
  row: number;
  col: number;
}

interface Move {
  from: Position;
  to: Position;
  captures: Position[];
  isPromotion: boolean;
}

interface GameState {
  board: Board;
  currentPlayer: Player;
  moveHistory: Move[];
  capturedPieces: { red: number; black: number };
  winner: Player | null;
  mandatoryCaptures: boolean;
}
```

## Game Rules Implementation

### Board Coordinates
- 8×8 grid, rows 0-7, columns 0-7
- Row 0 is the top (Black's starting side)
- Row 7 is the bottom (Red's starting side)
- Only dark squares are playable (where `row + col` is odd)

### Move Generation

#### Normal Pieces
- Move diagonally forward one square
- Red moves upward (decreasing row)
- Black moves downward (increasing row)

#### Kings
- Move diagonally in all four directions
- Can move forward or backward

#### Captures
- Jump diagonally over an opponent piece to an empty square
- Captured piece is removed from the board
- **Both normal pieces and kings can capture backward**
- Multi-jump: If another capture is available after landing, the same piece must continue jumping
- Captures are detected recursively to find all multi-jump sequences

### Forced Captures
When `mandatoryCaptures` is enabled (default):
- If any capture move is available for the current player, only capture moves are legal
- Non-capture moves are filtered out

### King Promotion
- Occurs when a normal piece reaches the far row:
  - Red pieces reaching row 0
  - Black pieces reaching row 7
- Promotion happens **after** the entire move sequence completes (including multi-jumps)
- Timing is critical: promotion is detected during move generation and applied in `applyMove`

### Win Conditions
A player wins when the opponent has no legal moves, which happens when:
1. The opponent has no pieces left, OR
2. All opponent pieces are blocked and cannot move

## AI Implementation

### Algorithm
The AI uses **minimax with alpha-beta pruning**:

```
function minimax(state, depth, alpha, beta, maximizing, aiPlayer):
  if depth == 0 or game over:
    return evaluate(state, aiPlayer)

  if maximizing:
    for each move:
      score = minimax(applyMove(state, move), depth-1, alpha, beta, false, aiPlayer)
      alpha = max(alpha, score)
      if beta <= alpha: break (prune)
    return alpha
  else:
    for each move:
      score = minimax(applyMove(state, move), depth-1, alpha, beta, true, aiPlayer)
      beta = min(beta, score)
      if beta <= alpha: break (prune)
    return beta
```

### Evaluation Heuristic

```
score = 0

// Material advantage
score += (playerPieces - opponentPieces) × 100
score += (playerKings - opponentKings) × 50

// Positional advantage (proximity to promotion)
for each normal piece:
  distanceToPromotion = rowsFromFarEnd
  score += (7 - distanceToPromotion) × 5

// Mobility (number of legal moves)
score += (playerMoves - opponentMoves) × 3

return score
```

### Difficulty Levels

- **Casual**: Depth 3, faster evaluation
- **Crown Match**: Depth 6, deeper lookahead

Move ordering prioritizes captures and promotions for better alpha-beta pruning efficiency.

## Testing

### Running Tests

```bash
npm test              # Run all tests
npm run test:ui       # Run with UI
npm run test:coverage # Generate coverage report
```

### Test Coverage

The game engine has comprehensive unit tests covering:

1. **Game State** (`gameState.test.ts`)
   - Board initialization
   - Helper functions (position validation, square color, etc.)
   - Initial state correctness

2. **Move Generation** (`moveGeneration.test.ts`)
   - Normal piece forward movement
   - King omnidirectional movement
   - Capture detection (including backward captures)
   - Multi-jump sequences
   - Forced capture enforcement
   - Promotion detection

3. **Game Engine** (`gameEngine.test.ts`)
   - Move application
   - Piece capture and removal
   - King promotion
   - Turn switching
   - Win condition detection
   - Undo functionality

## Setup and Development

### Prerequisites
- Node.js 18+ recommended
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server
The app will be available at `http://localhost:5173` (Vite default).

### Building
Production build outputs to `dist/` directory.

## Microcopy and Tone

### Voice
Confident, minimal, not goofy. Avoid slapstick humor.

### Key Phrases
- **Tutorial tagline**: "Kings are made, not given."
- **Main tagline**: "Earn the crown."
- **Win (player)**: "You earned it. King Me."
- **Loss (vs AI)**: "Almost. Try again."
- **King promotion**: "Crowned."

## Theme and Styling

### Charcoal Theme (Default)
- Deep charcoal background (`#1a1a1a`)
- Muted red accents (`#a94442`)
- Off-white text (`#f5f5f5`)
- Subtle crown icon motif
- Matte, modern aesthetic

### High Contrast Theme
- Pure black background
- Increased text contrast
- Brighter piece colors
- Yellow move highlights

CSS variables make theme switching trivial.

## Known Limitations & Trade-offs

1. **Undo in AI mode**: Undoes both the AI's move and the player's move to maintain turn order
2. **Sound effects**: Placeholder implementation (console logs)
3. **AI performance**: Crown Match difficulty may take 1-2 seconds on slower devices
4. **No move animations between squares**: Pieces appear instantly (design choice for speed)

## Future Enhancements

Here are the next 10 enhancements to consider:

1. **Online Multiplayer**
   - WebSocket-based real-time play
   - Matchmaking system
   - Friend invites and room codes
   - Chat (with moderation)

2. **Ranked Crown Matches**
   - Elo rating system
   - Leaderboards
   - Seasonal competitions
   - Achievement badges

3. **Advanced AI**
   - Neural network-based AI
   - Multiple personalities (aggressive, defensive, balanced)
   - Difficulty levels beyond Crown Match
   - AI training mode with analysis

4. **Move Analysis & Hints**
   - Highlight best move suggestion
   - Post-game move analysis
   - Mistake identification ("You missed a double jump here")
   - Opening book and endgame tablebase

5. **Cosmetics & Customization**
   - Unlockable board themes
   - Custom piece skins
   - Animated backgrounds
   - Sound packs
   - Profile customization

6. **Game Modes**
   - Timed matches (blitz, rapid, classical)
   - Puzzle mode (solve checkmate-in-N scenarios)
   - Campaign mode with progressively harder AI
   - Daily challenges

7. **Replay & Spectate**
   - Save and replay games
   - Share games via URL
   - Spectate live matches
   - PGN-style notation export

8. **Tutorials & Learning**
   - Interactive step-by-step tutorial
   - Practice scenarios (opening, mid-game, endgame)
   - Video guides
   - Tips and tricks library

9. **Social Features**
   - User profiles with stats
   - Follow other players
   - Clans/teams
   - Tournaments
   - Streaming integration

10. **Mobile App**
    - Native iOS/Android apps
    - Haptic feedback
    - Offline play
    - Push notifications for online matches
    - Cross-platform account sync

## Credits

Built with:
- React 18
- TypeScript 5
- Vite 5
- Vitest 2

Design inspired by modern minimalism and competitive gaming aesthetics.

---

**Kings are made, not given.**
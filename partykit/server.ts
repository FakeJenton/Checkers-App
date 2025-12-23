import type * as Party from "partykit/server";

// Import game engine types and functions
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

interface Piece {
  player: 'red' | 'black';
  type: 'normal' | 'king';
}

type Board = (Piece | null)[][];
type Player = 'red' | 'black';

interface GameState {
  board: Board;
  currentPlayer: Player;
  moveHistory: Move[];
  capturedPieces: {
    red: number;
    black: number;
  };
  winner: Player | null;
  mandatoryCaptures: boolean;
}

// Room state interface
interface RoomState {
  gameState: GameState | null;
  players: {
    red: string | null; // Player ID (not connection ID)
    black: string | null; // Player ID (not connection ID)
  };
  playerConnections: Map<string, string>; // Map player ID to current connection ID
  spectators: Set<string>;
  createdAt: number;
  lastActivity: number;
}

// Message types
type ClientMessage =
  | { type: 'join'; preferredColor?: 'red' | 'black'; playerId: string }
  | { type: 'move'; move: Move }
  | { type: 'restart' }
  | { type: 'ping' };

type ServerMessage =
  | { type: 'state'; gameState: GameState; yourColor: Player | 'spectator'; players: { red: boolean; black: boolean } }
  | { type: 'move'; move: Move; gameState: GameState }
  | { type: 'player_joined'; player: Player }
  | { type: 'player_left'; player: Player }
  | { type: 'error'; message: string }
  | { type: 'pong' };

export default class CheckersServer implements Party.Server {
  options: Party.ServerOptions = {
    hibernate: false, // Disable hibernation to prevent state loss
  };

  constructor(public room: Party.Room) {}

  private roomState: RoomState | null = null;

  // Initialize room state
  private initializeRoomState(): RoomState {
    return {
      gameState: null,
      players: {
        red: null,
        black: null,
      },
      playerConnections: new Map(),
      spectators: new Set(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
  }

  // Get or create room state
  private getRoomState(): RoomState {
    if (!this.roomState) {
      this.roomState = this.initializeRoomState();
    }
    return this.roomState;
  }

  // Create initial game state
  private createInitialGameState(): GameState {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Initialize red pieces (rows 0-2)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { player: 'red', type: 'normal' };
        }
      }
    }

    // Initialize black pieces (rows 5-7)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { player: 'black', type: 'normal' };
        }
      }
    }

    return {
      board,
      currentPlayer: 'red',
      moveHistory: [],
      capturedPieces: { red: 0, black: 0 },
      winner: null,
      mandatoryCaptures: true,
    };
  }

  // Validate if a move is legal (basic validation - client does full validation)
  private isMoveLegal(gameState: GameState, move: Move, player: Player): boolean {
    // Check if it's the player's turn
    if (gameState.currentPlayer !== player) {
      return false;
    }

    // Check if the from position has the player's piece
    const piece = gameState.board[move.from.row][move.from.col];
    if (!piece || piece.player !== player) {
      return false;
    }

    // Check if the to position is empty
    if (gameState.board[move.to.row][move.to.col] !== null) {
      return false;
    }

    return true;
  }

  // Apply a move to the game state
  private applyMove(gameState: GameState, move: Move): GameState {
    const newBoard = gameState.board.map(row => [...row]);
    const piece = newBoard[move.from.row][move.from.col];

    if (!piece) {
      return gameState;
    }

    // Move the piece
    newBoard[move.to.row][move.to.col] = piece;
    newBoard[move.from.row][move.from.col] = null;

    // Handle captures
    const newCapturedPieces = { ...gameState.capturedPieces };
    for (const capturePos of move.captures) {
      const capturedPiece = newBoard[capturePos.row][capturePos.col];
      if (capturedPiece) {
        newBoard[capturePos.row][capturePos.col] = null;
        newCapturedPieces[capturedPiece.player]++;
      }
    }

    // Handle promotion
    if (move.isPromotion) {
      newBoard[move.to.row][move.to.col] = { ...piece, type: 'king' };
    }

    // Switch player
    const nextPlayer: Player = gameState.currentPlayer === 'red' ? 'black' : 'red';

    // Check for winner
    let winner: Player | null = null;
    const hasRedPieces = newBoard.some(row => row.some(p => p?.player === 'red'));
    const hasBlackPieces = newBoard.some(row => row.some(p => p?.player === 'black'));

    if (!hasRedPieces) winner = 'black';
    if (!hasBlackPieces) winner = 'red';

    return {
      ...gameState,
      board: newBoard,
      currentPlayer: nextPlayer,
      moveHistory: [...gameState.moveHistory, move],
      capturedPieces: newCapturedPieces,
      winner,
    };
  }

  // Get player color by player ID
  private getPlayerColor(playerId: string): Player | 'spectator' {
    const state = this.getRoomState();
    if (state.players.red === playerId) return 'red';
    if (state.players.black === playerId) return 'black';
    return 'spectator';
  }

  // Get player ID from connection ID
  private getPlayerIdFromConnection(connectionId: string): string | null {
    const state = this.getRoomState();
    for (const [playerId, connId] of state.playerConnections.entries()) {
      if (connId === connectionId) return playerId;
    }
    return null;
  }

  // Broadcast state to all connections
  private broadcastState() {
    const state = this.getRoomState();

    console.log(`[${this.room.id}] Broadcasting. Player IDs:`, {
      red: state.players.red,
      black: state.players.black
    });

    for (const connection of this.room.getConnections()) {
      const playerId = this.getPlayerIdFromConnection(connection.id);
      const yourColor = playerId ? this.getPlayerColor(playerId) : 'spectator';
      console.log(`[${this.room.id}] Sending to connection ${connection.id} (player: ${playerId}): yourColor=${yourColor}`);

      const message: ServerMessage = {
        type: 'state',
        gameState: state.gameState || this.createInitialGameState(),
        yourColor,
        players: {
          red: state.players.red !== null,
          black: state.players.black !== null,
        },
      };
      connection.send(JSON.stringify(message));
    }
  }

  onConnect(connection: Party.Connection): void {
    const state = this.getRoomState();
    state.lastActivity = Date.now();

    console.log(`[${this.room.id}] Connection ${connection.id} joined. Current players:`, {
      red: state.players.red,
      black: state.players.black
    });
  }

  async onMessage(message: string, sender: Party.Connection): Promise<void> {
    const state = this.getRoomState();
    state.lastActivity = Date.now();

    try {
      const msg: ClientMessage = JSON.parse(message);

      switch (msg.type) {
        case 'join': {
          const playerId = msg.playerId;
          const preferredColor = msg.preferredColor;

          console.log(`[${this.room.id}] Join request from connection ${sender.id}, player ID: ${playerId}, preferred: ${preferredColor}`);
          console.log(`[${this.room.id}] Current state:`, {
            red: state.players.red,
            black: state.players.black,
            connections: Array.from(state.playerConnections.entries())
          });

          // Update connection mapping
          state.playerConnections.set(playerId, sender.id);

          // Check if this player ID already has a slot assigned (reconnection)
          const existingColor = this.getPlayerColor(playerId);
          if (existingColor !== 'spectator') {
            // Player is reconnecting to their existing slot
            console.log(`[${this.room.id}] Player ${playerId} reconnecting as ${existingColor}`);
            this.broadcastState();
            break;
          }

          // New player - assign them to a slot
          let assignedColor: Player | 'spectator' = 'spectator';

          if (preferredColor && !state.players[preferredColor]) {
            // Assign preferred color if available
            state.players[preferredColor] = playerId;
            assignedColor = preferredColor;
            console.log(`[${this.room.id}] Assigned player ${playerId} to preferred color ${preferredColor}`);
          } else if (!state.players.red) {
            // Assign red if available
            state.players.red = playerId;
            assignedColor = 'red';
            console.log(`[${this.room.id}] Assigned player ${playerId} to red (first available)`);
          } else if (!state.players.black) {
            // Assign black if available
            state.players.black = playerId;
            assignedColor = 'black';
            console.log(`[${this.room.id}] Assigned player ${playerId} to black (second available)`);
          } else {
            // Make spectator
            state.spectators.add(playerId);
            console.log(`[${this.room.id}] Player ${playerId} made spectator (room full)`);
          }

          // Initialize game state if both players connected
          if (state.players.red && state.players.black && !state.gameState) {
            state.gameState = this.createInitialGameState();
            console.log(`[${this.room.id}] Both players connected, initializing game`);
          }

          // Broadcast state to all
          console.log(`[${this.room.id}] Broadcasting state to ${this.room.getConnections().length} connections`);
          this.broadcastState();

          // Notify about player join
          if (assignedColor !== 'spectator') {
            const joinMessage: ServerMessage = {
              type: 'player_joined',
              player: assignedColor,
            };
            this.room.broadcast(JSON.stringify(joinMessage), [sender.id]);
          }

          break;
        }

        case 'move': {
          console.log(`[${this.room.id}] 📥 Move received from ${sender.id}`);

          if (!state.gameState) {
            console.log(`[${this.room.id}] ❌ Game not started`);
            sender.send(JSON.stringify({
              type: 'error',
              message: 'Game not started',
            } as ServerMessage));
            return;
          }

          const playerId = this.getPlayerIdFromConnection(sender.id);
          console.log(`[${this.room.id}]   Player ID: ${playerId}`);

          if (!playerId) {
            console.log(`[${this.room.id}] ❌ Player not found`);
            sender.send(JSON.stringify({
              type: 'error',
              message: 'Player not found',
            } as ServerMessage));
            return;
          }

          const playerColor = this.getPlayerColor(playerId);
          console.log(`[${this.room.id}]   Player color: ${playerColor}`);
          console.log(`[${this.room.id}]   Current player: ${state.gameState.currentPlayer}`);
          console.log(`[${this.room.id}]   Move:`, msg.move);

          if (playerColor === 'spectator') {
            console.log(`[${this.room.id}] ❌ Spectators cannot make moves`);
            sender.send(JSON.stringify({
              type: 'error',
              message: 'Spectators cannot make moves',
            } as ServerMessage));
            return;
          }

          // Validate move
          const isLegal = this.isMoveLegal(state.gameState, msg.move, playerColor);
          console.log(`[${this.room.id}]   Move legal: ${isLegal}`);

          if (!isLegal) {
            console.log(`[${this.room.id}] ❌ Illegal move`);
            sender.send(JSON.stringify({
              type: 'error',
              message: 'Illegal move',
            } as ServerMessage));
            return;
          }

          // Apply move
          console.log(`[${this.room.id}] ✅ Applying move`);
          state.gameState = this.applyMove(state.gameState, msg.move);

          // Broadcast updated state
          this.broadcastState();

          break;
        }

        case 'restart': {
          const playerId = this.getPlayerIdFromConnection(sender.id);
          if (!playerId) {
            sender.send(JSON.stringify({
              type: 'error',
              message: 'Player not found',
            } as ServerMessage));
            return;
          }

          const playerColor = this.getPlayerColor(playerId);

          if (playerColor === 'spectator') {
            sender.send(JSON.stringify({
              type: 'error',
              message: 'Spectators cannot restart',
            } as ServerMessage));
            return;
          }

          // Reset game state
          state.gameState = this.createInitialGameState();
          this.broadcastState();

          break;
        }

        case 'ping': {
          sender.send(JSON.stringify({ type: 'pong' } as ServerMessage));
          break;
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sender.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      } as ServerMessage));
    }
  }

  onClose(connection: Party.Connection): void {
    const state = this.getRoomState();
    const playerId = this.getPlayerIdFromConnection(connection.id);

    console.log(`[${this.room.id}] Connection ${connection.id} (player: ${playerId}) disconnected`);

    if (playerId) {
      // Remove connection mapping (but keep player slot for reconnection)
      state.playerConnections.delete(playerId);
      console.log(`[${this.room.id}] Removed connection mapping for player ${playerId}`);

      // Note: We DON'T remove the player from their slot
      // This allows them to reconnect and reclaim their spot
    }

    // Clean up if no connections left
    if (this.room.getConnections().length === 0) {
      console.log(`[${this.room.id}] No connections left, cleaning up room state`);
      this.roomState = null;
    }
  }
}

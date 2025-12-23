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
    red: { id: string; connection: Party.Connection } | null;
    black: { id: string; connection: Party.Connection } | null;
  };
  spectators: Set<string>;
  createdAt: number;
  lastActivity: number;
}

// Message types
type ClientMessage =
  | { type: 'join'; preferredColor?: 'red' | 'black' }
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
    hibernate: true,
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

  // Get player color by connection ID
  private getPlayerColor(connectionId: string): Player | 'spectator' {
    const state = this.getRoomState();
    if (state.players.red?.id === connectionId) return 'red';
    if (state.players.black?.id === connectionId) return 'black';
    return 'spectator';
  }

  // Broadcast state to all connections
  private broadcastState() {
    const state = this.getRoomState();

    for (const connection of this.room.getConnections()) {
      const yourColor = this.getPlayerColor(connection.id);
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

    console.log(`Connection ${connection.id} joined room ${this.room.id}`);
  }

  async onMessage(message: string, sender: Party.Connection): Promise<void> {
    const state = this.getRoomState();
    state.lastActivity = Date.now();

    try {
      const msg: ClientMessage = JSON.parse(message);

      switch (msg.type) {
        case 'join': {
          // Check if this connection is already assigned a player slot
          const existingColor = this.getPlayerColor(sender.id);
          if (existingColor !== 'spectator') {
            // Already assigned, just broadcast current state
            this.broadcastState();
            break;
          }

          // Assign player slot
          const preferredColor = msg.preferredColor;
          let assignedColor: Player | 'spectator' = 'spectator';

          if (preferredColor && !state.players[preferredColor]) {
            // Assign preferred color if available
            state.players[preferredColor] = { id: sender.id, connection: sender };
            assignedColor = preferredColor;
          } else if (!state.players.red) {
            // Assign red if available
            state.players.red = { id: sender.id, connection: sender };
            assignedColor = 'red';
          } else if (!state.players.black) {
            // Assign black if available
            state.players.black = { id: sender.id, connection: sender };
            assignedColor = 'black';
          } else {
            // Make spectator
            state.spectators.add(sender.id);
          }

          // Initialize game state if both players connected
          if (state.players.red && state.players.black && !state.gameState) {
            state.gameState = this.createInitialGameState();
          }

          // Broadcast state to all
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
          if (!state.gameState) {
            sender.send(JSON.stringify({
              type: 'error',
              message: 'Game not started',
            } as ServerMessage));
            return;
          }

          const playerColor = this.getPlayerColor(sender.id);

          if (playerColor === 'spectator') {
            sender.send(JSON.stringify({
              type: 'error',
              message: 'Spectators cannot make moves',
            } as ServerMessage));
            return;
          }

          // Validate move
          if (!this.isMoveLegal(state.gameState, msg.move, playerColor)) {
            sender.send(JSON.stringify({
              type: 'error',
              message: 'Illegal move',
            } as ServerMessage));
            return;
          }

          // Apply move
          state.gameState = this.applyMove(state.gameState, msg.move);

          // Broadcast updated state
          this.broadcastState();

          break;
        }

        case 'restart': {
          const playerColor = this.getPlayerColor(sender.id);

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
    const playerColor = this.getPlayerColor(connection.id);

    console.log(`Connection ${connection.id} left room ${this.room.id}`);

    // Remove player
    if (playerColor === 'red') {
      state.players.red = null;
      const leaveMessage: ServerMessage = { type: 'player_left', player: 'red' };
      this.room.broadcast(JSON.stringify(leaveMessage));
    } else if (playerColor === 'black') {
      state.players.black = null;
      const leaveMessage: ServerMessage = { type: 'player_left', player: 'black' };
      this.room.broadcast(JSON.stringify(leaveMessage));
    } else {
      state.spectators.delete(connection.id);
    }

    // Clean up if no connections left
    if (this.room.getConnections().length === 0) {
      this.roomState = null;
    }
  }
}

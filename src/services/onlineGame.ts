import PartySocket from 'partysocket';
import type { GameState, Move, Player, ServerMessage, ClientMessage } from '../engine/types';
import { getPlayerId } from '../utils/playerSession';

// PartyKit connection configuration
const PARTYKIT_HOST = import.meta.env.PROD
  ? 'king-me-checkers.fakejenton.partykit.dev' // Production host
  : 'localhost:1999'; // Local development

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface OnlineGameCallbacks {
  onStateUpdate?: (gameState: GameState, yourColor: Player | 'spectator', players: { red: boolean; black: boolean }) => void;
  onPlayerJoined?: (player: Player) => void;
  onPlayerLeft?: (player: Player) => void;
  onError?: (message: string) => void;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

export class OnlineGameService {
  private socket: PartySocket | null = null;
  private roomCode: string | null = null;
  private callbacks: OnlineGameCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(callbacks: OnlineGameCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Generate a random room code
   */
  static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar-looking characters
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 2) code += '-'; // Add hyphen in middle for readability
    }
    return code;
  }

  /**
   * Create a new game room
   */
  createRoom(preferredColor?: Player): string {
    this.roomCode = OnlineGameService.generateRoomCode();
    this.connect(this.roomCode, preferredColor);
    return this.roomCode;
  }

  /**
   * Join an existing game room
   */
  joinRoom(roomCode: string, preferredColor?: Player): void {
    this.roomCode = roomCode.toUpperCase().replace(/\s/g, '');
    this.connect(this.roomCode, preferredColor);
  }

  /**
   * Connect to a room via WebSocket
   */
  private connect(roomCode: string, preferredColor?: Player): void {
    if (this.socket) {
      this.socket.close();
    }

    this.callbacks.onConnectionStatusChange?.('connecting');

    try {
      this.socket = new PartySocket({
        host: PARTYKIT_HOST,
        room: roomCode,
      });

      this.socket.addEventListener('open', () => {
        console.log('Connected to room:', roomCode);
        this.callbacks.onConnectionStatusChange?.('connected');
        this.reconnectAttempts = 0;

        // Send join message with player ID
        this.sendMessage({
          type: 'join',
          preferredColor,
          playerId: getPlayerId(),
        });
      });

      this.socket.addEventListener('message', (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          this.handleServerMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      this.socket.addEventListener('close', () => {
        console.log('Disconnected from room');
        this.callbacks.onConnectionStatusChange?.('disconnected');
        this.attemptReconnect(roomCode, preferredColor);
      });

      this.socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        this.callbacks.onConnectionStatusChange?.('error');
        this.callbacks.onError?.('Connection error');
      });
    } catch (error) {
      console.error('Error creating socket:', error);
      this.callbacks.onConnectionStatusChange?.('error');
      this.callbacks.onError?.('Failed to connect to room');
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(roomCode: string, preferredColor?: Player): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.callbacks.onError?.('Failed to reconnect after multiple attempts');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(roomCode, preferredColor);
    }, delay);
  }

  /**
   * Handle messages from the server
   */
  private handleServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'state':
        this.callbacks.onStateUpdate?.(message.gameState, message.yourColor, message.players);
        break;

      case 'move':
        this.callbacks.onStateUpdate?.(message.gameState, 'red', { red: true, black: true }); // Temp values, will be overwritten by state message
        break;

      case 'player_joined':
        this.callbacks.onPlayerJoined?.(message.player);
        break;

      case 'player_left':
        this.callbacks.onPlayerLeft?.(message.player);
        break;

      case 'error':
        this.callbacks.onError?.(message.message);
        break;

      case 'pong':
        // Handle ping response
        break;
    }
  }

  /**
   * Send a message to the server
   */
  private sendMessage(message: ClientMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message: socket not connected');
    }
  }

  /**
   * Send a move to the server
   */
  sendMove(move: Move): void {
    this.sendMessage({
      type: 'move',
      move,
    });
  }

  /**
   * Request a game restart
   */
  restart(): void {
    this.sendMessage({
      type: 'restart',
    });
  }

  /**
   * Send a ping to keep connection alive
   */
  ping(): void {
    this.sendMessage({
      type: 'ping',
    });
  }

  /**
   * Disconnect from the room
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.roomCode = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Get the current room code
   */
  getRoomCode(): string | null {
    return this.roomCode;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

/**
 * Player session management
 * Generates and persists a unique player ID for each user
 */

const PLAYER_ID_KEY = 'kingme-player-id';

/**
 * Generate a random player ID
 */
function generatePlayerId(): string {
  return 'player_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Get or create a player ID for this browser
 */
export function getPlayerId(): string {
  let playerId = localStorage.getItem(PLAYER_ID_KEY);

  if (!playerId) {
    playerId = generatePlayerId();
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }

  return playerId;
}

/**
 * Clear the player ID (for testing or logout)
 */
export function clearPlayerId(): void {
  localStorage.removeItem(PLAYER_ID_KEY);
}

import { useState, useEffect } from 'react';
import { Difficulty, GameSettings, Player } from './engine/types';
import { Splash } from './screens/Splash';
import { Home } from './screens/Home';
import { Game } from './screens/Game';
import { Rules } from './screens/Rules';
import { Settings } from './screens/Settings';
import { DifficultySelect } from './screens/DifficultySelect';
import { Modal } from './components/Modal';
import { Button } from './components/Button';

type Screen = 'splash' | 'home' | 'game' | 'rules' | 'settings' | 'difficulty-select';
type GameMode = 'local' | 'ai' | null;

const DEFAULT_SETTINGS: GameSettings = {
  mandatoryCaptures: true,
  showHints: true,
  soundEnabled: true,
  theme: 'charcoal',
};

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('casual');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [winner, setWinner] = useState<Player | null>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('kingme-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        if (parsed.theme === 'high-contrast') {
          document.body.setAttribute('data-theme', 'high-contrast');
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('kingme-settings', JSON.stringify(newSettings));
  };

  const handlePlayLocal = () => {
    setGameMode('local');
    setCurrentScreen('game');
  };

  const handlePlayAI = () => {
    setCurrentScreen('difficulty-select');
  };

  const handleSelectDifficulty = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setGameMode('ai');
    setCurrentScreen('game');
  };

  const handleQuitGame = () => {
    setGameMode(null);
    setWinner(null);
    setCurrentScreen('home');
  };

  const handleWin = (winningPlayer: Player) => {
    setWinner(winningPlayer);
  };

  const handleRematch = () => {
    setWinner(null);
    // Force re-render of Game component by toggling screen
    setCurrentScreen('home');
    setTimeout(() => {
      setCurrentScreen('game');
    }, 0);
  };

  const getWinMessage = (winningPlayer: Player) => {
    if (gameMode === 'ai') {
      return winningPlayer === 'red' ? 'You earned it. King Me.' : 'Almost. Try again.';
    }
    return winningPlayer === 'red' ? 'Red earned it. King Me.' : 'Black earned it. King Me.';
  };

  return (
    <>
      {currentScreen === 'splash' && (
        <Splash onComplete={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'home' && (
        <Home
          onPlayLocal={handlePlayLocal}
          onPlayAI={handlePlayAI}
          onShowRules={() => setCurrentScreen('rules')}
          onShowSettings={() => setCurrentScreen('settings')}
        />
      )}

      {currentScreen === 'difficulty-select' && (
        <DifficultySelect
          onSelectDifficulty={handleSelectDifficulty}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'game' && gameMode && (
        <Game
          mode={gameMode}
          difficulty={difficulty}
          settings={settings}
          onQuit={handleQuitGame}
          onWin={handleWin}
        />
      )}

      {currentScreen === 'rules' && (
        <Rules onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'settings' && (
        <Settings
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      <Modal
        isOpen={winner !== null}
        title={winner === 'red' ? 'Red Wins!' : 'Black Wins!'}
        message={winner ? getWinMessage(winner) : ''}
        actions={
          <>
            <Button onClick={handleRematch} variant="primary">
              Rematch
            </Button>
            <Button onClick={handleQuitGame} variant="secondary">
              Menu
            </Button>
          </>
        }
      />
    </>
  );
}

export default App;

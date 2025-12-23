import { useState, useEffect } from 'react';
import { Difficulty, GameSettings, Player, GameMode } from './engine/types';
import { AuthProvider } from './contexts/AuthContext';
import { Splash } from './screens/Splash';
import { Home } from './screens/Home';
import { Game } from './screens/Game';
import { Rules } from './screens/Rules';
import { Settings } from './screens/Settings';
import { DifficultySelect } from './screens/DifficultySelect';
import { CreateRoom } from './screens/CreateRoom';
import { JoinRoom } from './screens/JoinRoom';
import { OnlineGame } from './screens/OnlineGame';
import { Login } from './screens/Login';
import { Register } from './screens/Register';
import { Stats } from './screens/Stats';
import { Leaderboard } from './screens/Leaderboard';
import { Modal } from './components/Modal';
import { Button } from './components/Button';

type Screen = 'splash' | 'home' | 'game' | 'rules' | 'settings' | 'difficulty-select' | 'online-menu' | 'create-room' | 'join-room' | 'online-game' | 'login' | 'register' | 'stats' | 'leaderboard';

const DEFAULT_SETTINGS: GameSettings = {
  mandatoryCaptures: true,
  showHints: true,
  soundEnabled: true,
  theme: 'charcoal',
};

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('casual');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [winner, setWinner] = useState<Player | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [preferredColor, setPreferredColor] = useState<Player | undefined>(undefined);
  const [returnToScreen, setReturnToScreen] = useState<Screen>('home');

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

  const handlePlayOnline = () => {
    setCurrentScreen('online-menu');
  };

  const handleShowLogin = () => {
    setReturnToScreen(currentScreen);
    setCurrentScreen('login');
  };

  const handleShowRegister = () => {
    setReturnToScreen(currentScreen);
    setCurrentScreen('register');
  };

  const handleAuthSuccess = () => {
    setCurrentScreen(returnToScreen);
  };

  const handleSkipAuth = () => {
    setCurrentScreen(returnToScreen);
  };

  const handleShowStats = () => {
    setCurrentScreen('stats');
  };

  const handleShowLeaderboard = () => {
    setCurrentScreen('leaderboard');
  };

  const handleCreateRoom = (newRoomCode: string, color: Player) => {
    setRoomCode(newRoomCode);
    setPreferredColor(color);
    setGameMode('online');
    setCurrentScreen('online-game');
  };

  const handleJoinRoom = (newRoomCode: string) => {
    setRoomCode(newRoomCode);
    setPreferredColor(undefined); // Let server auto-assign color
    setGameMode('online');
    setCurrentScreen('online-game');
  };

  const handleQuitGame = () => {
    setGameMode(null);
    setWinner(null);
    setRoomCode('');
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
    if (gameMode === 'online') {
      // For online games, show which color won
      return winningPlayer === 'red' ? 'Red earned it. King Me.' : 'Black earned it. King Me.';
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
          onPlayOnline={handlePlayOnline}
          onShowRules={() => setCurrentScreen('rules')}
          onShowSettings={() => setCurrentScreen('settings')}
          onShowStats={handleShowStats}
          onShowLeaderboard={handleShowLeaderboard}
          onLogin={handleShowLogin}
        />
      )}

      {currentScreen === 'login' && (
        <Login
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={handleShowRegister}
          onSkip={handleSkipAuth}
        />
      )}

      {currentScreen === 'register' && (
        <Register
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={handleShowLogin}
          onSkip={handleSkipAuth}
        />
      )}

      {currentScreen === 'stats' && (
        <Stats onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'leaderboard' && (
        <Leaderboard onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'difficulty-select' && (
        <DifficultySelect
          onSelectDifficulty={handleSelectDifficulty}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'game' && gameMode && (gameMode === 'local' || gameMode === 'ai') && (
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

      {currentScreen === 'online-menu' && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
            <Button onClick={() => setCurrentScreen('create-room')} variant="primary">
              Create Room
            </Button>
            <Button onClick={() => setCurrentScreen('join-room')} variant="primary">
              Join Room
            </Button>
            <Button onClick={() => setCurrentScreen('home')} variant="secondary">
              Back
            </Button>
          </div>
        </div>
      )}

      {currentScreen === 'create-room' && (
        <CreateRoom
          onRoomCreated={handleCreateRoom}
          onBack={() => setCurrentScreen('online-menu')}
        />
      )}

      {currentScreen === 'join-room' && (
        <JoinRoom
          onJoinRoom={handleJoinRoom}
          onBack={() => setCurrentScreen('online-menu')}
        />
      )}

      {currentScreen === 'online-game' && gameMode === 'online' && (
        <OnlineGame
          roomCode={roomCode}
          preferredColor={preferredColor}
          settings={settings}
          onQuit={handleQuitGame}
          onWin={handleWin}
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

}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './Login.module.css';

interface LoginProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onSkip: () => void;
}

export function Login({ onSuccess, onSwitchToRegister, onSkip }: LoginProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.login}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>King Me</h1>
          <p className={styles.tagline}>Earn the crown.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <h2>Login</h2>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className={styles.links}>
            <button
              type="button"
              className={styles.linkButton}
              onClick={onSwitchToRegister}
            >
              Don't have an account? Register
            </button>

            <button
              type="button"
              className={styles.linkButton}
              onClick={onSkip}
            >
              Continue as Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

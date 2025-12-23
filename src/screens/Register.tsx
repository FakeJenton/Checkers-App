import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './Login.module.css'; // Reuse Login styles

interface RegisterProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
  onSkip: () => void;
}

export function Register({ onSuccess, onSwitchToLogin, onSkip }: RegisterProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password, displayName || undefined);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
          <h2>Create Account</h2>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              minLength={3}
              maxLength={50}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              maxLength={255}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="displayName">Display Name (optional)</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How others see you"
              maxLength={100}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={100}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              minLength={8}
              maxLength={100}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className={styles.links}>
            <button
              type="button"
              className={styles.linkButton}
              onClick={onSwitchToLogin}
            >
              Already have an account? Login
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

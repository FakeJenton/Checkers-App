import { useEffect, useState } from 'react';
import styles from './Splash.module.css';

interface SplashProps {
  onComplete: () => void;
}

export function Splash({ onComplete }: SplashProps) {
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanContinue(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (canContinue) {
      onComplete();
    }
  };

  return (
    <div className={styles.splash} onClick={handleClick}>
      <div className={styles.crownIcon}>
        <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 24L6 12L11 16L16 8L21 16L26 12L28 24H4Z" fill="#D4AF37" stroke="#B8941F" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="6" cy="12" r="2" fill="#D4AF37" stroke="#B8941F" strokeWidth="1"/>
          <circle cx="16" cy="8" r="2" fill="#D4AF37" stroke="#B8941F" strokeWidth="1"/>
          <circle cx="26" cy="12" r="2" fill="#D4AF37" stroke="#B8941F" strokeWidth="1"/>
          <rect x="4" y="24" width="24" height="3" fill="#D4AF37" stroke="#B8941F" strokeWidth="1"/>
        </svg>
      </div>
      <h1 className={styles.title}>King Me</h1>
      <p className={styles.tagline}>Earn the crown.</p>
      {canContinue && <p className={styles.continue}>Click to continue</p>}
    </div>
  );
}

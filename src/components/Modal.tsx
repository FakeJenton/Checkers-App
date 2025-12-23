import { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  message?: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function Modal({ isOpen, onClose, title, message, children, actions }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          {message && <p className={styles.message}>{message}</p>}
        </div>

        {children && <div className={styles.content}>{children}</div>}

        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}

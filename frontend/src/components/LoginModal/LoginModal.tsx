'use client';

import { useState } from 'react';
import { X, Lock, User, Loader2 } from 'lucide-react';
import styles from './LoginModal.module.css';
import { useAuth } from '@/lib/AuthContext';
import { STRAPI_URL } from '@/lib/config';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {

      const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      const data = await response.json();

      if (data.jwt) {
        login(data.jwt, data.user);
        onClose();
        setIdentifier('');
        setPassword('');
      } else {
        setError(data.error?.message || 'Usuario o contraseña incorrectos.');
      }
    } catch (err: any) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Lock size={20} />
            Acceso Administrador
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.content}>
          <p className={styles.subtitle}>
            Inicia sesión para habilitar funciones de administración y métricas ocultas.
          </p>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Usuario o Email</label>
            <div className={styles.inputWrapper}>
              <User size={16} className={styles.inputIcon} />
              <input
                type="text"
                className={styles.input}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contraseña</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

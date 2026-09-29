import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// ============================================================
// ✅ CONFIGURATION
// ============================================================
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 1 minute (mettre 10 * 60 * 1000 pour 10 min)
const WARNING_BEFORE = 60 * 1000;          // Avertissement 15s avant
const ACTIVITY_THROTTLE = 5000;            // Max 1 reset / 5 sec

const useAutoLogout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const lastResetRef = useRef(0);

  const shouldAutoLogout = useCallback(() => {
    return isAuthenticated && user?.role === 'COMMERCIAL';
  }, [isAuthenticated, user]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  const triggerLogout = useCallback(async () => {
    clearTimers();
    console.warn(
      '⏱️ Déconnexion automatique : inactivité (COMMERCIAL)'
    );

    try {
      await logout();
    } catch (err) {
      console.error('Erreur lors de la déconnexion auto:', err);
    } finally {
      // ✅ Nettoyage cohérent
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // ✅ Pas de rechargement complet : on redirige proprement
      window.location.href = '/login?reason=inactivity';
    }
  }, [logout, clearTimers]);

  const resetTimers = useCallback(() => {
    if (!shouldAutoLogout()) return;

    lastActivityRef.current = Date.now();
    clearTimers();

    // ⚠️ Avertissement avant
    warningTimeoutRef.current = setTimeout(() => {
      const stay = window.confirm(
        '⏱️ Vous serez déconnecté dans quelques secondes pour inactivité.\n\n' +
        'Cliquez sur OK pour rester connecté.'
      );

      if (stay) {
        resetTimers();
      }
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    // 🔴 Déconnexion effective
    timeoutRef.current = setTimeout(triggerLogout, INACTIVITY_TIMEOUT);
  }, [shouldAutoLogout, clearTimers, triggerLogout]);

  // ============================================================
  // ÉCOUTEURS D'ACTIVITÉ
  // ============================================================
  useEffect(() => {
    if (!shouldAutoLogout()) {
      clearTimers();
      return;
    }

    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastResetRef.current > ACTIVITY_THROTTLE) {
        lastResetRef.current = now;
        resetTimers();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= INACTIVITY_TIMEOUT) {
          triggerLogout();
        } else {
          resetTimers();
        }
      }
    };

    resetTimers();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimers();
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shouldAutoLogout, resetTimers, clearTimers, triggerLogout]);

  return {
    isAutoLogoutActive: shouldAutoLogout(),
    resetTimers,
  };
};

export default useAutoLogout;
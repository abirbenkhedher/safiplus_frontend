import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ReparationModal from '../components/reparations/ReparationModal';

const ReparationModalContext = createContext(null);

export const useReparationModal = () => {
  const ctx = useContext(ReparationModalContext);
  if (!ctx) {
    throw new Error('useReparationModal doit être utilisé dans <ReparationModalProvider>');
  }
  return ctx;
};

export const ReparationModalProvider = ({ children }) => {
  const [show, setShow] = useState(false);
  const [editingReparation, setEditingReparation] = useState(null);
  const [initialClientId, setInitialClientId] = useState(null);

  // ✅ Callback enregistré par la page courante (ex: ReparationsList)
  // pour recharger ses données après un succès
  const onSuccessRef = useRef(null);

  /**
   * Enregistre un callback appelé après un enregistrement réussi.
   * Retourne une fonction de nettoyage.
   */
  const registerOnSuccess = useCallback((cb) => {
    onSuccessRef.current = cb;
    return () => {
      if (onSuccessRef.current === cb) onSuccessRef.current = null;
    };
  }, []);

  // ✅ Ouvrir pour une NOUVELLE réparation
  const openNewReparation = useCallback((clientId = null) => {
    setEditingReparation(null);
    setInitialClientId(clientId);
    setShow(true);
  }, []);

  // ✅ Ouvrir pour MODIFIER une réparation existante
  const openEditReparation = useCallback((reparation) => {
    setEditingReparation(reparation);
    setInitialClientId(null);
    setShow(true);
  }, []);

  const closeModal = useCallback(() => {
    setShow(false);
    setEditingReparation(null);
    setInitialClientId(null);
  }, []);

  const handleSuccess = useCallback((saved) => {
    // ✅ Notifier la page courante si elle écoute
    if (onSuccessRef.current) {
      try {
        onSuccessRef.current(saved);
      } catch (e) {
        console.error('onSuccess callback error:', e);
      }
    }
  }, []);

  return (
    <ReparationModalContext.Provider
      value={{
        openNewReparation,
        openEditReparation,
        closeModal,
        registerOnSuccess,
        show,
        editingReparation,
        initialClientId,
      }}
    >
      {children}

      {/* ✅ Modal unique rendu au niveau global */}
      <ReparationModal
        show={show}
        onClose={closeModal}
        onSuccess={handleSuccess}
        reparation={editingReparation}
        initialClientId={initialClientId}
      />
    </ReparationModalContext.Provider>
  );
};
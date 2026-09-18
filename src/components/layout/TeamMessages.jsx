import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaBullhorn,
  FaPaperPlane,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaTrash,
} from 'react-icons/fa';
import {
  getTeamMessages,
  sendTeamMessage,
  markMessageAsRead,
  markAllMessagesAsRead,
  deleteTeamMessage,
} from '../../api/teamMessages';
import { useAuth } from '../../context/AuthContext';

// ✅ Temps relatif
const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(date).toLocaleDateString('fr-FR');
};

const TeamMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // ✅ Charger les messages
  const load = useCallback(async () => {
    try {
      const res = await getTeamMessages();
      setMessages(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Erreur chargement messages équipe:', err);
    }
  }, []);

  // ✅ Charger au démarrage + polling toutes les 30s
  useEffect(() => {
    load();
    const interval = setInterval(load, 30 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  // ✅ Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Ouvrir le panneau → marquer tout comme lu
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllMessagesAsRead().then(() => {
        setUnreadCount(0);
        setMessages((prev) =>
          prev.map((m) => ({ ...m, isRead: true }))
        );
      });
    }
  }, [isOpen, unreadCount]);

  // ✅ Envoyer le message
  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await sendTeamMessage(newMessage.trim(), priority);
      setMessages((prev) => [res.data, ...prev]);
      setNewMessage('');
      setPriority('normal');
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de l'envoi"
      );
    } finally {
      setSending(false);
    }
  };

  // ✅ Touche Entrée pour envoyer
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ Supprimer son propre message
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    try {
      await deleteTeamMessage(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* ============ BOUTON ============ */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`header-icon-btn ${isOpen ? 'active' : ''}`}
        title="Messages d'équipe"
        style={{ position: 'relative' }}
      >
        <FaBullhorn />

        {/* Badge rouge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              background: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid white',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
              animation: 'pulseNotify 2s ease-in-out infinite',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ============ PANNEAU ============ */}
      {isOpen && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '440px',
            maxWidth: 'calc(100vw - 32px)',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            border: '1px solid var(--gray-200)',
            overflow: 'hidden',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '80vh',
            animation: 'dropdownIn 200ms ease-out',
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: '16px 18px',
              background:
                'linear-gradient(135deg, var(--primary-light), #ffffff)',
              borderBottom: '1px solid var(--gray-200)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background:
                  'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}
            >
              <FaBullhorn />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: 'var(--gray-900)',
                }}
              >
                Messages d'équipe
              </div>
              <div
                style={{
                  fontSize: '11.5px',
                  color: 'var(--gray-500)',
                  fontWeight: '600',
                }}
              >
                Communication interne
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                border: 'none',
                background: 'white',
                color: 'var(--gray-500)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaTimes size={11} />
            </button>
          </div>

          {/* ============ ZONE D'ÉCRITURE ============ */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--gray-100)',
              background: 'var(--gray-50)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid var(--gray-200)',
                overflow: 'hidden',
              }}
            >
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez un message pour l'équipe..."
                maxLength={500}
                rows={3}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  padding: '12px 14px',
                  fontSize: '13.5px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  color: 'var(--gray-800)',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderTop: '1px solid var(--gray-100)',
                  background: 'white',
                }}
              >
                {/* Priority */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border:
                        priority === 'normal'
                          ? '1px solid var(--primary)'
                          : '1px solid var(--gray-200)',
                      background:
                        priority === 'normal' ? 'var(--primary-light)' : 'white',
                      color:
                        priority === 'normal'
                          ? 'var(--primary)'
                          : 'var(--gray-500)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border:
                        priority === 'urgent'
                          ? '1px solid #ef4444'
                          : '1px solid var(--gray-200)',
                      background:
                        priority === 'urgent' ? '#fee2e2' : 'white',
                      color:
                        priority === 'urgent' ? '#dc2626' : 'var(--gray-500)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <FaExclamationTriangle size={9} /> Urgent
                  </button>
                </div>

                <div style={{ flex: 1, fontSize: '10.5px', color: 'var(--gray-400)' }}>
                  {newMessage.length}/500 • Ctrl+Entrée
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: newMessage.trim()
                      ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                      : 'var(--gray-200)',
                    color: newMessage.trim() ? 'white' : 'var(--gray-400)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 150ms ease',
                  }}
                >
                  <FaPaperPlane size={10} />
                  {sending ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '6px 10px',
                  background: 'var(--danger-light)',
                  color: 'var(--danger)',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                }}
              >
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* ============ LISTE DES MESSAGES ============ */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {messages.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--gray-500)',
                }}
              >
                <div
                  style={{
                    fontSize: '36px',
                    marginBottom: '8px',
                    opacity: 0.3,
                  }}
                >
                  📢
                </div>
                <div style={{ fontSize: '13px' }}>
                  Aucun message pour le moment
                </div>
                <div
                  style={{
                    fontSize: '11.5px',
                    marginTop: '4px',
                    opacity: 0.7,
                  }}
                >
                  Soyez le premier à écrire !
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--gray-100)',
                    background: msg.isRead ? 'white' : '#f0f9ff',
                    borderLeft: msg.priority === 'urgent'
                      ? '4px solid #ef4444'
                      : '4px solid transparent',
                    transition: 'background 150ms ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background:
                          'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        flexShrink: 0,
                      }}
                    >
                      {msg.author?.firstName?.charAt(0)}
                      {msg.author?.lastName?.charAt(0)}
                    </div>

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '12.5px',
                            fontWeight: '700',
                            color: 'var(--gray-900)',
                          }}
                        >
                          {msg.author?.firstName} {msg.author?.lastName}
                        </span>

                        {msg.priority === 'urgent' && (
                          <span
                            style={{
                              padding: '1px 6px',
                              borderRadius: '6px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              fontSize: '9.5px',
                              fontWeight: '800',
                              letterSpacing: '0.3px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <FaExclamationTriangle size={8} /> URGENT
                          </span>
                        )}

                        {msg.isMine && (
                          <span
                            style={{
                              padding: '1px 6px',
                              borderRadius: '6px',
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              fontSize: '9.5px',
                              fontWeight: '700',
                            }}
                          >
                            Vous
                          </span>
                        )}

                        {!msg.isRead && !msg.isMine && (
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: 'var(--primary)',
                            }}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--gray-700)',
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {msg.message}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10.5px',
                            color: 'var(--gray-400)',
                            fontWeight: '600',
                          }}
                        >
                          {timeAgo(msg.createdAt)}
                        </span>

                        {msg.isMine && (
                          <button
                            onClick={() => handleDelete(msg._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--gray-400)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Supprimer"
                          >
                            <FaTrash size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMessages;
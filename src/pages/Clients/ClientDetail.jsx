import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaArrowLeft, FaPhone, FaEnvelope, FaMapMarkerAlt, 
  FaWhatsapp, FaTools, FaShoppingCart, FaWallet,
  FaCheckCircle, FaExclamationTriangle, FaUser,
  FaCalendarAlt, FaPlus, FaFileInvoiceDollar
} from 'react-icons/fa';
import { getClient } from '../../api/clients';
import ReparationModal from '../../components/reparations/ReparationModal';

const ClientDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [reparations, setReparations] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReparationModal, setShowReparationModal] = useState(false);

  useEffect(() => { loadClient(); }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const response = await getClient(id);
      setClient(response.data.client);
      setReparations(response.data.reparations || []);
      setVentes(response.data.ventes || []);
      setStats(response.data.stats || {});
    } catch (err) {
      setError('Erreur lors du chargement du client');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (!cleaned.startsWith('216') && cleaned.length === 8) {
      cleaned = '216' + cleaned;
    }
    return cleaned;
  };

  const getAvatarColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #4361ee, #3a52c9)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      'linear-gradient(135deg, #ec4899, #db2777)',
    ];
    return colors[name?.charCodeAt(0) % colors.length || 0];
  };

  const formatDate = (date) => !date ? '-' : new Date(date).toLocaleDateString('fr-FR');
  const formatMoney = (amount) => `${(amount || 0).toFixed(3)} TND`;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
        <div className="spinner-modern" />
        <p style={{ color: 'var(--gray-500)', fontSize: '13.5px' }}>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-modern" style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
        <p style={{ margin: 0, color: 'var(--danger)', fontWeight: '500' }}>⚠️ {error}</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">👤</div>
        <div className="empty-state-title">Client non trouvé</div>
      </div>
    );
  }

  const soldeTotalDu = (stats.totalRestant || 0) + (stats.ventesRestant || 0);
  const totalPaye = (stats.totalPaye || 0) + (stats.ventesPaye || 0);
  const transactionsImpayees = reparations.filter(r => (r.prix - r.acompte) > 0).length;

  return (
    <>
      <div className="fade-in-up" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ========================================== */}
        {/* BOUTON RETOUR */}
        {/* ========================================== */}
        <button 
          className="btn-modern btn-modern-outline mb-3" 
          onClick={() => navigate('/clients')} 
          style={{ padding: '8px 14px' }}
        >
          <FaArrowLeft size={12} /> Retour aux clients
        </button>

        {/* ========================================== */}
        {/* EN-TÊTE CLIENT */}
        {/* ========================================== */}
        <div className="card-modern mb-3" style={{ 
          padding: '28px',
          background: 'white',
          border: '1px solid var(--gray-200)',
        }}>
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px',
                  background: getAvatarColor(client.nom),
                  color: 'white', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '32px', fontWeight: '800',
                  boxShadow: '0 8px 24px rgba(67, 97, 238, 0.3)',
                  flexShrink: 0,
                }}>
                  {client.nom?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 style={{
                    fontSize: '26px', fontWeight: '800',
                    color: 'var(--gray-900)', margin: '0 0 8px',
                    lineHeight: 1.1,
                  }}>
                    {client.nom}
                  </h1>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge-modern badge-modern-primary">{client.code}</span>
                    <span className={`badge-modern ${client.isActive ? 'badge-modern-success' : 'badge-modern-gray'}`}>
                      {client.isActive ? '✓ Actif' : '✗ Inactif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaPhone size={13} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-800)', fontFamily: 'monospace' }}>
                    {client.phone}
                  </span>
                </div>
                
                {client.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaEnvelope size={13} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--gray-600)', wordBreak: 'break-all' }}>
                      {client.email}
                    </span>
                  </div>
                )}

                {client.adresse && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaMapMarkerAlt size={13} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                      {client.adresse}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaCalendarAlt size={13} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                    Client depuis le {formatDate(client.createdAt)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`tel:${client.phone}`}
                  style={{
                    flex: 1, padding: '12px 16px',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    color: 'white', borderRadius: '10px',
                    textDecoration: 'none', fontSize: '13px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(67, 97, 238, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(67, 97, 238, 0.3)';
                  }}
                >
                  <FaPhone size={13} /> Appeler
                </a>

                <a
                  href={`https://wa.me/${formatPhoneForWhatsApp(client.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: '12px 16px',
                    background: 'linear-gradient(135deg, #25D366, #1da851)',
                    color: 'white', borderRadius: '10px',
                    textDecoration: 'none', fontSize: '13px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 211, 102, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';
                  }}
                >
                  <FaWhatsapp size={15} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RÉSUMÉ - 3 CARTES */}
        {/* ========================================== */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-4">
            <div className="card-modern" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0,
              }}>
                <FaTools />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Réparations
                </div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--gray-900)', lineHeight: 1.1 }}>
                  {reparations.length}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card-modern" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'var(--success-light)', color: 'var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0,
              }}>
                <FaShoppingCart />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ventes
                </div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--gray-900)', lineHeight: 1.1 }}>
                  {ventes.length}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card-modern" style={{ 
              padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
              border: soldeTotalDu > 0 ? '1.5px solid var(--danger)' : '1px solid var(--gray-200)',
              background: soldeTotalDu > 0 ? 'var(--danger-light)' : 'white',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: soldeTotalDu > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--gray-100)',
                color: soldeTotalDu > 0 ? 'var(--danger)' : 'var(--gray-500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0,
              }}>
                <FaWallet />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Solde dû
                </div>
                <div style={{ 
                  fontSize: '20px', fontWeight: '800', lineHeight: 1.1,
                  color: soldeTotalDu > 0 ? 'var(--danger)' : 'var(--success)',
                }}>
                  {formatMoney(soldeTotalDu)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* DÉTAILS DU CRÉDIT */}
        {/* ========================================== */}
        <div className="card-modern mb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--warning-light)', color: 'var(--warning)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px',
            }}>
              <FaFileInvoiceDollar />
            </div>
            <h2 style={{
              fontSize: '16px', fontWeight: '700',
              color: 'var(--gray-900)', margin: 0,
            }}>
              Détails du crédit
            </h2>
          </div>

          <div style={{
            background: 'var(--gray-50)',
            borderRadius: '12px',
            padding: '4px 0',
          }}>
            {[
              { label: 'Dette réparations', value: formatMoney(stats.totalRestant), icon: <FaTools size={12} /> },
              { label: 'Dette ventes', value: formatMoney(stats.ventesRestant || 0), icon: <FaShoppingCart size={12} /> },
              { label: 'Total payé', value: formatMoney(totalPaye), icon: <FaCheckCircle size={12} />, isSuccess: true },
              { label: 'Transactions impayées', value: transactionsImpayees, icon: <FaExclamationTriangle size={12} />, isDanger: transactionsImpayees > 0 },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: i < 3 ? '1px solid var(--gray-200)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: item.isSuccess ? 'var(--success)' : item.isDanger ? 'var(--danger)' : 'var(--gray-400)' }}>
                    {item.icon}
                  </span>
                  <span style={{ fontSize: '13.5px', color: 'var(--gray-700)', fontWeight: '500' }}>
                    {item.label}
                  </span>
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: item.isSuccess ? 'var(--success)' : item.isDanger ? 'var(--danger)' : 'var(--gray-900)',
                }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px' }}>
            {soldeTotalDu > 0 ? (
              <div style={{
                padding: '14px 18px',
                background: 'var(--danger-light)',
                borderRadius: '12px',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <FaExclamationTriangle size={20} />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '700' }}>
                    Solde impayé de {formatMoney(soldeTotalDu)}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                    Ce client a {transactionsImpayees} transaction(s) impayée(s)
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '14px 18px',
                background: 'var(--success-light)',
                borderRadius: '12px',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <FaCheckCircle size={20} />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '700' }}>
                    Aucun solde impayé
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                    Le compte de ce client est à jour
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* HISTORIQUE DES RÉPARATIONS */}
        {/* ========================================== */}
        <div className="card-modern mb-3" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--gray-200)',
            background: 'var(--gray-50)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px',
              }}>
                <FaTools />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                  Historique des réparations
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                  {reparations.length} réparation(s)
                </div>
              </div>
            </div>
            <button
              className="btn-modern btn-modern-primary"
              style={{ fontSize: '12.5px', padding: '8px 14px' }}
              onClick={() => setShowReparationModal(true)}
            >
              <FaPlus size={11} /> Nouvelle
            </button>
          </div>

          {reparations.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🔧</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '4px' }}>
                Aucune réparation
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--gray-500)' }}>
                Ce client n'a pas encore de réparation
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}>
                <thead>
                  <tr style={{ background: 'white', borderBottom: '2px solid var(--gray-200)' }}>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      N° Ticket
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      Modèle d'appareil
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      Statut
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      Paiement
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      Montant
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reparations.map((rep, index) => {
                    const reste = (rep.prix || 0) - (rep.acompte || 0);
                    const isPaid = reste === 0;
                    
                    return (
                      <tr
                        key={rep._id}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--gray-100)',
                          transition: 'background 150ms ease',
                          background: index % 2 === 0 ? 'white' : 'var(--gray-50)',
                        }}
                        onClick={() => navigate(`/reparations/${rep._id}`)}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : 'var(--gray-50)'}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'var(--gray-100)',
                            color: 'var(--gray-700)',
                            fontSize: '11px',
                            fontWeight: '700',
                            fontFamily: 'monospace',
                          }}>
                            {rep.numero}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-800)' }}>
                            {rep.marque} {rep.modele}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                            {rep.objet?.nom}
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: rep.status?.color || 'var(--gray-500)',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                          }}>
                            {rep.status?.label || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isPaid ? '#059669' : '#d97706',
                            fontSize: '11px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                          }}>
                            {isPaid ? '✓ Payé' : '⚠ Non payé'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--gray-900)' }}>
                            {(rep.prix || 0).toFixed(3)}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--gray-500)', fontWeight: '500' }}>
                            TND
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <span style={{ fontSize: '12.5px', color: 'var(--gray-600)', fontWeight: '500' }}>
                            {formatDate(rep.createdAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* HISTORIQUE DES VENTES */}
        {/* ========================================== */}
        <div className="card-modern" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--gray-200)',
            background: 'var(--gray-50)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--success-light)', color: 'var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px',
              }}>
                <FaShoppingCart />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                  Historique des ventes
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                  {ventes.length} vente(s)
                </div>
              </div>
            </div>
          </div>

          {ventes.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🛍️</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '4px' }}>
                Aucune vente
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--gray-500)' }}>
                Aucune vente pour ce client
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table-modern">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>N° Vente</th>
                    <th>Produit</th>
                    <th style={{ width: '130px' }}>Statut</th>
                    <th style={{ width: '130px' }}>Paiement</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Montant</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ventes.map((vente) => {
                    const reste = (vente.prix || 0) - (vente.acompte || 0);
                    const isPaid = reste === 0;
                    
                    return (
                      <tr key={vente._id}>
                        <td>
                          <span className="badge-modern badge-modern-gray" style={{ fontSize: '10.5px' }}>
                            {vente.numero}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-800)' }}>
                            {vente.produit || 'Produit'}
                          </div>
                        </td>
                        <td>
                          <span className="badge-modern badge-modern-success">
                            {vente.status || 'Complétée'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-modern ${isPaid ? 'badge-modern-success' : 'badge-modern-warning'}`}>
                            {isPaid ? '✓ Payé' : '⚠️ Non payé'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--gray-900)' }}>
                            {(vente.prix || 0).toFixed(3)}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--gray-500)' }}>TND</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '12.5px', color: 'var(--gray-600)' }}>
                            {formatDate(vente.createdAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ✅ MODAL - EN DEHORS DU CONTENEUR .fade-in-up */}
      <ReparationModal
        show={showReparationModal}
        onClose={() => setShowReparationModal(false)}
        onSuccess={() => {
          setShowReparationModal(false);
          loadClient();
        }}
        reparation={null}
        initialClientId={client._id}
      />
    </>
  );
};

export default ClientDetail;
import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  FaQrcode, FaDownload, FaPrint, FaCopy,
  FaCheck, FaTools, FaUser, FaCalendarAlt,
  FaMoneyBillWave, FaHourglassHalf
} from 'react-icons/fa';

/**
 * ✅ Composant QR Code pour une réparation
 * Contient : Appareil, Client, Dates, Paiement, Statut
 */
const ReparationQRCode = ({ reparation }) => {
  const [copied, setCopied] = React.useState(false);
  const qrRef = React.useRef(null);

  // ✅ Helper : extrait le nom d'un champ (objet populé OU string)
  const getNom = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && field.nom) return field.nom;
    return '';
  };

  // ✅ Construire l'URL publique du QR Code
  const qrData = useMemo(() => {
    if (!reparation) return '';

    // ✅ URL de base du frontend
    const baseUrl = window.location.origin;

    // ✅ URL de la page publique de suivi
    return `${baseUrl}/suivi/${reparation.numero}`;
  }, [reparation]);

  // ✅ Télécharger le QR Code en PNG
  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 500;
    canvas.height = 500;

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${reparation.numero}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // ✅ Imprimer le QR Code
  const printQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const marqueNom = getNom(reparation.marque);
    const modeleNom = getNom(reparation.modele);

    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>QR Code - ${reparation.numero}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            h1 { font-size: 18px; margin-bottom: 10px; text-align: center; }
            .qr { 
              padding: 20px; 
              background: white; 
              border: 2px solid #000;
              border-radius: 12px;
            }
            .info {
              margin-top: 15px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>${reparation.numero}</h1>
          <div class="qr">${svgData}</div>
          <div class="info">
            ${reparation.client?.nom || ''} - ${marqueNom} ${modeleNom}
          </div>
          <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // ✅ Copier les données en texte
  const copyData = () => {
    navigator.clipboard.writeText(qrData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!reparation) return null;

  const reste = (reparation.prix || 0) - (reparation.acompte || 0);

  // ✅ Noms de marque et modèle extraits correctement
  const marqueNom = getNom(reparation.marque);
  const modeleNom = getNom(reparation.modele);

  return (
    <div className="card-modern" style={{ height: '100%', padding: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '20px', paddingBottom: '12px',
        borderBottom: '1px solid var(--gray-100)',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'var(--primary-light)', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FaQrcode size={13} />
        </div>
        <h6 style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--gray-800)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          QR Code de suivi
        </h6>
      </div>

      {/* QR Code centré */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          ref={qrRef}
          style={{
            display: 'inline-block',
            padding: '16px',
            background: 'white',
            border: '2px solid var(--gray-200)',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          <QRCodeSVG
            value={qrData}
            size={200}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#1e293b"
          />
        </div>
        <p style={{
          fontSize: '11.5px',
          color: 'var(--gray-500)',
          marginTop: '12px',
          marginBottom: 0,
          textAlign: 'center',
        }}>
          📱 Scannez pour suivre votre réparation
        </p>
      </div>

      {/* Résumé compact */}
      <div style={{
        background: 'var(--gray-50)',
        borderRadius: '10px',
        padding: '14px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* ✅ Appareil — CORRIGÉ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'var(--info-light)', color: 'var(--info)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FaTools size={11} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10.5px', color: 'var(--gray-500)', fontWeight: '600', textTransform: 'uppercase' }}>
                Appareil
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--gray-800)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {/* ✅ Utilise marqueNom et modeleNom (extraits) */}
                {marqueNom || '-'} {modeleNom}
              </div>
            </div>
          </div>

          {/* Client */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'var(--primary-light)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FaUser size={11} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10.5px', color: 'var(--gray-500)', fontWeight: '600', textTransform: 'uppercase' }}>
                Client
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--gray-800)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {reparation.client?.nom}
              </div>
            </div>
          </div>

          {/* Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'var(--warning-light)', color: 'var(--warning)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FaCalendarAlt size={11} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10.5px', color: 'var(--gray-500)', fontWeight: '600', textTransform: 'uppercase' }}>
                Dates
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-700)', fontWeight: '500' }}>
                Reçu: {new Date(reparation.createdAt).toLocaleDateString('fr-FR')}
              </div>
              {reparation.datePrevisionnelle && (
                <div style={{ fontSize: '11.5px', color: 'var(--gray-600)' }}>
                  Prévu: {new Date(reparation.datePrevisionnelle).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          </div>

          {/* Paiement */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'var(--success-light)', color: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FaMoneyBillWave size={11} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10.5px', color: 'var(--gray-500)', fontWeight: '600', textTransform: 'uppercase' }}>
                Paiement
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--gray-800)', fontWeight: '600' }}>
                Total: {(reparation.prix || 0).toFixed(2)} DT
              </div>
              <div style={{
                fontSize: '11.5px',
                color: reste > 0 ? 'var(--danger)' : 'var(--success)',
                fontWeight: '600'
              }}>
                {reste > 0 ? `Reste: ${reste.toFixed(2)} DT` : '✓ Payé'}
              </div>
            </div>
          </div>

          {/* Statut */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'var(--gray-100)', color: reparation.status?.color || 'var(--gray-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FaHourglassHalf size={11} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10.5px', color: 'var(--gray-500)', fontWeight: '600', textTransform: 'uppercase' }}>
                Progression
              </div>
              <span className="badge-modern" style={{
                background: reparation.status?.color || 'var(--gray-500)',
                color: 'white',
                fontSize: '10.5px',
                marginTop: '2px',
                display: 'inline-block',
              }}>
                {reparation.status?.label || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={downloadQR}
          className="btn-modern btn-modern-outline"
          style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '10px' }}
          title="Télécharger en PNG"
        >
          <FaDownload size={11} /> PNG
        </button>
        <button
          onClick={printQR}
          className="btn-modern btn-modern-outline"
          style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '10px' }}
          title="Imprimer"
        >
          <FaPrint size={11} /> Imprimer
        </button>
        <button
          onClick={copyData}
          className="btn-modern btn-modern-outline"
          style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '10px' }}
          title="Copier les données"
        >
          {copied ? <FaCheck size={11} /> : <FaCopy size={11} />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
    </div>
  );
};

export default ReparationQRCode;
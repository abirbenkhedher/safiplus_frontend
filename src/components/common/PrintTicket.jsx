import React, { useState } from 'react';
import { FaPrint, FaFilePdf } from 'react-icons/fa';
import { downloadPDF } from '../../api/reparations';

const PrintTicket = ({ reparationId, numero }) => {
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ============================================================
  // IMPRESSION
  // ============================================================
  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);

    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // ✅ Récupérer le HTML du ticket
      const response = await fetch(`${apiUrl}/reparations/${reparationId}/ticket`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du ticket');
      }

      const html = await response.text();

      // ✅ Ouvrir une fenêtre d'impression
      const printWindow = window.open('', '_blank', 'width=400,height=700');

      if (!printWindow) {
        alert('Veuillez autoriser les popups pour imprimer le ticket');
        setPrinting(false);
        return;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      // ✅ Attendre le chargement complet (images + CSS) avant d'imprimer
      const triggerPrint = () => {
        printWindow.focus();
        printWindow.print();
        // Optionnel : fermer après impression
        // printWindow.onafterprint = () => printWindow.close();
      };

      if (printWindow.document.readyState === 'complete') {
        setTimeout(triggerPrint, 500);
      } else {
        printWindow.onload = () => setTimeout(triggerPrint, 500);
      }
    } catch (error) {
      console.error('Erreur impression:', error);
      alert("Erreur lors de l'impression");
    } finally {
      // ✅ Petit délai pour laisser le temps à l'impression de se lancer
      setTimeout(() => setPrinting(false), 1000);
    }
  };

  // ============================================================
  // TÉLÉCHARGEMENT PDF
  // ============================================================
  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const blob = await downloadPDF(reparationId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recu-${numero}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      alert('Erreur lors du téléchargement du PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="d-flex gap-2">
      <button
        className="btn-modern btn-modern-primary"
        onClick={handlePrint}
        disabled={printing}
      >
        {printing ? (
          <>
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              style={{ marginRight: '6px' }}
            ></span>
            Impression...
          </>
        ) : (
          <>
            <FaPrint /> Imprimer
          </>
        )}
      </button>

      <button
        className="btn-modern btn-modern-outline"
        onClick={handleDownloadPDF}
        disabled={downloading}
      >
        {downloading ? (
          <>
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              style={{ marginRight: '6px' }}
            ></span>
            Téléchargement...
          </>
        ) : (
          <>
            <FaFilePdf /> PDF
          </>
        )}
      </button>
    </div>
  );
};

export default PrintTicket;
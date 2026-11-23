import { useState } from 'react';
import { FaPrint, FaFilePdf } from 'react-icons/fa';
import { downloadPDF, getTicketHTML } from '../../api/reparations';
import { informer } from "../../utils/dialog";
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
      // ✅ Récupérer le HTML du ticket (session renouvelée automatiquement si besoin)
      const html = await getTicketHTML(reparationId);

      // ✅ Ouvrir une fenêtre d'impression
      const printWindow = window.open('', '_blank', 'width=400,height=700');

      if (!printWindow) {
        informer({ title: "Impression", message: 'Veuillez autoriser les popups pour imprimer le ticket', variant: "warning" });
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
      informer({ title: "Erreur", message: "Erreur lors de l'impression", variant: "danger" });
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
      informer({ title: "Erreur", message: 'Erreur lors du téléchargement du PDF', variant: "danger" });
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
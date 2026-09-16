import React from 'react';
import { FaPrint, FaFilePdf } from 'react-icons/fa';
import { downloadPDF } from '../../api/reparations';

const PrintTicket = ({ reparationId, numero }) => {
  const handlePrint = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${apiUrl}/reparations/${reparationId}/ticket`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const html = await response.text();
      
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      printWindow.document.write(html);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } catch (error) {
      console.error('Erreur impression:', error);
      alert('Erreur lors de l\'impression');
    }
  };

  const handleDownloadPDF = async () => {
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
    }
  };

  return (
    <div className="d-flex gap-2">
      <button className="btn-modern btn-modern-primary" onClick={handlePrint}>
        <FaPrint /> Imprimer
      </button>
      <button className="btn-modern btn-modern-outline" onClick={handleDownloadPDF}>
        <FaFilePdf /> PDF
      </button>
    </div>
  );
};

export default PrintTicket;
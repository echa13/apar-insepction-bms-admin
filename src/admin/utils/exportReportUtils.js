import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatHseDate } from '../../shared/utils/hydrotestUtils';

/**
 * Ekspor Rekap Data APAR ke File Excel Bersih (.xlsx)
 */
export function exportAparToExcel(apars, filterInfo = 'Semua Rig') {
  const exportRows = apars.map((apar, index) => {
    return {
      'No': index + 1,
      'Asset Code': apar.assetCode,
      'Rig': apar.rigCode,
      'Tipe Terstandar': apar.typeId.replace(/_/g, ' '),
      'Brand / Merk': apar.brand || 'Firex',
      'Serial No': apar.serialNo || 'TIDAK TERBACA',
      'Tahun Pembuatan': apar.manufactureDate || apar.manufactureRaw || '-',
      'Penempatan Fisik': apar.placement,
      'Handle': apar.components?.handle || 'bagus',
      'Hose': apar.components?.hose || 'bagus',
      'Nozle': apar.components?.nozle || 'bagus',
      'Pengaman Tabung': apar.components?.pengamanTabung || 'bagus',
      'Pin Handle': apar.components?.pinHandle || 'bagus',
      'Pressure Gauge': apar.components?.pressureGauge || 'bagus',
      'Tabung': apar.components?.tabung || 'bagus',
      'Charge': apar.charge,
      'Pihak ke 3': apar.vendor || 'PT Sepakat HSE Solution',
      'Jadwal Hydrotest (+5 Thn)': apar.nextHydrotestDate ? formatHseDate(apar.nextHydrotestDate) : 'Belum Ada Data Valid',
      'Status Kondisi': apar.status.toUpperCase(),
      'Temuan Kerusakan': apar.issues?.join('; ') || 'Tidak Ada'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  // Set auto column widths
  const colWidths = [
    { wch: 5 },  // No
    { wch: 18 }, // Asset Code
    { wch: 10 }, // Rig
    { wch: 24 }, // Tipe
    { wch: 14 }, // Brand
    { wch: 15 }, // Serial
    { wch: 16 }, // Mfg
    { wch: 18 }, // Penempatan
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 15 }, { wch: 10 }, { wch: 14 }, { wch: 8 }, // 7 Komponen
    { wch: 8 },  // Charge
    { wch: 22 }, // Pihak ke 3
    { wch: 24 }, // Hydrotest
    { wch: 14 }, // Status
    { wch: 25 }, // Temuan
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_APAR_BMS_2025');

  const dateSlug = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Laporan_APAR_BMS_${dateSlug}.xlsx`);
}

/**
 * Ekspor Dokumen Audit K3 APAR Siap Cetak & Tanda Tangan ke PDF
 */
export function exportAparToPdf(apars, reportMeta = {}) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Header Brand
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PT BESMINDO MUDA SARANA — HSE DEPARTMENT', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('LAPORAN HASIL TRACKING, INSPEKSI & KEPATUHAN HYDROTEST APAR 16 RIG', 14, 18);

  // Meta Info Box
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.text(`Filter Rig: ${reportMeta.rig || 'Seluruh Rig Operasional'}`, 14, 32);
  doc.text(`Tanggal Cetak Dokumen: ${dateFormatted}`, 14, 37);

  const total = apars.length;
  const layak = apars.filter(a => a.status === 'layak').length;
  const rusak = apars.filter(a => a.status === 'rusak').length;
  doc.text(`Total Tabung: ${total} Unit  |  Layak: ${layak} Unit  |  Perlu Tindakan: ${rusak} Unit`, 160, 32);

  // Table Body
  const tableData = apars.map((a, idx) => [
    idx + 1,
    a.assetCode,
    a.rigCode,
    a.typeId.replace(/_/g, ' '),
    a.serialNo || '-',
    a.placement,
    a.charge,
    a.nextHydrotestDate ? formatHseDate(a.nextHydrotestDate) : '-',
    a.status.toUpperCase(),
    a.issues?.join(', ') || 'Nihil'
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['No', 'Kode Aset', 'Rig', 'Tipe APAR', 'Serial No', 'Penempatan', 'Charge', 'Hydrotest', 'Status', 'Catatan Temuan']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [220, 38, 38], // Red 600
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate 50
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 32, font: 'courier', fontStyle: 'bold' },
      2: { cellWidth: 16 },
      3: { cellWidth: 34 },
      4: { cellWidth: 24, font: 'courier' },
      5: { cellWidth: 30 },
      6: { cellWidth: 15 },
      7: { cellWidth: 26 },
      8: { cellWidth: 20 },
      9: { cellWidth: 60 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        if (data.cell.raw === 'LAYAK') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // Signature Block at Bottom
  const finalY = doc.lastAutoTable.finalY || 160;
  if (finalY < 165) {
    const signY = Math.max(finalY + 15, 165);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Diverifikasi oleh:', 22, signY);
    doc.text('HSE Officer Lapangan', 22, signY + 5);
    doc.text('(________________________)', 22, signY + 25);

    doc.text('Disetujui oleh:', 210, signY);
    doc.text('HSE Superintendent Pusat', 210, signY + 5);
    doc.text('(________________________)', 210, signY + 25);
  }

  const dateSlug = now.toISOString().split('T')[0];
  doc.save(`Laporan_Audit_HSE_APAR_${dateSlug}.pdf`);
}

import React, { useState, useMemo } from 'react';
import { useApar } from '../../shared/context/AparContext';
import { formatHseDate, getHydrotestStatus } from '../../shared/utils/hydrotestUtils';
import {
  X,
  FileCheck,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  Building2,
  ShieldCheck,
  Clock,
  UserCheck,
  Plus,
  Eye,
  AlertCircle
} from 'lucide-react';

export default function HydrotestCertViewerModal({ apar, onClose, onOpenUpdateModal }) {
  const { hydrotestLogs } = useApar();
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);

  // Filter riwayat hydrotest logs khusus untuk APAR ini
  const aparLogs = useMemo(() => {
    if (!apar || !Array.isArray(hydrotestLogs)) return [];
    const clean = (s) => (s ? String(s).toLowerCase().replace(/[^a-z0-9]/g, '') : '');
    const cleanId = clean(apar.id);
    const cleanAsset = clean(apar.assetCode);

    return hydrotestLogs.filter(l => {
      const lId = clean(l.aparId || l.apar_id);
      const lAsset = clean(l.assetCode || l.asset_code);
      return (
        (cleanId && (lId === cleanId || lAsset === cleanId)) ||
        (cleanAsset && (lId === cleanAsset || lAsset === cleanAsset))
      );
    }).sort((a, b) => new Date(b.testDate || b.createdAt || 0) - new Date(a.testDate || a.createdAt || 0));
  }, [apar, hydrotestLogs]);

  if (!apar) return null;

  const currentDocUrl = apar.hydrotestDocUrl;
  const currentDocName = apar.hydrotestDocName || 'Dokumen_Sertifikat_Hydrotest.pdf';
  const isCurrentPdf = currentDocUrl?.startsWith('data:application/pdf') || currentDocName?.toLowerCase().endsWith('.pdf');
  const hydroStatus = getHydrotestStatus(apar.nextHydrotestDate, apar.manufactureDate);

  const handleDownload = (docData, fileName) => {
    if (!docData) return;
    const link = document.createElement('a');
    link.href = docData;
    link.download = fileName || 'Sertifikat_Hydrotest.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = (docData) => {
    if (!docData) return;
    const win = window.open();
    if (win) {
      if (docData.startsWith('data:application/pdf')) {
        win.document.write(`<iframe src="${docData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        win.document.write(`<body style="margin:0; background:#0f172a; display:flex; align-items:center; justify-content:center;"><img src="${docData}" style="max-width:100%; max-height:100%; object-fit:contain;" /></body>`);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Sertifikat & Riwayat Hydrotest Pihak ke-3
                </h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-200">
                  {apar.assetCode}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Dokumentasi resmi uji kelayakan tekan K3 Migas PT Besmindo Materi Sewatama
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* APAR Quick Summary Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Rig & Penempatan</span>
                <span className="font-bold text-slate-800">
                  {apar.rigCode} • {apar.placement}
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tipe & Merk Tabung</span>
                <span className="font-semibold text-slate-800">
                  {apar.typeId?.replace(/_/g, ' ')} ({apar.brand || 'Firex'})
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Status Uji Tekan</span>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${hydroStatus.badgeClass}`}>
                  {hydroStatus.label}
                </span>
              </div>
            </div>

            {onOpenUpdateModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpdateModal(apar);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Update Hydrotest Baru</span>
              </button>
            )}
          </div>

          {/* Section 1: Dokumen Sertifikat Aktif Saat Ini */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Sertifikat Hydrotest Aktif
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Berlaku s.d. {formatHseDate(apar.nextHydrotestDate) || 'Belum Terjadwal'}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {currentDocUrl ? (
                <div className="space-y-4">
                  {/* Meta Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Vendor Penguji</span>
                      <span className="font-bold text-slate-800 block truncate">
                        {apar.hydrotestVendor || 'PT Sepakat HSE Solution'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Tanggal Uji Terakhir</span>
                      <span className="font-mono font-semibold text-slate-800 block">
                        {formatHseDate(apar.lastHydrotestDate) || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Jatuh Tempo Berikutnya</span>
                      <span className="font-mono font-bold text-emerald-700 block">
                        {formatHseDate(apar.nextHydrotestDate) || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Nama Dokumen</span>
                      <span className="font-mono text-slate-700 block truncate" title={currentDocName}>
                        {currentDocName}
                      </span>
                    </div>
                  </div>

                  {/* Actions for current doc */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(currentDocUrl, currentDocName)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Dokumen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenNewTab(currentDocUrl)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka di Tab Baru</span>
                    </button>
                  </div>

                  {/* Embedded Document Viewer */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center min-h-[300px]">
                    {isCurrentPdf ? (
                      <iframe
                        src={currentDocUrl}
                        title="Sertifikat Hydrotest Aktif"
                        className="w-full h-[400px] border-0"
                      />
                    ) : (
                      <img
                        src={currentDocUrl}
                        alt="Sertifikat Hydrotest Aktif"
                        className="max-h-[420px] max-w-full object-contain p-2"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                  <h4 className="text-xs font-bold text-slate-700">Belum Ada Dokumen Sertifikat yang Diunggah</h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                    Tabung APAR ini belum memiliki lampiran berkas sertifikat atau Berita Acara pengujian Hydrotest dari pihak ke-3 di database Supabase.
                  </p>
                  {onOpenUpdateModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenUpdateModal(apar);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload Dokumen Sertifikat Sekarang</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Log Riwayat Uji Tekan Sebelumnya (hydrotest_logs) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                Histori Lengkap Log Uji Hydrotest ({aparLogs.length})
              </span>
              <span className="text-[10px] text-slate-500">
                Tersinkronisasi dari tabel <code>hydrotest_logs</code>
              </span>
            </div>

            <div className="p-0">
              {aparLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Belum ada catatan riwayat uji hydrotest masa lalu untuk unit APAR ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="px-4 py-2.5">Tanggal Uji</th>
                        <th className="px-4 py-2.5">Berlaku s.d.</th>
                        <th className="px-4 py-2.5">Vendor Pihak ke-3</th>
                        <th className="px-4 py-2.5">No. Sertifikat</th>
                        <th className="px-4 py-2.5">Diperbarui Oleh</th>
                        <th className="px-4 py-2.5">Dokumen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {aparLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-2.5 font-mono font-semibold text-slate-800 whitespace-nowrap">
                            {formatHseDate(log.testDate)}
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {formatHseDate(log.nextDueDate)}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                            {log.vendorName}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                            {log.certificateNo || '-'}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                            {log.updatedBy || 'Admin HSE'}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {log.documentData ? (
                              <button
                                type="button"
                                onClick={() => setSelectedDocPreview({
                                  url: log.documentData,
                                  name: log.documentName || `Sertifikat_${log.certificateNo || 'Hydrotest'}.pdf`
                                })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Lihat Berkas</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Tanpa Berkas</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Pratinjau Dokumen dari Histori Log */}
        {selectedDocPreview && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
            onClick={() => setSelectedDocPreview(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <span className="font-semibold text-xs truncate">
                  Dokumen Riwayat: {selectedDocPreview.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(selectedDocPreview.url, selectedDocPreview.name)}
                    className="p-1 rounded text-slate-300 hover:text-white"
                    title="Unduh"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDocPreview(null)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1 overflow-y-auto flex items-center justify-center bg-slate-100">
                {selectedDocPreview.url.startsWith('data:application/pdf') || selectedDocPreview.name.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={selectedDocPreview.url}
                    title="Riwayat Dokumen PDF"
                    className="w-full h-[65vh] rounded-lg border border-slate-300"
                  />
                ) : (
                  <img
                    src={selectedDocPreview.url}
                    alt="Preview Riwayat"
                    className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-sm"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

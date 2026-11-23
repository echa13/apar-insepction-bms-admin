import React, { useState, useMemo } from 'react';
import { useApar } from '../../shared/context/AparContext';
import { calculateNextHydrotestDate, formatHseDate } from '../../shared/utils/hydrotestUtils';
import { confirmActionAlert, showErrorAlert } from '../../shared/utils/alertUtils';
import {
  X,
  ShieldCheck,
  Calendar,
  Building2,
  MapPin,
  Upload,
  FileText,
  FileCheck,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function HydrotestUpdateModal({ apar, onClose, onSuccess }) {
  const { aparTypes, updateAparHydrotest, maintenances } = useApar();

  // Find Apar Type config for hydrotest years
  const aparType = useAparType(apar?.typeId, aparTypes);
  const hydroYears = aparType?.hydrotestYears || 5;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [testDate, setTestDate] = useState(todayStr);
  const [vendorName, setVendorName] = useState('PT Sepakat HSE Solution');
  const [certificateNo, setCertificateNo] = useState('');
  const [notes, setNotes] = useState('');
  const [closeTicket, setCloseTicket] = useState(true);

  // File Upload State
  const [documentData, setDocumentData] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState(''); // 'pdf' | 'image'
  const [fileSizeStr, setFileSizeStr] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDocOpen, setPreviewDocOpen] = useState(false);

  // Auto calculate next due date
  const nextDueDate = useMemo(() => {
    return calculateNextHydrotestDate(testDate, hydroYears);
  }, [testDate, hydroYears]);

  // Check if there is an active maintenance ticket for hydrotest
  const activeHydroTicket = useMemo(() => {
    if (!apar) return null;
    return maintenances.find(m =>
      (m.aparId === apar.id || m.assetCode === apar.assetCode) &&
      m.actionType === 'hydrotest' &&
      (m.status === 'open' || m.status === 'in_progress' || m.status === 'pending_review')
    );
  }, [maintenances, apar]);

  if (!apar) return null;

  // File Upload Handler (PDF & Image with Compression)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi Ukuran Maksimal 1 MB (1,048,576 bytes)
    const MAX_BYTES = 1024 * 1024;
    if (file.size > MAX_BYTES) {
      showErrorAlert(
        'Ukuran File Terlalu Besar',
        `File "${file.name}" berukuran ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maksimal ukuran file yang diizinkan adalah 1.00 MB.`
      );
      e.target.value = '';
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      showErrorAlert('Format Tidak Didukung', 'Harap unggah file dokumen berformat PDF atau Gambar (JPG, PNG).');
      e.target.value = '';
      return;
    }

    setIsProcessingFile(true);
    const sizeKb = (file.size / 1024).toFixed(1) + ' KB';

    if (isImage) {
      // Kompresi otomatis gambar ke JPEG base64 maksimal 1200x1200
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG 0.85
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setDocumentData(compressedBase64);
          setDocumentName(file.name);
          setDocumentType('image');
          setFileSizeStr(sizeKb);
          setIsProcessingFile(false);
        };
        img.onerror = () => {
          showErrorAlert('Gagal Membaca Gambar', 'Gambar rusak atau tidak dapat diproses.');
          setIsProcessingFile(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // PDF: Baca sebagai Data URL Base64
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocumentData(event.target.result);
        setDocumentName(file.name);
        setDocumentType('pdf');
        setFileSizeStr(sizeKb);
        setIsProcessingFile(false);
      };
      reader.onerror = () => {
        showErrorAlert('Gagal Membaca PDF', 'Dokumen PDF tidak dapat dibaca.');
        setIsProcessingFile(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setDocumentData('');
    setDocumentName('');
    setDocumentType('');
    setFileSizeStr('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!testDate) {
      showErrorAlert('Tanggal Wajib Diisi', 'Silakan tentukan tanggal pelaksanaan uji hydrotest.');
      return;
    }

    if (!vendorName.trim()) {
      showErrorAlert('Nama Vendor Wajib', 'Harap isi nama vendor / pelaksana uji pihak ke-3.');
      return;
    }

    if (!documentData) {
      showErrorAlert(
        'Dokumen Sertifikat Wajib',
        'Sesuai regulasi K3 Migas & Perusahaan, perpanjangan jadwal Hydrotest WAJIB melampirkan file dokumen sertifikat / Berita Acara dari pihak ke-3 (PDF atau Gambar).'
      );
      return;
    }

    const confirmRes = await confirmActionAlert({
      title: 'Perbarui Jadwal Hydrotest?',
      text: `Jadwal Hydrotest ${apar.assetCode} akan diperbarui menjadi berlaku s.d. ${formatHseDate(nextDueDate)} (+${hydroYears} tahun) oleh ${vendorName}.`,
      confirmButtonText: 'Ya, Simpan & Perbarui',
      confirmButtonColor: '#2563eb'
    });

    if (!confirmRes.isConfirmed) return;

    try {
      setIsSubmitting(true);
      await updateAparHydrotest(apar.id, {
        testDate,
        nextDueDate,
        vendorName: vendorName.trim(),
        certificateNo: certificateNo.trim(),
        documentData,
        documentName,
        notes: notes.trim(),
        closeRelatedTicket: closeTicket
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch {
      // Error handled in updateAparHydrotest
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Update Hydrotest Pihak ke-3
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Admin Only
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Pembaruan masa berlaku uji tekan (+{hydroYears} Tahun) dengan bukti sertifikat sah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs flex-1 overflow-y-auto bg-white">
          
          {/* Card Info APAR (Read Only) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Informasi Tabung APAR:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Kode Aset</span>
                <span className="font-mono font-bold text-slate-900 block truncate">
                  {apar.assetCode}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Rig & Lokasi</span>
                <span className="font-semibold text-slate-800 block truncate" title={`${apar.rigCode} • ${apar.placement}`}>
                  {apar.rigCode} • {apar.placement}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Uji Terakhir</span>
                <span className="font-mono font-semibold text-slate-700 block">
                  {formatHseDate(apar.lastHydrotestDate) || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Jatuh Tempo Saat Ini</span>
                <span className="font-mono font-bold text-amber-700 block">
                  {formatHseDate(apar.nextHydrotestDate) || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Input Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tanggal Uji Hydrotest */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Uji Hydrotest *
              </label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Tanggal fisik pelaksanaan uji tekan
              </span>
            </div>

            {/* Preview Masa Berlaku Baru (Otomatis +5 Tahun) */}
            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Masa Berlaku Baru (+{hydroYears} Tahun)
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-mono font-black text-emerald-700">
                  {formatHseDate(nextDueDate) || 'Pilih tanggal'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  Aktif
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 mt-0.5">
                Otomatis dihitung s.d. {nextDueDate}
              </span>
            </div>
          </div>

          {/* Vendor Pelaksana Pihak ke-3 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nama Vendor / Pihak ke-3 *
              </label>
              <span className="text-[10px] text-slate-400">Pilih Preset atau Ketik Manual</span>
            </div>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Contoh: PT Sepakat HSE Solution"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              required
            />
            {/* Quick Vendor Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {[
                'PT Sepakat HSE Solution',
                'PT Besmindo Inspection',
                'PT Surveyor Indonesia',
                'PT Sucofindo'
              ].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVendorName(v)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                    vendorName === v
                      ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Nomor Sertifikat / Berita Acara */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nomor Sertifikat / Berita Acara (BA)
            </label>
            <input
              type="text"
              value={certificateNo}
              onChange={(e) => setCertificateNo(e.target.value)}
              placeholder="Contoh: BA-HYD/BMS/2026/XI-004 atau CERT-788912"
              className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Upload Dokumen Sertifikat (WAJIB) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                Upload Dokumen Bukti Sertifikat * (PDF / Foto)
              </label>
              <span className="text-[10px] font-mono text-slate-400">Maks. 1 MB</span>
            </div>

            {!documentData ? (
              <label className="relative flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30 transition cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={isProcessingFile}
                />
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {isProcessingFile ? 'Memproses File...' : 'Klik untuk Unggah Sertifikat'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 text-center">
                  Menerima file <strong>PDF</strong> atau <strong>Foto Gambar</strong> (Maks. 1 MB)
                </span>
              </label>
            ) : (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    {documentType === 'pdf' ? <FileText className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 truncate block text-xs">
                      {documentName}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.2 rounded bg-blue-200 text-blue-800">
                        {documentType.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {fileSizeStr}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewDocOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                    title="Hapus file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Pengujian (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tabung telah diuji tekanan 250 bar selama 30 detik tanpa penurunan tekanan atau deformasi fisik."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Auto Close Ticket Work Order (if exists) */}
          {activeHydroTicket && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="closeTicketCheck"
                checked={closeTicket}
                onChange={(e) => setCloseTicket(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="closeTicketCheck" className="text-[11px] text-amber-900 cursor-pointer">
                <strong>Otomatis Tutup Tiket Perbaikan Hydrotest (#{activeHydroTicket.id.slice(-6).toUpperCase()})</strong>
                <p className="text-amber-700 text-[10px] mt-0.5">
                  Tiket work order yang sedang berjalan untuk APAR ini akan otomatis ditandai <em>Closed (Selesai)</em> dengan bukti dokumen yang dilampirkan.
                </p>
              </label>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingFile}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan ke Supabase...' : 'Simpan & Perbarui Hydrotest'}</span>
            </button>
          </div>
        </form>

        {/* Modal Pratinjau Dokumen Sementara Sebelum Submit */}
        {previewDocOpen && documentData && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
            onClick={() => setPreviewDocOpen(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <span className="font-semibold text-xs truncate">
                  Pratinjau Dokumen: {documentName}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewDocOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto flex items-center justify-center bg-slate-100">
                {documentType === 'pdf' ? (
                  <iframe
                    src={documentData}
                    title="PDF Preview"
                    className="w-full h-[65vh] rounded-lg border border-slate-300"
                  />
                ) : (
                  <img
                    src={documentData}
                    alt="Preview Sertifikat"
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

function useAparType(typeId, aparTypes) {
  return useMemo(() => {
    if (!typeId || !Array.isArray(aparTypes)) return null;
    return aparTypes.find(t => t.id === typeId) || null;
  }, [typeId, aparTypes]);
}

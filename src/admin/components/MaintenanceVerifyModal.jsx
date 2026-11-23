import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useApar } from '../../shared/context/AparContext';
import {
  X,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Building2,
  MapPin,
  FileText,
  UserCheck,
  ZoomIn,
  Camera
} from 'lucide-react';
import { formatHseDate } from '../../shared/utils/hydrotestUtils';
import { confirmActionAlert, showErrorAlert } from '../../shared/utils/alertUtils';
import { getTicketBeforePhoto } from '../../shared/utils/supabaseMappers';

export default function MaintenanceVerifyModal({ ticket, onClose }) {
  const { verifyMaintenance, apars, inspections, maintenances } = useApar();
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [beforeImgError, setBeforeImgError] = useState(false);
  const [afterImgError, setAfterImgError] = useState(false);

  // Esc key listener untuk menutup Lightbox tanpa menutup modal validasi
  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setLightboxImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [lightboxImage]);

  if (!ticket) return null;

  const linkedApar = apars.find(a => a.id === ticket.aparId || a.assetCode === ticket.assetCode);

  // Logika Fallback Berantai Foto Temuan Awal (Before)
  const beforePhoto = getTicketBeforePhoto(ticket, inspections, maintenances);
  const afterPhoto = ticket.evidencePhoto || ticket.evidence_photo || null;

  const handleApprove = async () => {
    const result = await confirmActionAlert({
      title: 'Setujui Hasil Perbaikan?',
      text: `Tiket ${ticket.assetCode} akan ditutup (Closed) dan kondisi tabung otomatis dipulihkan menjadi Layak Pakai.`,
      confirmButtonText: 'Ya, Setujui & Tutup Tiket',
      confirmButtonColor: '#16a34a'
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      await verifyMaintenance(
        ticket.id,
        true,
        adminNotes.trim() || 'Disetujui Admin HSE. Foto bukti dan hasil perbaikan fisik valid.'
      );
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      showErrorAlert(
        'Catatan Penolakan Wajib Diisi',
        'Harap berikan alasan penolakan dan instruksi perbaikan agar personil HFO di lapangan dapat memperbaikinya kembali.'
      );
      return;
    }

    const result = await confirmActionAlert({
      title: 'Tolak & Minta Perbaikan Ulang?',
      text: 'Tiket akan dikembalikan ke status Dikerjakan (In Progress) dan User di lapangan diminta mengunggah ulang bukti fisik.',
      confirmButtonText: 'Ya, Tolak Bukti',
      confirmButtonColor: '#dc2626'
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      await verifyMaintenance(ticket.id, false, adminNotes.trim());
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[95vw] md:max-w-4xl max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ========================================================================= */}
          {/* 1. HEADER ATAS TIPIS & RINGKAS (~56px)                                  */}
          {/* ========================================================================= */}
          <div className="shrink-0 px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 truncate">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  Validasi Tindakan APAR
                </h2>
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                  #{ticket.id?.slice(-6).toUpperCase() || ticket.assetCode}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 2. AREA ISI UTAMA YANG LEGA & BISA DI-SCROLL                              */}
          {/* ========================================================================= */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            
            {/* Ringkasan APAR & Tindakan (Kompak 4 Kolom) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Kode Aset</span>
                <span className="font-mono font-bold text-slate-900 truncate block text-xs">
                  {ticket.assetCode}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Rig & Lokasi</span>
                <span
                  className="font-semibold text-slate-700 truncate block text-xs"
                  title={`${ticket.rigCode} • ${ticket.placement || linkedApar?.placement || 'Area Rig'}`}
                >
                  {ticket.rigCode} • {ticket.placement || linkedApar?.placement || 'Area Rig'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Tindakan</span>
                <span className="font-bold text-blue-700 uppercase truncate block text-xs">
                  {ticket.actionType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Vendor</span>
                <span
                  className="font-semibold text-slate-800 truncate block text-xs"
                  title={ticket.vendorName || 'PT Sepakat HSE Solution'}
                >
                  {ticket.vendorName || 'PT Sepakat HSE Solution'}
                </span>
              </div>
            </div>

            {/* Kartu Perbandingan Foto BEFORE vs AFTER (Mobile vertikal, Desktop 2 kolom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* SISI KIRI: BEFORE (Temuan Awal) */}
              <div className="flex flex-col bg-rose-50/40 rounded-xl border border-rose-200 p-3 sm:p-3.5 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                      BEFORE (Temuan Awal)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                    Laporan
                  </span>
                </div>

                {/* Foto Temuan Awal */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (beforePhoto && !beforeImgError) {
                      setLightboxImage({
                        src: beforePhoto,
                        title: `Foto Temuan Awal (Before) — ${ticket.assetCode}`
                      });
                    }
                  }}
                  className={`relative rounded-lg overflow-hidden bg-slate-900 border border-slate-200 h-48 sm:h-56 flex items-center justify-center group ${
                    beforePhoto && !beforeImgError ? 'cursor-pointer' : ''
                  }`}
                >
                  {beforePhoto && !beforeImgError ? (
                    <>
                      <img
                        src={beforePhoto}
                        alt="Foto Temuan Kerusakan Awal (Before)"
                        onError={() => setBeforeImgError(true)}
                        className="w-full h-48 sm:h-56 object-cover cursor-pointer transition duration-150 group-hover:scale-102"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600/90 text-white rounded text-[10px] font-bold shadow-xs">
                        KONDISI AWAL
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage({
                            src: beforePhoto,
                            title: `Foto Temuan Awal (Before) — ${ticket.assetCode}`
                          });
                        }}
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-slate-950/80 hover:bg-slate-900 text-white text-[11px] font-semibold flex items-center gap-1 shadow-md transition cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Inspect / Perbesar Foto</span>
                      </button>
                    </>
                  ) : (
                    <div className="p-4 text-center text-slate-400">
                      <Camera className="w-8 h-8 mx-auto mb-1 opacity-40 text-rose-400" />
                      <p className="text-xs font-semibold text-slate-300">Foto Temuan Awal</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {beforeImgError ? 'File foto tidak dapat dimuat' : 'Tidak dilampirkan oleh pelapor'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Deskripsi Kerusakan */}
                <div className="p-2.5 bg-white rounded-lg border border-rose-100 text-xs">
                  <span className="text-[10px] font-bold text-rose-700 uppercase block mb-0.5">
                    Deskripsi Kerusakan:
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {ticket.issueDescription || '-'}
                  </p>
                </div>

                {/* Info Pelapor & Waktu */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-rose-100/60">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-rose-500" />
                    <span>{ticket.reportedBy || 'HFO Lapangan'}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {formatHseDate(ticket.reportedAt || ticket.createdAt)}
                  </span>
                </div>
              </div>

              {/* SISI KANAN: AFTER (Bukti Perbaikan) */}
              <div className="flex flex-col bg-emerald-50/40 rounded-xl border border-emerald-200 p-3 sm:p-3.5 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      AFTER (Bukti Perbaikan)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Menunggu Verifikasi
                  </span>
                </div>

                {/* Foto Bukti Perbaikan */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (afterPhoto && !afterImgError) {
                      setLightboxImage({
                        src: afterPhoto,
                        title: `Foto Bukti Perbaikan (After) — ${ticket.assetCode}`
                      });
                    }
                  }}
                  className={`relative rounded-lg overflow-hidden bg-slate-900 border border-slate-200 h-48 sm:h-56 flex items-center justify-center group ${
                    afterPhoto && !afterImgError ? 'cursor-pointer' : ''
                  }`}
                >
                  {afterPhoto && !afterImgError ? (
                    <>
                      <img
                        src={afterPhoto}
                        alt="Foto Bukti Hasil Perbaikan (After)"
                        onError={() => setAfterImgError(true)}
                        className="w-full h-48 sm:h-56 object-cover cursor-pointer transition duration-150 group-hover:scale-102"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600/90 text-white rounded text-[10px] font-bold shadow-xs">
                        HASIL PERBAIKAN
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage({
                            src: afterPhoto,
                            title: `Foto Bukti Perbaikan (After) — ${ticket.assetCode}`
                          });
                        }}
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-slate-950/80 hover:bg-slate-900 text-white text-[11px] font-semibold flex items-center gap-1 shadow-md transition cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Inspect / Perbesar Foto</span>
                      </button>
                    </>
                  ) : (
                    <div className="p-4 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-1 opacity-40 text-emerald-400" />
                      <p className="text-xs font-semibold text-slate-300">Belum Ada Foto Bukti</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {afterImgError ? 'File foto tidak dapat dimuat' : 'Personil lapangan belum mengunggah bukti fisik'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Catatan Perbaikan User */}
                <div className="p-2.5 bg-white rounded-lg border border-emerald-100 text-xs">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-0.5">
                    Catatan Perbaikan Lapangan:
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {ticket.repairNotes || 'Perbaikan fisik telah selesai dilaksanakan.'}
                  </p>
                </div>

                {/* Info Pengunggah Bukti */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-emerald-100/60">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{ticket.evidenceUploadedBy || ticket.reportedBy || 'HFO Lapangan'}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 capitalize">
                    {ticket.actionType}
                  </span>
                </div>
              </div>

            </div>

            {/* Textarea Catatan Verifikasi Admin HSE */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Verifikasi Admin HSE:
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Penggantian selang dan uji tekanan valid. Segel rapi. Disetujui."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                * Wajib diisi jika menolak hasil perbaikan agar personil HFO mengetahui catatan revisi yang diperlukan.
              </p>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 3. FOOTER STICKY TIPIS DI BAWAH (~56px)                                  */}
          {/* ========================================================================= */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-300 hover:bg-rose-100 transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tolak / Revisi</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#16A34A] text-white hover:bg-green-700 transition shadow-md shadow-green-600/20 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui & Tutup</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Preview Lightbox via React Portal (z-[9999] menimpa modal) */}
      {lightboxImage && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxImage(null);
          }}
        >
          {/* Lightbox Container */}
          <div
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Title and Close Button */}
            <div className="w-full flex items-center justify-between text-white px-3 py-2 mb-2 bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700/60 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold tracking-tight">
                  {lightboxImage.title}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxImage(null);
                }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Full Size */}
            <div className="relative flex items-center justify-center w-full overflow-hidden rounded-xl bg-slate-950/70 border border-slate-800 shadow-2xl">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.title}
                className="max-h-[82vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Klik di luar gambar atau tekan tombol <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">ESC</kbd> untuk menutup
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

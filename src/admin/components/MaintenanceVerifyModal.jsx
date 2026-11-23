import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useApar } from '../../shared/context/AparContext';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  Wrench,
  FileText,
  UserCheck,
  ZoomIn,
  Camera,
  ArrowRight
} from 'lucide-react';
import { formatHseDate } from '../../shared/utils/hydrotestUtils';
import { confirmActionAlert, showErrorAlert } from '../../shared/utils/alertUtils';
import { getTicketBeforePhoto } from '../../shared/utils/supabaseMappers';

export default function MaintenanceVerifyModal({ ticket, onClose }) {
  const { verifyMaintenance, apars, inspections } = useApar();
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
  const beforePhoto = getTicketBeforePhoto(ticket, inspections);
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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Verifikasi Before vs After K3
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-300">
                    Tiket #{ticket.id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                  Validasi Persetujuan Hasil Tindakan APAR
                </h2>
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

          {/* Quick Header Summary Bar */}
          <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-300">
                {ticket.assetCode}
              </span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Rig: {ticket.rigCode}
              </span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Lokasi: {ticket.placement || linkedApar?.placement || 'Area Rig Operasional'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Tindakan:</span>
              <span className="font-bold text-blue-700 uppercase bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {ticket.actionType}
              </span>
              <span className="text-slate-500 text-[11px] ml-2">Vendor:</span>
              <span className="font-semibold text-slate-800">
                {ticket.vendorName || 'PT Sepakat HSE Solution'}
              </span>
            </div>
          </div>

          {/* Modal Body: Side by Side Before vs After Comparison */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
            
            {/* SISI KIRI: BEFORE (Temuan Kerusakan Awal) */}
            <div className="flex flex-col space-y-4 bg-white p-5 rounded-2xl border-2 border-rose-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-800">
                    BEFORE (Temuan Kerusakan Awal)
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                  Laporan Masuk
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
                className={`relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300 aspect-video flex items-center justify-center group ${
                  beforePhoto && !beforeImgError ? 'cursor-pointer' : ''
                }`}
              >
                {beforePhoto && !beforeImgError ? (
                  <>
                    <img
                      src={beforePhoto}
                      alt="Foto Temuan Kerusakan Awal (Before)"
                      onError={() => setBeforeImgError(true)}
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImage({
                          src: beforePhoto,
                          title: `Foto Temuan Awal (Before) — ${ticket.assetCode}`
                        });
                      }}
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-semibold text-xs cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Inspect / Perbesar Foto</span>
                    </button>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <Camera className="w-10 h-10 mx-auto mb-2 opacity-40 text-rose-400" />
                    <p className="text-xs font-semibold text-slate-300">Foto Temuan Fisik Awal</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {beforeImgError ? 'File foto tidak dapat dimuat' : 'Tidak dilampirkan oleh pelapor lapangan'}
                    </p>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600/90 text-white rounded text-[10px] font-bold shadow-xs">
                  KONDISI AWAL (BEFORE)
                </div>
              </div>

              {/* Rincian Masalah Awal */}
              <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-100 space-y-1.5">
                <span className="text-[11px] font-bold text-rose-800 uppercase block">
                  Deskripsi Kerusakan:
                </span>
                <p className="text-xs text-rose-950 font-medium leading-relaxed">
                  {ticket.issueDescription}
                </p>
              </div>

              {/* Info Pelapor HFO */}
              <div className="mt-auto pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Dilaporkan Oleh:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    {ticket.reportedBy || 'HFO Lapangan'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tanggal Temuan:</span>
                  <span className="font-medium text-slate-700">
                    {formatHseDate(ticket.reportedAt || ticket.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* SISI KANAN: AFTER (Bukti Perbaikan Lapangan) */}
            <div className="flex flex-col space-y-4 bg-white p-5 rounded-2xl border-2 border-emerald-300 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800">
                    AFTER (Bukti Hasil Perbaikan)
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
                className={`relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300 aspect-video flex items-center justify-center group ${
                  afterPhoto && !afterImgError ? 'cursor-pointer' : ''
                }`}
              >
                {afterPhoto && !afterImgError ? (
                  <>
                    <img
                      src={afterPhoto}
                      alt="Foto Bukti Hasil Perbaikan (After)"
                      onError={() => setAfterImgError(true)}
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImage({
                          src: afterPhoto,
                          title: `Foto Bukti Perbaikan (After) — ${ticket.assetCode}`
                        });
                      }}
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-semibold text-xs cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Inspect / Perbesar Bukti</span>
                    </button>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-400" />
                    <p className="text-xs font-semibold text-slate-300">Belum Ada Foto Bukti</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {afterImgError ? 'File foto tidak dapat dimuat' : 'Personil lapangan belum mengunggah file bukti'}
                    </p>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600/90 text-white rounded text-[10px] font-bold shadow-xs">
                  HASIL PERBAIKAN (AFTER)
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur rounded text-[10px] text-slate-200 font-mono">
                  GPS: Rig Active • Verified
                </div>
              </div>

              {/* Catatan Teknisi / User */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                  Catatan Teknisi / User Lapangan:
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {ticket.repairNotes || 'Perbaikan fisik telah selesai dilaksanakan sesuai SOP K3.'}
                </p>
              </div>

              {/* Info Pengunggah Bukti */}
              <div className="mt-auto pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bukti Diunggah Oleh:</span>
                  <span className="font-bold text-blue-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    {ticket.evidenceUploadedBy || ticket.reportedBy || 'HFO Lapangan'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Tindakan:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {ticket.actionType} ({ticket.vendorName || 'PT Sepakat'})
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Form Validasi & Keputusan Admin */}
          <div className="p-6 border-t border-slate-200 bg-white space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Verifikasi Admin HSE:
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Hasil penggantian selang dan uji tekanan 14 bar valid. Segel terpasang rapi. Disetujui."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                * Wajib diisi jika menolak hasil perbaikan agar kru lapangan mengetahui catatan revisi yang diperlukan.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup / Nanti Saja
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tolak & Minta Perbaikan Ulang</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui & Tutup Tiket</span>
                </button>
              </div>
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

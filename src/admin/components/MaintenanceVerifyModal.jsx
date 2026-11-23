import React, { useState } from 'react';
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

export default function MaintenanceVerifyModal({ ticket, onClose }) {
  const { verifyMaintenance, apars } = useApar();
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  if (!ticket) return null;

  const linkedApar = apars.find(a => a.id === ticket.aparId || a.assetCode === ticket.assetCode);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
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
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300 aspect-video flex items-center justify-center group">
                {ticket.findingPhoto ? (
                  <>
                    <img
                      src={ticket.findingPhoto}
                      alt="Foto Temuan Kerusakan Awal"
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => setLightboxImage({ src: ticket.findingPhoto, title: `Foto Temuan Awal — ${ticket.assetCode}` })}
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-semibold text-xs"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Perbesar Foto</span>
                    </button>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <Camera className="w-10 h-10 mx-auto mb-2 opacity-40 text-rose-400" />
                    <p className="text-xs font-semibold text-slate-300">Foto Temuan Fisik Awal</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Tidak dilampirkan oleh pelapor lapangan</p>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600/90 text-white rounded text-[10px] font-bold">
                  KONDISI AWAL
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
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300 aspect-video flex items-center justify-center group">
                {ticket.evidencePhoto ? (
                  <>
                    <img
                      src={ticket.evidencePhoto}
                      alt="Foto Bukti Hasil Perbaikan"
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => setLightboxImage({ src: ticket.evidencePhoto, title: `Bukti Hasil Perbaikan — ${ticket.assetCode}` })}
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-semibold text-xs"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Perbesar Bukti</span>
                    </button>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-400" />
                    <p className="text-xs font-semibold text-slate-300">Belum Ada Foto Bukti</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Personil lapangan belum mengunggah file bukti</p>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600/90 text-white rounded text-[10px] font-bold">
                  HASIL PERBAIKAN
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

          {/* Admin Verification Input Field */}
          <div className="px-6 py-3.5 bg-white border-t border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Catatan Verifikasi Admin HSE <span className="text-slate-400 font-normal">(Wajib jika menolak, opsional jika menyetujui):</span>
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Contoh: Hasil perbaikan komponen hose sesuai standar / Harap pasang klem segel baru..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-slate-500">
              {ticket.actionType === 'hydrotest' ? (
                <span className="text-blue-700 font-semibold">
                  * Uji Tekan (Hydrotest): Persetujuan otomatis memperbarui tanggal jatuh tempo APAR +5 tahun ke depan.
                </span>
              ) : (
                <span>
                  * Persetujuan otomatis mengembalikan status APAR menjadi <strong className="text-emerald-700">Layak Pakai</strong>.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 transition shadow-2xs disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tolak & Minta Perbaikan Ulang</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui & Tutup Tiket</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Preview Modal for Zooming Photos */}
      {lightboxImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            <div className="px-4 py-3 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <span className="text-xs font-bold">{lightboxImage.title}</span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

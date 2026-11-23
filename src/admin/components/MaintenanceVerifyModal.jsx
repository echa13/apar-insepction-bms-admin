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
  UserCheck
} from 'lucide-react';
import { formatHseDate } from '../../shared/utils/hydrotestUtils';

export default function MaintenanceVerifyModal({ ticket, onClose }) {
  const { verifyMaintenance, apars } = useApar();
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!ticket) return null;

  const linkedApar = apars.find(a => a.id === ticket.aparId || a.assetCode === ticket.assetCode);

  const handleApprove = () => {
    setIsSubmitting(true);
    verifyMaintenance(ticket.id, true, adminNotes.trim() || 'Disetujui Admin HSE. Foto bukti dan hasil perbaikan valid.');
    setIsSubmitting(false);
    onClose();
  };

  const handleReject = () => {
    if (!adminNotes.trim()) {
      alert('Harap berikan catatan alasan penolakan agar personil lapangan dapat memperbaiki.');
      return;
    }
    setIsSubmitting(true);
    verifyMaintenance(ticket.id, false, adminNotes.trim());
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Verifikasi Bukti K3
                </span>
                <span className="font-mono text-xs font-semibold text-slate-300">
                  Tiket #{ticket.id.slice(-6).toUpperCase()}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                Persetujuan Hasil Perbaikan Fisik APAR
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

        {/* Modal Body: Side by Side Inspection */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
          {/* Kolom Kiri: Riwayat Kerusakan & Tindakan */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Data Aset & Lokasi Temuan
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Kode Aset APAR</span>
                  <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                    {ticket.assetCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Rig Operasional</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {ticket.rigCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Penempatan</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {linkedApar?.placement || 'Area Rig'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tipe Tabung</span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {linkedApar?.typeId?.replace(/_/g, ' ') || 'Powder 9 Kg'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  2. Temuan Kerusakan Awal
                </h3>
              </div>
              <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-100 text-xs text-rose-900 font-medium">
                {ticket.issueDescription}
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5">
                <p className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dilaporkan oleh: <strong className="text-slate-800">{ticket.reportedBy || 'HFO Lapangan'}</strong></span>
                </p>
                <p className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>Tanggal Laporan: {formatHseDate(ticket.reportedAt || ticket.createdAt)}</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                3. Tindakan Disetujui
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Jenis Tindakan</span>
                  <span className="font-bold text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mt-1">
                    {ticket.actionType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pihak Ke-3 / Vendor</span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {ticket.vendorName || 'PT Sepakat HSE Solution'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Foto Bukti & Catatan User */}
          <div className="space-y-4 flex flex-col">
            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs flex-1 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  4. Bukti Foto & Catatan Lapangan
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  Pengunggah: <strong className="text-slate-800">{ticket.evidenceUploadedBy || ticket.reportedBy || 'HFO Lapangan'}</strong>
                </span>
              </div>

              {/* Foto Bukti */}
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300 aspect-video flex items-center justify-center">
                {ticket.evidencePhoto ? (
                  <img
                    src={ticket.evidencePhoto}
                    alt="Bukti Perbaikan APAR"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Tidak ada file foto terlampir</p>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-slate-950/80 backdrop-blur rounded text-[10px] text-slate-200 font-mono">
                  GPS: Lat -1.258, Long 101.442 • Verified
                </div>
              </div>

              {/* Catatan Lapangan */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block mb-1">Catatan Teknisi:</span>
                {ticket.repairNotes || 'Tidak ada catatan perbaikan tambahan.'}
              </div>

              {/* Input Catatan Admin */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Verifikasi Admin HSE:
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Berikan persetujuan atau instruksi perbaikan ulang jika ditolak..."
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            * Jika disetujui, status APAR otomatis dipulihkan menjadi <strong className="text-emerald-600">Layak</strong>.
          </p>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReject}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tolak & Minta Ulang</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Setujui & Tutup Tiket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

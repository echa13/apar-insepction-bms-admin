import React, { useState } from 'react';
import { useApar } from '../../shared/context/AparContext';
import { formatHseDate } from '../../shared/utils/hydrotestUtils';
import {
  Wrench,
  Camera,
  CheckCircle2,
  Clock,
  ShieldAlert,
  X,
  Upload,
  Building2
} from 'lucide-react';

export default function UserMaintenances() {
  const { maintenances, currentUser, rigs, submitEvidence } = useApar();

  const userRig = rigs.find(r => r.id === currentUser.rigId) || rigs[0];
  const userTickets = maintenances.filter(m => m.rigId === userRig?.id || m.rigCode === userRig?.code);

  const [uploadModalTicket, setUploadModalTicket] = useState(null);
  const [evidencePhoto, setEvidencePhoto] = useState('');
  const [repairNotes, setRepairNotes] = useState('');

  const samplePhotos = [
    { label: 'Foto Selang Baru', url: 'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=800&q=80' },
    { label: 'Foto Tekanan Normal (Hijau)', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80' },
  ];

  const handleOpenUpload = (ticket) => {
    setUploadModalTicket(ticket);
    setEvidencePhoto(samplePhotos[0].url);
    setRepairNotes('Perbaikan fisik telah diselesaikan oleh teknisi lapangan. Segel baru dan pin terpasang rapi.');
  };

  const handleConfirmUpload = (e) => {
    e.preventDefault();
    if (!uploadModalTicket) return;
    submitEvidence(uploadModalTicket.id, evidencePhoto, repairNotes);
    alert('Foto bukti berhasil diunggah! Tiket kini berstatus Menunggu Verifikasi Admin HSE.');
    setUploadModalTicket(null);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">
          Status Perbaikan APAR — {userRig.name}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Pantau status tiket perbaikan dari Admin HSE Pusat dan unggah bukti hasil perbaikan fisik.
        </p>
      </div>

      <div className="space-y-3">
        {userTickets.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Tidak Ada Tiket Perbaikan Aktif</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Semua APAR di Rig ini siap operasi.</p>
          </div>
        ) : (
          userTickets.map((ticket) => {
            const isInProgress = ticket.status === 'in_progress';
            const isPendingReview = ticket.status === 'pending_review';
            const isOpen = ticket.status === 'open';
            const isClosed = ticket.status === 'closed';

            return (
              <div
                key={ticket.id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded border">
                      {ticket.assetCode}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-600">
                      Tindakan: {ticket.actionType}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isOpen
                      ? 'bg-amber-100 text-amber-800'
                      : isInProgress
                      ? 'bg-blue-100 text-blue-800'
                      : isPendingReview
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{ticket.issueDescription}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Vendor Ditunjuk: <strong>{ticket.vendorName || 'PT Sepakat HSE Solution'}</strong>
                  </p>
                </div>

                {/* Conditional Actions */}
                {isInProgress && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Disetujui Admin — Siap upload bukti foto
                    </span>
                    <button
                      onClick={() => handleOpenUpload(ticket)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Foto Bukti</span>
                    </button>
                  </div>
                )}

                {isPendingReview && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Foto bukti telah terkirim. Menunggu persetujuan Admin HSE Pusat.</span>
                  </div>
                )}

                {isClosed && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Selesai diverifikasi Admin. Status APAR kembali Layak Pakai.</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Upload Foto Bukti Perbaikan ({uploadModalTicket.assetCode})
              </h3>
              <button onClick={() => setUploadModalTicket(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmUpload} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Sampel Foto Bukti:</label>
                <div className="grid grid-cols-2 gap-2">
                  {samplePhotos.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setEvidencePhoto(p.url)}
                      className={`p-2 rounded-lg border text-left text-[11px] font-semibold transition ${
                        evidencePhoto === p.url ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview image */}
              <div className="aspect-video rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center border">
                <img src={evidencePhoto} alt="Bukti Perbaikan" className="w-full h-full object-cover" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Hasil Perbaikan:</label>
                <textarea
                  rows={2}
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalTicket(null)}
                  className="px-3.5 py-2 border rounded-lg font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  Kirim ke Admin HSE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

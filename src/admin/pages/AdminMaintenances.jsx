import React, { useState, useMemo } from 'react';
import { useApar } from '../../shared/context/AparContext';
import { formatHseDate } from '../../shared/utils/hydrotestUtils';
import MaintenanceVerifyModal from '../components/MaintenanceVerifyModal';
import {
  Wrench,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Eye,
  Send,
  Plus,
  Building2,
  X,
  FileCheck
} from 'lucide-react';

export default function AdminMaintenances() {
  const { maintenances, apars, rigs, dispatchMaintenance, createManualMaintenance } = useApar();

  // Status Tab
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'open' | 'in_progress' | 'pending_review' | 'closed'
  const [selectedRig, setSelectedRig] = useState('all');
  const [selectedVerifyTicket, setSelectedVerifyTicket] = useState(null);

  // Dispatch Action Modal State
  const [dispatchTicket, setDispatchTicket] = useState(null);
  const [actionType, setActionType] = useState('perbaikan');
  const [vendorName, setVendorName] = useState('PT Sepakat HSE Solution');

  // Manual Ticket Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    aparId: apars[0]?.id || '',
    issueDescription: 'Uji Tekan (Hydrotest) Berkala 5 Tahun',
    actionType: 'hydrotest',
    vendorName: 'PT Sepakat HSE Solution'
  });

  const filteredTickets = useMemo(() => {
    return maintenances.filter(m => {
      if (activeTab !== 'all' && m.status !== activeTab) return false;
      if (selectedRig !== 'all' && m.rigId !== selectedRig && m.rigCode !== selectedRig) return false;
      return true;
    });
  }, [maintenances, activeTab, selectedRig]);

  const counts = {
    all: maintenances.length,
    open: maintenances.filter(m => m.status === 'open').length,
    in_progress: maintenances.filter(m => m.status === 'in_progress').length,
    pending_review: maintenances.filter(m => m.status === 'pending_review').length,
    closed: maintenances.filter(m => m.status === 'closed').length,
  };

  const handleOpenDispatch = (ticket) => {
    setDispatchTicket(ticket);
    setActionType(ticket.actionType || 'perbaikan');
    setVendorName(ticket.vendorName || 'PT Sepakat HSE Solution');
  };

  const handleConfirmDispatch = (e) => {
    e.preventDefault();
    if (!dispatchTicket) return;
    dispatchMaintenance(dispatchTicket.id, actionType, vendorName);
    setDispatchTicket(null);
  };

  const handleCreateManual = (e) => {
    e.preventDefault();
    if (!manualForm.aparId) {
      alert('Pilih tabung APAR.');
      return;
    }
    createManualMaintenance(manualForm.aparId, manualForm.issueDescription, manualForm.actionType, manualForm.vendorName);
    setIsManualModalOpen(false);
    alert('Tiket pemeliharaan berhasil dibuat.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tindak Lanjut & Verifikasi Perbaikan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Siklus alur kerja K3: Tiket Masuk &rarr; Proses Tindakan &rarr; Tinjau Bukti Foto &rarr; Penutupan Tiket.
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-md shadow-red-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tiket Pemeliharaan</span>
        </button>
      </div>

      {/* Tabs & Rig Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Semua Tiket', count: counts.all },
            { id: 'open', label: 'Tiket Masuk', count: counts.open, alert: counts.open > 0 },
            { id: 'in_progress', label: 'Dikerjakan', count: counts.in_progress },
            { id: 'pending_review', label: 'Menunggu Verifikasi', count: counts.pending_review, highlight: true },
            { id: 'closed', label: 'Selesai (Closed)', count: counts.closed },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-slate-700 text-white'
                    : tab.highlight && tab.count > 0
                    ? 'bg-blue-600 text-white animate-pulse'
                    : tab.alert
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Rig Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Rig:</span>
          <select
            value={selectedRig}
            onChange={(e) => setSelectedRig(e.target.value)}
            className="text-xs font-mono font-semibold p-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Semua Rig</option>
            {rigs.map(r => (
              <option key={r.id} value={r.code}>{r.code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2.5 opacity-80" />
            <h3 className="text-sm font-bold text-slate-800">Tidak Ada Tiket di Kategori Ini</h3>
            <p className="text-xs text-slate-400 mt-1">
              Seluruh APAR dalam status operasional aman atau filter tidak menemukan hasil.
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isPendingReview = ticket.status === 'pending_review';
            const isOpen = ticket.status === 'open';
            const isInProgress = ticket.status === 'in_progress';
            const isClosed = ticket.status === 'closed';

            return (
              <div
                key={ticket.id}
                className={`p-4 sm:p-5 rounded-2xl border bg-white shadow-xs transition hover:shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                  isPendingReview
                    ? 'border-blue-300 bg-blue-50/20'
                    : isOpen
                    ? 'border-amber-300 bg-amber-50/20'
                    : isClosed
                    ? 'border-slate-200 opacity-90'
                    : 'border-slate-200'
                }`}
              >
                {/* Left: Ticket Core Info */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {ticket.assetCode}
                    </span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {ticket.rigCode}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isOpen
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : isInProgress
                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                          : isPendingReview
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isOpen ? 'Tiket Masuk' : isInProgress ? 'Dikerjakan' : isPendingReview ? 'Verifikasi Foto' : 'Selesai (Closed)'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {ticket.issueDescription}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                    <span>Pelapor: <strong className="text-slate-800">{ticket.reportedBy || 'HFO Lapangan'}</strong></span>
                    {ticket.evidenceUploadedBy && (
                      <span>Bukti oleh: <strong className="text-blue-700">{ticket.evidenceUploadedBy}</strong></span>
                    )}
                    <span>Tgl: {formatHseDate(ticket.reportedAt || ticket.createdAt)}</span>
                    <span>Tindakan: <strong className="capitalize text-slate-700">{ticket.actionType}</strong></span>
                    <span>Vendor: <strong className="text-slate-700">{ticket.vendorName || 'PT Sepakat'}</strong></span>
                  </div>

                  {ticket.adminNotes && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-2">
                      <strong>Catatan Admin:</strong> {ticket.adminNotes}
                    </div>
                  )}
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {isOpen && (
                    <button
                      onClick={() => handleOpenDispatch(ticket)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Proses Tindakan</span>
                    </button>
                  )}

                  {isPendingReview && (
                    <button
                      onClick={() => setSelectedVerifyTicket(ticket)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Tinjau Bukti Foto</span>
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => setSelectedVerifyTicket(ticket)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Status</span>
                    </button>
                  )}

                  {isClosed && (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                      <FileCheck className="w-4 h-4" />
                      <span>Terverifikasi</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dispatch Maintenance */}
      {dispatchTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-sm font-bold">Tetapkan Tindakan Perbaikan</h2>
              <button onClick={() => setDispatchTicket(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmDispatch} className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Kode Aset</span>
                <span className="font-mono font-bold text-sm text-slate-900">{dispatchTicket.assetCode} ({dispatchTicket.rigCode})</span>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Jenis Tindakan *
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-500"
                >
                  <option value="perbaikan">Perbaikan Komponen (Hose, Handle, Nozzle)</option>
                  <option value="pergantian">Pergantian Tabung / Unit Baru</option>
                  <option value="isi_ulang">Isi Ulang Media Pemadam (Refill N2 / Powder)</option>
                  <option value="hydrotest">Uji Tekan (Hydrotest) 5 Tahun</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nama Vendor / Pihak Ke-3
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchTicket(null)}
                  className="px-3.5 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 shadow-xs"
                >
                  Terbitkan Surat Perintah (In Progress)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buat Tiket Manual */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-sm font-bold">Buat Tiket Pemeliharaan Manual</h2>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateManual} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Pilih Tabung APAR *
                </label>
                <select
                  value={manualForm.aparId}
                  onChange={(e) => setManualForm({ ...manualForm, aparId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-red-500"
                  required
                >
                  {apars.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.assetCode} — {a.rigCode} ({a.placement})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Jenis Tindakan Terjadwal *
                </label>
                <select
                  value={manualForm.actionType}
                  onChange={(e) => setManualForm({ ...manualForm, actionType: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-500"
                >
                  <option value="hydrotest">Uji Tekan (Hydrotest) 5 Tahun</option>
                  <option value="isi_ulang">Isi Ulang Terjadwal</option>
                  <option value="perbaikan">Perbaikan Fisik Terjadwal</option>
                  <option value="pergantian">Pergantian Tabung Baru</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Keterangan Tindakan
                </label>
                <input
                  type="text"
                  value={manualForm.issueDescription}
                  onChange={(e) => setManualForm({ ...manualForm, issueDescription: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Vendor Pelaksana
                </label>
                <input
                  type="text"
                  value={manualForm.vendorName}
                  onChange={(e) => setManualForm({ ...manualForm, vendorName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3.5 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-xs"
                >
                  Buat Tiket Terjadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Verifikasi Bukti Foto (Side-by-side) */}
      {selectedVerifyTicket && (
        <MaintenanceVerifyModal
          ticket={selectedVerifyTicket}
          onClose={() => setSelectedVerifyTicket(null)}
        />
      )}
    </div>
  );
}

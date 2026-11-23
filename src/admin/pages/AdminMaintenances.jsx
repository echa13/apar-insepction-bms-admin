import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  FileCheck,
  MapPin,
  Camera,
  UserCheck,
  ZoomIn,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { notifySuccess, showErrorAlert, confirmActionAlert } from '../../shared/utils/alertUtils';
import { getTicketBeforePhoto } from '../../shared/utils/supabaseMappers';

export default function AdminMaintenances() {
  const { maintenances, apars, rigs, inspections, dispatchMaintenance, createManualMaintenance } = useApar();

  // Status Tabs
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'open' | 'in_progress' | 'pending_review' | 'closed'
  const [selectedRig, setSelectedRig] = useState('all');
  const [selectedVerifyTicket, setSelectedVerifyTicket] = useState(null);

  // Dispatch Action Modal State (Tahap 1)
  const [dispatchTicket, setDispatchTicket] = useState(null);
  const [actionType, setActionType] = useState('perbaikan');
  const [vendorName, setVendorName] = useState('PT Sepakat HSE Solution');
  const [isDispatching, setIsDispatching] = useState(false);

  // Manual Ticket Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    aparId: apars[0]?.id || '',
    issueDescription: 'Uji Tekan (Hydrotest) Berkala 5 Tahun',
    actionType: 'hydrotest',
    vendorName: 'PT Sepakat HSE Solution'
  });

  // Lightbox Image Preview
  const [previewPhoto, setPreviewPhoto] = useState(null);

  useEffect(() => {
    if (!previewPhoto) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setPreviewPhoto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [previewPhoto]);

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

  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchTicket) return;

    setIsDispatching(true);
    await dispatchMaintenance(dispatchTicket.id, actionType, vendorName);
    setIsDispatching(false);
    setDispatchTicket(null);
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    if (!manualForm.aparId) {
      showErrorAlert('Pilih APAR', 'Harap pilih tabung APAR yang akan dijadwalkan tindakannya.');
      return;
    }

    await createManualMaintenance(
      manualForm.aparId,
      manualForm.issueDescription,
      manualForm.actionType,
      manualForm.vendorName
    );
    setIsManualModalOpen(false);
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
            Alur kerja K3: Laporan Baru Masuk &rarr; Tetapkan Tindakan &rarr; Verifikasi Before vs After &rarr; Selesai.
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-md shadow-red-600/20 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tiket Pemeliharaan Manual</span>
        </button>
      </div>

      {/* Tabs Filter Cepat & Filter Rig */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Status Tabs Sesuai Permintaan */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Semua', count: counts.all },
            { id: 'open', label: 'Laporan Baru', count: counts.open, alert: counts.open > 0 },
            { id: 'in_progress', label: 'Sedang Diproses', count: counts.in_progress },
            { id: 'pending_review', label: 'Perlu Verifikasi', count: counts.pending_review, highlight: true },
            { id: 'closed', label: 'Selesai', count: counts.closed },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
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
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Rig Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Rig:</span>
          <select
            value={selectedRig}
            onChange={(e) => setSelectedRig(e.target.value)}
            className="text-xs font-mono font-semibold p-2 rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                    ? 'border-blue-400 bg-blue-50/20'
                    : isOpen
                    ? 'border-amber-300 bg-amber-50/20'
                    : isClosed
                    ? 'border-slate-200 opacity-90'
                    : 'border-slate-200'
                }`}
              >
                {/* Left Section: Information */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {ticket.assetCode}
                    </span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {ticket.rigCode}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {ticket.placement || 'Area Rig Operasional'}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isOpen
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : isInProgress
                          ? 'bg-slate-100 text-slate-800 border border-slate-300'
                          : isPendingReview
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {isOpen
                        ? 'Laporan Baru'
                        : isInProgress
                        ? 'Sedang Diproses'
                        : isPendingReview
                        ? 'Perlu Verifikasi (Before vs After)'
                        : 'Selesai (Closed)'}
                    </span>
                  </div>

                  {/* Issue Description */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {ticket.issueDescription}
                  </h3>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      Pelapor: <strong className="text-slate-800">{ticket.reportedBy || 'HFO Lapangan'}</strong>
                    </span>
                    {ticket.evidenceUploadedBy && (
                      <span className="flex items-center gap-1">
                        Bukti oleh: <strong className="text-blue-700">{ticket.evidenceUploadedBy}</strong>
                      </span>
                    )}
                    <span>Tgl Laporan: {formatHseDate(ticket.reportedAt || ticket.createdAt)}</span>
                    <span>Tindakan: <strong className="capitalize text-slate-700">{ticket.actionType}</strong></span>
                    <span>Vendor: <strong className="text-slate-700">{ticket.vendorName || 'PT Sepakat HSE Solution'}</strong></span>
                  </div>

                  {/* Admin Notes Preview */}
                  {ticket.adminNotes && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1.5 flex items-start gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Catatan Admin HSE:</strong> {ticket.adminNotes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Section: Thumbnail Photo & Action Buttons */}
                <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Thumbnail Preview if Photo Available */}
                  {(() => {
                    const beforePhoto = getTicketBeforePhoto(ticket, inspections);
                    const thumbSrc = ticket.evidencePhoto || ticket.evidence_photo || beforePhoto;
                    if (!thumbSrc) return null;

                    return (
                      <button
                        type="button"
                        onClick={() => setPreviewPhoto({
                          src: thumbSrc,
                          title: `${ticket.assetCode} — ${ticket.evidencePhoto || ticket.evidence_photo ? 'Bukti Perbaikan (After)' : 'Foto Temuan Awal (Before)'}`
                        })}
                        className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden relative group shrink-0 shadow-2xs hover:border-blue-400 transition cursor-pointer"
                        title="Klik untuk perbesar foto"
                      >
                        <img
                          src={thumbSrc}
                          alt="Thumbnail"
                          className="w-full h-full object-cover group-hover:scale-110 transition"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    );
                  })()}

                  {/* Actions Depending on Status */}
                  {isOpen && (
                    <button
                      onClick={() => handleOpenDispatch(ticket)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Proses Tindakan</span>
                    </button>
                  )}

                  {isPendingReview && (
                    <button
                      onClick={() => setSelectedVerifyTicket(ticket)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Verifikasi Before vs After</span>
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => setSelectedVerifyTicket(ticket)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Status / Detail</span>
                    </button>
                  )}

                  {isClosed && (
                    <button
                      onClick={() => setSelectedVerifyTicket(ticket)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Lihat Arsip</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL TAHAP 1: TERIMA LAPORAN BARU & TETAPKAN TINDAKAN */}
      {/* ========================================================================= */}
      {dispatchTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Tahap 1 — Proses Laporan Kerusakan</h2>
                  <p className="text-[10px] text-slate-400">Tetapkan jenis tindakan dan vendor pelaksana</p>
                </div>
              </div>
              <button
                onClick={() => setDispatchTicket(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleConfirmDispatch} className="p-6 space-y-4 text-xs">
              {/* Detail Laporan Masuk */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kode Aset APAR</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {dispatchTicket.assetCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Rig Operasional</span>
                    <span className="font-semibold text-slate-800">
                      {dispatchTicket.rigCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Penempatan</span>
                    <span className="font-medium text-slate-700">
                      {dispatchTicket.placement || 'Area Rig Operasional'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Pelapor (HFO)</span>
                    <span className="font-bold text-slate-800">
                      {dispatchTicket.reportedBy || 'HFO Lapangan'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Deskripsi Kerusakan:</span>
                  <p className="font-semibold text-slate-900 bg-white p-2 rounded border border-slate-200">
                    {dispatchTicket.issueDescription}
                  </p>
                </div>

                {/* Preview Foto Temuan Awal */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[11px] mb-1">Foto Temuan Awal:</span>
                  {(() => {
                    const beforePhoto = getTicketBeforePhoto(dispatchTicket, inspections);
                    return beforePhoto ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 h-36 bg-slate-900 flex items-center justify-center">
                        <img
                          src={beforePhoto}
                          alt="Temuan Awal"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.parentElement) {
                              const fallback = e.currentTarget.parentElement.querySelector('.img-error-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="img-error-fallback hidden absolute inset-0 items-center justify-center bg-slate-800 text-slate-400 text-xs gap-1.5">
                          <Camera className="w-4 h-4 text-slate-500" />
                          <span>Gagal memuat gambar</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPhoto({ src: beforePhoto, title: `Foto Temuan Awal — ${dispatchTicket.assetCode}` });
                          }}
                          className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-slate-950/80 hover:bg-slate-900 text-white text-[11px] font-semibold flex items-center gap-1 shadow-md transition-colors cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Perbesar</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-white border border-dashed border-slate-300 text-slate-400 text-center flex items-center justify-center gap-1.5">
                        <Camera className="w-4 h-4 text-slate-300" />
                        <span>Foto temuan awal tidak dilampirkan oleh pelapor</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Form Input Tindakan */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Pilih Jenis Tindakan K3 *
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500"
                >
                  <option value="perbaikan">Perbaikan Komponen (Hose, Handle, Nozzle, dll.)</option>
                  <option value="pergantian">Pergantian Tabung / Unit APAR Baru</option>
                  <option value="isi_ulang">Isi Ulang Media Pemadam (Refill N2 / Powder)</option>
                  <option value="hydrotest">Uji Tekan (Hydrotest) 5 Tahun</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nama Vendor / Pelaksana Pihak Ke-3
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="PT Sepakat HSE Solution"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchTicket(null)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isDispatching ? 'Memproses...' : 'Proses Tindakan (In Progress)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL BUAT TIKET PEMELIHARAAN MANUAL */}
      {/* ========================================================================= */}
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-red-500"
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
                  Jenis Tindakan *
                </label>
                <select
                  value={manualForm.actionType}
                  onChange={(e) => setManualForm({ ...manualForm, actionType: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500"
                >
                  <option value="hydrotest">Uji Tekan (Hydrotest) 5 Tahun</option>
                  <option value="isi_ulang">Isi Ulang Terjadwal</option>
                  <option value="perbaikan">Perbaikan Komponen Fisik</option>
                  <option value="pergantian">Pergantian Tabung Baru</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Keterangan Perbaikan
                </label>
                <input
                  type="text"
                  value={manualForm.issueDescription}
                  onChange={(e) => setManualForm({ ...manualForm, issueDescription: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3.5 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-xs cursor-pointer"
                >
                  Buat Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL VERIFIKASI BEFORE VS AFTER */}
      {/* ========================================================================= */}
      {selectedVerifyTicket && (
        <MaintenanceVerifyModal
          ticket={selectedVerifyTicket}
          onClose={() => setSelectedVerifyTicket(null)}
        />
      )}

      {/* Lightbox Quick Viewer via Portal */}
      {previewPhoto && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between text-white pb-3 px-1">
              <span className="text-sm font-semibold tracking-wide drop-shadow-sm">
                {previewPhoto.title || 'Foto APAR'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                aria-label="Tutup Pratinjau Foto"
                className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950/60 max-h-[82vh] max-w-[92vw] flex items-center justify-center">
              <img
                src={previewPhoto.src}
                alt={previewPhoto.title || 'Preview'}
                className="max-h-[80vh] max-w-[90vw] object-contain select-none"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

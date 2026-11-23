import React, { useState } from 'react';
import { useApar } from '../../shared/context/AparContext';
import { formatHseDate } from '../../shared/utils/hydrotestUtils';
import HydrotestCertViewerModal from './HydrotestCertViewerModal';
import {
  X,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Building2,
  UserCheck,
  Calendar,
  Camera,
  ZoomIn,
  ShieldCheck,
  MapPin,
  FileCheck
} from 'lucide-react';

export default function InspectionHistoryModal({ apar, onClose }) {
  const { inspections } = useApar();
  const [zoomImage, setZoomImage] = useState(null);
  const [isCertViewerOpen, setIsCertViewerOpen] = useState(false);

  if (!apar) return null;

  // Filter inspeksi yang terkait dengan tabung APAR ini (dengan normalisasi kode dan id)
  const clean = (s) => (s ? String(s).toLowerCase().replace(/[^a-z0-9]/g, '') : '');
  const aparCleanId = clean(apar.id);
  const aparCleanAsset = clean(apar.assetCode);

  const relatedInspections = inspections
    .filter(i => {
      const iId = clean(i.aparId || i.apar_id);
      const iAsset = clean(i.assetCode || i.asset_code);
      return (
        (aparCleanId && (iId === aparCleanId || iAsset === aparCleanId)) ||
        (aparCleanAsset && (iId === aparCleanAsset || iAsset === aparCleanAsset)) ||
        (aparCleanId && iId && (iId.includes(aparCleanId) || aparCleanId.includes(iId)))
      );
    })
    .sort((a, b) => new Date(b.inspectionDate || b.createdAt || 0) - new Date(a.inspectionDate || a.createdAt || 0));

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                    Log K3 Terintegrasi Supabase
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-300">
                    {apar.assetCode}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                  Riwayat Inspeksi Tabung APAR
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* APAR Quick Info Banner */}
          <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-300">
                {apar.assetCode}
              </span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Rig: {apar.rigCode}
              </span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Lokasi: {apar.placement}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCertViewerOpen(true)}
                title="Buka Dokumen Sertifikat & Riwayat Hydrotest"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Lihat Sertifikat Hydrotest</span>
              </button>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  apar.status === 'layak'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {apar.status === 'layak' ? 'Layak Pakai' : 'Perlu Perbaikan'}
              </span>
            </div>
          </div>

          {/* Inspection Records List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {relatedInspections.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                <ClipboardList className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                <h3 className="text-sm font-bold text-slate-800">Belum Ada Riwayat Inspeksi</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tabung APAR ini belum pernah diinspeksi oleh personil HFO lapangan.
                </p>
              </div>
            ) : (
              relatedInspections.map((insp, index) => {
                const isLayak = insp.overallStatus === 'layak';
                const checklist = insp.checklist || {};

                return (
                  <div
                    key={insp.id || index}
                    className={`p-5 rounded-2xl border bg-white shadow-xs transition hover:shadow-md space-y-3.5 ${
                      isLayak ? 'border-slate-200' : 'border-rose-300 bg-rose-50/20'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                            isLayak
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isLayak ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{isLayak ? 'Hasil: Layak Pakai' : 'Hasil: Tidak Layak'}</span>
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatHseDate(insp.inspectionDate || insp.createdAt)}
                        </span>
                      </div>

                      {/* Petugas HFO */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400">Petugas HFO:</span>
                        <strong className="text-slate-900 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          {insp.inspectorName || 'HFO Lapangan'}
                        </strong>
                      </div>
                    </div>

                    {/* Content Grid: Checklist + Photo Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Checklist Components */}
                      <div className="md:col-span-2 space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Checklist Komponen K3:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {[
                            { key: 'handle', label: 'Handle / Tuas' },
                            { key: 'hose', label: 'Hose / Selang' },
                            { key: 'nozzle', label: 'Nozzle' },
                            { key: 'cylinder', label: 'Tabung Fisik' },
                            { key: 'pinHandle', label: 'Pin & Segel' },
                            { key: 'pressureGauge', label: 'Pressure Gauge' },
                            { key: 'cylinderGuard', label: 'Pengaman Dinding' },
                          ].map(comp => {
                            const val = checklist[comp.key] || 'bagus';
                            const isDamaged = val === 'rusak';
                            const isNa = val === 'na';

                            return (
                              <div
                                key={comp.key}
                                className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between ${
                                  isDamaged
                                    ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                                    : isNa
                                    ? 'bg-slate-50 border-slate-200 text-slate-400'
                                    : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                                }`}
                              >
                                <span className="truncate">{comp.label}</span>
                                <span className="uppercase text-[9px] font-mono ml-1 font-bold">
                                  {isDamaged ? 'RUSAK' : isNa ? 'N/A' : 'OK'}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Catatan / Temuan */}
                        {insp.notes && (
                          <div className="pt-1.5">
                            <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Catatan HFO:</span>
                            <p className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 text-xs">
                              {insp.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Preview Foto Inspeksi (inspection_photo) */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Foto Inspeksi Lapangan:
                        </span>
                        {insp.inspectionPhoto ? (
                          <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-900 aspect-video flex items-center justify-center group">
                            <img
                              src={insp.inspectionPhoto}
                              alt="Foto Inspeksi"
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                            <button
                              type="button"
                              onClick={() => setZoomImage({ src: insp.inspectionPhoto, title: `Foto Inspeksi ${apar.assetCode} — ${insp.inspectorName}` })}
                              className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 font-semibold text-xs cursor-pointer"
                            >
                              <ZoomIn className="w-4 h-4" />
                              <span>Perbesar</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-100 border border-dashed border-slate-300 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[90px]">
                            <Camera className="w-6 h-6 mb-1 opacity-50 text-slate-400" />
                            <span>Tidak ada foto lampiran</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Total <strong>{relatedInspections.length}</strong> log inspeksi tersimpan di Supabase.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Preview */}
      {zoomImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            <div className="px-4 py-3 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <span className="text-xs font-bold">{zoomImage.title}</span>
              <button
                onClick={() => setZoomImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={zoomImage.src}
                alt={zoomImage.title}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hydrotest Certificate Viewer Modal */}
      {isCertViewerOpen && (
        <HydrotestCertViewerModal
          apar={apar}
          onClose={() => setIsCertViewerOpen(false)}
        />
      )}
    </>
  );
}

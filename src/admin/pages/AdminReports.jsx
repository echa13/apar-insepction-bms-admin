import React, { useState, useMemo } from 'react';
import { useApar } from '../../shared/context/AparContext';
import { getHydrotestStatus, formatHseDate } from '../../shared/utils/hydrotestUtils';
import { exportAparToExcel, exportAparToPdf } from '../utils/exportReportUtils';
import {
  FileSpreadsheet,
  FileText,
  Filter,
  Download,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  ClipboardList,
  UserCheck,
  Calendar,
  Camera,
  ZoomIn,
  Search,
  X
} from 'lucide-react';

export default function AdminReports() {
  const { apars, rigs, inspections } = useApar();

  // Mode Tab: 'apars' (Rekapitulasi Audit APAR) | 'inspections' (Log Riwayat Inspeksi Lapangan)
  const [reportTab, setReportTab] = useState('apars');

  // Filters for APAR Audit
  const [selectedRig, setSelectedRig] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedHydroStatus, setSelectedHydroStatus] = useState('all');

  // Filters for Inspections Log
  const [inspRig, setInspRig] = useState('all');
  const [inspStatus, setInspStatus] = useState('all');
  const [inspSearch, setInspSearch] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // 1. Filtered APARs
  const filteredApars = useMemo(() => {
    return apars.filter(a => {
      if (selectedRig !== 'all' && a.rigId !== selectedRig && a.rigCode !== selectedRig) return false;
      if (selectedStatus !== 'all' && a.status !== selectedStatus) return false;
      if (selectedHydroStatus !== 'all') {
        const hydro = getHydrotestStatus(a.nextHydrotestDate, a.manufactureDate);
        if (hydro.key !== selectedHydroStatus) return false;
      }
      return true;
    });
  }, [apars, selectedRig, selectedStatus, selectedHydroStatus]);

  // 2. Filtered Inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter(i => {
      if (inspRig !== 'all' && i.rigId !== inspRig) return false;
      if (inspStatus !== 'all' && i.overallStatus !== inspStatus) return false;
      if (inspSearch.trim()) {
        const q = inspSearch.toLowerCase();
        const matchName = (i.inspectorName || '').toLowerCase().includes(q);
        const matchApar = (i.aparId || '').toLowerCase().includes(q);
        const matchRig = (i.rigId || '').toLowerCase().includes(q);
        if (!matchName && !matchApar && !matchRig) return false;
      }
      return true;
    });
  }, [inspections, inspRig, inspStatus, inspSearch]);

  const stats = {
    total: filteredApars.length,
    layak: filteredApars.filter(a => a.status === 'layak').length,
    rusak: filteredApars.filter(a => a.status === 'rusak').length,
    expiredHydro: filteredApars.filter(a => getHydrotestStatus(a.nextHydrotestDate, a.manufactureDate).key === 'expired').length,
  };

  const handleExcelExport = () => {
    const rigLabel = selectedRig === 'all' ? 'Seluruh Rig Operasional' : selectedRig;
    exportAparToExcel(filteredApars, rigLabel);
  };

  const handlePdfExport = () => {
    const rigLabel = selectedRig === 'all' ? 'Seluruh Rig Operasional' : selectedRig;
    exportAparToPdf(filteredApars, { rig: rigLabel });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laporan Kepatuhan & Audit HSE
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Rekapitulasi data tabung APAR dan log riwayat inspeksi lapangan yang tersinkronisasi live dari Supabase.
          </p>
        </div>

        {reportTab === 'apars' && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExcelExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
            <button
              onClick={handlePdfExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-sm shadow-red-600/20 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Ekspor PDF Siap Cetak</span>
            </button>
          </div>
        )}
      </div>

      {/* Primary Report Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setReportTab('apars')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            reportTab === 'apars'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Rekap Tabung APAR (Audit HSE)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
            {apars.length}
          </span>
        </button>

        <button
          onClick={() => setReportTab('inspections')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            reportTab === 'inspections'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Riwayat Log Inspeksi Lapangan</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
            {inspections.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REKAPITULASI TABUNG APAR (AUDIT HSE) */}
      {/* ========================================================================= */}
      {reportTab === 'apars' && (
        <div className="space-y-4">
          {/* Filter Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Filter className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Kriteria Filter Rekapitulasi APAR
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Rig */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Rig Operasional
                </label>
                <select
                  value={selectedRig}
                  onChange={(e) => setSelectedRig(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-medium"
                >
                  <option value="all">Semua 16 Rig Operasional</option>
                  {rigs.map(r => (
                    <option key={r.id} value={r.code}>{r.code} — {r.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Kondisi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kondisi Fisik Tabung
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                >
                  <option value="all">Semua Status (Layak & Rusak)</option>
                  <option value="layak">Hanya Layak Pakai</option>
                  <option value="rusak">Hanya Perlu Perbaikan (Rusak)</option>
                  <option value="afkir">Hanya Tabung Afkir</option>
                </select>
              </div>

              {/* Hydrotest */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Hydrotest (+5 Thn)
                </label>
                <select
                  value={selectedHydroStatus}
                  onChange={(e) => setSelectedHydroStatus(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                >
                  <option value="all">Semua Jadwal Hydrotest</option>
                  <option value="safe">Masa Berlaku Aman</option>
                  <option value="near_due">Segera Jatuh Tempo (&lt;60 hari)</option>
                  <option value="expired">Telah Kadaluarsa</option>
                </select>
              </div>
            </div>

            {/* Summary Pills */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-medium">
                Hasil: <strong className="font-mono text-slate-900">{stats.total}</strong> Tabung
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                Layak: <strong className="font-mono">{stats.layak}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 font-medium">
                Rusak: <strong className="font-mono">{stats.rusak}</strong>
              </div>
              {stats.expiredHydro > 0 && (
                <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-medium">
                  Hydrotest Lewat: <strong className="font-mono">{stats.expiredHydro}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Preview Rekap Data ({filteredApars.length} Baris Siap Diekspor)
              </h2>
              <span className="text-[11px] text-slate-400">
                * Data tersinkronisasi 100% dengan tabel Supabase <code>apars</code>.
              </span>
            </div>

            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">No</th>
                    <th className="px-4 py-2.5">Kode Aset</th>
                    <th className="px-4 py-2.5">Rig</th>
                    <th className="px-4 py-2.5">Tipe Terstandar</th>
                    <th className="px-4 py-2.5">Penempatan</th>
                    <th className="px-4 py-2.5">Jadwal Hydrotest</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Temuan Kerusakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filteredApars.slice(0, 20).map((apar, idx) => (
                    <tr key={apar.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                      <td className="px-4 py-2 font-bold text-slate-900">{apar.assetCode}</td>
                      <td className="px-4 py-2 font-sans font-semibold text-slate-700">{apar.rigCode}</td>
                      <td className="px-4 py-2 font-sans text-slate-800">{apar.typeId?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2 font-sans text-slate-600">{apar.placement}</td>
                      <td className="px-4 py-2 text-emerald-700 font-bold">
                        {formatHseDate(apar.nextHydrotestDate)}
                      </td>
                      <td className="px-4 py-2 font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          apar.status === 'layak' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {apar.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-sans text-rose-600 truncate max-w-[200px]">
                        {apar.issues?.join(', ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RIWAYAT LOG INSPEKSI LAPANGAN (DARI TABEL INSPECTIONS SUPABASE) */}
      {/* ========================================================================= */}
      {reportTab === 'inspections' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search Inspector / APAR */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={inspSearch}
                  onChange={(e) => setInspSearch(e.target.value)}
                  placeholder="Cari nama HFO atau kode APAR..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Filter Rig */}
              <select
                value={inspRig}
                onChange={(e) => setInspRig(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Rig</option>
                {rigs.map(r => (
                  <option key={r.id} value={r.code}>{r.code}</option>
                ))}
              </select>

              {/* Filter Status */}
              <select
                value={inspStatus}
                onChange={(e) => setInspStatus(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="layak">Hasil Layak</option>
                <option value="tidak_layak">Hasil Tidak Layak</option>
              </select>
            </div>

            <div className="text-slate-500 text-xs">
              Menampilkan <strong>{filteredInspections.length}</strong> dari {inspections.length} log
            </div>
          </div>

          {/* Table of Inspections */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-slate-300 font-semibold sticky top-0 z-10 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Tanggal & Kategori</th>
                    <th className="px-4 py-3">Rig & Kode Aset</th>
                    <th className="px-4 py-3">Petugas HFO & Vendor</th>
                    <th className="px-4 py-3">Checklist 7 Titik</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Foto Inspeksi</th>
                    <th className="px-4 py-3">Catatan / Temuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInspections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        Tidak ada catatan inspeksi yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredInspections.slice(0, 50).map((insp, idx) => {
                      const isLayak = insp.overallStatus === 'layak';

                      return (
                        <tr key={insp.id || idx} className="hover:bg-slate-50 transition">
                          {/* Tanggal */}
                          <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">
                              {formatHseDate(insp.inspectionDate || insp.createdAt)}
                            </div>
                            <span className="text-[10px] text-slate-400 capitalize">
                              Kategori: {insp.category || 'bulanan'}
                            </span>
                          </td>

                          {/* Rig & APAR */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                              {insp.aparId}
                            </span>
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              Rig: {insp.rigId}
                            </div>
                          </td>

                          {/* Petugas HFO & Vendor */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                <UserCheck className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  {insp.inspectorName || 'HFO Lapangan'}
                                </span>
                                {insp.thirdPartyVendor && (
                                  <span className="text-[10px] text-slate-400">
                                    {insp.thirdPartyVendor}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Checklist 7 Titik Fisik */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {[
                                { key: 'handle', label: 'Hdl' },
                                { key: 'hose', label: 'Hse' },
                                { key: 'nozzle', label: 'Noz' },
                                { key: 'cylinder', label: 'Tbg' },
                                { key: 'pinHandle', label: 'Pin' },
                                { key: 'pressureGauge', label: 'Gag' },
                                { key: 'cylinderGuard', label: 'Grd' },
                              ].map(comp => {
                                const val = insp.checklist?.[comp.key] || 'bagus';
                                const isDamaged = val === 'rusak';
                                const isNa = val === 'na';

                                return (
                                  <span
                                    key={comp.key}
                                    title={`${comp.label}: ${val.toUpperCase()}`}
                                    className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold ${
                                      isDamaged
                                        ? 'bg-rose-500 text-white'
                                        : isNa
                                        ? 'bg-slate-200 text-slate-500'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {comp.label}
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isLayak
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isLayak ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                              )}
                              <span>{isLayak ? 'Layak' : 'Tidak Layak'}</span>
                            </span>
                          </td>

                          {/* Preview Foto Inspeksi (inspection_photo) */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {insp.inspectionPhoto ? (
                              <button
                                type="button"
                                onClick={() => setLightboxPhoto({
                                  src: insp.inspectionPhoto,
                                  title: `Foto Inspeksi ${insp.aparId} oleh ${insp.inspectorName}`
                                })}
                                className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 relative group flex items-center justify-center bg-slate-900 shadow-2xs hover:border-blue-500 transition cursor-pointer"
                              >
                                <img
                                  src={insp.inspectionPhoto}
                                  alt="Foto Inspeksi"
                                  className="w-full h-full object-cover group-hover:scale-110 transition"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Tidak ada foto
                              </span>
                            )}
                          </td>

                          {/* Catatan / Temuan */}
                          <td className="px-4 py-3 text-slate-700 max-w-[220px]">
                            <p className="truncate text-xs" title={insp.notes || 'Normal'}>
                              {insp.notes || <span className="text-slate-400 italic">Semua checklist normal</span>}
                            </p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            <div className="px-4 py-3 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <span className="text-xs font-bold">{lightboxPhoto.title}</span>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={lightboxPhoto.src}
                alt={lightboxPhoto.title}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

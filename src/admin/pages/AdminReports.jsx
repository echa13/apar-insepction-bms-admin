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
  ShieldCheck
} from 'lucide-react';

export default function AdminReports() {
  const { apars, rigs } = useApar();

  const [selectedRig, setSelectedRig] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedHydroStatus, setSelectedHydroStatus] = useState('all');

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
            Ekspor rekapitulasi data tabung APAR ke spreadsheet Excel bersih (.xlsx) atau dokumen PDF siap audit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExcelExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button
            onClick={handlePdfExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-sm shadow-red-600/20"
          >
            <FileText className="w-4 h-4" />
            <span>Ekspor PDF Siap Cetak</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-slate-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Kriteria Filter Laporan
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

        {/* Live Filter Summary Pills */}
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
            * Kolom telah terstandarisasi bebas dari error <code>#VALUE!</code>.
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
              {filteredApars.slice(0, 15).map((apar, idx) => (
                <tr key={apar.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                  <td className="px-4 py-2 font-bold text-slate-900">{apar.assetCode}</td>
                  <td className="px-4 py-2 font-sans font-semibold text-slate-700">{apar.rigCode}</td>
                  <td className="px-4 py-2 font-sans text-slate-800">{apar.typeId.replace(/_/g, ' ')}</td>
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
  );
}

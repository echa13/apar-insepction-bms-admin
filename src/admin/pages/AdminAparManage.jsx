import React, { useState, useMemo } from 'react';
import { useApar } from '../../shared/context/AparContext';
import { getHydrotestStatus, formatHseDate } from '../../shared/utils/hydrotestUtils';
import AparFormModal from '../components/AparFormModal';
import ExcelImportModal from '../components/ExcelImportModal';
import QrPrintModal from '../components/QrPrintModal';
import {
  Flame,
  Search,
  Filter,
  Plus,
  UploadCloud,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  CalendarPlus,
  Building2,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminAparManage() {
  const { apars, rigs, aparTypes, deleteApar, createManualMaintenance } = useApar();

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingApar, setEditingApar] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRig, setSelectedRig] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCharge, setSelectedCharge] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedHydroStatus, setSelectedHydroStatus] = useState('all');

  // Filtered dataset
  const filteredApars = useMemo(() => {
    return apars.filter((apar) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = apar.assetCode.toLowerCase().includes(q);
        const matchSerial = (apar.serialNo || '').toLowerCase().includes(q);
        const matchPlace = (apar.placement || '').toLowerCase().includes(q);
        const matchBrand = (apar.brand || '').toLowerCase().includes(q);
        if (!matchCode && !matchSerial && !matchPlace && !matchBrand) return false;
      }

      // 2. Rig Filter
      if (selectedRig !== 'all' && apar.rigId !== selectedRig && apar.rigCode !== selectedRig) {
        return false;
      }

      // 3. Type Filter
      if (selectedType !== 'all' && apar.typeId !== selectedType) {
        return false;
      }

      // 4. Charge Filter
      if (selectedCharge !== 'all' && apar.charge !== selectedCharge) {
        return false;
      }

      // 5. Condition Status
      if (selectedStatus !== 'all' && apar.status !== selectedStatus) {
        return false;
      }

      // 6. Hydrotest Status
      if (selectedHydroStatus !== 'all') {
        const hydro = getHydrotestStatus(apar.nextHydrotestDate, apar.manufactureDate);
        if (hydro.key !== selectedHydroStatus) return false;
      }

      return true;
    });
  }, [apars, searchQuery, selectedRig, selectedType, selectedCharge, selectedStatus, selectedHydroStatus]);

  const handleDelete = (apar) => {
    if (window.confirm(`Hapus tabung APAR ${apar.assetCode} dari inventaris?`)) {
      deleteApar(apar.id);
    }
  };

  const handleCreateSchedule = (apar) => {
    const action = window.prompt(`Jadwalkan tindakan untuk ${apar.assetCode}:\nKetik: 'hydrotest' atau 'isi_ulang'`, 'hydrotest');
    if (action && (action === 'hydrotest' || action === 'isi_ulang')) {
      createManualMaintenance(apar.id, `Tindakan terjadwal ${action} sebelum jatuh tempo`, action);
      alert(`Tiket terjadwal ${action} berhasil dibuat di menu Tindak Lanjut.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventaris Master APAR
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Total {apars.length} unit tabung terdata di seluruh 16 Rig operasional BMS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <UploadCloud className="w-4 h-4 text-slate-500" />
            <span>Impor Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Label QR</span>
          </button>

          <button
            onClick={() => { setEditingApar(null); setIsFormModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-md shadow-red-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah APAR Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode aset (APAR-BMS07-001), nomor seri, penempatan, atau merk..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Rig Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Rig
            </label>
            <select
              value={selectedRig}
              onChange={(e) => setSelectedRig(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
            >
              <option value="all">Semua Rig</option>
              {rigs.map(r => (
                <option key={r.id} value={r.code}>{r.code}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tipe APAR
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Semua Tipe</option>
              {aparTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Condition Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Kondisi Fisik
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
            >
              <option value="all">Semua Status</option>
              <option value="layak">Layak Pakai</option>
              <option value="rusak">Perlu Perbaikan</option>
              <option value="afkir">Afkir</option>
            </select>
          </div>

          {/* Hydrotest Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Status Hydrotest
            </label>
            <select
              value={selectedHydroStatus}
              onChange={(e) => setSelectedHydroStatus(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Semua Jadwal</option>
              <option value="safe">Aman</option>
              <option value="near_due">Segera (&lt;60 hari)</option>
              <option value="expired">Kadaluarsa</option>
              <option value="unknown">Belum Ada Data</option>
            </select>
          </div>

          {/* Charge Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Charge
            </label>
            <select
              value={selectedCharge}
              onChange={(e) => setSelectedCharge(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
            >
              <option value="all">BMS & APM</option>
              <option value="BMS">BMS</option>
              <option value="APM">APM</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Menampilkan <strong className="text-slate-900 font-mono">{filteredApars.length}</strong> dari {apars.length} tabung</span>
          {(searchQuery || selectedRig !== 'all' || selectedType !== 'all' || selectedStatus !== 'all' || selectedHydroStatus !== 'all' || selectedCharge !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRig('all');
                setSelectedType('all');
                setSelectedStatus('all');
                setSelectedHydroStatus('all');
                setSelectedCharge('all');
              }}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Dense Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/95 backdrop-blur sticky top-0 z-10 text-slate-500 font-semibold border-b border-slate-200 shadow-2xs">
              <tr>
                <th className="px-4 py-3">Kode Aset</th>
                <th className="px-4 py-3">Rig & Lokasi</th>
                <th className="px-4 py-3">Tipe & Merk</th>
                <th className="px-4 py-3">No. Seri</th>
                <th className="px-4 py-3">Charge</th>
                <th className="px-4 py-3">Pembuatan / Hydrotest (+5 Thn)</th>
                <th className="px-4 py-3">Kondisi Fisik</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApars.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Tidak ditemukan data APAR yang cocok dengan kriteria pencarian/filter.
                  </td>
                </tr>
              ) : (
                filteredApars.map((apar) => {
                  const hydroStatus = getHydrotestStatus(apar.nextHydrotestDate, apar.manufactureDate);

                  return (
                    <tr key={apar.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Asset Code */}
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {apar.assetCode}
                        </span>
                      </td>

                      {/* Rig & Placement */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{apar.rigCode}</div>
                        <div className="text-[11px] text-slate-500">{apar.placement}</div>
                      </td>

                      {/* Tipe APAR & Brand */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {apar.typeId.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[11px] text-slate-500">{apar.brand || 'Firex'}</div>
                      </td>

                      {/* Serial No */}
                      <td className="px-4 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                        {apar.serialNo}
                      </td>

                      {/* Charge */}
                      <td className="px-4 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          apar.charge === 'APM' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {apar.charge}
                        </span>
                      </td>

                      {/* Hydrotest Status */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${hydroStatus.dotClass}`} />
                          <span className="font-mono text-slate-900 font-semibold">
                            {formatHseDate(apar.nextHydrotestDate)}
                          </span>
                        </div>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.2 rounded-full border mt-0.5 ${hydroStatus.badgeClass}`}>
                          {hydroStatus.label}
                        </span>
                      </td>

                      {/* Condition Status */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          apar.status === 'layak'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : apar.status === 'rusak'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {apar.status === 'layak' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                          )}
                          <span className="capitalize">{apar.status}</span>
                        </span>
                        {apar.issues?.length > 0 && (
                          <div className="text-[10px] text-rose-600 truncate max-w-[140px] mt-0.5" title={apar.issues.join(', ')}>
                            {apar.issues[0]}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleCreateSchedule(apar)}
                            title="Jadwalkan Hydrotest / Isi Ulang"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditingApar(apar); setIsFormModalOpen(true); }}
                            title="Edit Tabung"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(apar)}
                            title="Hapus dari Database"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isFormModalOpen && (
        <AparFormModal
          apar={editingApar}
          onClose={() => { setIsFormModalOpen(false); setEditingApar(null); }}
        />
      )}

      {isImportModalOpen && (
        <ExcelImportModal
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {isQrModalOpen && (
        <QrPrintModal
          onClose={() => setIsQrModalOpen(false)}
        />
      )}
    </div>
  );
}

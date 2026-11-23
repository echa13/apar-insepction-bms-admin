import React, { useState, useEffect } from 'react';
import { useApar } from '../../shared/context/AparContext';
import { calculateNextHydrotestDate, formatHseDate } from '../../shared/utils/hydrotestUtils';
import { X, Flame, Calendar, Save, CheckCircle2 } from 'lucide-react';

export default function AparFormModal({ apar, onClose }) {
  const { rigs, aparTypes, addApar, updateApar } = useApar();
  const isEditing = Boolean(apar);

  const [formData, setFormData] = useState({
    rigId: apar?.rigId || rigs[0]?.id || 'BMS-02',
    assetCode: apar?.assetCode || '',
    serialNo: apar?.serialNo || '',
    typeId: apar?.typeId || 'type_powder_9kg',
    brand: apar?.brand || 'Firex (FX-90)',
    placement: apar?.placement || 'Rig Carrier',
    manufactureDate: apar?.manufactureDate || '2024-01-01',
    charge: apar?.charge || 'BMS',
    vendor: apar?.vendor || 'PT Sepakat HSE Solution',
    status: apar?.status || 'layak',
    notes: apar?.notes || '',
  });

  const [components, setComponents] = useState(
    apar?.components || {
      handle: 'bagus',
      hose: 'bagus',
      nozle: 'bagus',
      pengamanTabung: 'bagus',
      pinHandle: 'bagus',
      pressureGauge: 'bagus',
      tabung: 'bagus',
    }
  );

  // Jika tipe CO2, matikan pressure gauge menjadi 'na'
  useEffect(() => {
    if (formData.typeId === 'type_co2' || formData.typeId === 'co2_cylinder') {
      setComponents(prev => ({ ...prev, pressureGauge: 'na' }));
    } else if (components.pressureGauge === 'na') {
      setComponents(prev => ({ ...prev, pressureGauge: 'bagus' }));
    }
  }, [formData.typeId]);

  const calculatedNextHydrotest = calculateNextHydrotestDate(formData.manufactureDate);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Deteksi jika ada komponen yang rusak
    const isCo2 = formData.typeId === 'type_co2' || formData.typeId === 'co2_cylinder';
    const hasDamagedComp = Object.entries(components).some(([k, v]) => k !== 'pressureGauge' && v === 'rusak') ||
      (!isCo2 && components.pressureGauge === 'rusak');

    const issues = [];
    if (components.handle === 'rusak') issues.push('Handle Rusak');
    if (components.hose === 'rusak') issues.push('Hose Rusak');
    if (components.nozle === 'rusak') issues.push('Nozzle Rusak');
    if (components.pengamanTabung === 'rusak') issues.push('Pengaman Tabung Rusak');
    if (components.pinHandle === 'rusak') issues.push('Pin Handle Rusak');
    if (components.pressureGauge === 'rusak') issues.push('Pressure Gauge Rusak');
    if (components.tabung === 'rusak') issues.push('Tabung Rusak / Keropos');

    const statusFinal = formData.status === 'afkir' ? 'afkir' : (hasDamagedComp ? 'rusak' : 'layak');

    const payload = {
      ...formData,
      components,
      issues,
      status: statusFinal
    };

    if (isEditing) {
      updateApar(apar.id, payload);
    } else {
      addApar(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? `Edit Tabung APAR — ${apar.assetCode}` : 'Tambah Unit APAR Baru'}
              </h2>
              <p className="text-xs text-slate-400">
                Data master terstandarisasi untuk 16 Rig Operasional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rig */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Rig Operasional *
              </label>
              <select
                value={formData.rigId}
                onChange={(e) => setFormData({ ...formData, rigId: e.target.value })}
                className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                required
              >
                {rigs.map(r => (
                  <option key={r.id} value={r.id}>{r.code} — {r.name}</option>
                ))}
              </select>
            </div>

            {/* Asset Code (Optional manual override) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kode Aset (Auto jika kosong)
              </label>
              <input
                type="text"
                value={formData.assetCode}
                onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                placeholder="Contoh: APAR-BMS07-001"
                className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Tipe APAR (7 Master Types) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipe APAR Terstandar *
              </label>
              <select
                value={formData.typeId}
                onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                {aparTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.capacity})</option>
                ))}
              </select>
            </div>

            {/* Serial No */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Seri Tabung (Serial No) *
              </label>
              <input
                type="text"
                value={formData.serialNo}
                onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                placeholder="Contoh: 000340 / OA 120035"
                className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Brand / Merk */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Merk / Brand Tabung
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Firex / Viking / Champion / Tonata"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Penempatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lokasi Penempatan Fisik *
              </label>
              <input
                type="text"
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                placeholder="Contoh: Rig Carrier, Mud Pump, Fire Box"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Tahun / Tgl Pembuatan APAR */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Pembuatan Tabung
              </label>
              <input
                type="date"
                value={formData.manufactureDate || ''}
                onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Auto Calculated Hydrotest */}
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Jadwal Hydrotest (+5 Tahun)
              </span>
              <span className="text-sm font-mono font-bold text-emerald-700 mt-1">
                {formatHseDate(calculatedNextHydrotest) || 'Belum dihitung'}
              </span>
              <span className="text-[10px] text-emerald-600">
                Otomatis dihitung 5 tahun dari tanggal pembuatan.
              </span>
            </div>

            {/* Charge */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Charge
              </label>
              <select
                value={formData.charge}
                onChange={(e) => setFormData({ ...formData, charge: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              >
                <option value="BMS">BMS (Internal)</option>
                <option value="APM">APM (Asset Owner)</option>
              </select>
            </div>

            {/* Status Tabung */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status Operasional
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
              >
                <option value="layak">Layak Pakai (Siap Operasi)</option>
                <option value="rusak">Perlu Perbaikan (Rusak)</option>
                <option value="afkir">Afkir (Tidak Layak Permanen / Scrap)</option>
              </select>
            </div>
          </div>

          {/* 7 Komponen Fisik */}
          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Kondisi 7 Komponen Fisik (K3 Standard Checklist)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {['handle', 'hose', 'nozle', 'pengamanTabung', 'pinHandle', 'tabung'].map((comp) => (
                <div key={comp} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-semibold text-slate-600 capitalize block mb-1">
                    {comp.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <select
                    value={components[comp] || 'bagus'}
                    onChange={(e) => setComponents({ ...components, [comp]: e.target.value })}
                    className="w-full text-xs p-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="bagus">Bagus</option>
                    <option value="rusak">Rusak</option>
                  </select>
                </div>
              ))}

              {/* Pressure Gauge */}
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Pressure Gauge
                </span>
                {formData.typeId === 'type_co2' || formData.typeId === 'co2_cylinder' ? (
                  <span className="text-xs font-mono font-bold text-slate-500 py-1 px-2 bg-slate-200 rounded block text-center">
                    N/A (CO2)
                  </span>
                ) : (
                  <select
                    value={components.pressureGauge || 'bagus'}
                    onChange={(e) => setComponents({ ...components, pressureGauge: e.target.value })}
                    className="w-full text-xs p-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="bagus">Bagus (Hijau)</option>
                    <option value="rusak">Rusak (Merah/Low)</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-md shadow-red-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambahkan APAR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

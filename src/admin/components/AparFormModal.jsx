import React, { useState, useEffect } from 'react';
import { useApar } from '../../shared/context/AparContext';
import { calculateNextHydrotestDate, formatHseDate } from '../../shared/utils/hydrotestUtils';
import { X, Flame, Calendar, Save, CheckCircle2, AlertTriangle, RefreshCw, ArrowRightLeft } from 'lucide-react';

export default function AparFormModal({ apar, onClose }) {
  const { rigs, aparTypes, apars, addApar, updateApar } = useApar();
  const isEditing = Boolean(apar);

  const generateAssetCode = (targetRigId) => {
    const selectedRigObj = rigs.find(r => r.id === targetRigId || r.code === targetRigId);
    const rigCodeClean = (selectedRigObj?.code || targetRigId || 'BMS02').replace(/[^a-zA-Z0-9]/g, '');
    const countInRig = apars.filter(a => a.rigId === targetRigId || a.rigCode === selectedRigObj?.code).length + 1;
    return `APAR-${rigCodeClean}-${String(countInRig).padStart(3, '0')}`;
  };

  const initialRigId = apar?.rigId || rigs[0]?.id || 'BMS-02';
  const [manualCodeEdited, setManualCodeEdited] = useState(isEditing);

  const [formData, setFormData] = useState({
    rigId: initialRigId,
    assetCode: apar?.assetCode || generateAssetCode(initialRigId),
    serialNo: apar?.serialNo || '',
    typeId: apar?.typeId || 'type_powder_9kg',
    brand: apar?.brand || apar?.brand_model || 'Firex (FX-90)',
    placement: apar?.placement || 'Rig Carrier',
    manufactureDate: apar?.manufactureDate || '2024-01-01',
    charge: apar?.charge || apar?.charge_owner || 'BMS',
    vendor: apar?.vendor || 'PT Sepakat HSE Solution',
    status: apar?.status === 'rusak' ? 'perlu_perbaikan' : (apar?.status || 'layak'),
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

  const handleRigChange = (newRigId) => {
    if (!isEditing && !manualCodeEdited) {
      setFormData(prev => ({
        ...prev,
        rigId: newRigId,
        assetCode: generateAssetCode(newRigId)
      }));
    } else {
      setFormData(prev => ({ ...prev, rigId: newRigId }));
    }
  };

  const handleRegenerateCode = () => {
    const code = generateAssetCode(formData.rigId);
    setFormData(prev => ({ ...prev, assetCode: code }));
    setManualCodeEdited(false);
  };

  const calculatedNextHydrotest = calculateNextHydrotestDate(formData.manufactureDate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
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

    // Tentukan status akhir
    let statusFinal = formData.status;
    if (statusFinal !== 'afkir') {
      if (hasDamagedComp) {
        statusFinal = 'perlu_perbaikan';
      }
    }

    const payload = {
      ...formData,
      components,
      issues,
      status: statusFinal
    };

    try {
      setIsSubmitting(true);
      if (isEditing) {
        await updateApar(apar.id, payload);
      } else {
        await addApar(payload);
      }
      onClose();
    } catch {
      // Error handled with Alert in AparContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSelectedRig = rigs.find(r => r.id === formData.rigId || r.code === formData.rigId);
  const isRigMoving = isEditing && apar && apar.rigId !== formData.rigId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-xs">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {isEditing ? `Edit Master APAR — ${apar.assetCode}` : 'Tambah Master APAR Baru'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Data master tersinkronisasi 100% real-time dengan aplikasi User & Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Rig Operasional */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Rig Operasional (16 Rig) *
              </label>
              <select
                value={formData.rigId}
                onChange={(e) => handleRigChange(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                required
              >
                {rigs.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.name}
                  </option>
                ))}
              </select>

              {/* Notifikasi Pindah Rig */}
              {isRigMoving && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-800 flex items-start gap-1.5 animate-in fade-in">
                  <ArrowRightLeft className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pindah Rig:</strong> APAR dipindahkan dari <strong>{apar.rigCode}</strong> ke <strong>{currentSelectedRig?.code}</strong>. Akan otomatis muncul di HP User Rig baru dan hilang dari Rig lama.
                  </span>
                </div>
              )}
            </div>

            {/* Kode Aset */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kode Aset APAR *
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800"
                    title="Buat ulang kode aset berdasarkan Rig terpilih"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-Code</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={formData.assetCode}
                onChange={(e) => {
                  setManualCodeEdited(true);
                  setFormData({ ...formData, assetCode: e.target.value });
                }}
                placeholder="Contoh: APAR-BMS07-001"
                className="w-full text-xs font-mono font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 uppercase"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Format baku: APAR-[RIG]-[NOMOR]
              </span>
            </div>

            {/* Tipe APAR (7 Master Types) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipe APAR (7 Master Types) *
              </label>
              <select
                value={formData.typeId}
                onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                {aparTypes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.capacity})
                  </option>
                ))}
              </select>
            </div>

            {/* Nomor Seri */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Seri Tabung (Serial No) *
              </label>
              <input
                type="text"
                value={formData.serialNo}
                onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                placeholder="Contoh: 000340 / OA 120035 / -"
                className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Brand / Model */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Merk / Model Tabung
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Contoh: Firex FX-90 / Viking / Tonata"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Lokasi Penempatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lokasi Penempatan Fisik *
              </label>
              <input
                type="text"
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                placeholder="Contoh: Rig Carrier, Mud Pump #1, Generator Room"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Charge Owner (BMS / APM) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Charge Owner *
              </label>
              <select
                value={formData.charge}
                onChange={(e) => setFormData({ ...formData, charge: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold"
              >
                <option value="BMS">BMS (Internal PT Besmindo)</option>
                <option value="APM">APM (Asset Owner PT APM)</option>
              </select>
            </div>

            {/* Status Operasional */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status Operasional *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
              >
                <option value="layak">Layak Pakai (Siap Operasi)</option>
                <option value="perlu_perbaikan">Perlu Perbaikan (Kerusakan Fisik)</option>
                <option value="afkir">Afkir (Tidak Layak Permanen / Scrap)</option>
              </select>
            </div>

            {/* Tanggal Pembuatan Tabung */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Pembuatan Tabung
              </label>
              <input
                type="date"
                value={formData.manufactureDate || ''}
                onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Auto Calculated Hydrotest (+5 Tahun) */}
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Jadwal Uji Tekan (Hydrotest +5 Tahun)
              </span>
              <span className="text-sm font-mono font-black text-emerald-700 mt-0.5">
                {formatHseDate(calculatedNextHydrotest) || 'Belum dihitung'}
              </span>
              <span className="text-[10px] text-emerald-600">
                Otomatis dihitung 5 tahun dari tanggal pembuatan tabung.
              </span>
            </div>

          </div>

          {/* 7 Komponen Fisik */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Kondisi 7 Komponen Fisik (K3 Checklist)
              </h3>
              <span className="text-[10px] text-slate-400">
                * Jika ada komponen rusak, status otomatis menjadi Perlu Perbaikan
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {['handle', 'hose', 'nozle', 'pengamanTabung', 'pinHandle', 'tabung'].map((comp) => (
                <div key={comp} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-semibold text-slate-600 capitalize block mb-1">
                    {comp.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <select
                    value={components[comp] || 'bagus'}
                    onChange={(e) => setComponents({ ...components, [comp]: e.target.value })}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="bagus">Bagus</option>
                    <option value="rusak">Rusak</option>
                  </select>
                </div>
              ))}

              {/* Pressure Gauge */}
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Pressure Gauge
                </span>
                {formData.typeId === 'type_co2' || formData.typeId === 'co2_cylinder' ? (
                  <span className="text-xs font-mono font-bold text-slate-500 py-1.5 px-2 bg-slate-200 rounded-lg block text-center">
                    N/A (CO2)
                  </span>
                ) : (
                  <select
                    value={components.pressureGauge || 'bagus'}
                    onChange={(e) => setComponents({ ...components, pressureGauge: e.target.value })}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="bagus">Bagus (Hijau)</option>
                    <option value="rusak">Rusak (Merah/Low)</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-md shadow-red-600/20 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan ke Supabase...' : (isEditing ? 'Simpan Perubahan' : 'Tambahkan APAR')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Building2,
  Save,
  Flame
} from 'lucide-react';
import { formatHseDate } from '../../shared/utils/hydrotestUtils';

export default function UserInspect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apars, recordInspection, currentUser } = useApar();

  const targetApar = apars.find(a => a.id === id);

  const [components, setComponents] = useState(
    targetApar?.components || {
      handle: 'bagus',
      hose: 'bagus',
      nozle: 'bagus',
      pengamanTabung: 'bagus',
      pinHandle: 'bagus',
      pressureGauge: (targetApar?.typeId === 'type_co2' || targetApar?.typeId === 'co2_cylinder') ? 'na' : 'bagus',
      tabung: 'bagus',
    }
  );

  const [issueNotes, setIssueNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!targetApar) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm text-slate-600">APAR tidak ditemukan.</p>
        <button
          onClick={() => navigate('/user/dashboard')}
          className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const isCo2 = targetApar.typeId === 'type_co2' || targetApar.typeId === 'co2_cylinder';

  const handleComponentToggle = (comp, status) => {
    setComponents(prev => ({ ...prev, [comp]: status }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const damagedComps = [];
    if (components.handle === 'rusak') damagedComps.push('Handle Rusak');
    if (components.hose === 'rusak') damagedComps.push('Hose Bocor / Retak');
    if (components.nozle === 'rusak') damagedComps.push('Nozzle Rusak');
    if (components.pengamanTabung === 'rusak') damagedComps.push('Pengaman Tabung Rusak');
    if (components.pinHandle === 'rusak') damagedComps.push('Pin Handle Lepas');
    if (!isCo2 && components.pressureGauge === 'rusak') damagedComps.push('Low Pressure / Jarum Merah');
    if (components.tabung === 'rusak') damagedComps.push('Tabung Keropos / Korosi');

    if (issueNotes.trim() && !damagedComps.includes(issueNotes.trim())) {
      damagedComps.push(issueNotes.trim());
    }

    const defaultInspectionPhoto = damagedComps.length > 0
      ? 'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80';

    recordInspection(targetApar.id, {
      components,
      issues: damagedComps,
      inspectorName: currentUser?.name || 'HFO Lapangan',
      inspectionPhoto: photoUrl.trim() || defaultInspectionPhoto,
      category: 'bulanan',
      thirdPartyVendor: targetApar.vendor || 'PT Sepakat HSE Solution'
    });

    setIsSuccess(true);
    setTimeout(() => {
      navigate('/user/dashboard');
    }, 1500);
  };

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => navigate('/user/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Daftar APAR</span>
      </button>

      {/* Target APAR Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {targetApar.assetCode}
            </span>
            <span className="text-xs font-bold text-slate-700">
              {targetApar.rigCode}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            SN: {targetApar.serialNo}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
          <div>
            <span className="text-[11px] text-slate-400 block">Tipe APAR</span>
            <span className="font-semibold text-slate-800">{targetApar.typeId.replace(/_/g, ' ')}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Penempatan</span>
            <span className="font-semibold text-slate-800">{targetApar.placement}</span>
          </div>
        </div>
      </div>

      {/* Inspection Form */}
      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Inspeksi 7 Komponen Fisik (K3 Checklist)
          </h3>
          <span className="text-[11px] text-slate-400">Pilih status setiap bagian</span>
        </div>

        <div className="space-y-2.5">
          {[
            { id: 'handle', label: '1. Handle & Tuas Operasional' },
            { id: 'hose', label: '2. Hose (Selang Semprot)' },
            { id: 'nozle', label: '3. Nozzle (Corong Pengarah)' },
            { id: 'pengamanTabung', label: '4. Pengaman & Sabuk Tabung' },
            { id: 'pinHandle', label: '5. Pin Pengunci & Segel Handle' },
            { id: 'tabung', label: '6. Kondisi Fisik Tabung (Bebas Karat)' },
          ].map(comp => (
            <div key={comp.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">{comp.label}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleComponentToggle(comp.id, 'bagus')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    components[comp.id] === 'bagus'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Bagus
                </button>
                <button
                  type="button"
                  onClick={() => handleComponentToggle(comp.id, 'rusak')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    components[comp.id] === 'rusak'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Rusak
                </button>
              </div>
            </div>
          ))}

          {/* Component 7: Pressure Gauge */}
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">7. Pressure Gauge (Indikator Tekanan)</span>
            {isCo2 ? (
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-200 px-3 py-1 rounded-lg">
                N/A (Tabung CO2)
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleComponentToggle('pressureGauge', 'bagus')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    components.pressureGauge === 'bagus'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Hijau (Normal)
                </button>
                <button
                  type="button"
                  onClick={() => handleComponentToggle('pressureGauge', 'rusak')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    components.pressureGauge === 'rusak'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Merah (Low/Over)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Issue Note */}
        <div className="pt-2 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Tambahan Temuan di Lapangan:
            </label>
            <input
              type="text"
              placeholder="Contoh: Selang retak halus, pin segel kendor, atau cat mengelupas..."
              value={issueNotes}
              onChange={(e) => setIssueNotes(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL / Link Foto Fisik Inspeksi (Opsional):
            </label>
            <input
              type="url"
              placeholder="https://... (Foto default terpasang otomatis jika dikosongkan)"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isSuccess ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Hasil inspeksi berhasil disimpan! Tiket otomatis disinkronkan ke Admin.</span>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Hasil Inspeksi Rutin</span>
          </button>
        )}
      </form>
    </div>
  );
}

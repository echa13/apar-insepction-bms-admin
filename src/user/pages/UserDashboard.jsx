import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import { formatHseDate } from '../../shared/utils/hydrotestUtils';
import {
  QrCode,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Building2,
  MapPin,
  Wrench,
  Camera
} from 'lucide-react';

export default function UserDashboard() {
  const { apars, rigs, currentUser, maintenances } = useApar();
  const navigate = useNavigate();

  const userRig = rigs.find(r => r.id === currentUser.rigId) || rigs[0];
  const rigApars = apars.filter(a => a.rigId === userRig?.id || a.rigCode === userRig?.code);

  const [searchQuery, setSearchQuery] = useState('');
  const [qrInput, setQrInput] = useState('');

  const filteredApars = rigApars.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return a.assetCode.toLowerCase().includes(q) || (a.placement || '').toLowerCase().includes(q) || (a.serialNo || '').toLowerCase().includes(q);
  });

  const inProgressTickets = maintenances.filter(m =>
    (m.rigId === userRig?.id || m.rigCode === userRig?.code) && m.status === 'in_progress'
  );

  const handleSimulateScan = (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    const matched = rigApars.find(a => a.assetCode.toLowerCase() === qrInput.trim().toLowerCase());
    if (matched) {
      navigate(`/user/inspect/${matched.id}`);
    } else {
      alert(`Kode APAR "${qrInput}" tidak ditemukan di ${userRig.code}. Silakan coba kode seperti "${rigApars[0]?.assetCode}".`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Banner if Tickets need evidence upload */}
      {inProgressTickets.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Ada {inProgressTickets.length} Perbaikan Sedang Berjalan
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Segera unggah foto bukti setelah teknisi menyelesaikan perbaikan fisik.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/user/maintenances')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition shrink-0"
          >
            Upload Bukti
          </button>
        </div>
      )}

      {/* Rig Header Card & QR Scanner Simulator */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              {userRig.name} ({userRig.code})
            </h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {rigApars.length} Unit APAR
          </span>
        </div>

        {/* QR Simulation Box */}
        <form onSubmit={handleSimulateScan} className="flex gap-2">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Ketik / Scan Kode Aset (Contoh: ${rigApars[0]?.assetCode || 'APAR-BMS07-001'})...`}
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition shadow-xs shrink-0"
          >
            Inspeksi
          </button>
        </form>
      </div>

      {/* APAR List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Daftar Tabung APAR di Unit Rig Ini
          </h3>
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredApars.map((apar) => (
            <div
              key={apar.id}
              onClick={() => navigate(`/user/inspect/${apar.id}`)}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {apar.assetCode}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                    apar.status === 'layak' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {apar.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 truncate">
                  {apar.typeId.replace(/_/g, ' ')}
                </h4>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {apar.placement}
                </p>
              </div>

              <div className="shrink-0 text-slate-400">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApar } from '../context/AparContext';
import { ShieldCheck, Flame, HardHat, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'user'
  const [selectedRigId, setSelectedRigId] = useState('BMS-02');
  const { rigs, loginAs } = useApar();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (activeTab === 'admin') {
      loginAs('admin', 'all');
      navigate('/admin/dashboard');
    } else {
      loginAs('user', selectedRigId);
      navigate('/user/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-red-500 selection:text-white">
      {/* Background Subtle Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Glow highlight */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                PT Besmindo Muda Sarana
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-1">
              APAR Inspection & Tracking
            </h1>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-xl border border-slate-750 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'admin'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Admin HSE Pusat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('user')}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'user'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardHat className="w-4 h-4" />
            Inspector Lapangan
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="space-y-4">
          {activeTab === 'admin' ? (
            <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-700/60">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Akses Penuh Seluruh 16 Rig</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Memantau kepatuhan inspeksi, manajemen QR code, verifikasi bukti perbaikan, dan ekspor laporan audit HSE.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Peran: <strong className="text-slate-200">HSE Superintendent</strong></span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Siap Masuk
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Pilih Rig Operasional
                </label>
                <select
                  value={selectedRigId}
                  onChange={(e) => setSelectedRigId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                >
                  {rigs.map(rig => (
                    <option key={rig.id} value={rig.id}>
                      {rig.code} — {rig.location || rig.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-400">
                Mode mobile-friendly untuk scan QR APAR di unit rig dan upload temuan perbaikan fisik.
              </p>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg mt-2 ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
            }`}
          >
            <span>Masuk ke {activeTab === 'admin' ? 'Dashboard HSE Admin' : 'Portal Rig'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-750/70 text-center">
          <p className="text-[11px] text-slate-400">
            Sistem K3 Terintegrasi — PT Besmindo Muda Sarana &copy; 2025
          </p>
        </div>
      </div>
    </div>
  );
}

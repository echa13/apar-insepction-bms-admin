import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import {
  Flame,
  QrCode,
  Wrench,
  LogOut,
  Building2,
  HardHat,
  ShieldCheck
} from 'lucide-react';

export default function UserLayout() {
  const { currentUser, rigs, maintenances, isSupabaseConnected } = useApar();
  const navigate = useNavigate();

  const userRig = rigs.find(r => r.id === currentUser.rigId) || { code: 'BMS-07', name: 'Rig BMS-07' };
  const userTicketsCount = maintenances.filter(m => (m.rigId === currentUser.rigId || m.rigCode === userRig.code) && m.status !== 'closed').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-16 sm:pb-0">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-4 py-3.5 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
                Portal Inspector
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {userRig.code}
              </span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase ${
                isSupabaseConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                {isSupabaseConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              Inspeksi APAR Lapangan
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin HSE</span>
          </button>
          <button
            onClick={() => navigate('/login')}
            title="Keluar"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 py-2 px-4 flex items-center justify-around z-30 shadow-lg">
        <NavLink
          to="/user/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Flame className="w-5 h-5" />
          <span>Daftar APAR</span>
        </NavLink>

        <NavLink
          to="/user/maintenances"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold relative ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Wrench className="w-5 h-5" />
          <span>Perbaikan</span>
          {userTicketsCount > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center">
              {userTicketsCount}
            </span>
          )}
        </NavLink>

        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-red-600"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Ke Admin</span>
        </button>
      </nav>
    </div>
  );
}

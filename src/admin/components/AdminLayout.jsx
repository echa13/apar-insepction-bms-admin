import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import {
  LayoutDashboard,
  Flame,
  Wrench,
  Building2,
  FileSpreadsheet,
  LogOut,
  RotateCcw,
  Menu,
  X,
  ShieldCheck,
  AlertTriangle,
  Smartphone,
  ExternalLink
} from 'lucide-react';

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { maintenances, apars, resetDemoData, currentUser, isSupabaseConnected, supabaseSyncStatus, loadAllFromSupabase } = useApar();
  const navigate = useNavigate();
  const location = useLocation();

  // Hitung tiket aktif yang butuh perhatian admin (open + pending_review)
  const pendingActionsCount = maintenances.filter(m => m.status === 'open' || m.status === 'pending_review').length;
  const pendingReviewCount = maintenances.filter(m => m.status === 'pending_review').length;
  const damagedAparsCount = apars.filter(a => a.status === 'rusak').length;

  const handleReset = () => {
    if (window.confirm('Reset semua data ke sampel awal Excel 2025? Perubahan yang Anda simpan akan dikembalikan.')) {
      resetDemoData();
      alert('Data berhasil di-reset ke kondisi awal.');
    }
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/apars', label: 'Inventaris APAR', icon: Flame, count: apars.length },
    { to: '/admin/maintenances', label: 'Tindak Lanjut', icon: Wrench, badge: pendingActionsCount, badgeType: pendingReviewCount > 0 ? 'review' : 'action' },
    { to: '/admin/rigs', label: 'Data Rig (16+)', icon: Building2 },
    { to: '/admin/reports', label: 'Laporan & Export', icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      {/* Mobile Topbar */}
      <div className="lg:hidden bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 z-30 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-md shadow-red-600/30">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight">HSE Admin Panel</h1>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase ${
                isSupabaseConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                {isSupabaseConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">PT Besmindo Muda Sarana</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
          title="Menu Tambahan"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#0F172A] text-slate-300 flex flex-col z-40 transition-transform duration-200 ease-in-out border-r border-slate-800 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-red-400">
                Pusat Kendali K3
              </span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase ${
                isSupabaseConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                {isSupabaseConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight truncate">
              HSE Admin Panel
            </h2>
            <p className="text-[11px] text-slate-400 truncate">16 Rig Operasional</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-600/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      item.badgeType === 'review'
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-amber-500 text-slate-950 font-black'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && !item.badge && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {item.count}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Akses Cepat Pengujian
            </div>
            <NavLink
              to="/user/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-blue-300 hover:bg-blue-950/30 transition-colors border border-dashed border-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Simulasi Mode User</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </NavLink>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          {/* Active Admin Info */}
          <div className="px-3 py-2 rounded-lg bg-slate-800/50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
              HA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>

          {/* Reset Demo Data & Logout */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={handleReset}
              title="Reset ke Data Mentah Excel 2025"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              title="Keluar dari Panel Admin"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 flex flex-col min-w-0 pb-24 lg:pb-6">
        {/* Desktop Sticky Header Stats Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Sistem Tracking & Inspeksi APAR
            </span>
            <h2 className="text-sm font-bold text-slate-800 capitalize">
              {location.pathname.replace('/admin/', '').replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Supabase Connection Status Pill (Live / Offline) */}
            {isSupabaseConnected ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase Live</span>
              </div>
            ) : (
              <button
                onClick={() => loadAllFromSupabase(true)}
                title="Klik untuk menyinkronkan ulang dengan database Supabase"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Supabase Offline (Klik Sync)</span>
              </button>
            )}

            {pendingReviewCount > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{pendingReviewCount} Foto Bukti Menunggu Verifikasi Admin</span>
              </div>
            )}
            {damagedAparsCount > 0 && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{damagedAparsCount} APAR Rusak Perlu Tindakan</span>
              </div>
            )}
          </div>
        </header>

        {/* Page View Outlet */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0F172A] border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {/* 1. Dashboard */}
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 flex-1 transition-colors ${
              isActive ? 'text-[#EF4444] font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </NavLink>

        {/* 2. Unit APAR */}
        <NavLink
          to="/admin/apars"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 flex-1 transition-colors ${
              isActive ? 'text-[#EF4444] font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Flame className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Unit APAR</span>
        </NavLink>

        {/* 3. Perbaikan (Tengah, Tombol Menonjol Elevated) */}
        <div className="flex-1 flex justify-center">
          <NavLink
            to="/admin/maintenances"
            className={({ isActive }) =>
              `relative -mt-6 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 ${
                isActive
                  ? 'bg-[#DC2626] text-white shadow-red-600/40 ring-4 ring-[#0F172A]'
                  : 'bg-[#DC2626] text-white shadow-red-600/30 hover:bg-red-700 ring-4 ring-[#0F172A]'
              }`
            }
          >
            <Wrench className="w-6 h-6" />
            <span className="text-[9px] font-bold mt-0.5 leading-none">Perbaikan</span>
            {pendingActionsCount > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-[#0F172A] ${
                pendingReviewCount > 0
                  ? 'bg-blue-500 text-white animate-pulse'
                  : 'bg-amber-400 text-slate-950'
              }`}>
                {pendingActionsCount}
              </span>
            )}
          </NavLink>
        </div>

        {/* 4. Data Rig */}
        <NavLink
          to="/admin/rigs"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 flex-1 transition-colors ${
              isActive ? 'text-[#EF4444] font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Data Rig</span>
        </NavLink>

        {/* 5. Laporan */}
        <NavLink
          to="/admin/reports"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 flex-1 transition-colors ${
              isActive ? 'text-[#EF4444] font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <FileSpreadsheet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Laporan</span>
        </NavLink>
      </nav>
    </div>
  );
}

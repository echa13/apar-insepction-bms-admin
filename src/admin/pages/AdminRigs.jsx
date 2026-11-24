import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import {
  Building2,
  Plus,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  X,
  Power,
  Users,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { confirmActionAlert } from '../../shared/utils/alertUtils';

export default function AdminRigs() {
  const { rigs, apars, addRig, toggleRigStatus, hfoUsers, resetHfoPassword } = useApar();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRig, setNewRig] = useState({ code: '', name: '', location: '' });
  const [showPasswords, setShowPasswords] = useState({});
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [togglingId, setTogglingId] = useState(null);

  const activeCount = rigs.filter(r => r.status === 'active' || r.status === 'aktif').length;
  const inactiveCount = rigs.filter(r => r.status === 'inactive' || r.status === 'nonaktif').length;
  const totalCount = rigs.length;

  const filteredRigs = rigs.filter(rig => {
    const isActive = rig.status === 'active' || rig.status === 'aktif';
    if (statusFilter === 'active') return isActive;
    if (statusFilter === 'inactive') return !isActive;
    return true;
  });

  const handleCreateRig = async (e) => {
    e.preventDefault();
    if (!newRig.code.trim()) return;
    await addRig(newRig.code, newRig.name, newRig.location);
    setNewRig({ code: '', name: '', location: '' });
    setIsAddModalOpen(false);
  };

  const handleToggleStatus = async (rig) => {
    const isCurrentlyActive = rig.status === 'active' || rig.status === 'aktif';
    const actionText = isCurrentlyActive ? 'Nonaktifkan' : 'Aktifkan';

    const result = await confirmActionAlert({
      title: `${actionText} Rig ${rig.code}?`,
      text: isCurrentlyActive
        ? `Rig ${rig.code} akan ditandai NONAKTIF di Supabase. Petugas HFO tidak akan dapat memilih Rig ini untuk inspeksi baru.`
        : `Rig ${rig.code} akan diaktifkan kembali (status AKTIF) di Supabase dan dapat diinspeksi oleh petugas HFO.`,
      confirmButtonText: `Ya, ${actionText}`,
      confirmButtonColor: isCurrentlyActive ? '#e11d48' : '#059669',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      setTogglingId(rig.id);
      await toggleRigStatus(rig.id);
    } catch (err) {
      console.error('Error toggling rig status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleResetPassword = async (user) => {
    const result = await confirmActionAlert({
      title: 'Reset Password Akun HFO?',
      text: `Password untuk ${user.name} (${user.position || 'HFO'}) akan di-reset kembali ke "123456" di Supabase.`,
      confirmButtonText: 'Ya, Reset Password',
      confirmButtonColor: '#f59e0b'
    });
    if (result.isConfirmed) {
      await resetHfoPassword(user.id, '123456');
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Rig & Master Lokasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau kepatuhan inspeksi, sebaran aset APAR di 16+ Rig Operasional, dan akun HFO Lapangan.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-md shadow-red-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Rig Baru</span>
        </button>
      </div>

      {/* Filter Tabs: Semua, Aktif, Nonaktif */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Semua</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            statusFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
          }`}>
            {totalCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            statusFilter === 'active'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Aktif</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            statusFilter === 'active' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('inactive')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            statusFilter === 'inactive'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span>Nonaktif</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            statusFilter === 'inactive' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
          }`}>
            {inactiveCount}
          </span>
        </button>
      </div>

      {/* Grid of Rigs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRigs.map((rig) => {
          const isRigActive = rig.status === 'active' || rig.status === 'aktif';
          const isTogglingThis = togglingId === rig.id;
          const aparsInRig = apars.filter(a => a.rigId === rig.id || a.rigCode === rig.code);
          const totalInRig = aparsInRig.length;
          const layakInRig = aparsInRig.filter(a => a.status === 'layak').length;
          const rusakInRig = aparsInRig.filter(a => a.status === 'rusak').length;
          const compliancePct = totalInRig > 0 ? Math.round((layakInRig / totalInRig) * 100) : 100;

          return (
            <div
              key={rig.id}
              className={`p-5 rounded-2xl border bg-white shadow-xs transition hover:shadow-md flex flex-col justify-between ${
                !isRigActive ? 'opacity-70 bg-slate-50 border-slate-300' : 'border-slate-200/80'
              }`}
            >
              <div>
                {/* Rig Card Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-800 font-mono">
                      {rig.code.replace('BMS-', '')}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{rig.code}</h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{rig.location || 'Wilayah Operasional'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Tombol Aksi Status Berlabel Jelas: Nonaktifkan / Aktifkan */}
                  {isRigActive ? (
                    <button
                      type="button"
                      disabled={isTogglingThis}
                      onClick={() => handleToggleStatus(rig)}
                      title={`Klik untuk nonaktifkan Rig ${rig.code}`}
                      className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition active:scale-95 disabled:opacity-50"
                    >
                      <Power className="w-3.5 h-3.5 text-rose-600" />
                      <span>{isTogglingThis ? '...' : 'Nonaktifkan'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isTogglingThis}
                      onClick={() => handleToggleStatus(rig)}
                      title={`Klik untuk aktifkan Rig ${rig.code}`}
                      className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition active:scale-95 disabled:opacity-50"
                    >
                      <Power className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isTogglingThis ? '...' : 'Aktifkan'}</span>
                    </button>
                  )}
                </div>

                {/* Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total APAR</span>
                    <span className="font-mono font-bold text-sm text-slate-900">{totalInRig} Unit</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kondisi Rusak</span>
                    <span className={`font-mono font-bold text-sm ${rusakInRig > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {rusakInRig} Unit
                    </span>
                  </div>
                </div>

                {/* Compliance Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Kepatuhan K3</span>
                    <span className="font-mono font-bold text-slate-800">{compliancePct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        compliancePct >= 90 ? 'bg-emerald-500' : compliancePct >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${compliancePct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isRigActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : 'bg-slate-200 text-slate-600 border border-slate-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRigActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {isRigActive ? 'AKTIF' : 'NONAKTIF'}
                </span>

                <button
                  onClick={() => navigate(`/admin/apars`)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  <span>Kelola Tabung</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredRigs.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada Rig dengan status '{statusFilter}'</p>
            <p className="text-xs text-slate-400 mt-1">Pilih tab filter lain untuk melihat daftar Rig operasional.</p>
          </div>
        )}
      </div>

      {/* Tabel Manajemen Akun Petugas HFO Lapangan (hfo_users) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Manajemen Akun Petugas HFO Lapangan (Tabel: <code className="text-blue-600">hfo_users</code>)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola kredensial login petugas inspeksi lapangan dan reset password default <code className="bg-slate-100 px-1 py-0.5 rounded">123456</code>.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {hfoUsers.length} Petugas Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Nama Petugas HFO</th>
                <th className="px-5 py-3">Rig Penempatan</th>
                <th className="px-5 py-3">Jabatan / Posisi</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Password Akun</th>
                <th className="px-5 py-3 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {hfoUsers.map((user) => {
                const assignedRig = rigs.find(r => r.id === user.rigId || r.code === user.rigId) || { code: 'BMS-07' };
                const isPasswordShown = showPasswords[user.id];

                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {user.name}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border">
                        {assignedRig.code}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {user.position || 'HFO Officer'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs">
                        <span>{isPasswordShown ? user.password : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          {isPasswordShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleResetPassword(user)}
                        title="Reset password ke 123456"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Reset ke 123456</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rig Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-sm font-bold">Tambah Rig Operasional Baru</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRig} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Kode Rig *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BMS-22"
                  value={newRig.code}
                  onChange={(e) => setNewRig({ ...newRig, code: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-red-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nama Rig Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rig BMS-22 (Heavy Workover)"
                  value={newRig.name}
                  onChange={(e) => setNewRig({ ...newRig, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Lokasi / Field Area
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Duri Field Steamflood Sector 4"
                  value={newRig.location}
                  onChange={(e) => setNewRig({ ...newRig, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-xs"
                >
                  Simpan Rig Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import {
  Building2,
  ArrowRight,
  MapPin,
  Users,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { confirmActionAlert } from '../../shared/utils/alertUtils';

export default function AdminRigs() {
  const { rigs, apars, hfoUsers, resetHfoPassword } = useApar();
  const navigate = useNavigate();

  const [showPasswords, setShowPasswords] = useState({});

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

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 self-start sm:self-auto shadow-xs">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span><strong className="font-bold text-slate-900">{rigs.length}</strong> Rig Terdaftar</span>
        </div>
      </div>

      {/* Grid of Rigs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rigs.map((rig) => {
          const aparsInRig = apars.filter(a => a.rigId === rig.id || a.rigCode === rig.code);
          const totalInRig = aparsInRig.length;
          const layakInRig = aparsInRig.filter(a => a.status === 'layak').length;
          const rusakInRig = aparsInRig.filter(a => a.status === 'rusak').length;
          const compliancePct = totalInRig > 0 ? Math.round((layakInRig / totalInRig) * 100) : 100;

          return (
            <div
              key={rig.id}
              className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Rig Card Header - Rapih & Proporsional */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center font-bold text-xs text-slate-800 font-mono shrink-0">
                    {rig.code.replace('BMS-', '')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{rig.code}</h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Rig Operasional Aktif" />
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate mt-0.5" title={rig.location || 'Wilayah Operasional'}>
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{rig.location || 'Wilayah Operasional'}</span>
                    </p>
                  </div>
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
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>

                <button
                  onClick={() => navigate(`/admin/apars`)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition"
                >
                  <span>Kelola Tabung</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
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
    </div>
  );
}

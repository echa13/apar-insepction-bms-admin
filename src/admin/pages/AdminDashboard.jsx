import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import { getHydrotestStatus, formatHseDate } from '../../shared/utils/hydrotestUtils';
import MaintenanceVerifyModal from '../components/MaintenanceVerifyModal';
import HydrotestUpdateModal from '../components/HydrotestUpdateModal';
import {
  Flame,
  CheckCircle2,
  AlertOctagon,
  CalendarClock,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Eye,
  Building2,
  Clock,
  ShieldCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const { apars, rigs, maintenances } = useApar();
  const navigate = useNavigate();
  const [selectedVerifyTicket, setSelectedVerifyTicket] = useState(null);
  const [hydroUpdateApar, setHydroUpdateApar] = useState(null);

  // 1. KPI Calculations
  const totalApar = apars.length;
  const layakCount = apars.filter(a => a.status === 'layak').length;
  const layakPct = totalApar > 0 ? Math.round((layakCount / totalApar) * 100) : 100;
  const activeTicketsCount = maintenances.filter(m => m.status !== 'closed').length;

  // Hydrotest due calculation
  const hydrotestAlerts = apars.filter(a => {
    const status = getHydrotestStatus(a.nextHydrotestDate, a.manufactureDate);
    return status.key === 'expired' || status.key === 'near_due' || status.key === 'unknown';
  });

  // 2. Data Grafik Kondisi per Rig (Layak vs Rusak)
  const rigChartData = rigs.map(rig => {
    const aparsInRig = apars.filter(a => a.rigId === rig.id || a.rigCode === rig.code);
    const layak = aparsInRig.filter(a => a.status === 'layak').length;
    const rusak = aparsInRig.filter(a => a.status === 'rusak').length;
    return {
      rigCode: rig.code,
      Layak: layak,
      Rusak: rusak,
      total: aparsInRig.length
    };
  }).filter(r => r.total > 0);

  // 3. Data Komponen Rusak dari Inspeksi
  const componentDamageStats = [
    { name: 'Hose / Selang', count: 0 },
    { name: 'Pressure Gauge', count: 0 },
    { name: 'Tabung Keropos', count: 0 },
    { name: 'Handle & Segel', count: 0 },
    { name: 'Nozzle Retak', count: 0 },
    { name: 'Pengaman Tabung', count: 0 },
  ];

  apars.forEach(apar => {
    if (apar.components) {
      if (apar.components.hose === 'rusak') componentDamageStats[0].count++;
      if (apar.components.pressureGauge === 'rusak') componentDamageStats[1].count++;
      if (apar.components.tabung === 'rusak') componentDamageStats[2].count++;
      if (apar.components.handle === 'rusak' || apar.components.pinHandle === 'rusak') componentDamageStats[3].count++;
      if (apar.components.nozle === 'rusak') componentDamageStats[4].count++;
      if (apar.components.pengamanTabung === 'rusak') componentDamageStats[5].count++;
    }
  });

  // Urutkan komponen paling sering rusak
  componentDamageStats.sort((a, b) => b.count - a.count);

  // 4. Tiket Pending Review (Prioritas Tertinggi Admin)
  const pendingReviewTickets = maintenances.filter(m => m.status === 'pending_review');

  // 5. APAR dengan jadwal Hydrotest paling mendesak
  const upcomingHydrotests = apars
    .filter(a => a.nextHydrotestDate)
    .sort((a, b) => new Date(a.nextHydrotestDate) - new Date(b.nextHydrotestDate))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pusat Kendali APAR — 16 Rig Operasional
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan kesiapan proteksi kebakaran, siklus verifikasi perbaikan K3, dan kepatuhan hydrotest.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/apars')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <span>Buka Inventaris</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/admin/maintenances')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition shadow-md shadow-red-600/20"
          >
            <span>Kelola Tiket Perbaikan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 1: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Aset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Tabung APAR
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Flame className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {totalApar}
            </span>
            <span className="text-xs text-slate-500 font-medium">Unit Terdata</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Tersebar di 16 Rig Operasional
          </p>
        </div>

        {/* Card 2: Kondisi Layak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kondisi Layak Pakai
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">
              {layakPct}%
            </span>
            <span className="text-xs text-slate-500 font-medium font-mono">
              ({layakCount}/{totalApar})
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${layakPct}%` }}
            />
          </div>
        </div>

        {/* Card 3: Tiket Perbaikan Aktif */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tiket Tindak Lanjut
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
              {activeTicketsCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Tiket Berjalan</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {pendingReviewTickets.length} tiket menunggu approval Admin
          </p>
        </div>

        {/* Card 4: Hydrotest Alert */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Perhatian Hydrotest
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 font-mono tracking-tight">
              {hydrotestAlerts.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">Perlu Cek / Uji</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 truncate">
            Jatuh tempo &lt;60 hari / data tanggal belum valid
          </p>
        </div>
      </div>

      {/* Row 2: Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: BarChart Layak vs Rusak per Rig (2 Kolom) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Kondisi APAR per Rig Operasional
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan jumlah unit layak vs rusak berdasarkan inspeksi lapangan terakhir
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-slate-600">Layak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500" />
                <span className="text-slate-600">Rusak</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rigChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="rigCode"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  cursor={{ fill: '#F8FAFC' }}
                />
                <Bar dataKey="Layak" fill="#16A34A" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="Rusak" fill="#E11D48" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Top Komponen Sering Rusak (1 Kolom) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Temuan Komponen Rusak
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi kerusakan dari 7 komponen fisik APAR
            </p>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-center">
            {componentDamageStats.map((item, idx) => {
              const maxCount = Math.max(...componentDamageStats.map(c => c.count), 1);
              const pct = Math.round((item.count / maxCount) * 100);

              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {item.count} kasus
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        item.count > 0 ? 'bg-red-500' : 'bg-slate-300'
                      }`}
                      style={{ width: `${item.count > 0 ? Math.max(pct, 12) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            * Kerusakan selang (hose) dan jarum tekanan rendah (low pressure) mendominasi temuan.
          </div>
        </div>
      </div>

      {/* Row 3: Priority Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Menunggu Verifikasi Admin (pending_review) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <h2 className="text-sm font-bold text-slate-900">
                Menunggu Verifikasi Bukti Foto Admin
              </h2>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {pendingReviewTickets.length} Tiket
            </span>
          </div>

          {pendingReviewTickets.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Semua Bukti Telah Diverifikasi</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tidak ada tiket perbaikan yang menunggu persetujuan Anda saat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviewTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {ticket.assetCode}
                      </span>
                      <span className="text-xs font-semibold text-blue-700">
                        {ticket.rigCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium truncate mt-1">
                      {ticket.issueDescription}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Tindakan: <strong className="capitalize text-slate-700">{ticket.actionType}</strong> oleh {ticket.vendorName}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedVerifyTicket(ticket)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Tinjau Foto</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: Hydrotest Jatuh Tempo Terdekat */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Jadwal Hydrotest Mendatang (+5 Tahun)
            </h2>
            <button
              onClick={() => navigate('/admin/apars')}
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-2.5">
            {upcomingHydrotests.map((apar) => {
              const status = getHydrotestStatus(apar.nextHydrotestDate, apar.manufactureDate);

              return (
                <div
                  key={apar.id}
                  className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {apar.assetCode}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {apar.rigCode} • {apar.placement}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tgl Pembuatan: {apar.manufactureDate || apar.manufactureRaw || '-'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <div className="text-right">
                      <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${status.badgeClass}`}>
                        {status.label}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        Tempo: {formatHseDate(apar.nextHydrotestDate)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHydroUpdateApar(apar)}
                      title="Update Hydrotest Pihak ke-3 (Upload Sertifikat)"
                      className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition shadow-2xs cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Verification Modal Launcher */}
      {selectedVerifyTicket && (
        <MaintenanceVerifyModal
          ticket={selectedVerifyTicket}
          onClose={() => setSelectedVerifyTicket(null)}
        />
      )}

      {/* Hydrotest Update Modal Launcher */}
      {hydroUpdateApar && (
        <HydrotestUpdateModal
          apar={hydroUpdateApar}
          onClose={() => setHydroUpdateApar(null)}
        />
      )}
    </div>
  );
}

/**
 * Utility Perhitungan & Status Uji Tekan (Hydrotest) APAR
 * Sesuai Permenakertrans No. PER.04/MEN/1980 & Standar K3 Migas BMS:
 * Hydrotest dilakukan berkala setiap 5 TAHUN sekali (Bukan +5 Hari seperti bug di rumus Excel!).
 */

/**
 * Menghitung tanggal jatuh tempo hydrotest berikutnya (+5 tahun)
 * @param {string|Date} dateStr - Tanggal pembuatan (manufactureDate) atau uji hydrotest terakhir
 * @returns {string|null} Tanggal ISO YYYY-MM-DD atau null jika tidak valid
 */
export function calculateNextHydrotestDate(dateStr, years = 5) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const nextYear = d.getFullYear() + (Number(years) || 5);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${nextYear}-${month}-${day}`;
}

/**
 * Menghitung selisih hari menuju jatuh tempo hydrotest dari hari ini
 * @param {string} nextHydrotestDateStr - Tanggal jatuh tempo YYYY-MM-DD
 * @returns {number|null} Selisih hari (positif: sisa hari, negatif: sudah lewat)
 */
export function getDaysUntilHydrotest(nextHydrotestDateStr) {
  if (!nextHydrotestDateStr) return null;
  const target = new Date(nextHydrotestDateStr);
  if (isNaN(target.getTime())) return null;

  const now = new Date();
  // Set both to midnight UTC for pure calendar day comparison
  const utc1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const utc2 = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());

  const diffMs = utc2 - utc1;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Mengembalikan objek status visual hydrotest K3
 * @param {string|null} nextHydrotestDateStr 
 * @param {string|null} manufactureDateStr
 * @returns {{ key: string, label: string, badgeClass: string, dotClass: string, daysRemaining: number|null }}
 */
export function getHydrotestStatus(nextHydrotestDateStr, manufactureDateStr) {
  if (!nextHydrotestDateStr && !manufactureDateStr) {
    return {
      key: 'unknown',
      label: 'Belum Ada Data',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
      daysRemaining: null,
    };
  }

  const days = getDaysUntilHydrotest(nextHydrotestDateStr);
  if (days === null) {
    return {
      key: 'unknown',
      label: 'Tanggal Tidak Valid',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
      daysRemaining: null,
    };
  }

  if (days < 0) {
    return {
      key: 'expired',
      label: `Kadaluarsa (${Math.abs(days)} hari lalu)`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-500',
      daysRemaining: days,
    };
  }

  if (days <= 60) {
    return {
      key: 'near_due',
      label: `Segera (${days} hari lagi)`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
      daysRemaining: days,
    };
  }

  return {
    key: 'safe',
    label: `Aman (${days} hari lagi)`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    daysRemaining: days,
  };
}

/**
 * Format tanggal ramah pengguna (contoh: 19 Jun 2028)
 */
export function formatHseDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

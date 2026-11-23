import { rigsSeed } from '../data/rigsSeed.js';
import { aparTypesSeed } from '../data/aparTypesSeed.js';
import { calculateNextHydrotestDate } from './hydrotestUtils.js';

/**
 * Normalisasi Nama / Kode Rig dari Teks Mentah Excel
 * Contoh: "Rig BMS -05" -> "BMS-05", "Rig BMS-07" -> "BMS-07"
 */
export function normalizeRigCode(rawRig) {
  if (!rawRig) return 'BMS-01';
  let clean = String(rawRig).trim();
  // Hapus kata 'Rig' di awal
  clean = clean.replace(/^Rig\s*/i, '');
  // Hilangkan spasi di sekitar tanda minus
  clean = clean.replace(/\s*-\s*/g, '-');
  // Standarkan huruf besar
  clean = clean.toUpperCase();

  // Cocokkan ke daftar Rig master
  const matchedRig = rigsSeed.find(r => r.code === clean);
  if (matchedRig) return matchedRig.code;

  // Normalisasi BMS-5 -> BMS-05 jika ada
  const singleDigitMatch = clean.match(/^BMS-(\d)$/i);
  if (singleDigitMatch) {
    const formatted = `BMS-0${singleDigitMatch[1]}`;
    const matchFormatted = rigsSeed.find(r => r.code === formatted);
    if (matchFormatted) return matchFormatted.code;
  }

  return clean || 'BMS-01';
}

/**
 * Mendapatkan Rig ID dari kode
 */
export function getRigIdFromCode(code) {
  const rig = rigsSeed.find(r => r.code === code);
  if (rig) return rig.id;
  return `rig-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
}

/**
 * Pemetaan 27+ Variasi Teks Tipe APAR Mentah ke 7 Master aparTypes
 */
export function normalizeAparType(rawType) {
  if (!rawType) {
    return {
      typeId: 'dry_powder_9kg',
      brand: 'Standard',
      rawType: 'Tidak Diketahui'
    };
  }

  const str = String(rawType).trim();
  const lower = str.toLowerCase();

  // Deteksi Brand
  let brand = 'Standard';
  if (/firex/i.test(str)) brand = 'Firex';
  else if (/champion|cmp/i.test(str)) brand = 'Champion';
  else if (/viking/i.test(str)) brand = 'Viking';
  else if (/alfrex|afco/i.test(str)) brand = 'Alfrex';
  else if (/tonata/i.test(str)) brand = 'Tonata';

  // 1. Karbon Dioksida (CO2)
  if (/co2|co-alfrex|\bco\b|afco/i.test(lower)) {
    return {
      typeId: 'co2_cylinder',
      brand: brand === 'Standard' ? 'Alfrex' : brand,
      rawType: str
    };
  }

  // 2. Foam (Busa AFFF)
  if (/foam/i.test(lower)) {
    return {
      typeId: 'foam_trolley_100l',
      brand,
      rawType: str
    };
  }

  // 3. Trolley Powder Berkapasitas Besar (150 Lbs / 75 Kg / 150 Found)
  if (/150\s*(found|lbs|dry)|75\s*kg|tonata\s*75|qa15|oa15/i.test(lower)) {
    return {
      typeId: 'powder_trolley_150lbs',
      brand,
      rawType: str
    };
  }

  // 4. Powder 6 Kg
  if (/6\s*kg/i.test(lower)) {
    return {
      typeId: 'dry_powder_6kg',
      brand,
      rawType: str
    };
  }

  // 5. Powder 4 Kg
  if (/4\s*kg/i.test(lower)) {
    return {
      typeId: 'dry_powder_4kg',
      brand,
      rawType: str
    };
  }

  // 6. Powder 3 Kg
  if (/3\s*kg/i.test(lower)) {
    return {
      typeId: 'dry_powder_3kg',
      brand,
      rawType: str
    };
  }

  // 7. Default: Powder 9 Kg ABC (termasuk FIREX FX-90 tanpa penulisan berat)
  return {
    typeId: 'dry_powder_9kg',
    brand,
    rawType: str
  };
}

/**
 * Normalisasi Tanggal Pembuatan / Uji Tekan
 * Menangani teks error Excel (#VALUE!), typo bulan, dan format 2-digit tahun
 */
export function normalizeDate(rawDate) {
  if (!rawDate) return { validDate: null, rawText: '' };

  const str = String(rawDate).trim();

  // Abaikan teks tidak terbaca atau error Excel
  if (/^#value!|tidak\s*terbaca|tidak\s*tebaca|tidak\s*ada|-$/i.test(str)) {
    return { validDate: null, rawText: str };
  }

  // Periksa apakah tahun corrupt (> 2099, misal "Oktober-20224")
  if (/\b202\d{2,}\b/.test(str)) {
    return { validDate: null, rawText: str };
  }

  // Format ISO langsung YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    if (y >= 1990 && y <= 2040) {
      return { validDate: `${y}-${m}-${d}`, rawText: str };
    }
  }

  // Pemetaan bulan bahasa Indonesia & Inggris beserta typo umum di file Excel
  const monthMap = {
    jan: 1, januari: 1, january: 1,
    feb: 2, febb: 2, februari: 2, februarii: 2, february: 2,
    mar: 3, maret: 3, march: 3,
    apr: 4, april: 4,
    mai: 5, mei: 5, may: 5,
    jun: 6, juni: 6, junni: 6, june: 6,
    jul: 7, juli: 7, july: 7, julyy: 7,
    aug: 8, agu: 8, agustus: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    okt: 10, oct: 10, oktober: 10, october: 10,
    nov: 11, november: 11,
    des: 12, dec: 12, desember: 12, december: 12
  };

  // Coba pola gabungan: "1 Sept-2023", "junni-2024", "Oct-21", "3 November--2021", "2024"
  // Bersihkan tanda minus ganda
  const cleaned = str.replace(/--+/g, '-').replace(/\s+/g, ' ');

  // Pola hanya tahun: "2024", "2022"
  if (/^\d{4}$/.test(cleaned)) {
    const yr = parseInt(cleaned, 10);
    if (yr >= 1990 && yr <= 2040) {
      return { validDate: `${yr}-01-01`, rawText: str };
    }
  }

  // Pola teks: Bulan-Tahun (misal: "Oct-21", "junni-2024", "August-24")
  const monthYearMatch = cleaned.match(/^([a-zA-Z]+)[-\s]+(\d{2,4})$/);
  if (monthYearMatch) {
    const mStr = monthYearMatch[1].toLowerCase();
    let yr = parseInt(monthYearMatch[2], 10);
    if (yr < 100) yr = 2000 + yr; // "21" -> 2021

    const mNum = monthMap[mStr];
    if (mNum && yr >= 1990 && yr <= 2040) {
      const mm = String(mNum).padStart(2, '0');
      return { validDate: `${yr}-${mm}-01`, rawText: str };
    }
  }

  // Pola teks: Hari-Bulan-Tahun (misal: "1 Sept-2023", "3 februarii -2024", "1 july 2023")
  const dayMonthYearMatch = cleaned.match(/^(\d{1,2})[-\s]+([a-zA-Z]+)[-\s]+(\d{2,4})$/);
  if (dayMonthYearMatch) {
    const day = parseInt(dayMonthYearMatch[1], 10);
    const mStr = dayMonthYearMatch[2].toLowerCase();
    let yr = parseInt(dayMonthYearMatch[3], 10);
    if (yr < 100) yr = 2000 + yr;

    const mNum = monthMap[mStr];
    if (mNum && yr >= 1990 && yr <= 2040) {
      const mm = String(mNum).padStart(2, '0');
      const dd = String(Math.min(day, 28)).padStart(2, '0');
      return { validDate: `${yr}-${mm}-${dd}`, rawText: str };
    }
  }

  // Coba parse bawaan Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    if (y >= 1990 && y <= 2040) {
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return { validDate: `${y}-${m}-${d}`, rawText: str };
    }
  }

  return { validDate: null, rawText: str };
}

/**
 * Normalisasi Status 7 Komponen Inspeksi Fisik
 */
export function normalizeComponents(row, isCo2) {
  const getCompStatus = (val) => {
    if (!val) return 'bagus';
    const s = String(val).trim().toLowerCase();
    if (s === 'rusak' || s === 'tidak bagus' || s === 'tidak' || s === 'bocor') {
      return 'rusak';
    }
    return 'bagus';
  };

  const components = {
    handle: getCompStatus(row.handle || row.Handle),
    hose: getCompStatus(row.hose || row.Hose),
    nozle: getCompStatus(row.nozle || row.Nozle),
    pengamanTabung: getCompStatus(row.pengamanTabung || row['Pengaman Tabung']),
    pinHandle: getCompStatus(row.pinHandle || row['Pin Handle']),
    pressureGauge: isCo2 ? 'na' : getCompStatus(row.pressureGauge || row['Pressure Gauge']),
    tabung: getCompStatus(row.tabung || row.Tabung),
  };

  const issues = [];
  if (components.handle === 'rusak') issues.push('Handle Rusak');
  if (components.hose === 'rusak') issues.push('Hose Rusak / Bocor');
  if (components.nozle === 'rusak') issues.push('Nozzle Tersumbat / Retak');
  if (components.pengamanTabung === 'rusak') issues.push('Pengaman Tabung Hilang/Rusak');
  if (components.pinHandle === 'rusak') issues.push('Pin Handle Lepas');
  if (components.pressureGauge === 'rusak') issues.push('Pressure Gauge Low / Jarum Merah');
  if (components.tabung === 'rusak') issues.push('Tabung Keropos / Penyok / Karat Parah');

  // Cek kolom Hal Perbaikan
  const halPerbaikan = row.halPerbaikan || row['Hal Perbaikan'];
  if (halPerbaikan && String(halPerbaikan).trim()) {
    const note = String(halPerbaikan).trim();
    if (!issues.includes(note)) issues.push(note);
  }

  return { components, issues };
}

/**
 * Normalisasi Nomor Seri
 */
export function cleanSerialNo(rawSerial) {
  if (!rawSerial) return 'TIDAK TERBACA';
  let s = String(rawSerial).trim();
  // Hilangkan petik satu di awal (trik format text Excel)
  s = s.replace(/^'/, '');
  // Tangani 0.000777 dari bug format floating point Excel
  if (/^0\.0+/.test(s)) {
    s = s.replace('0.', '').replace(/^0+/, (match) => match);
  }
  return s || 'TIDAK TERBACA';
}

/**
 * Normalisasi Seluruh Baris Mentah Menjadi Objek APAR Standar
 */
export function normalizeExcelRow(row, index, currentRigCode) {
  const rawRig = row.rig || row.Rig || currentRigCode;
  const rigCode = normalizeRigCode(rawRig);
  const rigId = getRigIdFromCode(rigCode);

  const rawType = row.type || row.Type;
  const { typeId, brand, rawType: originalType } = normalizeAparType(rawType);
  const isCo2 = typeId === 'co2_cylinder';

  const rawMfg = row.tahunApar || row['Tahun APAR'];
  const { validDate: manufactureDate, rawText: manufactureRaw } = normalizeDate(rawMfg);

  // KOREKSI UTAMA: Hitung Hydrotest +5 TAHUN (bukan +5 hari seperti di rumus Excel `=F2+5`)
  const nextHydrotestDate = calculateNextHydrotestDate(manufactureDate);

  const placement = String(row.penempatan || row.Penempatan || 'Area Operasional Rig').trim();
  const serialNo = cleanSerialNo(row.serialNo || row['Serial No']);
  const charge = String(row.charge || row.Charge || 'BMS').trim().toUpperCase() === 'APM' ? 'APM' : 'BMS';
  const vendor = String(row.pihakKe3 || row['Pihak ke 3'] || row.vendor || 'PT Sepakat HSE Solution').trim();

  const { components, issues } = normalizeComponents(row, isCo2);
  const isDamaged = issues.length > 0;
  const status = isDamaged ? 'rusak' : 'layak';

  // Format kode aset unik terstandar: APAR-BMS07-001
  const cleanRigSuffix = rigCode.replace(/[^a-zA-Z0-9]/g, '');
  const seq = String(index + 1).padStart(3, '0');
  const assetCode = `APAR-${cleanRigSuffix}-${seq}`;
  const id = `apar-${cleanRigSuffix.toLowerCase()}-${seq}`;

  return {
    id,
    assetCode,
    serialNo,
    rigId,
    rigCode,
    typeId,
    brand,
    placement,
    manufactureDate,
    manufactureRaw,
    lastHydrotestDate: null,
    nextHydrotestDate,
    charge,
    vendor,
    status,
    lastInspectionDate: '2025-04-15',
    components,
    issues,
    notes: originalType !== typeId ? `Tipe dinormalisasi dari "${originalType}"` : '',
    hasHydrotestBugFixed: true
  };
}

/**
 * Normalisasi Array Baris Hasil Import CSV / XLSX
 */
export function processNormalizedExcelData(rows) {
  let activeRigCode = 'BMS-01';
  const aparList = [];
  const anomalyStats = {
    totalRows: 0,
    validApars: 0,
    typesNormalized: 0,
    datesRecovered: 0,
    datesUnreadable: 0,
    hydrotestCalculated: 0,
    issuesDetected: 0
  };

  rows.forEach((row, idx) => {
    // Abaikan baris kosong total
    const hasAnyData = Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
    if (!hasAnyData) return;

    anomalyStats.totalRows++;

    // Jika baris memuat nama rig baru, perbarui activeRigCode
    const rawRig = row.rig || row.Rig;
    if (rawRig && String(rawRig).trim()) {
      activeRigCode = normalizeRigCode(rawRig);
    }

    // Jika baris hanya nama penempatan tanpa tipe atau serial (contoh: baris placeholder TANDAM, LOW BED di BMS-15), lewati
    const hasApar = (row.type || row.Type || row.serialNo || row['Serial No'] || row.penempatan || row.Penempatan);
    if (!hasApar) return;

    // Normalisasi baris
    const apar = normalizeExcelRow(row, aparList.length, activeRigCode);

    if (apar.manufactureDate) {
      anomalyStats.datesRecovered++;
      anomalyStats.hydrotestCalculated++;
    } else {
      anomalyStats.datesUnreadable++;
    }

    if (apar.notes) {
      anomalyStats.typesNormalized++;
    }

    if (apar.issues.length > 0) {
      anomalyStats.issuesDetected++;
    }

    aparList.push(apar);
    anomalyStats.validApars++;
  });

  return { aparList, anomalyStats };
}

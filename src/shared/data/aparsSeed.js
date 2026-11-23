import { normalizeExcelRow } from '../utils/excelNormalizer.js';

// Data mentah terstandarisasi yang diekstrak langsung dari Tracking APAR 2025.xlsx
const rawDataset = [
  // BMS-07
  { Rig: 'Rig BMS-07', Type: 'Powder 9 Kg ABC Firex (FX-90)', 'Serial No': '000340', 'Tahun APAR': '2023-09-01', Penempatan: 'Rig Carier', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Powder 9 Kg ABC Firex (FX-90)', 'Serial No': '000290', 'Tahun APAR': 'Tidak Terbaca', Penempatan: 'Rest Crew', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Powder 9 Kg ABC Firex (FX-90)', 'Serial No': '79719', 'Tahun APAR': '2024-04-10', Penempatan: 'M Pump', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Powder 9 Kg ABC Firex (FX-90)', 'Serial No': '000153', 'Tahun APAR': 'Tidak Terbaca', Penempatan: 'TANK 1', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Powder 9 Kg ABC Firex (FX-90)', 'Serial No': '000184', 'Tahun APAR': '2024-12-10', Penempatan: 'Vacum Truck', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'APM', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Powder 9 Kg ABC Firex (FX-90)', 'Serial No': 'OA 120035', 'Tahun APAR': '2024-02-01', Penempatan: 'CRANE', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'APM', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Powder 9 Kg ABC Firex (FX-90)', 'Serial No': 'OA 120036', 'Tahun APAR': '2023-02-01', Penempatan: 'BULLDOZER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'APM', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Powder 9 kg ABC Cahmpion(CMP)', 'Serial No': 'OA120037', 'Tahun APAR': '1 Sept-2023', Penempatan: 'FOCO TMC', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Powder 9 kg ABC Cahmpion(CMP)', 'Serial No': '00199', 'Tahun APAR': '1 Sept-2023', Penempatan: 'TANDAM TRUCK', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'APM', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Powder 9 Kg ABC VIKING (AV-90P)', 'Serial No': '000462', 'Tahun APAR': 'TIDAK TERBACA', Penempatan: 'BUS CREW', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'CO-ALFREX(AFCO-150)', 'Serial No': '068/OA130032', 'Tahun APAR': '1 july 2023', Penempatan: 'ACCUMULATOR', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'CO-ALFREX(AFCO-150)', 'Serial No': '0051/OA130021', 'Tahun APAR': '1 july 2023', Penempatan: 'AACUMULATOR', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'CO-ALFREX(AFCO-150)', 'Serial No': '182/OA130027', 'Tahun APAR': '1 Sept-2023', Penempatan: 'FUEL TANK', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Powder 75 kg Firex(FX-800)', 'Serial No': 'OA140020', 'Tahun APAR': '2022-06-02', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Foam 100 Liter Firex (FF-1000)', 'Serial No': 'OA140018', 'Tahun APAR': '2024-02-01', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-07', Type: 'Powder 3 Kg ABC', 'Serial No': '000777', 'Tahun APAR': '1 mai 2021', Penempatan: 'LV RIG', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },

  // BMS-18
  { Rig: 'Rig BMS-18', Type: 'FIREX (FX-90)', 'Serial No': '001326', 'Tahun APAR': 'junni-2024', Penempatan: 'RIG CARIER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-18', Type: 'FIREX (FX-90)', 'Serial No': '0254', 'Tahun APAR': 'Oct-21', Penempatan: 'TANGKI RIG', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Rusak', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025', 'Hal Perbaikan': 'Tabung Rusak Keropos' },
  { Rig: 'Rig BMS-18', Type: 'FIREX (FX-90)', 'Serial No': '000916', 'Tahun APAR': 'julyy-2022', Penempatan: 'MUD PUMP', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-18', Type: 'FIREX (FX-90)', 'Serial No': '009424', 'Tahun APAR': '3 November--2021', Penempatan: 'STATION BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-18', Type: 'FIREX (FX-90)', 'Serial No': '000251', 'Tahun APAR': '3 februarii -2024', Penempatan: 'VACUM TRUCK', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-18', Type: 'CO-ALFREX (AFCO-150)', 'Serial No': 'OA130017/098', 'Tahun APAR': 'julyy-2024', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-18', Type: 'POWDER -TONATA 75 KG', 'Serial No': 'OA150021', 'Tahun APAR': 'junni-2022', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },
  { Rig: 'Rig BMS-18', Type: 'FOAM TONATA 100 Liter', 'Serial No': 'OA140021', 'Tahun APAR': 'junni-2022', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat -19 Juni 2025' },

  // BMS-06
  { Rig: 'Rig BMS-06', Type: 'Powder 9 Kg ABC', 'Serial No': '00082', 'Tahun APAR': '2025-10-24', Penempatan: 'RIG CARIER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat 26 mar 2025' },
  { Rig: 'Rig BMS-06', Type: 'Powder 9 Kg ABC', 'Serial No': '000153', 'Tahun APAR': '2025-06-24', Penempatan: 'TANGKI 1', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat 26 mar 2025' },
  { Rig: 'Rig BMS-06', Type: 'CO', 'Serial No': 'OA130048', 'Tahun APAR': '2025-10-24', Penempatan: 'GENSET', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat 26 mar 2025' },
  { Rig: 'Rig BMS-06', Type: 'Powder 75 kg ABC', 'Serial No': 'QA150016', 'Tahun APAR': '2025-11-24', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat 26 mar 2025' },
  { Rig: 'Rig BMS-06', Type: 'Foam', 'Serial No': 'OA140007', 'Tahun APAR': '2025-11-24', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat 26 mar 2025' },

  // BMS-3A
  { Rig: 'Rig BMS-3A', Type: 'Powder 150 Found', 'Serial No': 'OA150008', 'Tahun APAR': '2024-12-01', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat 07 April 2025' },
  { Rig: 'Rig BMS-3A', Type: 'Foam', 'Serial No': 'OA140008', 'Tahun APAR': '2024-12-01', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat 07 April 2025' },
  { Rig: 'Rig BMS-3A', Type: 'CO', 'Serial No': 'OA130001 - ALFREX', 'Tahun APAR': '2024-12-01', Penempatan: 'ACCUMULATOR', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat 07 April 2025' },
  { Rig: 'Rig BMS-3A', Type: 'Powder 9 Kg ABC', 'Serial No': '001257', 'Tahun APAR': '2024-12-01', Penempatan: 'RIG CARIER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat 07 April 2025' },

  // BMS-01
  { Rig: 'Rig BMS-01', Type: 'Powder 9 Kg ABC', 'Serial No': '00250', 'Tahun APAR': '2024-04-01', Penempatan: 'RIG CARIER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS-01', Type: 'CO', 'Serial No': 'OA 130025', 'Tahun APAR': 'July-2024', Penempatan: 'FBT', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS-01', Type: 'Powder 150 Found', 'Serial No': 'OA140017', 'Tahun APAR': 'Oktober-20224', Penempatan: 'GENSET', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' },

  // BMS-16
  { Rig: 'Rig BMS -16', Type: 'Powder 9 Kg ABC', 'Serial No': '579749', 'Tahun APAR': '2021-10-01', Penempatan: 'RIG CARIER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat 07 April 2025' },
  { Rig: 'Rig BMS -16', Type: 'CO', 'Serial No': 'TIDAK TERBACA', 'Tahun APAR': 'TIDAK TERBACA', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Tidak bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS', 'Hal Perbaikan': 'Hose Bocor' },
  { Rig: 'Rig BMS -16', Type: 'Powder 150 Lbs', 'Serial No': 'OA150009', 'Tahun APAR': 'May-2022', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Pihak ke 3': 'Sepakat 07 April 2025' },

  // BMS-10
  { Rig: 'Rig BMS -10', Type: 'Powder 9 Kg ABC', 'Serial No': '000271', 'Tahun APAR': '2021-06-13', Penempatan: 'M PUMP 1', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS -10', Type: 'Powder 9 Kg ABC', 'Serial No': '000154', 'Tahun APAR': '2023-06-08', Penempatan: 'TANDAM', Handle: 'Bagus', Hose: 'TIDAK BAGUS', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS', 'Hal Perbaikan': 'HOSE RUSAK' },
  { Rig: 'Rig BMS -10', Type: 'Powder 3 Kg ABC', 'Serial No': '001311', 'Tahun APAR': 'TIDAK TEBACA', Penempatan: 'LV-HYB', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'TIDAK BAGUS', Tabung: 'Bagus', Charge: 'BMS', 'Hal Perbaikan': 'LOW PRESURE' },

  // BMS-05
  { Rig: 'Rig BMS -05', Type: 'Powder 9 Kg ABC', 'Serial No': '001039', 'Tahun APAR': '2024-08-01', Penempatan: 'RIG CARIER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS -05', Type: 'CO', 'Serial No': 'OA130030', 'Tahun APAR': '2024-07-01', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS -05', Type: 'Powder 4 Kg', 'Serial No': '000408', 'Tahun APAR': 'july-2024', Penempatan: 'BUS CREW', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' },

  // BMS-20
  { Rig: 'Rig BMS-20', Type: 'Powder 9 Kg ABC', 'Serial No': 'OA120329', 'Tahun APAR': '2023-09-01', Penempatan: 'RIG CARRIER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS-20', Type: 'CO', 'Serial No': 'OA130031', 'Tahun APAR': 'July-2024', Penempatan: 'GENSET', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS' },

  // BMS-08
  { Rig: 'Rig BMS-08', Type: 'Powder 9 Kg ABC', 'Serial No': 'OA120044', 'Tahun APAR': 'Oktober-20224', Penempatan: 'RIG CARIER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS-08', Type: 'CO', 'Serial No': 'OA130044', 'Tahun APAR': 'Oktober-20224', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS' },

  // BMS-09
  { Rig: 'Rig BMS-09', Type: 'FOAM 100 liter', 'Serial No': 'OA140011', 'Tahun APAR': '2025-02-25', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS-09', Type: 'CO', 'Serial No': 'OA130003', 'Tahun APAR': '2025-02-25', Penempatan: 'GENSET', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS-09', Type: 'Powder 9 Kg ABC', 'Serial No': '1536', 'Tahun APAR': '2025-02-25', Penempatan: 'RIG CARIER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' },

  // BMS-21
  { Rig: 'Rig BMS-21', Type: 'Powder 9 Kg ABC', 'Serial No': 'OA120333', 'Tahun APAR': '2024-09-01', Penempatan: 'RIG CARIER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS-21', Type: 'CO', 'Serial No': 'OA130052', 'Tahun APAR': '2024-02-01', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS' },

  // BMS-19
  { Rig: 'Rig BMS-19', Type: 'Powder 9 Kg ABC', 'Serial No': '2325', 'Tahun APAR': '2023-02-01', Penempatan: 'RIG CARIER', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS-19', Type: 'CO', 'Serial No': '0057', 'Tahun APAR': '2023-03-01', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'N/A', Tabung: 'Bagus', Charge: 'BMS' },
  { Rig: 'Rig BMS-19', Type: 'Powder 150 Found', 'Serial No': 'OA150001', 'Tahun APAR': '2022-06-01', Penempatan: 'FIRE BOX', Handle: 'Bagus', Hose: 'Bagus', Nozle: 'Bagus', 'Pengaman Tabung': 'Bagus', 'Pin Handle': 'Bagus', 'Pressure Gauge': 'Bagus', Tabung: 'Bagus', Charge: 'BMS' }
];

export const aparsSeed = rawDataset.map((row, index) => {
  return normalizeExcelRow(row, index, row.Rig);
});

// Seed Awal Maintenance untuk mendemonstrasikan siklus lengkap verifikasi
export const initialMaintenancesSeed = [
  {
    id: 'maint-bms18-002',
    aparId: aparsSeed.find(a => a.rigCode === 'BMS-18' && a.status === 'rusak')?.id || 'apar-bms18-002',
    assetCode: 'APAR-BMS18-002',
    rigId: 'rig-bms-18',
    rigCode: 'BMS-18',
    reportedAt: '2025-04-10T08:30:00.000Z',
    issueDescription: 'Tabung Rusak Keropos / Korosi Parah di Bagian Bawah',
    status: 'open', // Menunggu Admin memproses tindakan
    actionType: 'pergantian',
    vendorName: 'PT Sepakat HSE Solution',
    dispatchedAt: null,
    evidencePhoto: null,
    repairNotes: null,
    submittedForReviewAt: null,
    adminNotes: null,
    resolvedAt: null
  },
  {
    id: 'maint-bms16-002',
    aparId: aparsSeed.find(a => a.rigCode === 'BMS-16' && a.status === 'rusak')?.id || 'apar-bms16-002',
    assetCode: 'APAR-BMS16-002',
    rigId: 'rig-bms-16',
    rigCode: 'BMS-16',
    reportedAt: '2025-04-11T10:15:00.000Z',
    issueDescription: 'Hose Bocor / Selang Pecah Getas',
    status: 'in_progress', // Sedang dalam perbaikan teknisi di lapangan
    actionType: 'perbaikan',
    vendorName: 'PT Sepakat HSE Solution',
    dispatchedAt: '2025-04-12T09:00:00.000Z',
    evidencePhoto: null,
    repairNotes: null,
    submittedForReviewAt: null,
    adminNotes: null,
    resolvedAt: null
  },
  {
    id: 'maint-bms10-002',
    aparId: aparsSeed.find(a => a.rigCode === 'BMS-10' && a.issues.includes('HOSE RUSAK'))?.id || 'apar-bms10-002',
    assetCode: 'APAR-BMS10-002',
    rigId: 'rig-bms-10',
    rigCode: 'BMS-10',
    reportedAt: '2025-04-12T14:20:00.000Z',
    issueDescription: 'HOSE RUSAK — Selang retak dan nozzle longgar',
    status: 'pending_review', // User SUDAH mengunggah foto bukti, BUTUH VERIFIKASI ADMIN!
    actionType: 'perbaikan',
    vendorName: 'PT Sepakat HSE Solution',
    dispatchedAt: '2025-04-13T08:00:00.000Z',
    evidencePhoto: 'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=800&q=80',
    repairNotes: 'Hose lama diganti baru dengan selang EPDM tekanan tinggi 25 bar. Clamp dikencangkan dan segel dipasang ulang. Siap diverifikasi Admin HSE.',
    submittedForReviewAt: '2025-04-14T11:45:00.000Z',
    adminNotes: null,
    resolvedAt: null
  },
  {
    id: 'maint-bms10-003',
    aparId: aparsSeed.find(a => a.rigCode === 'BMS-10' && a.issues.includes('LOW PRESURE'))?.id || 'apar-bms10-003',
    assetCode: 'APAR-BMS10-003',
    rigId: 'rig-bms-10',
    rigCode: 'BMS-10',
    reportedAt: '2025-04-05T09:10:00.000Z',
    issueDescription: 'LOW PRESURE — Jarum manometer di zona merah',
    status: 'closed', // Selesai & disetujui Admin
    actionType: 'isi_ulang',
    vendorName: 'PT Sepakat HSE Solution',
    dispatchedAt: '2025-04-06T08:00:00.000Z',
    evidencePhoto: 'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=800&q=80',
    repairNotes: 'Tabung diisi ulang N2 dan serbuk dry chemical powder baru 3 kg. Tekanan kembali normal di zona hijau 14 bar.',
    submittedForReviewAt: '2025-04-07T13:00:00.000Z',
    adminNotes: 'Foto bukti dan manometer zona hijau diverifikasi jelas. Disetujui.',
    resolvedAt: '2025-04-07T15:30:00.000Z'
  }
];

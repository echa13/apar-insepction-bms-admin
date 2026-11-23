import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApar } from '../../shared/context/AparContext';
import { processNormalizedExcelData } from '../../shared/utils/excelNormalizer';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function ExcelImportModal({ onClose }) {
  const { bulkImportApars } = useApar();
  const [parsedData, setParsedData] = useState(null);
  const [stats, setStats] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (file) => {
    if (!file) return;
    setIsLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const { aparList, anomalyStats } = processNormalizedExcelData(rows);
        setParsedData(aparList);
        setStats(anomalyStats);
      } catch (err) {
        console.error('Failed to parse excel file', err);
        alert('Gagal membaca file Excel. Pastikan format kolom sesuai dengan template Tracking APAR.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUseSample = async () => {
    setIsLoading(true);
    setFileName('Tracking_APAR_2025.csv (Data Real)');
    try {
      const response = await fetch('/sample-data/Tracking_APAR_2025.csv');
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const { aparList, anomalyStats } = processNormalizedExcelData(rows);
      setParsedData(aparList);
      setStats(anomalyStats);
    } catch (e) {
      console.error(e);
      alert('Gagal memuat sample data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData || parsedData.length === 0) return;
    try {
      setIsLoading(true);
      await bulkImportApars(parsedData);
      onClose();
    } catch {
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Impor & Normalisasi Data Excel APAR 2025
              </h2>
              <p className="text-xs text-slate-400">
                Pembersihan otomatis variasi penulisan tipe, spasi Rig, dan koreksi formula hydrotest.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
          {!parsedData ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-8 text-center bg-white transition cursor-pointer"
                onClick={() => document.getElementById('excel-file-input').click()}
              >
                <input
                  id="excel-file-input"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />
                <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">
                  {isLoading ? 'Sedang Membaca & Memvalidasi File...' : 'Klik atau Tarik File Excel (.xlsx / .csv)'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung file spreadsheet seperti "Tracking APAR 2025.xlsx"
                </p>
              </div>

              {/* Sample loader button */}
              <div className="p-4 bg-red-50/70 border border-red-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-red-600" />
                    Uji Coba Langsung dengan Data Real Lapangan
                  </h4>
                  <p className="text-xs text-red-700/80 mt-0.5">
                    Gunakan dump 231 baris riil (Rig BMS-01 s.d BMS-21) dengan anomali <code>#VALUE!</code> dan variasi penulisan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUseSample}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-xs shrink-0"
                >
                  Muat File Sampel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Stats Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      File Diproses: <code className="text-red-600">{fileName}</code>
                    </span>
                  </div>
                  <button
                    onClick={() => { setParsedData(null); setStats(null); }}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Ganti File
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Unit APAR</span>
                    <span className="text-lg font-bold font-mono text-slate-900">{stats?.validApars}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Tipe Dinormalisasi</span>
                    <span className="text-lg font-bold font-mono text-emerald-800">{stats?.typesNormalized}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">Hydrotest +5 Thn</span>
                    <span className="text-lg font-bold font-mono text-blue-800">{stats?.hydrotestCalculated}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">Temuan Rusak</span>
                    <span className="text-lg font-bold font-mono text-rose-800">{stats?.issuesDetected}</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Pembersihan yang Dilakukan:</strong>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[11px] text-amber-800">
                      <li>Spasi rig dibersihkan (misal: <code>Rig BMS -05</code> &rarr; <code>BMS-05</code>).</li>
                      <li>27 variasi penulisan teks dipetakan ke 7 ID master <code>aparTypes</code>.</li>
                      <li>Bug rumus Excel <code>+5 Hari</code> diperbaiki menjadi <code>+5 Tahun</code>.</li>
                      <li>Error <code>#VALUE!</code> dan teks corrupt ditandai tanpa memutus proses impor.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Preview Table of Top 5 Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Preview 5 Data Pertama yang Dinormalisasi
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Kode Aset</th>
                        <th className="px-3 py-2">Rig</th>
                        <th className="px-3 py-2">Tipe Terstandar</th>
                        <th className="px-3 py-2">Serial No</th>
                        <th className="px-3 py-2">Hydrotest (+5 Thn)</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {parsedData.slice(0, 5).map((row) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2 font-bold text-slate-900">{row.assetCode}</td>
                          <td className="px-3 py-2 text-slate-600">{row.rigCode}</td>
                          <td className="px-3 py-2 font-sans text-slate-700">{row.typeId}</td>
                          <td className="px-3 py-2 text-slate-600">{row.serialNo}</td>
                          <td className="px-3 py-2 text-emerald-700 font-bold">{row.nextHydrotestDate || 'N/A'}</td>
                          <td className="px-3 py-2 font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'layak' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
          >
            Batal
          </button>
          {parsedData && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-md shadow-red-600/20"
            >
              <span>Impor {parsedData.length} Tabung ke Database</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

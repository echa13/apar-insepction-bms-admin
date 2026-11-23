import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApar } from '../../shared/context/AparContext';
import { formatHseDate } from '../../shared/utils/hydrotestUtils';
import { X, Printer, Filter, Flame } from 'lucide-react';

export default function QrPrintModal({ preselectedRigId, onClose }) {
  const { apars, rigs } = useApar();
  const [selectedRigId, setSelectedRigId] = useState(preselectedRigId || 'all');

  const filteredApars = selectedRigId === 'all'
    ? apars
    : apars.filter(a => a.rigId === selectedRigId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header (Hidden on Print) */}
        <div className="no-print px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Cetak Stiker Label QR Code APAR
              </h2>
              <p className="text-xs text-slate-400">
                Format stiker tahan cuaca siap tempel pada tabung fisik di lapangan.
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

        {/* Filter Toolbar (Hidden on Print) */}
        <div className="no-print px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Filter Rig:</span>
            <select
              value={selectedRigId}
              onChange={(e) => setSelectedRigId(e.target.value)}
              className="text-xs font-semibold p-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
            >
              <option value="all">Semua Rig ({apars.length} Tabung)</option>
              {rigs.map(r => (
                <option key={r.id} value={r.id}>
                  {r.code} ({apars.filter(a => a.rigId === r.id).length} Tabung)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Siap cetak: <strong className="text-slate-900 font-mono">{filteredApars.length}</strong> stiker
            </span>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-md shadow-red-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Ctrl + P)</span>
            </button>
          </div>
        </div>

        {/* Print Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print-grid">
            {filteredApars.map((apar) => (
              <div
                key={apar.id}
                className="bg-white border-2 border-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-xs print-sticker"
              >
                {/* Header Stiker */}
                <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-red-600 flex items-center justify-center text-white">
                      <Flame className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider block text-slate-900 leading-none">
                        BMS HSE SAFETY
                      </span>
                      <span className="text-[8px] text-slate-600 font-semibold block leading-tight">
                        PT Besmindo Muda Sarana
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono">
                    {apar.rigCode}
                  </span>
                </div>

                {/* QR Code & Center Info */}
                <div className="py-3 flex items-center gap-3">
                  <div className="p-1 border border-slate-300 rounded-lg bg-white shrink-0">
                    <QRCodeSVG
                      value={`https://bms-apar.app/user/inspect/${apar.id}`}
                      size={80}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="min-w-0 text-left space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">
                      Kode Aset:
                    </span>
                    <span className="font-mono text-sm font-black text-slate-900 block truncate">
                      {apar.assetCode}
                    </span>
                    <span className="text-[10px] text-slate-700 font-semibold block truncate">
                      {apar.typeId.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-600 block truncate">
                      Lokasi: <strong>{apar.placement}</strong>
                    </span>
                  </div>
                </div>

                {/* Footer Stiker: Hydrotest Date & QR Instructions */}
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] text-slate-600">
                  <span>
                    Hydrotest: <strong className="text-slate-900 font-mono">{formatHseDate(apar.nextHydrotestDate)}</strong>
                  </span>
                  <span className="text-slate-400 font-mono">
                    SN: {apar.serialNo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

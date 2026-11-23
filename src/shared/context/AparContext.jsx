import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  mapRigFromDb,
  mapRigToDb,
  mapAparTypeFromDb,
  mapAparTypeToDb,
  mapHfoUserFromDb,
  mapHfoUserToDb,
  mapAparFromDb,
  mapAparToDb,
  mapInspectionFromDb,
  mapInspectionToDb,
  mapMaintenanceFromDb,
  mapMaintenanceToDb
} from '../utils/supabaseMappers';
import { rigsSeed } from '../data/rigsSeed';
import { aparTypesSeed } from '../data/aparTypesSeed';
import { aparsSeed, initialMaintenancesSeed } from '../data/aparsSeed';
import { calculateNextHydrotestDate } from '../utils/hydrotestUtils';
import { showErrorAlert, notifySuccess, notifyInfo, notifyWarning } from '../utils/alertUtils';

const AparContext = createContext();

const STORAGE_KEYS = {
  AUTH: 'bms_apar_v1_auth', // HANYA sesi auth login yang disimpan di localStorage
};

export function AparProvider({ children }) {
  // State Transaksi & Master — TIDAK DISIMPAN DI LOCALSTORAGE (Hanya di Supabase)
  const [apars, setApars] = useState(aparsSeed);
  const [rigs, setRigs] = useState(rigsSeed);
  const [aparTypes, setAparTypes] = useState(aparTypesSeed);
  const [maintenances, setMaintenances] = useState(initialMaintenancesSeed);
  const [inspections, setInspections] = useState([]);
  const [hfoUsers, setHfoUsers] = useState([
    { id: 'hfo-bms-07', rigId: 'rig-bms-07', name: 'Ilham Prasetyo', position: 'HFO Officer Rig BMS-07', role: 'user', password: '123456' },
    { id: 'hfo-bms-18', rigId: 'rig-bms-18', name: 'Budi Santoso', position: 'HFO Officer Rig BMS-18', role: 'user', password: '123456' },
    { id: 'hfo-bms-10', rigId: 'rig-bms-10', name: 'Agus Setiawan', position: 'HFO Officer Rig BMS-10', role: 'user', password: '123456' },
    { id: 'hfo-bms-16', rigId: 'rig-bms-16', name: 'Dedi Kurniawan', position: 'HFO Officer Rig BMS-16', role: 'user', password: '123456' },
  ]);

  // Koneksi & Status Realtime
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState('connecting'); // 'connecting' | 'online' | 'offline'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const isFirstLoadRef = useRef(true);

  // Sesi Login Pengguna — SATU-SATUNYA yang disimpan di localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
      return saved ? JSON.parse(saved) : { role: 'admin', name: 'Admin HSE Pusat', email: 'hse.admin@besmindo.co.id', rigId: 'all' };
    } catch {
      return { role: 'admin', name: 'Admin HSE Pusat', email: 'hse.admin@besmindo.co.id', rigId: 'all' };
    }
  });

  // Simpan HANYA sesi login ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(currentUser));
    } catch {}
  }, [currentUser]);

  // Bersihkan data transaksi lawas dari localStorage agar tidak ada duplikasi data lokal
  useEffect(() => {
    localStorage.removeItem('bms_apar_v1_apars');
    localStorage.removeItem('bms_apar_v1_rigs');
    localStorage.removeItem('bms_apar_v1_maintenances');
    localStorage.removeItem('bms_apar_v1_hfo_users');
    localStorage.removeItem('bms_apar_v1_inspections');
  }, []);

  // =========================================================================
  // 1. QUERY BACA SELURUH DATA DARI 6 TABEL BAKU SUPABASE
  // =========================================================================
  const loadAllFromSupabase = useCallback(async (isManualTrigger = false) => {
    try {
      setSupabaseSyncStatus('connecting');

      // a. Query tabel 'rigs'
      const { data: dbRigs, error: rigsError } = await supabase.from('rigs').select('*').order('code');
      if (rigsError) throw rigsError;

      const mappedRigs = (dbRigs && dbRigs.length > 0)
        ? dbRigs.map(mapRigFromDb)
        : rigsSeed;

      // b. Query tabel 'apar_types'
      const { data: dbTypes, error: typesError } = await supabase.from('apar_types').select('*');
      if (typesError) throw typesError;

      const mappedTypes = (dbTypes && dbTypes.length > 0)
        ? dbTypes.map(mapAparTypeFromDb)
        : aparTypesSeed;

      // c. Query tabel 'hfo_users'
      const { data: dbUsers, error: usersError } = await supabase.from('hfo_users').select('*');
      if (usersError) throw usersError;
      if (dbUsers && dbUsers.length > 0) {
        setHfoUsers(dbUsers.map(mapHfoUserFromDb));
      }

      // Buat lookup dictionary untuk rig
      const rigLookup = {};
      mappedRigs.forEach(r => { rigLookup[r.id] = r; rigLookup[r.code] = r; });

      // d. Query tabel 'apars'
      const { data: dbApars, error: aparsError } = await supabase
        .from('apars')
        .select('*')
        .order('created_at', { ascending: false });
      if (aparsError) throw aparsError;

      let mappedApars = aparsSeed;
      if (dbApars && dbApars.length > 0) {
        mappedApars = dbApars.map(a => mapAparFromDb(a, rigLookup));
      }

      // e. Query tabel 'inspections'
      const { data: dbInspections, error: inspError } = await supabase
        .from('inspections')
        .select('*')
        .order('inspection_date', { ascending: false });
      if (inspError) throw inspError;
      if (dbInspections && dbInspections.length > 0) {
        setInspections(dbInspections.map(mapInspectionFromDb));
      }

      // f. Query tabel 'maintenances'
      const aparLookup = {};
      mappedApars.forEach(a => { aparLookup[a.id] = a; });

      const { data: dbMaintenances, error: maintError } = await supabase
        .from('maintenances')
        .select('*')
        .order('created_at', { ascending: false });
      if (maintError) throw maintError;

      let mappedMaint = initialMaintenancesSeed;
      if (dbMaintenances && dbMaintenances.length > 0) {
        mappedMaint = dbMaintenances.map(m => mapMaintenanceFromDb(m, aparLookup, rigLookup));
      }

      setRigs(mappedRigs);
      setAparTypes(mappedTypes);
      setApars(mappedApars);
      setMaintenances(mappedMaint);
      setIsSupabaseConnected(true);
      setSupabaseSyncStatus('online');
      setLastSyncTime(new Date());

      if (isManualTrigger) {
        notifySuccess('Berhasil terhubung dan tersinkronisasi dengan Supabase.');
      }
    } catch (err) {
      console.warn('Supabase fetch notice (fallback mode):', err.message || err);
      setIsSupabaseConnected(false);
      setSupabaseSyncStatus('offline');

      if (isManualTrigger) {
        showErrorAlert(
          'Gagal Menyambung ke Supabase',
          `Pesan error: ${err.message || 'Tabel belum ada di Supabase atau koneksi terputus.'}\n\nPastikan skrip SQL di "supabase-schema.sql" sudah dijalankan di Supabase SQL Editor.`
        );
      }
    }
  }, []);

  // Fetch pertama saat aplikasi dibuka
  useEffect(() => {
    loadAllFromSupabase(false);
  }, [loadAllFromSupabase]);

  // =========================================================================
  // 2. SUPABASE REALTIME SUBSCRIPTION (channel: 'apar-sync')
  // =========================================================================
  useEffect(() => {
    const channel = supabase
      .channel('apar-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'apars' },
        (payload) => {
          const rigLookup = {};
          rigs.forEach(r => { rigLookup[r.id] = r; });

          if (payload.eventType === 'INSERT') {
            const item = mapAparFromDb(payload.new, rigLookup);
            setApars(prev => [item, ...prev.filter(a => a.id !== item.id && a.assetCode !== item.assetCode)]);
            notifyInfo(`APAR baru ditambahkan dari HP User: ${item.assetCode}`);
          } else if (payload.eventType === 'UPDATE') {
            const item = mapAparFromDb(payload.new, rigLookup);
            setApars(prev => prev.map(a => a.id === item.id ? { ...a, ...item } : a));
          } else if (payload.eventType === 'DELETE') {
            setApars(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenances' },
        (payload) => {
          const aparLookup = {};
          apars.forEach(a => { aparLookup[a.id] = a; });
          const rigLookup = {};
          rigs.forEach(r => { rigLookup[r.id] = r; });

          if (payload.eventType === 'INSERT') {
            const item = mapMaintenanceFromDb(payload.new, aparLookup, rigLookup);
            setMaintenances(prev => [item, ...prev.filter(m => m.id !== item.id)]);
            notifyWarning(`Tiket kerusakan baru diterima dari ${item.reportedBy} (${item.assetCode})`);
          } else if (payload.eventType === 'UPDATE') {
            const item = mapMaintenanceFromDb(payload.new, aparLookup, rigLookup);
            setMaintenances(prev => prev.map(m => m.id === item.id ? { ...m, ...item } : m));
            if (item.status === 'pending_review') {
              notifyInfo(`Foto bukti baru diunggah oleh ${item.evidenceUploadedBy || 'User'} (${item.assetCode})`);
            }
          } else if (payload.eventType === 'DELETE') {
            setMaintenances(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inspections' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const item = mapInspectionFromDb(payload.new);
            setInspections(prev => [item, ...prev]);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSupabaseConnected(true);
          setSupabaseSyncStatus('online');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsSupabaseConnected(false);
          setSupabaseSyncStatus('offline');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rigs, apars]);

  // =========================================================================
  // 3. ACTION CRUD APAR (Tabel 'apars')
  // =========================================================================
  const addApar = async (aparData) => {
    const rig = rigs.find(r => r.id === aparData.rigId) || { code: 'BMS-01' };
    const rigClean = rig.code.replace(/[^a-zA-Z0-9]/g, '');
    const countInRig = apars.filter(a => a.rigId === aparData.rigId).length + 1;
    const seq = String(countInRig).padStart(3, '0');

    const assetCode = aparData.assetCode?.trim() || `APAR-${rigClean}-${seq}`;
    const id = `apar-${rigClean.toLowerCase()}-${Date.now()}`;
    const nextHydrotestDate = calculateNextHydrotestDate(aparData.manufactureDate);

    const newApar = {
      id,
      assetCode,
      serialNo: aparData.serialNo?.trim() || 'TIDAK TERBACA',
      rigId: aparData.rigId,
      rigCode: rig.code,
      typeId: aparData.typeId || 'dry_powder_9kg',
      brand: aparData.brand || 'Firex',
      placement: aparData.placement || 'Rig Carrier',
      manufactureDate: aparData.manufactureDate || null,
      manufactureRaw: aparData.manufactureRaw || '',
      lastHydrotestDate: null,
      nextHydrotestDate,
      charge: aparData.charge || 'BMS',
      vendor: aparData.vendor || 'PT Sepakat HSE Solution',
      status: aparData.status || 'layak',
      lastInspectionDate: new Date().toISOString().split('T')[0],
      components: aparData.components || {
        handle: 'bagus',
        hose: 'bagus',
        nozle: 'bagus',
        pengamanTabung: 'bagus',
        pinHandle: 'bagus',
        pressureGauge: aparData.typeId === 'co2_cylinder' ? 'na' : 'bagus',
        tabung: 'bagus',
      },
      issues: aparData.issues || [],
      hasHydrotestBugFixed: true
    };

    // Optimistic UI update
    setApars(prev => [newApar, ...prev]);

    // Kirim ke Supabase
    try {
      const dbPayload = mapAparToDb(newApar);
      const { error } = await supabase.from('apars').insert(dbPayload);
      if (error) {
        console.warn('Supabase insert notice:', error.message);
        notifyWarning(`Tersimpan lokal: ${error.message}`);
      } else {
        notifySuccess(`Tabung ${newApar.assetCode} berhasil disimpan ke Supabase.`);
      }
    } catch (e) {
      console.warn('Supabase addApar error:', e);
    }

    return newApar;
  };

  const updateApar = async (id, updates) => {
    let updatedApar = null;

    setApars(prev => prev.map(apar => {
      if (apar.id !== id) return apar;
      const nextMfg = updates.manufactureDate !== undefined ? updates.manufactureDate : apar.manufactureDate;
      const nextHydro = calculateNextHydrotestDate(nextMfg);

      updatedApar = {
        ...apar,
        ...updates,
        nextHydrotestDate: nextHydro || apar.nextHydrotestDate
      };
      return updatedApar;
    }));

    if (updatedApar) {
      try {
        const dbPayload = mapAparToDb(updatedApar);
        const { error } = await supabase.from('apars').update(dbPayload).eq('id', id);
        if (error) {
          console.warn('Supabase update notice:', error.message);
        } else {
          notifySuccess(`Perubahan ${updatedApar.assetCode} disimpan ke Supabase.`);
        }
      } catch (e) {
        console.warn('Supabase updateApar error:', e);
      }
    }
  };

  const deleteApar = async (id) => {
    setApars(prev => prev.filter(a => a.id !== id));
    try {
      const { error } = await supabase.from('apars').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete notice:', error.message);
      } else {
        notifySuccess('Tabung berhasil dihapus dari Supabase.');
      }
    } catch (e) {
      console.warn('Supabase deleteApar error:', e);
    }
  };

  const bulkImportApars = async (normalizedList) => {
    setApars(prev => {
      const existingAssetCodes = new Set(prev.map(a => a.assetCode.toUpperCase()));
      const filteredNew = normalizedList.filter(item => !existingAssetCodes.has(item.assetCode.toUpperCase()));
      return [...filteredNew, ...prev];
    });

    try {
      const dbRows = normalizedList.map(mapAparToDb);
      const { error } = await supabase.from('apars').upsert(dbRows, { onConflict: 'asset_code' });
      if (error) {
        console.warn('Supabase bulk upsert notice:', error.message);
        notifyWarning(`Impor lokal aktif: ${error.message}`);
      } else {
        notifySuccess(`${normalizedList.length} tabung APAR tersinkron ke Supabase.`);
      }
    } catch (e) {
      console.warn('Supabase bulkImportApars error:', e);
    }
  };

  // =========================================================================
  // 4. ACTION RIGS & AKUN HFO (Tabel 'rigs' & 'hfo_users')
  // =========================================================================
  const addRig = async (code, name, location = '') => {
    const cleanCode = code.trim().toUpperCase();
    const id = `rig-${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newRig = {
      id,
      code: cleanCode,
      name: name?.trim() || `Rig ${cleanCode}`,
      location: location?.trim() || 'Wilayah Operasional BMS',
      status: 'active'
    };

    setRigs(prev => [...prev, newRig]);

    try {
      const { error } = await supabase.from('rigs').insert(mapRigToDb(newRig));
      if (error) console.warn('Supabase insert rig notice:', error.message);
      else notifySuccess(`Rig ${newRig.code} tersimpan ke Supabase.`);
    } catch (e) {
      console.warn('Supabase addRig error:', e);
    }

    return newRig;
  };

  const toggleRigStatus = async (rigId) => {
    let nextStatus = 'aktif';

    setRigs(prev => prev.map(r => {
      if (r.id !== rigId) return r;
      const toggled = r.status === 'active' ? 'inactive' : 'active';
      nextStatus = toggled === 'active' ? 'aktif' : 'nonaktif';
      return { ...r, status: toggled };
    }));

    try {
      const { error } = await supabase.from('rigs').update({ status: nextStatus }).eq('id', rigId);
      if (error) console.warn('Supabase toggle rig notice:', error.message);
    } catch (e) {
      console.warn('Supabase toggleRigStatus error:', e);
    }
  };

  const resetHfoPassword = async (userId, newPassword = '123456') => {
    setHfoUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));

    try {
      const { error } = await supabase.from('hfo_users').update({ password: newPassword }).eq('id', userId);
      if (error) {
        console.warn('Supabase reset password notice:', error.message);
        notifyWarning(`Reset lokal berhasil: ${error.message}`);
      } else {
        notifySuccess('Password HFO berhasil di-reset ke 123456 di Supabase.');
      }
    } catch (e) {
      console.warn('Supabase resetHfoPassword error:', e);
    }
  };

  // =========================================================================
  // 5. SIKLUS PERBAIKAN TIKET (Tabel 'maintenances')
  // =========================================================================

  // a. Admin memproses tiket: ubah 'open' -> 'in_progress', simpan action_type & vendor_name
  const dispatchMaintenance = async (maintenanceId, actionType, vendorName) => {
    const action = actionType || 'perbaikan';
    const vendor = vendorName || 'PT Sepakat HSE Solution';

    setMaintenances(prev => prev.map(m => {
      if (m.id !== maintenanceId) return m;
      return {
        ...m,
        status: 'in_progress',
        actionType: action,
        vendorName: vendor,
      };
    }));

    try {
      const { error } = await supabase.from('maintenances').update({
        status: 'in_progress',
        action_type: action,
        vendor_name: vendor
      }).eq('id', maintenanceId);

      if (error) {
        console.warn('Supabase dispatch notice:', error.message);
      } else {
        notifySuccess('Perintah perbaikan diterbitkan (Status: In Progress).');
      }
    } catch (e) {
      console.warn('Supabase dispatchMaintenance error:', e);
    }
  };

  // b. User Lapangan mengunggah foto bukti & catatan ('in_progress' -> 'pending_review')
  const submitEvidence = async (maintenanceId, evidencePhoto, repairNotes, evidenceUploadedBy = 'Ilham Prasetyo (HFO)') => {
    const notes = repairNotes?.trim() || 'Perbaikan fisik selesai dilaksanakan.';

    setMaintenances(prev => prev.map(m => {
      if (m.id !== maintenanceId) return m;
      return {
        ...m,
        status: 'pending_review',
        evidencePhoto,
        evidenceUploadedBy,
        repairNotes: notes,
      };
    }));

    try {
      const { error } = await supabase.from('maintenances').update({
        status: 'pending_review',
        evidence_photo: evidencePhoto,
        evidence_uploaded_by: evidenceUploadedBy,
        repair_notes: notes
      }).eq('id', maintenanceId);

      if (error) console.warn('Supabase submit evidence notice:', error.message);
      else notifySuccess('Foto bukti berhasil terkirim ke Supabase.');
    } catch (e) {
      console.warn('Supabase submitEvidence error:', e);
    }
  };

  // c. Admin memverifikasi bukti foto (Setujui atau Tolak)
  const verifyMaintenance = async (maintenanceId, isApproved, adminNotes) => {
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];
    const targetTicket = maintenances.find(m => m.id === maintenanceId);
    if (!targetTicket) return;

    if (isApproved) {
      // Tutup Tiket
      setMaintenances(prev => prev.map(m => {
        if (m.id !== maintenanceId) return m;
        return {
          ...m,
          status: 'closed',
          adminNotes: adminNotes || 'Disetujui Admin HSE.',
          resolvedAt: nowIso
        };
      }));

      // Pulihkan APAR menjadi Layak
      let updatedApar = null;
      setApars(prev => prev.map(apar => {
        if (apar.id !== targetTicket.aparId) return apar;
        const isHydrotest = targetTicket.actionType === 'hydrotest';
        const nextHydro = isHydrotest ? calculateNextHydrotestDate(today) : apar.nextHydrotestDate;

        updatedApar = {
          ...apar,
          status: 'layak',
          issues: [],
          lastHydrotestDate: isHydrotest ? today : apar.lastHydrotestDate,
          nextHydrotestDate: nextHydro
        };
        return updatedApar;
      }));

      notifySuccess(`Tiket disetujui & ditutup. APAR kembali berstatus LAYAK.`);

      // Update Supabase
      try {
        await supabase.from('maintenances').update({
          status: 'closed',
          admin_notes: adminNotes || 'Disetujui Admin HSE.',
          resolved_at: nowIso
        }).eq('id', maintenanceId);

        if (updatedApar) {
          const isHydrotest = targetTicket.actionType === 'hydrotest';
          const aparUpdates = {
            status: 'layak',
            ...(isHydrotest ? {
              last_hydrotest_date: today,
              next_hydrotest_date: calculateNextHydrotestDate(today)
            } : {})
          };
          await supabase.from('apars').update(aparUpdates).eq('id', targetTicket.aparId);
        }
      } catch (e) {
        console.warn('Supabase verifyMaintenance error:', e);
      }
    } else {
      // Tolak / Kembalikan ke Lapangan
      const rejectNote = adminNotes || 'Foto bukti tidak memenuhi standar K3 / perlu perbaikan ulang.';
      setMaintenances(prev => prev.map(m => {
        if (m.id !== maintenanceId) return m;
        return {
          ...m,
          status: 'in_progress',
          adminNotes: rejectNote
        };
      }));

      notifyWarning('Tiket ditolak dan dikembalikan ke personil lapangan.');

      try {
        await supabase.from('maintenances').update({
          status: 'in_progress',
          admin_notes: rejectNote
        }).eq('id', maintenanceId);
      } catch (e) {
        console.warn('Supabase reject maintenance error:', e);
      }
    }
  };

  // d. Admin buat tiket terjadwal manual
  const createManualMaintenance = async (aparId, issueDescription, actionType = 'hydrotest', vendorName = 'PT Sepakat HSE Solution') => {
    const targetApar = apars.find(a => a.id === aparId);
    if (!targetApar) return;

    const newTicket = {
      id: `maint-manual-${Date.now()}`,
      aparId: targetApar.id,
      assetCode: targetApar.assetCode,
      rigId: targetApar.rigId,
      rigCode: targetApar.rigCode,
      reportedBy: 'Admin HSE Pusat',
      reportedAt: new Date().toISOString(),
      issueDescription: issueDescription || `Tindakan terjadwal ${actionType} oleh Admin HSE`,
      status: 'in_progress',
      actionType,
      vendorName,
      adminNotes: 'Dibuat terjadwal via Modul Admin',
      resolvedAt: null
    };

    setMaintenances(prev => [newTicket, ...prev]);

    try {
      const dbPayload = mapMaintenanceToDb(newTicket);
      await supabase.from('maintenances').insert(dbPayload);
      notifySuccess(`Tiket terjadwal ${actionType} berhasil dibuat di Supabase.`);
    } catch (e) {
      console.warn('Supabase createManualMaintenance error:', e);
    }

    return newTicket;
  };

  // e. User submit hasil inspeksi rutin di lapangan
  const recordInspection = async (aparId, { components, issues, inspectorName = 'Inspector Lapangan' }) => {
    const today = new Date().toISOString().split('T')[0];
    const isDamaged = issues && issues.length > 0;
    const targetApar = apars.find(a => a.id === aparId);

    // Update status APAR
    setApars(prev => prev.map(apar => {
      if (apar.id !== aparId) return apar;
      return {
        ...apar,
        status: isDamaged ? 'rusak' : 'layak',
        lastInspectionDate: today,
        components,
        issues: issues || []
      };
    }));

    // Record ke inspections
    const newInspection = {
      id: `insp-${Date.now()}`,
      aparId,
      rigId: targetApar?.rigId || 'rig-bms-01',
      inspectorName,
      inspectionDate: today,
      category: 'bulanan',
      thirdPartyVendor: targetApar?.vendor || 'PT Sepakat HSE Solution',
      checklist: {
        handle: components?.handle || 'bagus',
        hose: components?.hose || 'bagus',
        nozzle: components?.nozle || 'bagus',
        cylinderGuard: components?.pengamanTabung || 'bagus',
        pinHandle: components?.pinHandle || 'bagus',
        pressureGauge: components?.pressureGauge || 'bagus',
        cylinder: components?.tabung || 'bagus',
      },
      overallStatus: isDamaged ? 'tidak_layak' : 'layak',
      notes: issues?.join(', ') || 'Semua komponen dalam kondisi baik.'
    };
    setInspections(prev => [newInspection, ...prev]);

    // Jika rusak, otomatis buat tiket masuk 'open'
    if (isDamaged) {
      const newTicket = {
        id: `maint-${Date.now()}`,
        aparId,
        assetCode: targetApar?.assetCode || 'UNKNOWN',
        rigId: targetApar?.rigId || 'rig-bms-01',
        rigCode: targetApar?.rigCode || 'BMS-01',
        inspectionId: newInspection.id,
        reportedBy: inspectorName,
        reportedAt: new Date().toISOString(),
        issueDescription: issues.join(', '),
        status: 'open',
        actionType: 'perbaikan',
        vendorName: 'PT Sepakat HSE Solution',
        evidencePhoto: null,
        evidenceUploadedBy: null,
        repairNotes: null,
        adminNotes: null,
        resolvedAt: null
      };
      setMaintenances(prev => [newTicket, ...prev]);

      try {
        await supabase.from('apars').update({ status: 'perlu_perbaikan' }).eq('id', aparId);
        await supabase.from('inspections').insert(mapInspectionToDb(newInspection));
        await supabase.from('maintenances').insert(mapMaintenanceToDb(newTicket));
      } catch (e) {
        console.warn('Supabase inspection record error:', e);
      }
    } else {
      try {
        await supabase.from('apars').update({ status: 'layak' }).eq('id', aparId);
        await supabase.from('inspections').insert(mapInspectionToDb(newInspection));
      } catch (e) {
        console.warn('Supabase inspection record error:', e);
      }
    }
  };

  const resetDemoData = () => {
    setApars(aparsSeed);
    setRigs(rigsSeed);
    setMaintenances(initialMaintenancesSeed);
    notifyInfo('Data demo telah dikembalikan ke sampel awal.');
  };

  const loginAs = (role, rigId = 'all') => {
    const user = role === 'admin'
      ? { role: 'admin', name: 'Admin HSE Pusat', email: 'hse.admin@besmindo.co.id', rigId: 'all' }
      : { role: 'user', name: 'Ilham Prasetyo (HFO)', email: 'hfo.bms07@besmindo.co.id', rigId: rigId || 'rig-bms-07' };
    setCurrentUser(user);
    return user;
  };

  return (
    <AparContext.Provider value={{
      apars,
      rigs,
      aparTypes,
      maintenances,
      inspections,
      hfoUsers,
      currentUser,
      isSupabaseConnected,
      supabaseSyncStatus,
      lastSyncTime,
      loadAllFromSupabase,
      addApar,
      updateApar,
      deleteApar,
      bulkImportApars,
      addRig,
      toggleRigStatus,
      resetHfoPassword,
      dispatchMaintenance,
      submitEvidence,
      verifyMaintenance,
      createManualMaintenance,
      recordInspection,
      resetDemoData,
      loginAs
    }}>
      {children}
    </AparContext.Provider>
  );
}

export function useApar() {
  const context = useContext(AparContext);
  if (!context) {
    throw new Error('useApar must be used within an AparProvider');
  }
  return context;
}

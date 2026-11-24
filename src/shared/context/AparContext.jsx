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
  mapMaintenanceToDb,
  mapHydrotestLogFromDb,
  mapHydrotestLogToDb
} from '../utils/supabaseMappers';
import { rigsSeed } from '../data/rigsSeed';
import { aparTypesSeed } from '../data/aparTypesSeed';
import { aparsSeed, initialMaintenancesSeed } from '../data/aparsSeed';
import { calculateNextHydrotestDate, formatHseDate } from '../utils/hydrotestUtils';
import { showErrorAlert, notifySuccess, notifyInfo, notifyWarning } from '../utils/alertUtils';

const AparContext = createContext();

const STORAGE_KEYS = {
  AUTH: 'bms_apar_v1_auth', // HANYA sesi auth login yang disimpan di localStorage
};

export function AparProvider({ children }) {
  // State Transaksi & Master — Single Source of Truth dari Supabase
  const [apars, setApars] = useState(aparsSeed);
  const [rigs, setRigs] = useState(rigsSeed);
  const [aparTypes, setAparTypes] = useState(aparTypesSeed);
  const [maintenances, setMaintenances] = useState(initialMaintenancesSeed);
  const [inspections, setInspections] = useState([]);
  const [hydrotestLogs, setHydrotestLogs] = useState([]);
  const [hfoUsers, setHfoUsers] = useState([
    { id: 'hfo-bms02-1', rigId: 'BMS-02', name: 'ANDI KURNIAWAN S', position: 'HFO', role: 'user', password: '123456' },
    { id: 'hfo-bms03-1', rigId: 'BMS-03', name: 'INSANUL ARIF', position: 'HFO', role: 'user', password: '123456' },
    { id: 'hfo-bms05-1', rigId: 'BMS-05', name: 'HENDRA', position: 'HFO', role: 'user', password: '123456' },
    { id: 'hfo-bms07-1', rigId: 'BMS-07', name: 'APRIADI S', position: 'HFO', role: 'user', password: '123456' },
    { id: 'hfo-bms10-1', rigId: 'BMS-10', name: 'ARIF ILYAS', position: 'HFO', role: 'user', password: '123456' },
    { id: 'hfo-bms16-1', rigId: 'BMS-16', name: 'ANUGRAH BIMA', position: 'HFO', role: 'user', password: '123456' },
    { id: 'hfo-bms18-1', rigId: 'BMS-18', name: 'DONY HANDRI S', position: 'HFO', role: 'user', password: '123456' },
  ]);

  // Koneksi & Status Realtime
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState('connecting'); // 'connecting' | 'online' | 'offline'
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Guards untuk mencegah fetch bertabrakan / duplicate fetch
  const isFetchingRef = useRef(false);
  const pendingFetchRef = useRef(false);

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
  // 1. QUERY BACA SELURUH DATA DARI 6 TABEL BAKU SUPABASE SECARA PARALEL
  // =========================================================================
  const fetchAllData = useCallback(async ({ silent = true, isManual = false } = {}) => {
    if (isFetchingRef.current) {
      pendingFetchRef.current = true;
      return;
    }
    isFetchingRef.current = true;

    try {
      if (!silent) {
        setSupabaseSyncStatus('connecting');
      }

      // Query 7 tabel Supabase secara paralel menggunakan Promise.all
      const [
        { data: dbRigs, error: rigsError },
        { data: dbTypes, error: typesError },
        { data: dbUsers, error: usersError },
        { data: dbApars, error: aparsError },
        { data: dbInspections, error: inspError },
        { data: dbMaintenances, error: maintError },
        { data: dbHydroLogs, error: hydroError }
      ] = await Promise.all([
        supabase.from('rigs').select('*').order('code'),
        supabase.from('apar_types').select('*'),
        supabase.from('hfo_users').select('*').order('name'),
        supabase.from('apars').select('*').order('created_at', { ascending: false }),
        supabase.from('inspections').select('*').order('inspection_date', { ascending: false }),
        supabase.from('maintenances').select('*').order('created_at', { ascending: false }),
        supabase.from('hydrotest_logs').select('*').order('test_date', { ascending: false })
      ]);

      if (rigsError) throw rigsError;
      if (typesError) throw typesError;
      if (usersError) throw usersError;
      if (aparsError) throw aparsError;
      if (inspError) throw inspError;
      if (maintError) throw maintError;
      if (hydroError) {
        console.warn('Hydrotest logs fetch notice:', hydroError.message);
      }

      // 1. Rigs mapping
      const mappedRigs = (dbRigs && dbRigs.length > 0) ? dbRigs.map(mapRigFromDb) : rigsSeed;
      const rigLookup = {};
      mappedRigs.forEach(r => { rigLookup[r.id] = r; rigLookup[r.code] = r; });

      // 2. APAR Types mapping
      const mappedTypes = (dbTypes && dbTypes.length > 0) ? dbTypes.map(mapAparTypeFromDb) : aparTypesSeed;

      // 3. HFO Users mapping
      const mappedUsers = (dbUsers && dbUsers.length > 0) ? dbUsers.map(mapHfoUserFromDb) : [];

      // 4. APARs mapping
      const mappedApars = (dbApars && dbApars.length > 0)
        ? dbApars.map(a => mapAparFromDb(a, rigLookup))
        : aparsSeed;

      const aparLookup = {};
      mappedApars.forEach(a => {
        if (a.id) {
          aparLookup[a.id] = a;
          aparLookup[a.id.toLowerCase()] = a;
        }
        if (a.assetCode) {
          aparLookup[a.assetCode] = a;
          aparLookup[a.assetCode.toLowerCase()] = a;
        }
      });

      // 5. Inspections mapping
      const mappedInspections = (dbInspections && dbInspections.length > 0)
        ? dbInspections.map(i => mapInspectionFromDb(i, aparLookup))
        : [];

      // 6. Maintenances mapping
      const mappedMaint = (dbMaintenances && dbMaintenances.length > 0)
        ? dbMaintenances.map(m => mapMaintenanceFromDb(m, aparLookup, rigLookup))
        : initialMaintenancesSeed;

      // 7. Hydrotest Logs mapping
      const mappedHydroLogs = (dbHydroLogs && dbHydroLogs.length > 0)
        ? dbHydroLogs.map(l => mapHydrotestLogFromDb(l, aparLookup, rigLookup))
        : [];

      // Update state aplikasi
      setRigs(mappedRigs);
      setAparTypes(mappedTypes);
      if (mappedUsers.length > 0) setHfoUsers(mappedUsers);
      setApars(mappedApars);
      setInspections(mappedInspections);
      setMaintenances(mappedMaint);
      setHydrotestLogs(mappedHydroLogs);

      setIsSupabaseConnected(true);
      setSupabaseSyncStatus('online');
      setLastSyncTime(new Date());

      if (isManual) {
        notifySuccess('Seluruh data berhasil disinkronkan dari Supabase.');
      }
    } catch (err) {
      console.warn('Supabase fetch notice:', err.message || err);
      if (!silent) {
        setIsSupabaseConnected(false);
        setSupabaseSyncStatus('offline');
      }
      if (isManual) {
        showErrorAlert(
          'Gagal Sinkronisasi Supabase',
          `Error: ${err.message || 'Koneksi database Supabase terputus.'}\n\nPastikan skrip SQL di "supabase-schema.sql" sudah dijalankan di Supabase SQL Editor.`
        );
      }
    } finally {
      isFetchingRef.current = false;
      if (pendingFetchRef.current) {
        pendingFetchRef.current = false;
        fetchAllData({ silent: true });
      }
    }
  }, []);

  // Alias kompatibilitas
  const loadAllFromSupabase = useCallback((isManual = false) => {
    return fetchAllData({ silent: !isManual, isManual });
  }, [fetchAllData]);

  // ==========================================
  // 2. SUPABASE REALTIME SUBSCRIPTION UNTUK SEMUA 6 TABEL
  // ==========================================
  useEffect(() => {
    // Initial fetch saat aplikasi dimuat
    fetchAllData({ silent: false });

    // Dengarkan perubahan real-time dari HP User untuk SELURUH 6 tabel
    const channel = supabase
      .channel('apar-realtime-all-tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apars' }, (payload) => {
        fetchAllData({ silent: true });
        if (payload.eventType === 'INSERT') {
          notifyInfo(`APAR baru (${payload.new?.asset_code || ''}) ditambahkan dari HP User.`);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inspections' }, (payload) => {
        fetchAllData({ silent: true });
        if (payload.eventType === 'INSERT') {
          if (payload.new?.overall_status === 'tidak_layak') {
            notifyWarning(`Temuan APAR TIDAK LAYAK dari ${payload.new?.inspector_name || 'HFO Lapangan'} (${payload.new?.rig_id})!`);
          } else {
            notifyInfo(`Inspeksi baru selesai dicatat oleh ${payload.new?.inspector_name || 'HFO Lapangan'} (${payload.new?.rig_id}).`);
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenances' }, (payload) => {
        fetchAllData({ silent: true });
        if (payload.eventType === 'INSERT') {
          notifyWarning(`Laporan kerusakan baru (${payload.new?.reported_by || 'HFO'}): ${payload.new?.issue_description || ''}`);
        } else if (payload.eventType === 'UPDATE' && payload.new?.status === 'pending_review') {
          notifyInfo(`Foto bukti perbaikan diunggah oleh ${payload.new?.evidence_uploaded_by || 'User'}. Menunggu verifikasi Before vs After.`);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hydrotest_logs' }, (payload) => {
        fetchAllData({ silent: true });
        if (payload.eventType === 'INSERT') {
          notifyInfo(`Sertifikat Hydrotest baru telah diperbarui & disinkronkan dari Supabase.`);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rigs' }, () => {
        fetchAllData({ silent: true });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apar_types' }, () => {
        fetchAllData({ silent: true });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hfo_users' }, () => {
        fetchAllData({ silent: true });
      })
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
  }, [fetchAllData]);

  // ==========================================
  // 3. AUTO-SYNC SAAT TAB AKTIF & INTERVAL RINGAN 15 DETIK
  // ==========================================
  useEffect(() => {
    const handleActive = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData({ silent: true });
      }
    };

    window.addEventListener('focus', handleActive);
    document.addEventListener('visibilitychange', handleActive);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAllData({ silent: true });
      }
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleActive);
      document.removeEventListener('visibilitychange', handleActive);
      clearInterval(intervalId);
    };
  }, [fetchAllData]);

  // =========================================================================
  // 4. ACTION CRUD APAR (Tabel 'apars')
  // =========================================================================
  const addApar = async (aparData) => {
    const rig = rigs.find(r => r.id === aparData.rigId || r.code === aparData.rigId) || { code: 'BMS-02', id: 'BMS-02' };
    const rigClean = rig.code.replace(/[^a-zA-Z0-9]/g, '');
    const countInRig = apars.filter(a => a.rigId === rig.id || a.rigCode === rig.code).length + 1;
    const seq = String(countInRig).padStart(3, '0');

    const assetCode = aparData.assetCode?.trim() || `APAR-${rigClean}-${seq}`;
    const id = `apar-${rigClean.toLowerCase()}-${Date.now()}`;
    const nextHydrotestDate = calculateNextHydrotestDate(aparData.manufactureDate);

    const newApar = {
      id,
      assetCode,
      serialNo: aparData.serialNo?.trim() || 'TIDAK TERBACA',
      rigId: rig.id,
      rigCode: rig.code,
      typeId: aparData.typeId || 'type_powder_9kg',
      brand: aparData.brand || 'BMS Standard',
      placement: aparData.placement || 'Area Kerja Rig',
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
        pressureGauge: (aparData.typeId === 'type_co2' || aparData.typeId === 'co2_cylinder') ? 'na' : 'bagus',
        tabung: 'bagus',
      },
      issues: aparData.issues || [],
      hasHydrotestBugFixed: true
    };

    // Optimistic UI update
    setApars(prev => [newApar, ...prev]);

    try {
      const dbPayload = mapAparToDb(newApar);
      const { error } = await supabase.from('apars').insert(dbPayload);
      if (error) throw error;
      notifySuccess(`Tabung ${newApar.assetCode} berhasil disimpan ke Supabase.`);
      await fetchAllData({ silent: true });
    } catch (e) {
      console.error('Supabase addApar error:', e);
      setApars(prev => prev.filter(a => a.id !== newApar.id));
      showErrorAlert('Gagal Menyimpan APAR', e.message || 'Terjadi kesalahan saat menyimpan ke Supabase.');
      throw e;
    }

    return newApar;
  };

  const updateApar = async (id, updates) => {
    const originalApar = apars.find(a => a.id === id);
    let updatedApar = null;

    const nextMfg = updates.manufactureDate !== undefined ? updates.manufactureDate : originalApar?.manufactureDate;
    const nextHydro = calculateNextHydrotestDate(nextMfg);

    let nextRigId = updates.rigId || originalApar?.rigId;
    let nextRigCode = originalApar?.rigCode;
    if (updates.rigId) {
      const foundRig = rigs.find(r => r.id === updates.rigId || r.code === updates.rigId);
      if (foundRig) {
        nextRigId = foundRig.id;
        nextRigCode = foundRig.code;
      }
    }

    setApars(prev => prev.map(apar => {
      if (apar.id !== id) return apar;

      updatedApar = {
        ...apar,
        ...updates,
        rigId: nextRigId,
        rig_id: nextRigId,
        rigCode: nextRigCode,
        nextHydrotestDate: nextHydro || apar.nextHydrotestDate,
        next_hydrotest_date: nextHydro || apar.next_hydrotest_date
      };
      return updatedApar;
    }));

    if (updatedApar) {
      try {
        const dbPayload = mapAparToDb(updatedApar);
        const { error } = await supabase.from('apars').update(dbPayload).eq('id', id);
        if (error) throw error;

        // Beri tahu jika terjadi perpindahan rig
        if (originalApar && updates.rigId && updates.rigId !== originalApar.rigId) {
          notifySuccess(`Tabung ${updatedApar.assetCode} berhasil dipindahkan ke Rig ${nextRigCode}.`);
        } else {
          notifySuccess(`Perubahan ${updatedApar.assetCode} disimpan ke Supabase.`);
        }
        await fetchAllData({ silent: true });
      } catch (e) {
        console.error('Supabase updateApar error:', e);
        if (originalApar) {
          setApars(prev => prev.map(a => a.id === id ? originalApar : a));
        }
        showErrorAlert('Gagal Memperbarui APAR', e.message || 'Terjadi kesalahan saat update di Supabase.');
        throw e;
      }
    }
  };

  const deleteApar = async (id) => {
    const backup = apars.find(a => a.id === id);
    setApars(prev => prev.filter(a => a.id !== id));

    try {
      const { error } = await supabase.from('apars').delete().eq('id', id);
      if (error) throw error;
      notifySuccess('Tabung berhasil dihapus dari Supabase.');
      await fetchAllData({ silent: true });
    } catch (e) {
      console.error('Supabase deleteApar error:', e);
      if (backup) setApars(prev => [backup, ...prev]);
      showErrorAlert('Gagal Menghapus APAR', e.message || 'Terjadi kesalahan saat menghapus dari Supabase.');
      throw e;
    }
  };

  const bulkImportApars = async (normalizedList) => {
    try {
      const dbRows = normalizedList.map(mapAparToDb);
      const { error } = await supabase.from('apars').upsert(dbRows, { onConflict: 'asset_code' });
      if (error) throw error;
      notifySuccess(`${normalizedList.length} tabung APAR tersinkron ke Supabase.`);
      await fetchAllData({ silent: true });
    } catch (e) {
      console.error('Supabase bulkImportApars error:', e);
      showErrorAlert('Gagal Impor APAR ke Supabase', e.message || 'Terjadi kesalahan saat mengimpor data ke database.');
      throw e;
    }
  };

  // =========================================================================
  // 5. ACTION RIGS & AKUN HFO (Tabel 'rigs' & 'hfo_users')
  // =========================================================================
  const addRig = async (code, name, location = '') => {
    const cleanCode = code.trim().toUpperCase();
    const id = cleanCode;
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
      if (error) throw error;
      notifySuccess(`Rig ${newRig.code} tersimpan ke Supabase.`);
      await fetchAllData({ silent: true });
    } catch (e) {
      console.error('Supabase addRig error:', e);
      setRigs(prev => prev.filter(r => r.id !== id));
      showErrorAlert('Gagal Menambah Rig', e.message || 'Terjadi kesalahan saat menyimpan Rig ke Supabase.');
      throw e;
    }

    return newRig;
  };

  const toggleRigStatus = async (rigId) => {
    const oldRig = rigs.find(r => r.id === rigId || r.code === rigId);
    if (!oldRig) {
      console.warn(`[toggleRigStatus] Rig ${rigId} tidak ditemukan.`);
      return;
    }

    const isCurrentlyActive = (oldRig.status === 'active' || oldRig.status === 'aktif');
    const nextUiStatus = isCurrentlyActive ? 'inactive' : 'active';
    const nextDbStatus = isCurrentlyActive ? 'nonaktif' : 'aktif';

    // 1. Optimistic UI update
    setRigs(prev => prev.map(r => (r.id === oldRig.id ? { ...r, status: nextUiStatus } : r)));

    try {
      // 2. Query update dengan .select() untuk verifikasi data benar-benar berubah di DB
      const { data, error } = await supabase
        .from('rigs')
        .update({ status: nextDbStatus })
        .eq('id', oldRig.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(
          `Gagal mengubah status Rig ${oldRig.code || oldRig.id} di database Supabase (0 baris terpengaruh). Pastikan RLS mengizinkan operasi UPDATE.`
        );
      }

      notifySuccess(`Status Rig ${oldRig.code || oldRig.name} berhasil diubah menjadi '${nextDbStatus.toUpperCase()}'.`);
      await fetchAllData({ silent: true });
      return data[0];
    } catch (e) {
      console.error('Supabase toggleRigStatus error:', e);
      // Rollback UI state jika gagal
      setRigs(prev => prev.map(r => (r.id === oldRig.id ? oldRig : r)));
      showErrorAlert('Gagal Mengubah Status Rig', e.message || 'Terjadi kesalahan saat mengupdate status di Supabase.');
      throw e;
    }
  };

  const resetHfoPassword = async (userId, newPassword = '123456') => {
    const oldUser = hfoUsers.find(u => u.id === userId);
    setHfoUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));

    try {
      const { error } = await supabase.from('hfo_users').update({ password: newPassword }).eq('id', userId);
      if (error) throw error;
      notifySuccess(`Password akun HFO berhasil di-reset ke ${newPassword} di Supabase.`);
      await fetchAllData({ silent: true });
    } catch (e) {
      console.error('Supabase resetHfoPassword error:', e);
      if (oldUser) setHfoUsers(prev => prev.map(u => u.id === userId ? oldUser : u));
      showErrorAlert('Gagal Reset Password HFO', e.message || 'Terjadi kesalahan di Supabase.');
      throw e;
    }
  };

  // =========================================================================
  // 6. SIKLUS PERBAIKAN TIKET (Tabel 'maintenances')
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

      if (error) throw error;
      notifySuccess('Perintah tindakan berhasil diproses. User di lapangan sekarang dapat mengunggah bukti perbaikan.');
      await fetchAllData({ silent: true });
    } catch (e) {
      console.error('Supabase dispatchMaintenance error:', e);
      showErrorAlert('Gagal Memproses Tindakan', e.message || 'Terjadi kesalahan saat memproses tiket di Supabase.');
      throw e;
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

      if (error) throw error;
      notifySuccess('Foto bukti berhasil terkirim ke Supabase.');
      await fetchAllData({ silent: true });
    } catch (e) {
      console.error('Supabase submitEvidence error:', e);
      showErrorAlert('Gagal Mengunggah Bukti', e.message || 'Terjadi kesalahan saat menyimpan bukti di Supabase.');
      throw e;
    }
  };

  // c. Admin memverifikasi bukti foto (Setujui atau Tolak)
  const verifyMaintenance = async (maintenanceId, isApproved, adminNotes) => {
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];
    const targetTicket = maintenances.find(m => m.id === maintenanceId);
    if (!targetTicket) return;

    if (isApproved) {
      // 1. Tutup Tiket
      setMaintenances(prev => prev.map(m => {
        if (m.id !== maintenanceId) return m;
        return {
          ...m,
          status: 'closed',
          adminNotes: adminNotes || 'Disetujui Admin HSE. Hasil perbaikan valid.',
          resolvedAt: nowIso
        };
      }));

      // 2. Pulihkan APAR menjadi Layak & perbarui tanggal hydrotest jika uji tekan
      const isHydrotest = targetTicket.actionType === 'hydrotest';
      const nextHydro = isHydrotest ? calculateNextHydrotestDate(today) : null;

      let targetAparRealId = targetTicket.aparId;
      setApars(prev => prev.map(apar => {
        if (apar.id !== targetTicket.aparId && apar.assetCode !== targetTicket.assetCode) return apar;
        targetAparRealId = apar.id;
        return {
          ...apar,
          status: 'layak',
          issues: [],
          lastHydrotestDate: isHydrotest ? today : apar.lastHydrotestDate,
          nextHydrotestDate: isHydrotest ? nextHydro : apar.nextHydrotestDate
        };
      }));

      // 3. Update Supabase
      try {
        const { error: maintErr } = await supabase.from('maintenances').update({
          status: 'closed',
          admin_notes: adminNotes || 'Disetujui Admin HSE. Hasil perbaikan valid.',
          resolved_at: nowIso
        }).eq('id', maintenanceId);
        if (maintErr) throw maintErr;

        if (targetAparRealId) {
          const aparUpdates = {
            status: 'layak',
            ...(isHydrotest ? {
              last_hydrotest_date: today,
              next_hydrotest_date: nextHydro
            } : {})
          };
          const { error: aparErr } = await supabase.from('apars').update(aparUpdates).eq('id', targetAparRealId);
          if (aparErr) throw aparErr;
        }

        notifySuccess('Tiket berhasil disetujui & ditutup. Status APAR otomatis kembali LAYAK.');
        await fetchAllData({ silent: true });
      } catch (e) {
        console.error('Supabase verifyMaintenance error:', e);
        showErrorAlert('Gagal Verifikasi Tiket', e.message || 'Terjadi kesalahan saat menyetujui tiket di Supabase.');
        throw e;
      }
    } else {
      // Tolak / Kembalikan ke Lapangan
      const rejectNote = adminNotes?.trim() || 'Foto bukti tidak memenuhi standar K3 / perlu perbaikan ulang.';
      setMaintenances(prev => prev.map(m => {
        if (m.id !== maintenanceId) return m;
        return {
          ...m,
          status: 'in_progress',
          adminNotes: rejectNote
        };
      }));

      try {
        const { error } = await supabase.from('maintenances').update({
          status: 'in_progress',
          admin_notes: rejectNote
        }).eq('id', maintenanceId);
        if (error) throw error;
        notifyWarning('Tiket ditolak dan dikembalikan ke status Dikerjakan. Catatan revisi telah dikirim ke lapangan.');
        await fetchAllData({ silent: true });
      } catch (e) {
        console.error('Supabase reject maintenance error:', e);
        showErrorAlert('Gagal Menolak Tiket', e.message || 'Terjadi kesalahan saat menolak tiket di Supabase.');
        throw e;
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
      findingPhoto: null,
      evidencePhoto: null,
      evidenceUploadedBy: null,
      repairNotes: null,
      adminNotes: 'Dibuat terjadwal via Modul Admin',
      resolvedAt: null
    };

    setMaintenances(prev => [newTicket, ...prev]);

    try {
      const dbPayload = mapMaintenanceToDb(newTicket);
      const { error } = await supabase.from('maintenances').insert(dbPayload);
      if (error) throw error;
      notifySuccess(`Tiket terjadwal ${actionType} berhasil dibuat di Supabase.`);
      await fetchAllData({ silent: true });
    } catch (e) {
      console.error('Supabase createManualMaintenance error:', e);
      setMaintenances(prev => prev.filter(m => m.id !== newTicket.id));
      showErrorAlert('Gagal Membuat Tiket', e.message || 'Terjadi kesalahan di Supabase.');
      throw e;
    }

    return newTicket;
  };

  // e. User submit hasil inspeksi rutin di lapangan (Tabel 'inspections')
  const recordInspection = async (aparId, {
    components,
    issues,
    inspectorName = 'Inspector Lapangan',
    inspectionPhoto = null,
    category = 'bulanan',
    thirdPartyVendor = null
  }) => {
    const today = new Date().toISOString().split('T')[0];
    const isDamaged = issues && issues.length > 0;
    const targetApar = apars.find(a => a.id === aparId);

    const newInspection = {
      id: `insp-${Date.now()}`,
      aparId,
      rigId: targetApar?.rigId || 'BMS-02',
      inspectorName,
      inspectionDate: today,
      category: category || 'bulanan',
      thirdPartyVendor: thirdPartyVendor || targetApar?.vendor || 'PT Sepakat HSE Solution',
      checklist: {
        handle: components?.handle || 'bagus',
        hose: components?.hose || 'bagus',
        nozzle: components?.nozle || 'bagus',
        cylinderGuard: components?.pengamanTabung || 'bagus',
        pinHandle: components?.pinHandle || 'bagus',
        pressureGauge: components?.pressureGauge || 'bagus',
        cylinder: components?.tabung || 'bagus',
        photo: inspectionPhoto || null,
        inspection_photo: inspectionPhoto || null,
      },
      overallStatus: isDamaged ? 'tidak_layak' : 'layak',
      notes: issues?.join(', ') || 'Semua komponen dalam kondisi baik.',
      inspectionPhoto: inspectionPhoto || null
    };

    setInspections(prev => [newInspection, ...prev]);

    // Jika rusak, otomatis buat tiket masuk 'open'
    if (isDamaged) {
      const newTicket = {
        id: `maint-${Date.now()}`,
        aparId,
        assetCode: targetApar?.assetCode || 'UNKNOWN',
        rigId: targetApar?.rigId || 'BMS-02',
        rigCode: targetApar?.rigCode || 'BMS-02',
        inspectionId: newInspection.id,
        reportedBy: inspectorName,
        reportedAt: new Date().toISOString(),
        issueDescription: issues.join(', '),
        status: 'open',
        actionType: 'perbaikan',
        vendorName: targetApar?.vendor || 'PT Sepakat HSE Solution',
        findingPhoto: inspectionPhoto || null,
        evidencePhoto: inspectionPhoto || null,
        evidenceUploadedBy: inspectorName,
        repairNotes: null,
        adminNotes: null,
        resolvedAt: null
      };
      setMaintenances(prev => [newTicket, ...prev]);

      try {
        const { error: aparErr } = await supabase.from('apars').update({ status: 'perlu_perbaikan' }).eq('id', aparId);
        if (aparErr) throw aparErr;
        const { error: inspErr } = await supabase.from('inspections').insert(mapInspectionToDb(newInspection));
        if (inspErr) throw inspErr;
        const { error: maintErr } = await supabase.from('maintenances').insert(mapMaintenanceToDb(newTicket));
        if (maintErr) throw maintErr;
        await fetchAllData({ silent: true });
      } catch (e) {
        console.error('Supabase inspection record error:', e);
        showErrorAlert('Gagal Menyimpan Inspeksi', e.message || 'Terjadi kesalahan saat menyimpan ke Supabase.');
        throw e;
      }
    } else {
      try {
        const { error: aparErr } = await supabase.from('apars').update({ status: 'layak' }).eq('id', aparId);
        if (aparErr) throw aparErr;
        const { error: inspErr } = await supabase.from('inspections').insert(mapInspectionToDb(newInspection));
        if (inspErr) throw inspErr;
        await fetchAllData({ silent: true });
      } catch (e) {
        console.error('Supabase inspection record error:', e);
        showErrorAlert('Gagal Menyimpan Inspeksi', e.message || 'Terjadi kesalahan saat menyimpan ke Supabase.');
        throw e;
      }
    }
  };

  // f. Admin Update Hydrotest Khusus Pihak ke-3 (dengan upload dokumen/sertifikat)
  const updateAparHydrotest = async (aparId, {
    testDate,
    nextDueDate,
    vendorName = 'PT Sepakat HSE Solution',
    certificateNo = '',
    documentData,
    documentName = 'Sertifikat_Hydrotest.pdf',
    notes = '',
    closeRelatedTicket = true
  }) => {
    const targetApar = apars.find(a => a.id === aparId || a.assetCode === aparId);
    if (!targetApar) {
      showErrorAlert('APAR Tidak Ditemukan', 'Tabung APAR yang dimaksud tidak ditemukan.');
      return false;
    }

    const logId = `hydro-${Date.now()}`;
    const realAparId = targetApar.id;
    const rigId = targetApar.rigId;
    const updatedBy = currentUser?.name || 'Admin HSE Pusat';

    const newLog = {
      id: logId,
      aparId: realAparId,
      apar_id: realAparId,
      assetCode: targetApar.assetCode,
      asset_code: targetApar.assetCode,
      rigId: rigId,
      rig_id: rigId,
      rigCode: targetApar.rigCode,
      testDate: testDate,
      test_date: testDate,
      nextDueDate: nextDueDate,
      next_due_date: nextDueDate,
      vendorName: vendorName,
      vendor_name: vendorName,
      certificateNo: certificateNo || '-',
      certificate_no: certificateNo || '-',
      documentData: documentData,
      document_data: documentData,
      documentName: documentName,
      document_name: documentName,
      updatedBy: updatedBy,
      updated_by: updatedBy,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // 1. Optimistic update hydrotestLogs
    setHydrotestLogs(prev => [newLog, ...prev]);

    // 2. Optimistic update apars: perbarui last_hydrotest_date, next_hydrotest_date, hydrotest_doc_url, doc_name, vendor
    setApars(prev => prev.map(a => {
      if (a.id !== realAparId) return a;
      return {
        ...a,
        lastHydrotestDate: testDate,
        last_hydrotest_date: testDate,
        nextHydrotestDate: nextDueDate,
        next_hydrotest_date: nextDueDate,
        hydrotestDocUrl: documentData,
        hydrotest_doc_url: documentData,
        hydrotestDocName: documentName,
        hydrotest_doc_name: documentName,
        hydrotestVendor: vendorName,
        hydrotest_vendor: vendorName,
        status: a.status === 'afkir' ? 'afkir' : 'layak',
        issues: a.issues ? a.issues.filter(i => !i.toLowerCase().includes('hydrotest')) : []
      };
    }));

    // 3. Optimistic update ticket jika ada tiket hydrotest terbuka
    let closedTicketId = null;
    const openHydroTicket = maintenances.find(m =>
      (m.aparId === realAparId || m.assetCode === targetApar.assetCode) &&
      m.actionType === 'hydrotest' &&
      (m.status === 'open' || m.status === 'in_progress' || m.status === 'pending_review')
    );

    if (openHydroTicket && closeRelatedTicket) {
      closedTicketId = openHydroTicket.id;
      setMaintenances(prev => prev.map(m => {
        if (m.id !== closedTicketId) return m;
        return {
          ...m,
          status: 'closed',
          evidencePhoto: documentData,
          evidence_photo: documentData,
          evidenceUploadedBy: updatedBy,
          repairNotes: `Sertifikat Hydrotest #${certificateNo || '-'} oleh ${vendorName}`,
          adminNotes: `Hydrotest selesai diverifikasi oleh ${updatedBy}. Sertifikat: ${certificateNo || '-'}`,
          resolvedAt: new Date().toISOString()
        };
      }));
    }

    // 4. Kirim ke Supabase
    try {
      // a. Insert log riwayat hydrotest
      const dbLogPayload = mapHydrotestLogToDb(newLog);
      const { error: logErr } = await supabase.from('hydrotest_logs').insert(dbLogPayload);
      if (logErr) throw logErr;

      // b. Update tabel apars
      const aparUpdatePayload = {
        last_hydrotest_date: testDate,
        next_hydrotest_date: nextDueDate,
        hydrotest_doc_url: documentData,
        hydrotest_doc_name: documentName,
        hydrotest_vendor: vendorName,
        ...(targetApar.status !== 'afkir' ? { status: 'layak' } : {})
      };
      const { error: aparErr } = await supabase.from('apars').update(aparUpdatePayload).eq('id', realAparId);
      if (aparErr) throw aparErr;

      // c. Update ticket jika ada
      if (closedTicketId) {
        await supabase.from('maintenances').update({
          status: 'closed',
          evidence_photo: documentData,
          evidence_uploaded_by: updatedBy,
          repair_notes: `Sertifikat Hydrotest #${certificateNo || '-'} oleh ${vendorName}`,
          admin_notes: `Hydrotest selesai diverifikasi oleh ${updatedBy}. Sertifikat: ${certificateNo || '-'}`,
          resolved_at: new Date().toISOString()
        }).eq('id', closedTicketId);
      }

      notifySuccess(`Sertifikat Hydrotest ${targetApar.assetCode} berhasil disimpan & berlaku s.d. ${formatHseDate(nextDueDate)}.`);
      await fetchAllData({ silent: true });
      return true;
    } catch (e) {
      console.error('Supabase updateAparHydrotest error:', e);
      showErrorAlert('Gagal Memperbarui Hydrotest', e.message || 'Terjadi kesalahan di database Supabase.');
      await fetchAllData({ silent: true });
      throw e;
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
      : { role: 'user', name: 'ANDI KURNIAWAN S (HFO)', email: 'hfo.bms02@besmindo.co.id', rigId: rigId || 'BMS-02' };
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
      hydrotestLogs,
      hfoUsers,
      currentUser,
      isSupabaseConnected,
      supabaseSyncStatus,
      lastSyncTime,
      loadAllFromSupabase,
      fetchAllData,
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
      updateAparHydrotest,
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

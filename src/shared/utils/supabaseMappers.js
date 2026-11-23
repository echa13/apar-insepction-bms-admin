/**
 * Bidirectional Data Mappers: Supabase (snake_case) <-> Application (camelCase)
 * Menyelaraskan 100% skema tabel antara Proyek ADMIN dan Proyek USER.
 */

// ==========================================
// 1. RIGS MAPPER
// ==========================================
export function mapRigFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    location: `${row.name} Area Operasional`,
    status: row.status === 'aktif' ? 'active' : 'inactive',
  };
}

export function mapRigToDb(appRig) {
  if (!appRig) return null;
  return {
    id: appRig.id,
    code: appRig.code,
    name: appRig.name,
    status: appRig.status === 'active' ? 'aktif' : 'nonaktif',
  };
}

// ==========================================
// 2. APAR TYPES MAPPER
// ==========================================
export function mapAparTypeFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: `${row.media} (${row.capacity_label})`,
    medium: row.media,
    capacity: row.capacity_label,
    capacityLabel: row.capacity_label,
    hasPressureGauge: Boolean(row.has_pressure_gauge),
    hydrotestIntervalYears: row.hydrotest_years || 5,
  };
}

export function mapAparTypeToDb(appType) {
  if (!appType) return null;
  return {
    id: appType.id,
    media: appType.medium || appType.name,
    capacity_label: appType.capacity || appType.capacityLabel || '9 Kg',
    has_pressure_gauge: appType.hasPressureGauge !== undefined ? appType.hasPressureGauge : true,
    hydrotest_years: appType.hydrotestIntervalYears || 5,
  };
}

// ==========================================
// 3. HFO USERS MAPPER
// ==========================================
export function mapHfoUserFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    rigId: row.rig_id,
    name: row.name,
    position: row.position,
    role: row.role,
    password: row.password,
  };
}

export function mapHfoUserToDb(appUser) {
  if (!appUser) return null;
  return {
    id: appUser.id,
    rig_id: appUser.rigId,
    name: appUser.name,
    position: appUser.position || 'HFO Officer',
    role: appUser.role || 'user',
    password: appUser.password || '123456',
  };
}

// ==========================================
// 4. APARS MAPPER
// ==========================================
export function mapAparFromDb(row, rigLookup = {}, typeLookup = {}) {
  if (!row) return null;
  const rig = rigLookup[row.rig_id] || { code: row.rig_id || 'BMS-02' };

  // Status mapping: DB 'perlu_perbaikan' <-> UI 'rusak'
  let uiStatus = 'layak';
  if (row.status === 'perlu_perbaikan' || row.status === 'rusak') uiStatus = 'rusak';
  else if (row.status === 'afkir') uiStatus = 'afkir';

  return {
    id: row.id,
    assetCode: row.asset_code,
    asset_code: row.asset_code,
    rigId: row.rig_id,
    rig_id: row.rig_id,
    rigCode: rig.code,
    typeId: row.apar_type_id || 'type_powder_9kg',
    apar_type_id: row.apar_type_id || 'type_powder_9kg',
    brand: row.brand_model || 'BMS Standard',
    brand_model: row.brand_model || 'BMS Standard',
    serialNo: row.serial_no || '-',
    serial_no: row.serial_no || '-',
    placement: row.placement || 'Area Kerja Rig',
    charge: row.charge_owner || 'BMS',
    charge_owner: row.charge_owner || 'BMS',
    manufactureDate: row.manufacture_date || null,
    manufacture_date: row.manufacture_date || null,
    manufactureRaw: row.manufacture_date ? '' : 'TIDAK TERBACA',
    lastHydrotestDate: row.last_hydrotest_date || null,
    last_hydrotest_date: row.last_hydrotest_date || null,
    nextHydrotestDate: row.next_hydrotest_date || null,
    next_hydrotest_date: row.next_hydrotest_date || null,
    status: uiStatus,
    createdAt: row.created_at,
    created_at: row.created_at,
    components: {
      handle: 'bagus',
      hose: uiStatus === 'rusak' ? 'rusak' : 'bagus',
      nozle: 'bagus',
      pengamanTabung: 'bagus',
      pinHandle: 'bagus',
      pressureGauge: (row.apar_type_id === 'type_co2' || row.apar_type_id === 'co2_cylinder') ? 'na' : 'bagus',
      tabung: 'bagus',
    },
    issues: uiStatus === 'rusak' ? ['Perlu Tindakan Perbaikan K3'] : [],
    hasHydrotestBugFixed: true
  };
}

export function mapAparToDb(appApar) {
  if (!appApar) return null;

  // Status mapping: UI 'rusak' <-> DB 'perlu_perbaikan'
  let dbStatus = 'layak';
  if (appApar.status === 'rusak' || appApar.status === 'perlu_perbaikan') dbStatus = 'perlu_perbaikan';
  else if (appApar.status === 'afkir') dbStatus = 'afkir';

  return {
    id: appApar.id,
    asset_code: appApar.assetCode || appApar.asset_code,
    rig_id: appApar.rigId || appApar.rig_id,
    apar_type_id: appApar.typeId || appApar.apar_type_id || 'type_powder_9kg',
    brand_model: appApar.brand || appApar.brand_model || 'BMS Standard',
    serial_no: appApar.serialNo || appApar.serial_no || '-',
    placement: appApar.placement || 'Area Kerja Rig',
    charge_owner: appApar.charge || appApar.charge_owner || 'BMS',
    manufacture_date: appApar.manufactureDate || appApar.manufacture_date || null,
    last_hydrotest_date: appApar.lastHydrotestDate || appApar.last_hydrotest_date || null,
    next_hydrotest_date: appApar.nextHydrotestDate || appApar.next_hydrotest_date || null,
    status: dbStatus,
  };
}

// ==========================================
// 5. INSPECTIONS MAPPER
// ==========================================
export function mapInspectionFromDb(row, aparLookup = {}) {
  if (!row) return null;
  let checklist = row.checklist || {};
  if (typeof checklist === 'string') {
    try {
      checklist = JSON.parse(checklist);
    } catch {
      checklist = {};
    }
  }

  const photo = row.inspection_photo || row.inspectionPhoto || checklist?.photo || checklist?.inspection_photo || checklist?.foto || checklist?.image || row.photo || row.evidence_photo || null;
  const apar = aparLookup[row.apar_id] || aparLookup[row.apar_id?.toLowerCase()] || {};

  return {
    id: row.id,
    aparId: row.apar_id,
    apar_id: row.apar_id,
    assetCode: apar.assetCode || apar.asset_code || row.apar_id,
    asset_code: apar.assetCode || apar.asset_code || row.apar_id,
    rigId: row.rig_id,
    rig_id: row.rig_id,
    inspectorName: row.inspector_name || 'HFO Lapangan',
    inspector_name: row.inspector_name,
    inspectionDate: row.inspection_date,
    inspection_date: row.inspection_date,
    category: row.category,
    thirdPartyVendor: row.third_party_vendor,
    third_party_vendor: row.third_party_vendor,
    checklist,
    overallStatus: row.overall_status,
    overall_status: row.overall_status,
    notes: row.notes,
    inspectionPhoto: photo,
    inspection_photo: photo,
    createdAt: row.created_at,
    created_at: row.created_at,
  };
}

export function mapInspectionToDb(appInsp) {
  if (!appInsp) return null;
  const photo = appInsp.inspectionPhoto || appInsp.inspection_photo || appInsp.checklist?.photo || appInsp.checklist?.inspection_photo || null;
  const baseChecklist = appInsp.checklist || {};
  const checklistWithPhoto = {
    ...baseChecklist,
    ...(photo ? { photo, inspection_photo: photo } : {})
  };

  return {
    id: appInsp.id,
    apar_id: appInsp.aparId || appInsp.apar_id,
    rig_id: appInsp.rigId || appInsp.rig_id,
    inspector_name: appInsp.inspectorName || appInsp.inspector_name || 'HFO Inspector',
    inspection_date: appInsp.inspectionDate || appInsp.inspection_date || new Date().toISOString().split('T')[0],
    category: appInsp.category || 'bulanan',
    third_party_vendor: appInsp.thirdPartyVendor || appInsp.third_party_vendor || 'PT Sepakat HSE Solution',
    checklist: checklistWithPhoto,
    overall_status: appInsp.overallStatus || appInsp.overall_status || 'layak',
    notes: appInsp.notes || '',
  };
}

// ==========================================
// 6. MAINTENANCES MAPPER
// ==========================================
export function mapMaintenanceFromDb(row, aparLookup = {}, rigLookup = {}) {
  if (!row) return null;
  const apar = aparLookup[row.apar_id] || {};
  const rig = rigLookup[row.rig_id] || {};

  const rawPhoto = row.finding_photo || row.findingPhoto || row.evidence_photo || row.evidencePhoto || null;
  const findingPhoto = rawPhoto;
  const evidencePhoto = row.evidence_photo || row.evidencePhoto || null;

  return {
    id: row.id,
    aparId: row.apar_id,
    apar_id: row.apar_id,
    assetCode: apar.assetCode || apar.asset_code || 'APAR-UNKNOWN',
    asset_code: apar.assetCode || apar.asset_code || 'APAR-UNKNOWN',
    rigId: row.rig_id,
    rig_id: row.rig_id,
    rigCode: rig.code || row.rig_id || 'BMS-02',
    placement: apar.placement || 'Area Rig Operasional',
    brand: apar.brand || apar.brand_model || 'Firex',
    inspectionId: row.inspection_id || row.inspectionId || null,
    inspection_id: row.inspection_id || row.inspectionId || null,
    reportedBy: row.reported_by || 'HFO Lapangan',
    reported_by: row.reported_by || 'HFO Lapangan',
    issueDescription: row.issue_description || '',
    issue_description: row.issue_description || '',
    actionType: row.action_type || 'perbaikan',
    action_type: row.action_type || 'perbaikan',
    status: row.status || 'open',
    vendorName: row.vendor_name || 'PT Sepakat HSE Solution',
    vendor_name: row.vendor_name || 'PT Sepakat HSE Solution',
    findingPhoto: findingPhoto,
    finding_photo: findingPhoto,
    evidencePhoto: evidencePhoto,
    evidence_photo: evidencePhoto,
    evidenceUploadedBy: row.evidence_uploaded_by || row.evidenceUploadedBy || null,
    evidence_uploaded_by: row.evidence_uploaded_by || row.evidenceUploadedBy || null,
    repairNotes: row.repair_notes || row.repairNotes || null,
    repair_notes: row.repair_notes || row.repairNotes || null,
    adminNotes: row.admin_notes || row.adminNotes || null,
    admin_notes: row.admin_notes || row.adminNotes || null,
    createdAt: row.created_at,
    created_at: row.created_at,
    reportedAt: row.created_at,
    resolvedAt: row.resolved_at || null,
    resolved_at: row.resolved_at || null,
  };
}

export function mapMaintenanceToDb(appMaint) {
  if (!appMaint) return null;
  const photo = appMaint.evidencePhoto || appMaint.evidence_photo || appMaint.findingPhoto || appMaint.finding_photo || null;
  return {
    id: appMaint.id,
    apar_id: appMaint.aparId || appMaint.apar_id,
    rig_id: appMaint.rigId || appMaint.rig_id,
    inspection_id: appMaint.inspectionId || appMaint.inspection_id || null,
    reported_by: appMaint.reportedBy || appMaint.reported_by || 'HFO Lapangan',
    issue_description: appMaint.issueDescription || appMaint.issue_description,
    action_type: appMaint.actionType || appMaint.action_type || 'perbaikan',
    status: appMaint.status || 'open',
    vendor_name: appMaint.vendorName || appMaint.vendor_name || 'PT Sepakat HSE Solution',
    evidence_photo: photo,
    evidence_uploaded_by: appMaint.evidenceUploadedBy || appMaint.evidence_uploaded_by || null,
    repair_notes: appMaint.repairNotes || appMaint.repair_notes || null,
    admin_notes: appMaint.adminNotes || appMaint.admin_notes || null,
    resolved_at: appMaint.resolvedAt || appMaint.resolved_at || null,
  };
}

/**
 * Chained Fallback Helper untuk Mendapatkan Foto Temuan Awal (Before)
 * 1. Cek langsung foto temuan awal di tiket (findingPhoto / finding_photo)
 * 2. Cek inspeksi terkait berdasarkan inspectionId
 * 3. Cek riwayat inspeksi APAR ini (prioritas status 'tidak_layak', tanggal terbaru)
 * 4. Cek foto bukti di tiket itu sendiri (evidencePhoto / evidence_photo)
 * 5. Cek histori tiket maintenance lain milik APAR yang sama
 */
export function getTicketBeforePhoto(ticket, inspections = [], allMaintenances = []) {
  if (!ticket) return null;

  const clean = (s) => (s ? String(s).toLowerCase().replace(/[^a-z0-9]/g, '') : '');

  const extractPhoto = (item) => {
    if (!item) return null;
    if (typeof item === 'string') {
      if (item.startsWith('data:image') || item.startsWith('http://') || item.startsWith('https://')) return item;
      return null;
    }
    let chk = item.checklist;
    if (typeof chk === 'string') {
      try { chk = JSON.parse(chk); } catch { chk = {}; }
    }
    return item.findingPhoto || item.finding_photo ||
           item.inspectionPhoto || item.inspection_photo ||
           chk?.photo || chk?.inspection_photo || chk?.foto || chk?.image || chk?.evidence_photo || chk?.finding_photo ||
           item.evidencePhoto || item.evidence_photo ||
           item.photo || item.photoUrl || item.imageUrl || null;
  };

  // 1. Cek langsung di tiket
  if (ticket.findingPhoto) return ticket.findingPhoto;
  if (ticket.finding_photo) return ticket.finding_photo;

  // 2. Cek inspeksi terkait berdasarkan inspectionId
  const inspId = clean(ticket.inspectionId || ticket.inspection_id);
  if (inspId && Array.isArray(inspections)) {
    const matched = inspections.find(i => clean(i.id) === inspId);
    if (matched) {
      const p = extractPhoto(matched);
      if (p) return p;
    }
  }

  // 3. Cek inspeksi APAR terkait yang punya foto (cari berdasarkan aparId atau assetCode secara normalized)
  const targetAparId = clean(ticket.aparId || ticket.apar_id);
  const targetAsset = clean(ticket.assetCode || ticket.asset_code);

  if (Array.isArray(inspections) && (targetAparId || targetAsset)) {
    const matchedInsps = inspections.filter(i => {
      const iAparId = clean(i.aparId || i.apar_id);
      const iAsset = clean(i.assetCode || i.asset_code);
      return (
        (targetAparId && (iAparId === targetAparId || iAsset === targetAparId)) ||
        (targetAsset && (iAparId === targetAsset || iAsset === targetAsset)) ||
        (targetAparId && iAparId && (iAparId.includes(targetAparId) || targetAparId.includes(iAparId)))
      );
    });

    if (matchedInsps.length > 0) {
      // Prioritas 1: temuan yang statusnya 'tidak_layak'
      // Prioritas 2: tanggal terbaru
      const sorted = [...matchedInsps].sort((a, b) => {
        const aIsBad = (a.overallStatus === 'tidak_layak' || a.overall_status === 'tidak_layak') ? 1 : 0;
        const bIsBad = (b.overallStatus === 'tidak_layak' || b.overall_status === 'tidak_layak') ? 1 : 0;
        if (aIsBad !== bIsBad) return bIsBad - aIsBad;
        const dateA = new Date(a.inspectionDate || a.inspection_date || a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.inspectionDate || b.inspection_date || b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      for (const insp of sorted) {
        const p = extractPhoto(insp);
        if (p) return p;
      }
    }
  }

  // 4. Cek foto bukti di tiket itu sendiri (terisi saat pelapor melampirkan foto temuan awal)
  if (ticket.evidencePhoto) return ticket.evidencePhoto;
  if (ticket.evidence_photo) return ticket.evidence_photo;

  // 5. Cek tiket maintenance lain milik APAR yang sama yang memiliki foto
  if (Array.isArray(allMaintenances) && (targetAparId || targetAsset)) {
    const matchedMaints = allMaintenances.filter(m => {
      if (m.id === ticket.id) return false;
      const mAparId = clean(m.aparId || m.apar_id);
      const mAsset = clean(m.assetCode || m.asset_code);
      return (
        (targetAparId && (mAparId === targetAparId || mAsset === targetAparId)) ||
        (targetAsset && (mAparId === targetAsset || mAsset === targetAsset))
      );
    });

    if (matchedMaints.length > 0) {
      const sorted = [...matchedMaints].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || a.reportedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || b.reportedAt || 0).getTime();
        return dateB - dateA;
      });

      for (const m of sorted) {
        const p = extractPhoto(m);
        if (p) return p;
      }
    }
  }

  return null;
}

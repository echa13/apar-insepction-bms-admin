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
  const rig = rigLookup[row.rig_id] || { code: 'BMS-01' };

  // Status mapping: DB 'perlu_perbaikan' <-> UI 'rusak'
  let uiStatus = 'layak';
  if (row.status === 'perlu_perbaikan' || row.status === 'rusak') uiStatus = 'rusak';
  else if (row.status === 'afkir') uiStatus = 'afkir';

  return {
    id: row.id,
    assetCode: row.asset_code,
    rigId: row.rig_id,
    rigCode: rig.code,
    typeId: row.apar_type_id || 'dry_powder_9kg',
    brand: row.brand_model || 'Firex',
    serialNo: row.serial_no || 'TIDAK TERBACA',
    placement: row.placement,
    charge: row.charge_owner || 'BMS',
    manufactureDate: row.manufacture_date || null,
    manufactureRaw: row.manufacture_date ? '' : 'TIDAK TERBACA',
    lastHydrotestDate: row.last_hydrotest_date || null,
    nextHydrotestDate: row.next_hydrotest_date || null,
    status: uiStatus,
    createdAt: row.created_at,
    components: {
      handle: 'bagus',
      hose: uiStatus === 'rusak' ? 'rusak' : 'bagus',
      nozle: 'bagus',
      pengamanTabung: 'bagus',
      pinHandle: 'bagus',
      pressureGauge: row.apar_type_id === 'co2_cylinder' ? 'na' : 'bagus',
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
    asset_code: appApar.assetCode,
    rig_id: appApar.rigId,
    apar_type_id: appApar.typeId || 'dry_powder_9kg',
    brand_model: appApar.brand || 'Firex',
    serial_no: appApar.serialNo || 'TIDAK TERBACA',
    placement: appApar.placement || 'Rig Carrier',
    charge_owner: appApar.charge || 'BMS',
    manufacture_date: appApar.manufactureDate || null,
    last_hydrotest_date: appApar.lastHydrotestDate || null,
    next_hydrotest_date: appApar.nextHydrotestDate || null,
    status: dbStatus,
  };
}

// ==========================================
// 5. INSPECTIONS MAPPER
// ==========================================
export function mapInspectionFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    aparId: row.apar_id,
    rigId: row.rig_id,
    inspectorName: row.inspector_name || 'HFO Lapangan',
    inspectionDate: row.inspection_date,
    category: row.category,
    thirdPartyVendor: row.third_party_vendor,
    checklist: row.checklist || {},
    overallStatus: row.overall_status,
    notes: row.notes,
    inspectionPhoto: row.inspection_photo || row.inspectionPhoto || row.checklist?.photo || row.checklist?.inspection_photo || null,
    createdAt: row.created_at,
  };
}

export function mapInspectionToDb(appInsp) {
  if (!appInsp) return null;
  return {
    id: appInsp.id,
    apar_id: appInsp.aparId,
    rig_id: appInsp.rigId,
    inspector_name: appInsp.inspectorName || 'HFO Inspector',
    inspection_date: appInsp.inspectionDate || new Date().toISOString().split('T')[0],
    category: appInsp.category || 'bulanan',
    third_party_vendor: appInsp.thirdPartyVendor || 'PT Sepakat HSE Solution',
    checklist: appInsp.checklist || {},
    overall_status: appInsp.overallStatus || 'layak',
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

  return {
    id: row.id,
    aparId: row.apar_id,
    assetCode: apar.assetCode || apar.asset_code || 'APAR-UNKNOWN',
    rigId: row.rig_id,
    rigCode: rig.code || row.rig_id || 'BMS-01',
    placement: apar.placement || 'Area Rig Operasional',
    brand: apar.brand || apar.brand_model || 'Firex',
    inspectionId: row.inspection_id || null,
    reportedBy: row.reported_by || 'HFO Lapangan',
    issueDescription: row.issue_description || '',
    actionType: row.action_type || 'perbaikan',
    status: row.status || 'open',
    vendorName: row.vendor_name || 'PT Sepakat HSE Solution',
    findingPhoto: row.finding_photo || row.findingPhoto || (row.evidence_photo && row.status === 'open' ? row.evidence_photo : null) || null,
    evidencePhoto: row.evidence_photo || null,
    evidenceUploadedBy: row.evidence_uploaded_by || null,
    repairNotes: row.repair_notes || null,
    adminNotes: row.admin_notes || null,
    createdAt: row.created_at,
    reportedAt: row.created_at,
    resolvedAt: row.resolved_at || null,
  };
}

export function mapMaintenanceToDb(appMaint) {
  if (!appMaint) return null;
  return {
    id: appMaint.id,
    apar_id: appMaint.aparId,
    rig_id: appMaint.rigId,
    inspection_id: appMaint.inspectionId || null,
    reported_by: appMaint.reportedBy || 'HFO Lapangan',
    issue_description: appMaint.issueDescription,
    action_type: appMaint.actionType || 'perbaikan',
    status: appMaint.status || 'open',
    vendor_name: appMaint.vendorName || 'PT Sepakat HSE Solution',
    evidence_photo: appMaint.evidencePhoto || null,
    evidence_uploaded_by: appMaint.evidenceUploadedBy || null,
    repair_notes: appMaint.repairNotes || null,
    admin_notes: appMaint.adminNotes || null,
    resolved_at: appMaint.resolvedAt || null,
  };
}

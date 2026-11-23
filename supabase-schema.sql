-- ==============================================================================
-- SKEMA DATABASE SUPABASE: SISTEM TRACKING & INSPEKSI APAR (K3 BMS)
-- Selaras 100% Antara Proyek ADMIN dan Proyek USER
-- Jalankan skrip ini pada Supabase SQL Editor (https://supabase.com/dashboard/project/vekfijwvhzphqvkbjltb/sql)
-- ==============================================================================

-- 1. TABEL rigs
CREATE TABLE IF NOT EXISTS public.rigs (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif'))
);

-- 2. TABEL apar_types
CREATE TABLE IF NOT EXISTS public.apar_types (
    id TEXT PRIMARY KEY,
    media TEXT NOT NULL,
    capacity_label TEXT NOT NULL,
    has_pressure_gauge BOOLEAN NOT NULL DEFAULT true,
    hydrotest_years INTEGER NOT NULL DEFAULT 5
);

-- 3. TABEL hfo_users
CREATE TABLE IF NOT EXISTS public.hfo_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    rig_id TEXT REFERENCES public.rigs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT NOT NULL DEFAULT 'HFO Officer',
    role TEXT NOT NULL DEFAULT 'user',
    password TEXT NOT NULL DEFAULT '123456'
);

-- 4. TABEL apars
CREATE TABLE IF NOT EXISTS public.apars (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    asset_code TEXT NOT NULL UNIQUE,
    rig_id TEXT REFERENCES public.rigs(id) ON DELETE CASCADE,
    apar_type_id TEXT REFERENCES public.apar_types(id) ON DELETE RESTRICT,
    brand_model TEXT,
    serial_no TEXT,
    placement TEXT NOT NULL,
    charge_owner TEXT NOT NULL DEFAULT 'BMS',
    manufacture_date DATE,
    last_hydrotest_date DATE,
    next_hydrotest_date DATE,
    status TEXT NOT NULL DEFAULT 'layak' CHECK (status IN ('layak', 'perlu_perbaikan', 'afkir')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABEL inspections
CREATE TABLE IF NOT EXISTS public.inspections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    apar_id TEXT REFERENCES public.apars(id) ON DELETE CASCADE,
    rig_id TEXT REFERENCES public.rigs(id) ON DELETE CASCADE,
    inspector_name TEXT NOT NULL,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL DEFAULT 'bulanan' CHECK (category IN ('bulanan', 'tahunan')),
    third_party_vendor TEXT,
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
    overall_status TEXT NOT NULL DEFAULT 'layak' CHECK (overall_status IN ('layak', 'tidak_layak')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABEL maintenances
CREATE TABLE IF NOT EXISTS public.maintenances (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    apar_id TEXT REFERENCES public.apars(id) ON DELETE CASCADE,
    rig_id TEXT REFERENCES public.rigs(id) ON DELETE CASCADE,
    inspection_id TEXT REFERENCES public.inspections(id) ON DELETE SET NULL,
    reported_by TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    action_type TEXT NOT NULL DEFAULT 'perbaikan' CHECK (action_type IN ('perbaikan', 'pergantian', 'isi_ulang', 'hydrotest')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_review', 'closed')),
    vendor_name TEXT DEFAULT 'PT Sepakat HSE Solution',
    evidence_photo TEXT,
    evidence_uploaded_by TEXT,
    repair_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- ==============================================================================
-- KEBIJAKAN AKSES ROW LEVEL SECURITY (RLS) UNTUK ANON/PUBLIC KEY
-- ==============================================================================
ALTER TABLE public.rigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apar_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hfo_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access rigs" ON public.rigs;
CREATE POLICY "Public access rigs" ON public.rigs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access apar_types" ON public.apar_types;
CREATE POLICY "Public access apar_types" ON public.apar_types FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access hfo_users" ON public.hfo_users;
CREATE POLICY "Public access hfo_users" ON public.hfo_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access apars" ON public.apars;
CREATE POLICY "Public access apars" ON public.apars FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access inspections" ON public.inspections;
CREATE POLICY "Public access inspections" ON public.inspections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access maintenances" ON public.maintenances;
CREATE POLICY "Public access maintenances" ON public.maintenances FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- AKTIFKAN SUPABASE REALTIME REPLICATION
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'apars'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.apars;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'inspections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inspections;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'maintenances'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenances;
  END IF;
END $$;

-- ==============================================================================
-- SEED DATA AWAL MASTER
-- ==============================================================================

-- Seed rigs (18 Rig Operasional BMS)
INSERT INTO public.rigs (id, code, name, status) VALUES
('rig-bms-01', 'BMS-01', 'Rig BMS-01', 'aktif'),
('rig-bms-02', 'BMS-02', 'Rig BMS-02', 'aktif'),
('rig-bms-03', 'BMS-03', 'Rig BMS-03', 'aktif'),
('rig-bms-3a',  'BMS-3A', 'Rig BMS-3A', 'aktif'),
('rig-bms-05', 'BMS-05', 'Rig BMS-05', 'aktif'),
('rig-bms-06', 'BMS-06', 'Rig BMS-06', 'aktif'),
('rig-bms-07', 'BMS-07', 'Rig BMS-07', 'aktif'),
('rig-bms-08', 'BMS-08', 'Rig BMS-08', 'aktif'),
('rig-bms-09', 'BMS-09', 'Rig BMS-09', 'aktif'),
('rig-bms-10', 'BMS-10', 'Rig BMS-10', 'aktif'),
('rig-bms-11', 'BMS-11', 'Rig BMS-11', 'aktif'),
('rig-bms-15', 'BMS-15', 'Rig BMS-15', 'aktif'),
('rig-bms-16', 'BMS-16', 'Rig BMS-16', 'aktif'),
('rig-bms-17', 'BMS-17', 'Rig BMS-17', 'aktif'),
('rig-bms-18', 'BMS-18', 'Rig BMS-18', 'aktif'),
('rig-bms-19', 'BMS-19', 'Rig BMS-19', 'aktif'),
('rig-bms-20', 'BMS-20', 'Rig BMS-20', 'aktif'),
('rig-bms-21', 'BMS-21', 'Rig BMS-21', 'aktif')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

-- Seed apar_types (7 Master Tipe K3)
INSERT INTO public.apar_types (id, media, capacity_label, has_pressure_gauge, hydrotest_years) VALUES
('dry_powder_9kg', 'Dry Chemical Powder ABC', '9 Kg', true, 5),
('dry_powder_6kg', 'Dry Chemical Powder ABC', '6 Kg', true, 5),
('dry_powder_4kg', 'Dry Chemical Powder ABC', '4 Kg', true, 5),
('dry_powder_3kg', 'Dry Chemical Powder ABC', '3 Kg', true, 5),
('co2_cylinder', 'Carbon Dioxide (CO2)', '15 Lbs (6.8 Kg)', false, 5),
('foam_trolley_100l', 'AFFF Foam', '100 Liter', true, 5),
('powder_trolley_150lbs', 'Dry Chemical Powder ABC', '150 Lbs (75 Kg)', true, 5)
ON CONFLICT (id) DO UPDATE SET media = EXCLUDED.media, capacity_label = EXCLUDED.capacity_label, has_pressure_gauge = EXCLUDED.has_pressure_gauge;

-- Seed hfo_users (Akun Petugas HFO Rig Lapangan)
INSERT INTO public.hfo_users (id, rig_id, name, position, role, password) VALUES
('hfo-bms-07', 'rig-bms-07', 'Ilham Prasetyo', 'HFO Officer Rig BMS-07', 'user', '123456'),
('hfo-bms-18', 'rig-bms-18', 'Budi Santoso', 'HFO Officer Rig BMS-18', 'user', '123456'),
('hfo-bms-10', 'rig-bms-10', 'Agus Setiawan', 'HFO Officer Rig BMS-10', 'user', '123456'),
('hfo-bms-16', 'rig-bms-16', 'Dedi Kurniawan', 'HFO Officer Rig BMS-16', 'user', '123456'),
('hfo-bms-01', 'rig-bms-01', 'Fajar Ramadhan', 'HFO Officer Rig BMS-01', 'user', '123456')
ON CONFLICT (id) DO NOTHING;

// 7 Tipe APAR Standar Armada Rig BMS (100% Selaras dengan Database Supabase sql.txt)
export const aparTypesSeed = [
  {
    id: 'type_powder_9kg',
    name: 'Dry Chemical Powder (9 Kg)',
    category: 'Portable',
    capacity: '9 Kg',
    capacityLabel: '9 Kg',
    medium: 'Dry Chemical Powder',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'APAR standar area operasional rig, carrier, mud pump, tangki, dan workshop.'
  },
  {
    id: 'type_powder_3kg',
    name: 'Dry Chemical Powder (3 Kg)',
    category: 'Portable',
    capacity: '3 Kg',
    capacityLabel: '3 Kg',
    medium: 'Dry Chemical Powder',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'APAR kendaraan ringan (LV TP, Rig Supt, Bus Crew).'
  },
  {
    id: 'type_powder_6kg',
    name: 'Dry Chemical Powder (6 Kg)',
    category: 'Portable',
    capacity: '6 Kg',
    capacityLabel: '6 Kg',
    medium: 'Dry Chemical Powder',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'APAR tabung sedang untuk area station box dan workshop.'
  },
  {
    id: 'type_powder_75kg',
    name: 'Dry Chemical Powder 75 Kg (150 Lbs)',
    category: 'Wheeled / Trolley',
    capacity: '75 Kg (150 Lbs)',
    capacityLabel: '75 Kg (150 Lbs)',
    medium: 'Dry Chemical Powder',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'Trolley mobile berkapasitas besar proteksi utama area Fire Box dan Rig Carrier.'
  },
  {
    id: 'type_foam_100l',
    name: 'AFFF Foam (100 Liter)',
    category: 'Wheeled / Trolley',
    capacity: '100 Liter',
    capacityLabel: '100 Liter',
    medium: 'AFFF (Aqueous Film Forming Foam)',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'Trolley mobile untuk proteksi kebakaran hidrokarbon/cair (Tangki BBM, Fire Box, Mud Pit).'
  },
  {
    id: 'type_co2',
    name: 'Carbon Dioxide Gas (High Pressure)',
    category: 'Portable / Trolley',
    capacity: '5 Kg - 150 Lbs',
    capacityLabel: '5 Kg - 150 Lbs',
    medium: 'Carbon Dioxide Gas (High Pressure)',
    hasPressureGauge: false, // CO2 tidak memiliki jarum manometer / pressure gauge
    hydrotestIntervalYears: 5,
    description: 'Khusus untuk kebakaran kelas C (kelistrikan, genset, accumulator, dan switchboard).'
  },
  {
    id: 'type_clean_agent',
    name: 'Halon Replacement / Clean Agent Gas (5 Kg)',
    category: 'Portable',
    capacity: '5 Kg',
    capacityLabel: '5 Kg',
    medium: 'Halon Replacement / Clean Agent Gas',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'Gas bersih non-residu khusus untuk Rig Office, ruang server, dan instrumentasi.'
  }
];

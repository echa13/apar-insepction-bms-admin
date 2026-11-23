export const aparTypesSeed = [
  {
    id: 'dry_powder_9kg',
    name: 'Powder 9 Kg ABC',
    category: 'Portable',
    capacity: '9 Kg',
    medium: 'Dry Chemical Powder ABC',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'APAR standar area operasional rig, carrier, mud pump, tangki, dan workshop.'
  },
  {
    id: 'dry_powder_6kg',
    name: 'Powder 6 Kg ABC',
    category: 'Portable',
    capacity: '6 Kg',
    medium: 'Dry Chemical Powder ABC',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'APAR tabung sedang untuk bus crew, station box, dan camp.'
  },
  {
    id: 'dry_powder_4kg',
    name: 'Powder 4 Kg ABC',
    category: 'Portable',
    capacity: '4 Kg',
    medium: 'Dry Chemical Powder ABC',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'APAR tabung kendaraan operasional ringan dan bus crew.'
  },
  {
    id: 'dry_powder_3kg',
    name: 'Powder 3 Kg ABC',
    category: 'Portable',
    capacity: '3 Kg',
    medium: 'Dry Chemical Powder ABC',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'APAR kendaraan ringan (LV TP, Rig Supt, Karavan).'
  },
  {
    id: 'co2_cylinder',
    name: 'CO2 (Carbon Dioxide)',
    category: 'Portable / Trolley',
    capacity: '15 Lbs / 6.8 Kg',
    medium: 'Carbon Dioxide (CO2)',
    hasPressureGauge: false, // Wajib false - CO2 tidak memiliki jarum manometer
    hydrotestIntervalYears: 5,
    description: 'Khusus untuk kebakaran kelas C (kelistrikan, genset, accumulator, dan switchboard).'
  },
  {
    id: 'foam_trolley_100l',
    name: 'Foam Trolley 100 Liter',
    category: 'Wheeled / Trolley',
    capacity: '100 Liter',
    medium: 'AFFF Foam',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'Trolley mobile untuk proteksi kebakaran hidrokarbon/cair (Tangki BBM, Fire Box, Mud Pit).'
  },
  {
    id: 'powder_trolley_150lbs',
    name: 'Powder Trolley 150 Lbs / 75 Kg',
    category: 'Wheeled / Trolley',
    capacity: '150 Lbs (68-75 Kg)',
    medium: 'Dry Chemical Powder ABC',
    hasPressureGauge: true,
    hydrotestIntervalYears: 5,
    description: 'Trolley mobile berkapasitas besar proteksi utama area Fire Box dan Rig Carrier.'
  }
];

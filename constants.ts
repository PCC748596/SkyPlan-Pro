
import { AssignmentType, CrewMember, Flight, Aircraft } from './types';

// 0=DOM, 1=SEG, 2=TER, 3=QUA, 4=QUI, 5=SEX, 6=SÁB
export const FLIGHTS: Flight[] = [
  { 
    code: 'LV9000', 
    route: 'VCP-MAO', 
    start: '08:00', 
    end: '12:00', 
    active: true,
    daysOfWeek: [1, 3, 5], 
    composition: 'SIMPLES',
    serviceType: 'DOMESTICO',
    aircraftType: 'JATO',
    landings: 1,
    hasRestFacility: false,
    timezonesCrossed: 1
  },
  { 
    code: 'LV9001', 
    route: 'MAO-VCP', 
    start: '14:00', 
    end: '18:00', 
    active: true,
    daysOfWeek: [1, 3, 5], 
    composition: 'SIMPLES',
    serviceType: 'DOMESTICO',
    aircraftType: 'JATO',
    landings: 1,
    hasRestFacility: false,
    timezonesCrossed: 1
  },
  { 
    code: 'LV9002', 
    route: 'VCP-REC', 
    start: '08:00', 
    end: '11:00', 
    active: true,
    daysOfWeek: [1, 2, 3, 4, 5],
    composition: 'SIMPLES',
    serviceType: 'DOMESTICO',
    aircraftType: 'JATO',
    landings: 1,
    hasRestFacility: false,
    timezonesCrossed: 0
  },
  { 
    code: 'LV9003', 
    route: 'REC-VCP', 
    start: '13:00', 
    end: '16:15', 
    active: true,
    daysOfWeek: [1, 2, 3, 4, 5],
    composition: 'SIMPLES',
    serviceType: 'DOMESTICO',
    aircraftType: 'JATO',
    landings: 1,
    hasRestFacility: false,
    timezonesCrossed: 0
  }
];

export const MOCK_AIRCRAFT: Aircraft[] = [
  { 
    id: 'A1', registration: 'PR-LVA', model: 'A321-200', config: 'Y220', 
    status: 'OPERATIONAL', hours: 14200, cycles: 8900, nextCheck: '12/12/2026',
    paxCapacity: 220, cargoCapacity: 27000, hasAPU: true, hasStairs: false,
    hasSeat: true, isRestricted: false, notes: 'Aeronave Principal', 
    company: 'LEVU AIR CARGO', dateStart: '01/01/2020', dateEnd: '01/01/2030'
  }
];

export const MOCK_CREW: CrewMember[] = [
  // Comandantes (CAPT)
  { 
    id: '1', name: 'ANDRE PESSOA', role: 'CMTE', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2022-08-01',
    adminTag: 'ADM.DO', operationalTag: 'OFF', instructionTag: null, syntheticTag: null,
    tagHistory: [],
    lastCheckRideDate: '2025-06-15',
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 }, 
    isOn: true,
    isAqExp: false,
    codAnac: '817122', matricula: '001', cpf: '024.917.327-18', seniority: '01'
  },
  { 
    id: '2', name: 'MACHADO', role: 'CMTE', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2022-08-01', resignationDate: '2025-01-09',
    adminTag: null, operationalTag: 'OFF', instructionTag: null, syntheticTag: null,
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 }, 
    isOn: false,
    isAqExp: false,
    codAnac: '000002', matricula: '002', seniority: '02'
  },
  { 
    id: '3', name: 'PAULO CORREA', role: 'CMTE', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2024-02-19',
    adminTag: 'ADM.PC', operationalTag: 'AVBL', instructionTag: 'TRE', syntheticTag: 'SFE',
    tagHistory: [],
    lastCheckRideDate: '2025-08-20',
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
    isOn: true,
    isAqExp: false,
    codAnac: '775866', matricula: '003', cpf: '022.398.297-02', seniority: '03'
  },
  { 
    id: '4', name: 'MARCO MONTEIRO', role: 'CMTE', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2024-03-04',
    adminTag: null, operationalTag: 'AVBL', instructionTag: 'TRI', syntheticTag: 'SFI',
    tagHistory: [],
    lastCheckRideDate: '2024-01-10',
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
    isOn: true,
    isAqExp: false,
    codAnac: '589879', matricula: '004', cpf: '534.265.099-20', seniority: '04'
  },
  { 
    id: '5', name: 'WILLIAN', role: 'CMTE', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2024-03-04', resignationDate: '2025-01-09',
    adminTag: null, operationalTag: 'OFF', instructionTag: null, syntheticTag: null,
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
    isOn: false,
    isAqExp: false,
    codAnac: '000005', matricula: '005', seniority: '05'
  },
  { 
    id: '6', name: 'ANDERSON', role: 'CMTE', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2024-06-03', resignationDate: '2025-01-09',
    adminTag: null, operationalTag: 'OFF', instructionTag: null, syntheticTag: null,
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
    isOn: false,
    isAqExp: false,
    codAnac: '000006', matricula: '006', seniority: '06'
  },
  { 
    id: '7', name: 'SPAGNOLO', role: 'CMTE', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2025-06-23',
    adminTag: null, operationalTag: 'AVBL', instructionTag: 'TRI', syntheticTag: 'SFI',
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
    isOn: true,
    isAqExp: false,
    codAnac: '122396', matricula: '007', seniority: '07'
  },
  { 
    id: '8', name: 'NASCIMENTO', role: 'CMTE', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2025-06-23',
    adminTag: null, operationalTag: 'AVBL', instructionTag: null, syntheticTag: null,
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
    isOn: true,
    isAqExp: false,
    codAnac: '965780', matricula: '008', seniority: '08'
  },
  { 
    id: '88', name: 'SCHUMACHER', role: 'CMTE', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2025-06-23',
    adminTag: 'ADM.GK', operationalTag: 'AVBL', instructionTag: 'TRI', syntheticTag: null,
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
    isOn: true,
    isAqExp: false,
    codAnac: '118480', matricula: '008', seniority: '08'
  },
  { 
    id: '9', name: 'FABIO LIUT', role: 'CMTE', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2025-06-23',
    adminTag: null, operationalTag: 'AVBL', instructionTag: 'TRI', syntheticTag: 'SFI',
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
    isOn: true,
    isAqExp: false,
    codAnac: '124490', matricula: '009', seniority: '09'
  },
  { 
    id: '109', name: 'RODRIGO CESAR', role: 'CMTE', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2025-06-23', resignationDate: '2025-09-10',
    adminTag: null, operationalTag: 'OFF', instructionTag: null, syntheticTag: null,
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
    isOn: false,
    isAqExp: false,
    codAnac: '000109', matricula: '109', seniority: '09'
  },
  
  // Copilotos (FO)
  { 
    id: '102', name: 'CRIPPA', role: 'COP', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2024-06-03',
    adminTag: null, operationalTag: 'REQ', instructionTag: null, syntheticTag: null,
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
    isOn: true,
    isAqExp: false,
    codAnac: '840686', matricula: '102', seniority: '102'
  },
  { 
    id: '103', name: 'ELTON CACEFFO', role: 'COP', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2024-06-03', resignationDate: '2025-01-09',
    adminTag: null, operationalTag: 'OFF', instructionTag: null, syntheticTag: null,
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 }, 
    isOn: false,
    isAqExp: false,
    codAnac: '000103', matricula: '103', seniority: '103'
  },
  { 
    id: '104', name: 'MASCARENHAS', role: 'COP', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2024-06-03', resignationDate: '2025-01-09',
    adminTag: null, operationalTag: 'OFF', instructionTag: null, syntheticTag: null,
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 }, 
    isOn: false,
    isAqExp: false,
    codAnac: '000104', matricula: '104', seniority: '104'
  },
  { 
    id: '105', name: 'LEONARDO PRADO', role: 'COP', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2025-06-23',
    adminTag: null, operationalTag: 'AGD', instructionTag: null, syntheticTag: null,
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 }, 
    isOn: true,
    isAqExp: false,
    codAnac: '131362', matricula: '105', seniority: '105'
  },
  { 
    id: '106', name: 'LUCAS MENERO', role: 'COP', category: 'TRIPULANTE_VOO', nationality: 'BRASILEIRO', licenseValid: true,
    base: 'VCP', equipment: 'A321', admissionDate: '2024-03-04',
    adminTag: 'ADM.GR', operationalTag: 'AVBL', instructionTag: null, syntheticTag: null,
    tagHistory: [],
    fatigueStatus: 'FIT',
    stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 }, 
    isOn: true,
    isAqExp: false,
    codAnac: '119280', matricula: '106', seniority: '106'
  },
];

export const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export const ACTIVITY_COLORS: Record<string, string> = {
  // Main Statuses
  'FR': 'bg-emerald-200 border-emerald-300 text-emerald-950 font-semibold', 
  'FP': 'bg-emerald-200 border-emerald-300 text-emerald-950 font-semibold', 
  'FS': 'bg-yellow-400 border-yellow-500 text-yellow-950 font-semibold', 
  'MNT': 'bg-amber-100 border-amber-300 text-amber-900 font-bold',
  
  // Inactivities / Admin
  'ADM 1': 'bg-blue-200 border-blue-300 text-blue-950 font-semibold',
  'ADM 2': 'bg-blue-200 border-blue-300 text-blue-950 font-semibold',
  'AGD REQ': 'bg-blue-300 border-blue-400 text-blue-950 font-semibold',
  'AGD INS': 'bg-slate-200 border-slate-300 text-slate-900 font-semibold',
  
  // Standby / Reserve
  'SA': 'bg-slate-600 border-slate-700 text-slate-100 font-semibold', 
  'RE': 'bg-slate-600 border-slate-700 text-slate-100 font-semibold', 
  
  // Greens (Modules)
  'JEPPSEN': 'bg-emerald-300 border-emerald-400 text-emerald-950 font-semibold',
  'FLYSMART': 'bg-emerald-300 border-emerald-400 text-emerald-950 font-semibold',
  'PPSP': 'bg-emerald-300 border-emerald-400 text-emerald-950 font-semibold',
  'AVSEC': 'bg-emerald-300 border-emerald-400 text-emerald-950 font-semibold',
  'LVP': 'bg-emerald-300 border-emerald-400 text-emerald-950 font-semibold',
  'PBN': 'bg-emerald-300 border-emerald-400 text-emerald-950 font-semibold',

  // Yellows / Tans (Modules)
  'DOBA': 'bg-yellow-200 border-yellow-300 text-yellow-950 font-semibold',
  'EMG': 'bg-yellow-200 border-yellow-300 text-yellow-950 font-semibold',
  'ALU-TRI-TRE': 'bg-yellow-200 border-yellow-300 text-yellow-950 font-semibold',

  // Oranges (Modules)
  'EFB': 'bg-orange-400 border-orange-500 text-orange-950 font-semibold',
  'GRF': 'bg-orange-400 border-orange-500 text-orange-950 font-semibold',
  'SGSO': 'bg-orange-400 border-orange-500 text-orange-950 font-semibold',
  'DGR CAT 10': 'bg-orange-400 border-orange-500 text-orange-950 font-semibold',
  'SOP': 'bg-orange-400 border-orange-500 text-orange-950 font-semibold',
  'SIGLA': 'bg-orange-400 border-orange-500 text-orange-950 font-semibold',

  // Grays / Lights
  'GS A320': 'bg-gray-400 border-gray-500 text-gray-950 font-semibold',
  'INS-TRI-TRE': 'bg-blue-200 border-blue-300 text-blue-950 font-semibold',

  // Simulators
  'EXPREC-SIM': 'bg-blue-900 border-blue-950 text-blue-100 font-semibold',
  'SIM': 'bg-blue-900 border-blue-950 text-blue-100',

  // Defaults / Categories
  'VOO': 'bg-emerald-900 border-emerald-700 text-emerald-100', 
  'GS': 'bg-indigo-900 border-indigo-700 text-indigo-100',
  'INAT': 'bg-amber-900 border-amber-700 text-amber-100', 
  'DLS': 'bg-violet-900 border-violet-700 text-violet-100', 
  'EXT': 'bg-violet-900 border-violet-700 text-violet-100', 
  'XQR': 'bg-pink-900 border-pink-700 text-pink-100 font-bold', 
  'EXM': 'bg-pink-900 border-pink-700 text-pink-100 font-bold', 
  'VAC': 'bg-cyan-600 border-cyan-500 text-white font-bold tracking-widest',
  'REPO': 'bg-slate-500 border-slate-400 text-white font-mono',
};

export const ACTIVITY_DESCRIPTIONS: Record<string, string> = {
  'RE': 'Reserva',
  'SA': 'Sobreaviso',
  'SIM': 'Simulador',
  'GS': 'Ground School',
  'FR': 'Folga Regulamentar',
  'FS': 'Folga Social',
  'INAT': 'Inatividade',
  'VOO': 'Voo',
  'DLS': 'Deslocamento (Extra a Serviço)',
  'XQR': 'CheckRide (Exame de Qualificação)',
  'EXM': 'Examinador (CheckRide)',
  'VAC': 'Férias Regulamentares',
  'REPO': 'Repouso Regulamentar'
};

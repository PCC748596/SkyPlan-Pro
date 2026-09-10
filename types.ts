
export type CrewRole = 'CMTE' | 'COP' | 'MEC' | 'COM';

// Art. 2º vs Art. 3º
export type CrewCategory = 'TRIPULANTE_VOO' | 'TRIPULANTE_CABINE';

export type Nationality = 'BRASILEIRO' | 'ESTRANGEIRO';

export type CrewCompositionType = 'MINIMA' | 'SIMPLES' | 'COMPOSTA' | 'REVEZAMENTO';
export type FlightServiceType = 'DOMESTICO' | 'INTERNACIONAL';

// Art. 33
export type AircraftType = 'JATO' | 'TURBOHELICE' | 'CONVENCIONAL' | 'HELICOPTERO';

export type AssignmentType = 
  | 'VOO' 
  | 'RE' // Reserva
  | 'SA' // Sobreaviso
  | 'SIM' // Simulador
  | 'GS' // Ground School
  | 'FR' // Folga Regulamentar
  | 'FS' // Folga Social
  | 'INAT' // Inatividade
  | 'DLS' // Deslocamento (Tripulante Extra a Serviço - Art. 4º)
  | 'DSL' // Deslocamento (Alias)
  | 'XQR' // CheckRide (Cheque de Qualificação)
  | 'VAC' // Férias (Art. 67)
  | 'REPO' // Repouso Regulamentar
  | 'MNT'; // Manutenção (Aeronave)

export interface Assignment {
  id: string;
  type: AssignmentType;
  code?: string; // Flight number or activity code
  route?: string; // e.g., VCP-MAO
  start?: string; // HH:mm
  end?: string; // HH:mm
  actualStart?: string; // Executed start
  actualEnd?: string; // Executed end
  details?: string;
  isExtraCrew?: boolean; // Art. 4º / Art. 34 flag
  presentationAirport?: string; // Art. 43 §1º
  accommodationType?: 'INDIVIDUAL' | 'SHARED' | 'INVALID' | 'NONE'; // Art 47
  transportAvailableTime?: string; // Art 47 §4
  isBase?: boolean; // Art 50
  vacationMetadata?: {
    noticeDate: Date; // Art 67 §2
    paymentDate: Date; // Art 71
    fractioningAgreement?: boolean; // Art 67 §1
  };
  // New fields for editing
  functionCode?: 'ALU' | 'INS' | 'EXM' | 'EXT' | 'OBS' | 'XQR' | 'XQR-TRI' | 'XQR-TRE' | 'XQR-SFI' | 'XQR-SFE' | 'EXPREC';
  airport?: string; // Added airport field
  aircraftId?: string; // LINK: ID of the aircraft assigned to this flight/duty
  maintenanceDates?: { startDate: string; endDate: string }; // For multi-day maintenance on aircraft
}

export interface ActivityDefinition {
  id: string;
  code: string;
  type: string; // Maps to AssignmentType or generic categories like 'CURSO', 'DIV'
  start: string;
  end: string;
  description: string;
  shortcut?: string;
  // flags
  pagaDiaria: boolean;
  relatorio: boolean;
  bloqueado: boolean;
  descontaAlmoco: boolean;
  verificaRepouso: boolean;
  naoPagaPublicada: boolean;
  fadiga: boolean;
  horarioObrigatorio: boolean;
  isFavorite: boolean; // NEW: Controls visibility in Sidebar
  color?: string; // NEW: Hex color for UI
}

export interface QualificationDefinition {
  id: string;
  code: string;
  description: string;
  isCritical: boolean;
  validityMonths?: number;
}

export interface CustomBlock {
  id: string;
  label: string;
  start: string;
  end: string;
}

export type AdminTag = 'ADM.DO' | 'ADM.PC' | 'ADM.DSO' | 'ADM.GK' | 'ADM.GR' | null;
export type OperationalTag = 'GS' | 'EMI' | 'AVBL' | 'REC' | 'OFF' | 'REQ' | 'AGD';
export type InstructionTag = 'TRI' | 'TRE' | null;
export type SyntheticTag = 'SFI' | 'SFE' | 'BANCA' | null;

// New Interface for Tag History
export interface TagHistoryEntry {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  adminTag: AdminTag;
  operationalTag: OperationalTag;
  instructionTag: InstructionTag;
  syntheticTag: SyntheticTag;
}

export interface CrewMember {
  id: string;
  name: string;
  role: CrewRole;
  category: CrewCategory; // Art. 2º / Art. 3º
  nationality: Nationality; // Art. 6º
  licenseValid: boolean; // Art. 1º §1º
  base: string; // Art. 35 (Base Contratual)
  equipment: string; // Art. 68 (Rodízio) e.g., 'A320', 'B737'
  admissionDate?: string; // YYYY-MM-DD
  resignationDate?: string; // YYYY-MM-DD (Desligamento)
  adminTag: AdminTag;
  operationalTag: OperationalTag;
  instructionTag: InstructionTag;
  syntheticTag: SyntheticTag; // NEW FIELD
  // Track changes by date ranges
  tagHistory: TagHistoryEntry[]; 
  lastCheckRideDate?: string; // YYYY-MM-DD
  lastAirportLanded?: string; // Tracks where the crew currently is (e.g., 'MAO')
  fatigueStatus: 'FIT' | 'FATIGUED'; // RBAC 117 Art. 11
  currentFatigueScore?: number; // Calculated fatigue score (0-16 scale) - Keeping for compat
  maxFatigueScore?: number; // Highest fatigue score in the current month view
  stats: {
    flightHours: number; // Month accumulation (HS)
    annualFlightHours: number; // Year accumulation (HST - Art. 33)
    baseAnnualHours?: number; // Base hours before schedule calculation
    instructionHours: number; // For XQR
    dutyTimeMonth: number; // Art. 41 (176h)
    dutyTimeWeek: number; // Art. 41 (44h) - simplified for current view
    standbyCount: number; // Art. 43 §7º (Max 8/month)
    daysOff: number; // Total Folgas (legacy)
    frCount: number; // Folgas Regulamentares Count
    fsCount: number; // Folgas Sociais Count
    dutyDays: number;
    minFR?: number;
    minFS?: number;
  };
  isOn: boolean;
  isAqExp?: boolean; // NEW: Aquisição de Experiência (High Hours for Check)
  // Extra fields for Registration (Cadastros)
  codAnac?: string;
  matricula?: string;
  cpf?: string;
  nascimento?: string;
  sexo?: string;
  email?: string;
  celular?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  pais?: string;
  cep?: string;
  bairro?: string;
  seniority?: string; // Senioridade
  // Technical Data Dates (Optional)
  roleDateStart?: string;
  roleDateEnd?: string;
  baseDateStart?: string;
  baseDateEnd?: string;
  equipmentDateStart?: string;
  equipmentDateEnd?: string;
  tagDateStart?: string;
  tagDateEnd?: string;
  qualifications?: {
    [code: string]: {
      courseDate?: string;
      referenceDate: string;
      expirationDate: string;
    }
  };
}

export interface Aircraft {
  id: string;
  registration: string; // Prefixo
  model: string; // Frota (Name)
  config: string; // Config.
  paxCapacity: number; // Capac. PAX
  cargoCapacity: number; // Capac. CGA
  hasAPU: boolean;
  hasStairs: boolean;
  hasSeat: boolean;
  isRestricted: boolean;
  notes: string; // Texto Aeronave
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'AOG';
  hours: number;
  cycles: number;
  nextCheck: string;
  company: string; // Empresa
  dateStart: string; // Início
  dateEnd: string; // Fim
  payload?: number;
  apuStatus?: 'AVLB' | 'NAVLB';
}

export interface CrewBase {
  id: string; // the airport code, e.g. VCP
  city: string; // e.g. CAMPINAS
}

export interface FleetType {
  id: string;
  code: string;
  speed: number;
  capaxPax: number;
  capaxCarga: number;
  fuel1: number;
  fuel2: number;
  fuelTaxi: number;
  capaxMax: number;
  iata: string;
  icao: string;
  internalCode: string;
  isCompanyFleet: boolean;
  color: string;
  qtyMaintenance: number;
  isJet: boolean;
  isMVT: boolean;
  hourValue: number;
  wingType: 'Fixa' | 'Rotativa';
  manufacturer: string;
  transportType: 'Carga' | 'Passageiro' | 'Misto';
}

export interface DayData {
  date: Date;
  dayOfMonth: number;
  dayOfWeek: string; // SEG, TER...
  isWeekend: boolean;
}

export interface Flight {
  code: string;
  route: string;
  start: string;
  end: string;
  active: boolean;
  daysOfWeek: number[]; // 0=Sun, 1=Mon...
  composition: CrewCompositionType; // Art. 13
  serviceType: FlightServiceType; // Art. 16/17 context
  aircraftType: AircraftType; // Art. 33
  landings: number; // Art. 31
  hasRestFacility: boolean; // Art. 29
  timezonesCrossed: number; // Art. 49
  justification?: string; // Required for Domestic Composite (Art. 16)
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  lawReference?: string; // e.g., "Lei 13.475 Art. 33"
}

// CHANGED: Support multiple assignments per day
export type ScheduleMap = Record<string, Record<string, Assignment[]>>; // CrewID -> DateStr -> Assignment List

// REGULATION TYPES
export interface ValidationResult {
  valid: boolean;
  message?: string;
  lawReference?: string;
  isWarning?: boolean;
  blockAction?: boolean;
  conversionAction?: 'TO_FR'; // For FS -> FR Logic
}

export interface RegulatoryConfig {
  sgrfhEnabled: boolean; // Art. 19 (Lei 13.475)
  collectiveAgreement: boolean; // Convenção ou Acordo Coletivo
  rbac117Appendix: 'A' | 'B_PLUS'; // RBAC 117: 'A' = Basic Limits, 'B_PLUS' = SGRF/GRF
}

// Art. 26 & 27
export type ScheduleType = 'MENSAL' | 'SEMANAL';
export type ServiceCategory = 'PASSAGEIRO' | 'CARGA' | 'OUTROS'; 

export interface ScheduleMetadata {
  type: ScheduleType;
  serviceCategory: ServiceCategory;
  publishDate: Date | null;
  weeklyCounter: number; // For Art 26 §1 (Max 4 months/year)
  logs?: any[];
}

export interface EquityResult {
  role: CrewRole;
  averageHours: number;
  discrepancyCrew: { name: string; hours: number; diff: number }[];
}

// NEW: Consolidated Generation Parameters
export interface GenerationParams {
  maxFlightHoursMonth: number; // e.g. 90
  maxFlightHoursYear: number; // e.g. 900
  maxStandbyMonth: number; // e.g. 8
  minDaysOffMonth: number; // e.g. 10
  usePattern5x3: boolean; // Pattern mode
  enableMonofolga: boolean; // Toggle Monofolga check
  generateRE: boolean; // Toggle automatic RE generation
  generateSA: boolean; // Toggle automatic SA generation
  
  // Custom Rest Rules (in minutes)
  minRestPostFlight: number; // Default 12:30 (750m)
  minRestPostStandby: number; // Default 10:00 (600m)
  minRestDefault: number; // Default 12:00 (720m) for other activities
  turnaroundTime: number; // Default 45m

  // Presentation Times (in minutes)
  presentationBase: number; // Default 60m
  presentationOutstation: number; // Default 30m

  // Madrugada Rules
  maxConsecutiveMadrugadas: number; // Default 2
  maxMadrugadasIn168h: number; // Default 4

  // Consecutive Days Rule
  maxConsecutiveDutyDays: number; // Default 6

  // Specific Days Off Rules
  minFrMonth: number; // Default 8
  minFsMonth: number; // Default 2
  maxFsMonth: number; // Default 2

  // Activity Defaults (in minutes)
  defaultDurationRE: number; // Default 180 (3h)
  defaultDurationSA: number; // Default 360 (6h)

  // Max Consecutive INAT
  maxConsecutiveInat: number; // Default 2

  // Max Duty for 100% Extra flights (in minutes)
  maxDutyExt: number; // Default 960 (16h)
}

// NEW: Generator Result Type
export type GenerationResult = 
  | { type: 'ASSIGNMENT'; crewId: string; date: Date; assignment: Assignment }
  | { type: 'REMOVAL'; crewId: string; date: Date; assignmentType: AssignmentType | 'ALL' }
  | { type: 'LOG'; message: string; level: 'info' | 'warning' | 'error' | 'success' }
  | { type: 'CREW_UPDATE'; crewId: string; updates: Partial<CrewMember> }; // NEW TYPE

export const DUTY_TYPES: AssignmentType[] = ['VOO', 'RE', 'SA', 'SIM', 'GS', 'DLS', 'XQR', 'REPO'];

export type SystemModule = 'ESCALA' | 'COORDENAÇÃO' | 'PLANEJAMENTO' | 'FADIGA';

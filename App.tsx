
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import Header from './components/Header';
import ScheduleGrid from './components/ScheduleGrid';
import EditAssignmentModal from './components/EditAssignmentModal'; 
import ActivitiesModal from './components/ActivitiesModal'; 
import QualificationModal from './components/QualificationModal'; 
import BasesModal from './components/BasesModal';
import ProgrammingCopyModal from './components/ProgrammingCopyModal';
import AircraftSearchModal from './components/AircraftSearchModal';
import FleetTypeModal from './components/FleetTypeModal';
import ClearScheduleModal from './components/ClearScheduleModal';
import GenerationSettingsModal from './components/GenerationSettingsModal';
import FlightNetworkModal from './components/FlightNetworkModal';
import FatigueModule from './components/FatigueModule'; 
import LoginScreen from './components/LoginScreen';
import { getStoredSession, logoutUser, UserSession } from './auth';
import { MOCK_CREW, MOCK_AIRCRAFT, FLIGHTS as INITIAL_FLIGHTS, MONTHS } from './constants';
import { getDaysInMonth, getDaysForGrid, recalculateCrewStats, sortAssignments, timeToMin, minToTime, syncQualificationsFromSchedule, calculateEligibilityDates } from './utils';
import { generateSchedule } from './ScheduleGenerator'; // IMPORTED FROM NEW FILE
import { dbInstance } from './database'; 
import { ScheduleMap, CrewMember, Flight, LogEntry, AssignmentType, Assignment, AdminTag, OperationalTag, InstructionTag, SyntheticTag, RegulatoryConfig, ScheduleMetadata, CustomBlock, ActivityDefinition, QualificationDefinition, TagHistoryEntry, Aircraft, FleetType, GenerationParams, GenerationResult, CrewBase } from './types';
import { 
  validateAssignment, 
  checkCrewEligibility, 
  validateTagApplication, 
  validateFlightCompositionAdd, 
  validateSchedulePublication, 
  STANDARD_TIMES, 
  calculateDutyWindow, 
  calculateRequiredRest, 
  getTimes,
  calculateSmartFolgaStartTime,
  getCrewLocation, 
  resolveCrewTags
} from './regulation';

export type SystemModule = 'ESCALA' | 'COORDENAÇÃO' | 'PLANEJAMENTO' | 'FADIGA';

const getDefaultActivities = (): ActivityDefinition[] => [
    { id: '1', code: 'FA', type: 'FR', start: '00:00', end: '00:00', description: 'FOLGA ANIVERSARIO', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: false, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: false, isFavorite: true, color: '#A7F3D0' },
    { id: '2', code: 'FR', type: 'FR', start: '00:00', end: '00:00', description: 'FOLGA REGULAMENTAR', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: false, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: false, isFavorite: true, color: '#A7F3D0' },
    { id: '3', code: 'FP', type: 'FR', start: '00:00', end: '00:00', description: 'FOLGA PEDIDA', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: false, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: false, isFavorite: true, color: '#A7F3D0' },
    { id: '4', code: 'FS', type: 'FS', start: '00:00', end: '00:00', description: 'FOLGA SOCIAL', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: false, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: false, isFavorite: true, color: '#FACC15' },
    { id: '5', code: 'IFR', type: 'CURSO', start: '08:30', end: '17:30', description: 'CURSO DE IFR', pagaDiaria: true, relatorio: true, bloqueado: false, descontaAlmoco: false, verificaRepouso: false, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: true, isFavorite: true, color: '#312E81' },
    { id: '6', code: 'EMG', type: 'CURSO', start: '08:30', end: '17:30', description: 'CURSO DE EMERGENCIAS GERAIS', pagaDiaria: true, relatorio: true, bloqueado: false, descontaAlmoco: true, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: true, isFavorite: true, color: '#312E81' },
    { id: '7', code: 'CRM', type: 'CURSO', start: '08:00', end: '17:00', description: 'CURSO - CREW RESOURCE MANAGEMENT', pagaDiaria: true, relatorio: true, bloqueado: false, descontaAlmoco: true, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: true, isFavorite: false, color: '#312E81' },
    { id: '8', code: 'PS', type: 'CURSO', start: '08:30', end: '17:30', description: 'CURSO DE PRIMEIROS SOCORROS', pagaDiaria: true, relatorio: true, bloqueado: false, descontaAlmoco: true, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: true, isFavorite: false, color: '#312E81' },
    { id: '9', code: 'FCMA', type: 'DIV', start: '07:00', end: '14:00', description: 'REVALIDACAO CMA', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: true, verificaRepouso: true, naoPagaPublicada: true, fadiga: false, horarioObrigatorio: false, isFavorite: false, color: '#334155' },
    { id: '10', code: 'LSV', type: 'NPP', start: '00:00', end: '23:59', description: 'LICENCA SEM VENCIMENTOS', pagaDiaria: false, relatorio: false, bloqueado: true, descontaAlmoco: false, verificaRepouso: false, naoPagaPublicada: true, fadiga: false, horarioObrigatorio: false, isFavorite: false, color: '#450A0A' },
    { id: '11', code: 'FERIAS', type: 'FERIAS', start: '00:00', end: '23:59', description: 'FERIAS', pagaDiaria: false, relatorio: false, bloqueado: true, descontaAlmoco: false, verificaRepouso: false, naoPagaPublicada: true, fadiga: false, horarioObrigatorio: false, isFavorite: true, color: '#0891B2' },
    { id: '12', code: 'INSS', type: 'INSS', start: '00:00', end: '23:59', description: 'INSS', pagaDiaria: false, relatorio: false, bloqueado: true, descontaAlmoco: false, verificaRepouso: false, naoPagaPublicada: true, fadiga: false, horarioObrigatorio: false, isFavorite: false, color: '#450A0A' },
    { id: '13', code: 'DEMISS', type: 'DIV', start: '00:00', end: '23:59', description: 'DEMISSIONARIO', pagaDiaria: false, relatorio: false, bloqueado: true, descontaAlmoco: false, verificaRepouso: false, naoPagaPublicada: true, fadiga: false, horarioObrigatorio: false, isFavorite: true, color: '#DC2626' },
    { id: '14', code: 'DM', type: 'DIV', start: '00:00', end: '23:59', description: 'DISPENSA MEDICA', pagaDiaria: false, relatorio: false, bloqueado: true, descontaAlmoco: false, verificaRepouso: false, naoPagaPublicada: true, fadiga: false, horarioObrigatorio: false, isFavorite: true, color: '#334155' },
    { id: '15', code: 'FALTA', type: 'DIV', start: '00:00', end: '00:00', description: 'FALTA', pagaDiaria: false, relatorio: false, bloqueado: true, descontaAlmoco: false, verificaRepouso: false, naoPagaPublicada: true, fadiga: false, horarioObrigatorio: false, isFavorite: false, color: '#334155' },
    { id: '16', code: 'TLDO', type: 'DIV', start: '00:00', end: '23:59', description: 'TRANSLADO', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: false, verificaRepouso: false, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: false, isFavorite: false, color: '#334155' },
    { id: '17', code: 'CURSO', type: 'CURSO', start: '08:30', end: '17:30', description: 'CURSO', pagaDiaria: true, relatorio: true, bloqueado: false, descontaAlmoco: true, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: true, isFavorite: true, color: '#312E81' },
    { id: '18', code: 'ADM 1', type: 'GS', start: '08:00', end: '18:00', description: 'ADMINISTRATIVO 1', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: true, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: true, isFavorite: true, color: '#BFDBFE' },
    { id: '19', code: 'ADM 2', type: 'GS', start: '08:00', end: '17:00', description: 'ADMINISTRATIVO 2', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: true, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: true, isFavorite: true, color: '#BFDBFE' },
    { id: '20', code: 'AGD REQ', type: 'GS', start: '00:00', end: '00:00', description: 'AGUARDANDO REQUALIFICACAO', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: true, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: true, isFavorite: true, color: '#312E81' },
    { id: '21', code: 'RE', type: 'RE', start: '06:00', end: '18:00', description: 'RESERVA', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: true, verificaRepouso: true, naoPagaPublicada: false, fadiga: true, horarioObrigatorio: true, isFavorite: true, color: '#475569' },
    { id: '22', code: 'SA', type: 'SA', start: '06:00', end: '18:00', description: 'SOBREAVISO', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: true, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: true, isFavorite: true, color: '#475569' },
    { id: '23', code: 'AGD INS', type: 'GS', start: '00:00', end: '00:00', description: 'AGUARDANDO INSTRUÇÃO', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: true, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: true, isFavorite: true, color: '#E2E8F0' },
    { id: '24', code: 'FM', type: 'FR', start: '00:00', end: '00:00', description: 'MONOFOLGA', pagaDiaria: false, relatorio: true, bloqueado: false, descontaAlmoco: false, verificaRepouso: true, naoPagaPublicada: false, fadiga: false, horarioObrigatorio: false, isFavorite: true, color: '#A7F3D0' }
];

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(() => getStoredSession());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [viewStartDate, setViewStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [activeModule, setActiveModule] = useState<SystemModule>('ESCALA');
  const [collapsed, setCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState<'CREW' | 'AIRCRAFT'>('CREW');
  
  const [schedule, setSchedule] = useState<ScheduleMap>({});
  const [crew, setCrew] = useState<CrewMember[]>(MOCK_CREW);
  const [aircraft, setAircraft] = useState<Aircraft[]>(MOCK_AIRCRAFT);
  const [flights, setFlights] = useState<Flight[]>(INITIAL_FLIGHTS);
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
  const [activities, setActivities] = useState<ActivityDefinition[]>(getDefaultActivities());

  const getDefaultBases = (): CrewBase[] => [
    { id: 'VCP', city: 'CAMPINAS' },
    { id: 'CGH', city: 'SÃO PAULO' },
    { id: 'CNF', city: 'BELO HORIZONTE' }
  ];

  const [bases, setBases] = useState<CrewBase[]>(getDefaultBases());

const getDefaultQualifications = (): QualificationDefinition[] => [
    { id: 'q1', code: 'CMA', description: 'CERTIFICADO MÉDICO AERONÁUTICO', isCritical: true },
    { id: 'q3', code: 'CHT', description: 'CERTIFICADO DE HABILITAÇÃO TÉCNICA', isCritical: true },
    { id: 'q4', code: 'PASSAPORTE', description: 'PASSAPORTE INTERNACIONAL', isCritical: true },
    { id: 'q5', code: 'VISTO', description: 'VISTO CONSULAR', isCritical: true },
    { id: 'q6', code: 'VACINA', description: 'CARTEIRA INTERNACIONAL DE VACINAÇÃO', isCritical: true },
    { id: 'q7', code: 'GRF', description: 'GRF', isCritical: true },
    { id: 'q8', code: 'SGSO', description: 'SGSO', isCritical: true },
    { id: 'q9', code: 'SIGLA', description: 'SIGLA', isCritical: true },
    { id: 'q10', code: 'PPSP', description: 'PPSP', isCritical: true },
    { id: 'q11', code: 'LVP', description: 'LVP', isCritical: true },
    { id: 'q12', code: 'PBN', description: 'PBN', isCritical: true },
    { id: 'q13', code: 'AVSEC', description: 'AVSEC', isCritical: true, validityMonths: 24 },
    { id: 'q14', code: 'UPRT', description: 'UPRT', isCritical: true },
    { id: 'q15', code: 'EFB', description: 'EFB', isCritical: true },
    { id: 'q16', code: 'CRM', description: 'CREW RESOURCE MANAGEMENT', isCritical: true },
    { id: 'q17', code: 'DGR', description: 'DGR', isCritical: true },
    { id: 'q18', code: 'EMG', description: 'EMERGENCIAS GERAIS', isCritical: true }, // Changed from EMERG
    { id: 'q19', code: 'SIST.A320', description: 'SIST.A320', isCritical: true },
    { id: 'q20', code: 'AS.OPER', description: 'AS.OPER', isCritical: true },
    { id: 'q21', code: 'MET', description: 'MET', isCritical: true },
    { id: 'q22', code: 'REGUL', description: 'REGUL', isCritical: true },
    { id: 'q23', code: 'INT.SIST', description: 'INT.SIST', isCritical: true },
    { id: 'q24', code: 'SOP', description: 'SOP', isCritical: true },
    { id: 'q25', code: 'ICE', description: 'ICE', isCritical: true },
    { id: 'q26', code: 'TRI', description: 'TYPE RATING INSTRUCTOR', isCritical: true, validityMonths: 24 },
    { id: 'q27', code: 'TRE', description: 'TYPE RATING EXAMINER', isCritical: true, validityMonths: 24 }
];

const mergeQualifications = (savedQuals: QualificationDefinition[] | null): QualificationDefinition[] => {
    if (!savedQuals || savedQuals.length === 0) return getDefaultQualifications();
    
    let migratedQuals = savedQuals.map(q => {
        if (q.code === 'EMERG') return { ...q, code: 'EMG', description: 'EMERGENCIAS GERAIS' };
        return q;
    });

    const defaults = getDefaultQualifications();
    const merged = [...migratedQuals];

    defaults.forEach(def => {
        const existingIndex = merged.findIndex(q => q.id === def.id || q.code === def.code);
        if (existingIndex === -1) {
            merged.push(def);
        } else {
            merged[existingIndex] = { 
                ...merged[existingIndex], 
                id: def.id, 
                code: def.code, 
                description: def.description,
                validityMonths: def.validityMonths,
                isCritical: def.isCritical
            };
        }
    });

    const uniqueMap = new Map();
    merged.forEach(q => uniqueMap.set(q.id, q));
    const uniqueMerged = Array.from(uniqueMap.values());

    return uniqueMerged
      .filter((q: any) => q.code !== 'CCT')
      .map((q: any) => ({ ...q, isCritical: true }));
};

  const [qualifications, setQualifications] = useState<QualificationDefinition[]>(getDefaultQualifications());
  const [fleet, setFleet] = useState<FleetType[]>([]);
  
  const [regulatoryConfig, setRegulatoryConfig] = useState<RegulatoryConfig>({
    sgrfhEnabled: true,
    collectiveAgreement: true,
    rbac117Appendix: 'A'
  });
  const [scheduleMetadata, setScheduleMetadata] = useState<ScheduleMetadata>({
    type: 'MENSAL',
    serviceCategory: 'PASSAGEIRO',
    publishDate: new Date(),
    weeklyCounter: 0
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // ESC to clear clipboard
  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
             setClipboard(null);
         }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [generationStartDay, setGenerationStartDay] = useState(1);
  const [generationDayLimit, setGenerationDayLimit] = useState(31);
  const [generationParams, setGenerationParams] = useState<GenerationParams>({
      maxFlightHoursMonth: 90,
      maxFlightHoursYear: 900,
      maxStandbyMonth: 8,
      minDaysOffMonth: 10,
      usePattern5x3: false,
      enableMonofolga: true, 
      generateRE: true, // NEW
      generateSA: true, // NEW
      minRestPostFlight: 750, 
      minRestPostStandby: 600, 
      minRestDefault: 720, 
      presentationBase: 60, 
      presentationOutstation: 30, 
      maxConsecutiveMadrugadas: 2,
      maxMadrugadasIn168h: 4,
      maxConsecutiveDutyDays: 6,
      minFrMonth: 8,
      minFsMonth: 2,
      maxFsMonth: 2,
      defaultDurationRE: 180, 
      defaultDurationSA: 360,  
      maxConsecutiveInat: 2,
      maxDutyExt: 960 
  });

  // CHANGED: Clipboard now holds an array of assignments to support copying the whole day
  const [clipboard, setClipboard] = useState<Assignment[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  
  // UPDATED: Added isCreating to track if it's a new assignment or editing
  const [editingAssignment, setEditingAssignment] = useState<{assignment: Assignment, crewId: string, date: Date, isCreating: boolean} | null>(null);
  const [showActivities, setShowActivities] = useState(false);
  const [showBases, setShowBases] = useState(false);
  // State for activity being edited from Sidebar
  const [activityEditId, setActivityEditId] = useState<string | null>(null);

  const [showQualifications, setShowQualifications] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showAircraftModal, setShowAircraftModal] = useState(false);
  const [showFleetModal, setShowFleetModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showGenerationSettings, setShowGenerationSettings] = useState(false);
  const [showFlightNetwork, setShowFlightNetwork] = useState(false);

  const [showCaptains, setShowCaptains] = useState(true);
  const [showFirstOfficers, setShowFirstOfficers] = useState(true);
  const [selectedCrewForFatigue, setSelectedCrewForFatigue] = useState<string | null>(null);
  const [assignmentAlert, setAssignmentAlert] = useState<{message: string, type: 'error' | 'warning'} | null>(null);
  const [warningAcknowledged, setWarningAcknowledged] = useState<string | null>(null);

  // --- EFFECT: DISMISS MODAL ON ESC ---
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAssignmentAlert(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // --- EFFECT: CLEAR CLIPBOARD ON CTRL RELEASE ---
  useEffect(() => {
      const handleKeyUp = (e: KeyboardEvent) => {
          if (e.key === 'Control') {
              setClipboard(prev => {
                  if (prev) {
                      return null;
                  }
                  return prev;
              });
          }
      };

      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, []);

  // --- HELPER TO AUTO-TRIM RE/SA OVERLAPS (Modified for ACTUAL END) ---
  const autoAdjustOverlaps = (existingAssignments: Assignment[], incoming: Assignment): { assignments: Assignment[], logs: string[] } => {
      const logs: string[] = [];
      
      // Only applies if incoming is a Flight
      if (incoming.type !== 'VOO') return { assignments: existingAssignments, logs };
      
      const incStart = timeToMin(incoming.actualStart || incoming.start || '00:00');
      
      const updated = existingAssignments.map(prev => {
          // Ignore if it's the assignment we are currently updating (in case of Edit)
          if (prev.id === incoming.id) return prev;

          // Check for RE or SA
          if (['RE', 'SA'].includes(prev.type)) {
              const prevStart = timeToMin(prev.actualStart || prev.start || '00:00');
              // Use Actual end if exists (EXECUTED), otherwise Planned end
              const prevEnd = timeToMin(prev.actualEnd || prev.end || '00:00');
              
              // Condition: Flight starts AFTER RE start AND Flight starts BEFORE RE ends
              // This implies the Flight cuts into the RE period.
              const effectivePrevEnd = prevEnd < prevStart ? prevEnd + 1440 : prevEnd;
              
              if (incStart > prevStart && incStart < effectivePrevEnd) {
                  // Adjust ACTUAL End Time to 1 minute before Flight Start
                  const newEndMin = incStart - 1;
                  const newEndStr = minToTime(newEndMin);
                  
                  const typeLabel = prev.type === 'RE' ? 'na RE' : 'no SA';
                  logs.push(`Tripulante acionado ${typeLabel}`);

                  // Return adjusted assignment with UPDATED ACTUAL END (Removed (ACIONADO) suffix)
                  return { 
                      ...prev, 
                      actualEnd: newEndStr
                  };
              }
          }
          return prev;
      });

      return { assignments: updated, logs };
  };

  const healCrewData = (rawCrew: any[], savedQuals?: any[]): CrewMember[] => {
    // ... same as before
    if (!rawCrew || !Array.isArray(rawCrew)) return [];
    const mockCrewMap = new Map(MOCK_CREW.map(c => [String(c.id), c]));
    const defaultQuals = [
      { code: 'AVSEC', validityMonths: 24 },
      { code: 'TRI', validityMonths: 24 },
      { code: 'TRE', validityMonths: 24 }
    ];

    let processed = rawCrew.map(c => {
      const defaultCrew = mockCrewMap.get(String(c.id));
      
      if (!c.admissionDate && defaultCrew && defaultCrew.admissionDate) {
          c.admissionDate = defaultCrew.admissionDate;
      } else if (!c.admissionDate) {
          c.admissionDate = '2020-01-01'; 
      }

      // Safe match check: Only apply default resignation if names roughly match to avoid ID collision issues
      const namesMatch = defaultCrew && c.name && defaultCrew.name.toUpperCase().includes(c.name.split(' ')[0].toUpperCase());

      if (!c.resignationDate && defaultCrew && defaultCrew.resignationDate && namesMatch) {
          c.resignationDate = defaultCrew.resignationDate;
      }

      const idStr = String(c.id);
      const nameStr = String(c.name).toUpperCase();
      
      if (idStr === '103' || nameStr.includes('MENQUINI')) {
        return { ...c, id: '103', name: 'MENQUINI', isOn: false, operationalTag: 'OFF' };
      }
      
      // Explicit fix for NASCIMENTO and SCHUMACHER to remove resignation date
      if (nameStr.includes('NASCIMENTO') || nameStr.includes('SCHUMACHER')) {
          c.resignationDate = undefined;
          c.isOn = true;
      }
      
      if (c.syntheticTag === undefined) {
          return { ...c, syntheticTag: null };
      }
      
      // Ensure tagHistory is an array (Migration)
      if (!c.tagHistory || !Array.isArray(c.tagHistory)) {
          c.tagHistory = [];
      }

      // Initialize isAqExp if missing
      if (c.isAqExp === undefined) {
          c.isAqExp = false;
      }

      // --- MIGRATION: Fix Qualification Expiration Dates ---
      if (c.qualifications) {
          Object.keys(c.qualifications).forEach(code => {
              const q = c.qualifications![code];
              
              if (q.courseDate && typeof q.courseDate === 'string' && q.courseDate.length === 10) {
                  // Try finding the definition dynamically to apply correct validity
                  const qDef = (savedQuals || defaultQuals).find((d: any) => d.code === code);
                  const validity = qDef?.validityMonths || 12; // default to 12
                  
                  // Re-calculate the reference and expiration date based on courseDate purely if possible.
                  let cdParts;
                  if (q.courseDate.includes('/')) {
                     cdParts = q.courseDate.split('/');
                  } else if (q.courseDate.includes('-')) {
                     cdParts = q.courseDate.split('-').reverse(); // assume YYYY-MM-DD
                  }
                  
                  if (cdParts && cdParts.length === 3) {
                      const formattedCourse = `${cdParts[0].padStart(2, '0')}/${cdParts[1].padStart(2, '0')}/${cdParts[2]}`;
                      const recalc = calculateEligibilityDates(formattedCourse, q.referenceDate || q.expirationDate, validity, code);
                      if (recalc) {
                          const [rm, ry] = recalc.refDate.split('/');
                          q.referenceDate = `${ry}-${rm}`;
                          
                          const [em, ey] = recalc.expDate.split('/');
                          if (q.expirationDate && q.expirationDate.includes('-')) {
                              q.expirationDate = `${ey}-${em}`;
                          } else {
                              q.expirationDate = `${em}/${ey}`;
                          }
                          return; // Early return as it was successfully updated
                      }
                  }
              }
              
              // Fallback logic if we couldn't recalculate from courseDate
              if (q.referenceDate) {
                  let rm, ry;
                  if (q.referenceDate.includes('-')) {
                      const rp = q.referenceDate.split('T')[0].split('-');
                      if (rp.length >= 2) {
                          ry = parseInt(rp[0], 10);
                          rm = parseInt(rp[1], 10);
                      }
                  } else {
                      const refParts = q.referenceDate.split('/');
                      if (refParts.length === 3) {
                          rm = parseInt(refParts[1], 10);
                          ry = parseInt(refParts[2], 10);
                          if (ry < 100) ry += 2000;
                      } else if (refParts.length === 2) {
                          rm = parseInt(refParts[0], 10);
                          ry = parseInt(refParts[1], 10);
                          if (ry < 100) ry += 2000;
                      }
                  }

                  if (rm && ry) {
                      // Normalize reference to YYYY-MM
                      q.referenceDate = `${ry}-${String(rm).padStart(2, '0')}`;
                      
                      // Expiration is ALWAYS the month FOLLOWING reference month (Elegibilidade Máx)
                      const nextMonthLastDay = new Date(ry, rm + 1, 0);
                      const mm = String(nextMonthLastDay.getMonth() + 1).padStart(2, '0');
                      const yy = nextMonthLastDay.getFullYear();
                      
                      const newExpDateIso = `${yy}-${mm}`;
                      const newExpDateSlash = `${mm}/${yy}`;
                      
                      if (q.expirationDate && q.expirationDate.includes('-')) {
                          q.expirationDate = newExpDateIso;
                      } else {
                          q.expirationDate = newExpDateSlash;
                      }
                  }
              }
          });
      }

      return c;
    });

    const s = processed.find(c => String(c.id) === '6');
    const f = processed.find(c => String(c.id) === '7');
    const m = processed.find(c => String(c.id) === '103');
    const others = processed.filter(c => !['6', '7', '103'].includes(String(c.id)));
    others.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    const head = others.filter(c => parseInt(c.id) <= 5);
    const tail = others.filter(c => parseInt(c.id) > 5);
    const result: CrewMember[] = [...head];
    if (s) result.push(s); 
    if (f) result.push(f); 
    result.push(...tail);
    if (m) result.push(m);
    return result;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedSchedule, savedCrew, savedFlights, savedConfig, savedCustomBlocks, savedActivities, savedAircraft, savedFleet, savedQuals, savedBases] = await Promise.all([
          dbInstance.loadSchedule(),
          dbInstance.loadCrew(),
          dbInstance.loadFlights(),
          dbInstance.loadSettings(),
          dbInstance.loadCustomBlocks(),
          dbInstance.loadActivities(),
          dbInstance.loadAircraft(),
          dbInstance.loadFleet(),
          dbInstance.loadQualifications(),
          dbInstance.loadBases()
        ]);

        if (savedSchedule) {
            setSchedule(savedSchedule);
        }
        if (savedCrew) {
            const healed = healCrewData(savedCrew, savedQuals);
            setCrew(healed);
            dbInstance.saveCrew(healed);
        }
        if (savedFlights) setFlights(savedFlights);
        if (savedConfig) {
           setRegulatoryConfig(savedConfig.regConfig);
           setScheduleMetadata(savedConfig.metadata);
        }
        if (savedCustomBlocks) setCustomBlocks(savedCustomBlocks);
        if (savedActivities) setActivities(savedActivities);
        if (savedBases && savedBases.length > 0) setBases(savedBases);
        if (savedAircraft) {
            const healedAircraft = savedAircraft.map(ac => {
                if (ac.registration === 'PS-LVU') {
                    return { ...ac, hours: 65944.85, cycles: 26283 };
                }
                return ac;
            });
            setAircraft(healedAircraft);
            dbInstance.saveAircraft(healedAircraft);
        }
        if (savedFleet) setFleet(savedFleet);
        if (savedQuals) {
            const finalMerged = mergeQualifications(savedQuals);
            setQualifications(finalMerged);
            dbInstance.saveQualifications(finalMerged);
        } else {
            const defaults = getDefaultQualifications();
            setQualifications(defaults);
            dbInstance.saveQualifications(defaults);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
     setCrew(prevCrew => recalculateCrewStats(prevCrew, schedule, currentYear, currentMonth, activities));
  }, [schedule, currentYear, currentMonth, activities]);

  useEffect(() => {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      setGenerationDayLimit(daysInMonth);
      setGenerationStartDay(1);
      
      if (viewStartDate.getMonth() !== currentMonth || viewStartDate.getFullYear() !== currentYear) {
          const boundaryStart = new Date(currentYear, currentMonth, 1);
          const diffDays = Math.abs(viewStartDate.getTime() - boundaryStart.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 1.5) {
             setViewStartDate(boundaryStart);
          }
      }
  }, [currentYear, currentMonth]);

  const addLog = (message: string, type: 'info' | 'warning' | 'error' | 'success', lawReference?: string) => {
    setLogs(prev => [...prev, { timestamp: new Date(), message, type, lawReference }]);
  };

  const clearLogs = () => setLogs([]);

  // ... (Review function remains same)
  const handleReviewMonth = async () => {
    if (isReviewing) return;
    setIsReviewing(true);
    addLog(`Iniciando revisão completa da escala de ${MONTHS[currentMonth]}/${currentYear}...`, 'info');
    
    const unavailableLogs: { msg: string, type: 'error' | 'warning' }[] = [];
    const reviewDate = new Date(currentYear, currentMonth, 1);
    
    crew.forEach(c => {
       if (c.resignationDate) return;
       
       let isUnavailable = false;
       let reason = 'Inativo / Fora da escala';
       
       if (!c.isOn) {
           isUnavailable = true;
       }
       
       if (c.qualifications) {
           for (const code in c.qualifications) {
               const qual = c.qualifications[code];
               if (qual.expirationDate && qual.expirationDate.length >= 6) {
                   let m: number | undefined, y: number | undefined, d: number | undefined;
                   if (qual.expirationDate.includes('/')) {
                       const parts = qual.expirationDate.split('/');
                       if (parts.length === 3) {
                           d = parseInt(parts[0], 10);
                           m = parseInt(parts[1], 10);
                           y = parseInt(parts[2], 10);
                       } else if (parts.length === 2) {
                           m = parseInt(parts[0], 10);
                           y = parseInt(parts[1], 10);
                       }
                   } else if (qual.expirationDate.includes('-')) {
                       const p = qual.expirationDate.split('-');
                       y = parseInt(p[0], 10);
                       m = parseInt(p[1], 10);
                       if (p.length > 2) d = parseInt(p[2], 10);
                   }
                   if (m && y) {
                       if (y < 100) y += 2000;
                       if (!d) d = new Date(y, m, 0).getDate();
                       const exactExpDate = new Date(y, m - 1, d, 23, 59, 59, 999);
                       if (reviewDate.getTime() > exactExpDate.getTime()) {
                           reason = `Carteira Vencida (${code})`;
                           isUnavailable = true;
                           break;
                       }
                   }
               }
           }
       }
       
       if (!isUnavailable && c.operationalTag && c.operationalTag !== 'AVBL') {
           if (c.operationalTag === 'EMI') {
                unavailableLogs.push({ msg: `Tripulante ${c.name} : Disponível Instrução em Rota. Voo com Instrutor.`, type: 'warning' });
                return; // Not unavailable, just a warning
           }

           if (c.operationalTag === 'OFF') reason = 'Status OFF';
           else if (c.operationalTag === 'REQ') reason = 'Requalificação (REQ)';
           else if (c.operationalTag === 'AGD') reason = 'Aguardando treinamento (AGD)';
           else if (c.operationalTag === 'REC') reason = 'Experiência Recente (REC)';
           else reason = `Status operacional: ${c.operationalTag}`;
           isUnavailable = true;
       }
       
       if (isUnavailable) {
           unavailableLogs.push({ msg: `Tripulante ${c.name} indisponível: ${reason}`, type: 'error' });
       }
    });

    const steps: { msg: string, type: 'info' | 'warning' | 'error' | 'success' }[] = [
      { msg: "Procurando tripulantes indisponíveis...", type: 'info' },
      ...unavailableLogs,
      { msg: "Verificando restrições de folga (FS/FR)...", type: 'info' },
      { msg: "Analisando jornadas de madrugada...", type: 'info' },
      { msg: "Cruzando limites de horas mensais (90h)...", type: 'info' },
      { msg: "Validando conectividade de trechos e DLS...", type: 'info' },
      { msg: "Checando composição de tripulação mínima...", type: 'info' },
      { msg: "Revisão finalizada.", type: 'success' }
    ];

    for (const step of steps) {
        await new Promise(r => setTimeout(r, 600)); // slightly faster
        addLog(step.msg, step.type);
    }
    
    setIsReviewing(false);
  };

  // ... (Days, filteredCrewList, Nav handlers remain same)
  const days = useMemo(() => {
      return getDaysForGrid(viewStartDate, 31);
  }, [viewStartDate]);

  const filteredCrewList = useMemo(() => {
    const list = crew.filter(c => {
      if (c.role === 'CMTE' && !showCaptains) return false;
      if (c.role === 'COP' && !showFirstOfficers) return false;

      if (c.admissionDate) {
          let admYear: number;
          let admMonth: number;
          if (c.admissionDate.includes('-')) {
              const parts = c.admissionDate.split('-').map(Number);
              admYear = parts[0];
              admMonth = parts[1];
          } else if (c.admissionDate.includes('/')) {
              const parts = c.admissionDate.split('/').map(Number);
              if (parts[2] > 1000) {
                  admYear = parts[2];
                  admMonth = parts[1];
              } else {
                  admYear = parts[2];
                  admMonth = parts[1];
              }
          } else {
              return true;
          }
          if (isNaN(admYear) || isNaN(admMonth)) return true;
          if (admYear > currentYear) return false;
          if (admYear === currentYear && (admMonth - 1) > currentMonth) return false;
      }
      
      if (c.resignationDate) {
          let resYear: number;
          let resMonth: number;
          if (c.resignationDate.includes('-')) {
              const parts = c.resignationDate.split('-').map(Number);
              resYear = parts[0];
              resMonth = parts[1];
          } else if (c.resignationDate.includes('/')) {
              const parts = c.resignationDate.split('/').map(Number);
              if (parts[2] > 1000) {
                  resYear = parts[2];
                  resMonth = parts[1];
              } else {
                  resYear = parts[2];
                  resMonth = parts[1];
              }
          } else {
              return true; 
          }
          if (!isNaN(resYear) && !isNaN(resMonth)) {
              if (currentYear > resYear) return false;
              if (currentYear === resYear && currentMonth > (resMonth - 1)) return false;
          }
      }
      return true;
    });

    // Sort by Seniority (Ascending)
    return list.sort((a, b) => {
        const senA = parseInt(a.seniority || '999999');
        const senB = parseInt(b.seniority || '999999');
        if (senA !== senB) return senA - senB;
        // Fallback to name if seniority is same or missing
        return a.name.localeCompare(b.name);
    });
  }, [crew, currentMonth, currentYear, showCaptains, showFirstOfficers]);

  const handlePrevDay = () => {
      const next = new Date(viewStartDate);
      next.setDate(next.getDate() - 1);
      if (next.getFullYear() !== currentYear || next.getMonth() !== currentMonth) {
          setCurrentMonth(next.getMonth());
          setCurrentYear(next.getFullYear());
      }
      setViewStartDate(next);
  };

  const handleNextDay = () => {
      const next = new Date(viewStartDate);
      next.setDate(next.getDate() + 1);
      if (next.getFullYear() !== currentYear || next.getMonth() !== currentMonth) {
          setCurrentMonth(next.getMonth());
          setCurrentYear(next.getFullYear());
      }
      setViewStartDate(next);
  };

  const handleGoToToday = () => {
      const today = new Date();
      const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      targetDate.setDate(targetDate.getDate() - 6);
      setCurrentMonth(targetDate.getMonth());
      setCurrentYear(targetDate.getFullYear());
      setViewStartDate(targetDate);
  };

  const handleToggleFlightDay = (code: string, dayIndex: number) => {
    setFlights(prev => {
      const updated = prev.map(f => {
        if (f.code === code) {
          const daysOfWeek = f.daysOfWeek.includes(dayIndex)
            ? f.daysOfWeek.filter(d => d !== dayIndex)
            : [...f.daysOfWeek, dayIndex].sort();
          return { ...f, daysOfWeek };
        }
        return f;
      });
      dbInstance.saveFlights(updated);
      return updated;
    });
  };

  const handleDrop = (crewId: string, date: Date, rawData: string) => {
    // ... logic remains same ...
    try {
      const payload = JSON.parse(rawData);
      const { category, data } = payload;
      let newAssignment: Assignment | null = null;
      const dateKey = date.toISOString().split('T')[0];

      if (category === 'FLIGHT') {
         const flight = data as Flight;
         const validation = checkCrewEligibility(crew.find(c => c.id === crewId)!, date, 'VOO');
         if (!validation.valid) {
             addLog(validation.message || "Erro de elegibilidade", 'error', validation.lawReference);
             setAssignmentAlert({ message: validation.message || 'Erro de elegibilidade', type: 'error' });
             return;
         }
         newAssignment = {
             id: `${crewId}-${dateKey}-VOO-${flight.code}`,
             type: 'VOO',
             code: flight.code,
             route: flight.route,
             start: flight.start,
             end: flight.end,
             aircraftId: aircraft.length > 0 ? aircraft[0].id : undefined
         };
      } else if (category === 'CUSTOM') {
          const block = data as CustomBlock;
          let forceType: AssignmentType = 'GS';
          if (block.label.includes('DLS') || block.label.includes('DSL') || block.label.includes('EXT')) {
              forceType = 'DLS';
          }
          newAssignment = {
              id: `${crewId}-${dateKey}-CUST-${block.id}`,
              type: forceType, 
              details: block.label.toUpperCase(),
              start: block.start,
              end: block.end
          };
      } else if (category === 'ACTIVITY') {
          const act = data as ActivityDefinition;
          let type = act.type as AssignmentType;
          let start = act.start;
          let end = act.end;

          if (['FR', 'FS', 'FA', 'FP', 'FM'].includes(act.code) || ['FR', 'FS'].includes(type)) {
             const prevDate = new Date(date);
             prevDate.setDate(date.getDate() - 1);
             const prevKey = prevDate.toISOString().split('T')[0];
             const prevAssigns = schedule[crewId]?.[prevKey];
             const prevAssign = prevAssigns && prevAssigns.length > 0 ? prevAssigns[prevAssigns.length - 1] : undefined;
             const calculatedStart = calculateSmartFolgaStartTime(prevAssign, flights);
             start = calculatedStart;
             end = calculatedStart === '00:00' ? '23:59' : calculatedStart;
          }

          if (act.code.includes('DLS') || act.code.includes('DSL')) {
              type = 'DLS';
          }

          newAssignment = {
              id: `${crewId}-${dateKey}-${act.code.toUpperCase()}`,
              type: type,
              details: act.code.toUpperCase(), 
              start: start,
              end: end
          };
      }

      if (newAssignment) {
         if (newAssignment.details === 'DEMISS') {
             const dateStr = date.toISOString().split('T')[0];
             setCrew(prev => {
                 const next = prev.map(c => {
                     if (c.id === crewId) return { ...c, isOn: false, resignationDate: dateStr };
                     return c;
                 });
                 dbInstance.saveCrew(next);
                 return next;
             });
             addLog(`Tripulante desligado (DEMISS) em ${date.toLocaleDateString()}.`, 'warning');
         }

         if (newAssignment.type === 'VAC') {
             setCrew(prev => {
                 const next = prev.map(c => {
                     if (c.id === crewId) return { ...c, isOn: false };
                     return c;
                 });
                 dbInstance.saveCrew(next);
                 return next;
             });
             addLog(`Tripulante inativado por Férias (VAC) em ${date.toLocaleDateString()}.`, 'info');
         }

         const crewMember = crew.find(c => c.id === crewId);
         if (crewMember && ['FR', 'FS'].includes(newAssignment.type)) {
             const tags = resolveCrewTags(crewMember, date);
             if (tags.operationalTag === 'GS') {
                 const loc = getCrewLocation(crewId, date, schedule, crewMember);
                 const isGeneric = ['DLS', 'DSL', 'EXT', 'GS', 'SIM', 'VOO', 'EXM'].includes(loc);
                 if (loc !== (crewMember.base || 'VCP') && !isGeneric) {
                     newAssignment.details = `${newAssignment.type}-${loc}`;
                 }
             }
         }

         const validation = validateAssignment(crewId, date, newAssignment, schedule, regulatoryConfig, flights, crew, scheduleMetadata, generationParams);
         if (!validation.valid) {
             if (validation.conversionAction === 'TO_FR') {
                 newAssignment = { ...newAssignment, type: 'FR', details: 'FR (Auto-Convert)', start: '00:00', end: '23:59' };
                 addLog(`Conversão Automática: ${validation.message}`, 'warning', validation.lawReference);
             } else {
                 addLog(`Bloqueio: ${validation.message}`, 'error', validation.lawReference);
                 setAssignmentAlert({ message: validation.message || 'Erro de validação', type: 'error' });
                 return;
             }
         }
         
         setSchedule(prev => {
            const current = prev[crewId] || {};
            const dayAssigns = current[dateKey] || [];
            const { assignments: adjustedAssigns, logs } = autoAdjustOverlaps(dayAssigns, newAssignment!);
            logs.forEach(msg => addLog(msg, 'warning'));
            const newDayList = [...adjustedAssigns, newAssignment!];
            return {
                ...prev,
                [crewId]: {
                    ...current,
                    [dateKey]: sortAssignments(newDayList)
                }
            };
         });
         addLog(`Atividade ${newAssignment.type} adicionada para ${crew.find(c => c.id === crewId)?.name}.`, 'success');
      }
    } catch (e) {
       console.error(e);
    }
  };

  const handleDeleteAssignment = (crewId: string, date: Date, assignmentId?: string) => {
      const dateKey = date.toISOString().split('T')[0];
      setSchedule(prev => {
          const newSchedule = { ...prev };
          if (newSchedule[crewId]) {
             const nextCrewSchedule = { ...newSchedule[crewId] };
             if (nextCrewSchedule[dateKey]) {
                 if (assignmentId) {
                     const assignment = nextCrewSchedule[dateKey].find(a => a.id === assignmentId);
                     if (assignment && assignment.type === 'XQR') {
                         const currentCrew = crew.find(c => c.id === crewId);
                         if (currentCrew && currentCrew.operationalTag === 'AVBL') {
                             setCrew(prevCrew => {
                                 const nextC = prevCrew.map(c => {
                                     if (c.id === crewId) return { ...c, operationalTag: 'EMI' as OperationalTag };
                                     return c;
                                 });
                                 dbInstance.saveCrew(nextC);
                                 return nextC;
                             });
                             addLog(`Tag de ${currentCrew.name} revertida para EMI (Cheque excluído).`, 'info');
                         }
                     }
                     nextCrewSchedule[dateKey] = nextCrewSchedule[dateKey].filter(a => a.id !== assignmentId);
                     if (nextCrewSchedule[dateKey].length === 0) delete nextCrewSchedule[dateKey];
                 } else {
                     delete nextCrewSchedule[dateKey];
                 }
                 newSchedule[crewId] = nextCrewSchedule;
             }
          }
          return newSchedule;
      });
  };

  const handleDeleteColumn = (date: Date) => {
      const dateKey = date.toISOString().split('T')[0];
      setSchedule(prev => {
          const newSchedule = { ...prev };
          Object.keys(newSchedule).forEach(crewId => {
              if (newSchedule[crewId] && newSchedule[crewId][dateKey]) {
                  const nextCrewSchedule = { ...newSchedule[crewId] };
                  delete nextCrewSchedule[dateKey];
                  newSchedule[crewId] = nextCrewSchedule;
              }
          });
          return newSchedule;
      });
      addLog(`Coluna do dia ${date.toLocaleDateString('pt-BR')} removida para toda a tripulação.`, 'info');
  };

  const handleSyncQualifications = async () => {
    const updatedCrew = syncQualificationsFromSchedule(crew, schedule, qualifications);
    setCrew(updatedCrew);
    await dbInstance.saveCrew(updatedCrew);
    addLog("Carteiras sincronizadas com histórico da escala.", 'success');
  };

  const handleGenerate = async () => {
     setIsGenerating(true);
     const limitedDays = days.filter(d => d.dayOfMonth >= generationStartDay && d.dayOfMonth <= generationDayLimit);
     if (limitedDays.length === 0) {
        addLog("Nenhum dia no intervalo selecionado para geração.", 'error');
        setIsGenerating(false);
        return;
     }

     const generator = generateSchedule(crew, limitedDays, flights, schedule, regulatoryConfig, scheduleMetadata, generationParams);
     const processStep = () => {
         const result = generator.next();
         if (result.done) {
             setIsGenerating(false);
             addLog(`Escala gerada com sucesso (De ${generationStartDay} até dia ${generationDayLimit})!`, 'success');
             return;
         }
         const resValue = result.value as GenerationResult;
         
         if (resValue.type === 'LOG') {
             addLog(resValue.message.toUpperCase(), resValue.level);
             setTimeout(processStep, 0); 
             return;
         }

         if (resValue.type === 'CREW_UPDATE') {
             const { crewId, updates } = resValue;
             setCrew(prev => {
                 const next = prev.map(c => c.id === crewId ? { ...c, ...updates } : c);
                 return next;
             });
             setTimeout(processStep, 0);
             return;
         }

         if (resValue.type === 'REMOVAL') {
             const { crewId, date, assignmentType } = resValue;
             const dateKey = date.toISOString().split('T')[0];
             setSchedule(prev => {
                 const nextSchedule = { ...prev };
                 const nextCrewSchedule = { ...(nextSchedule[crewId] || {}) };
                 if (nextCrewSchedule[dateKey]) {
                     if (assignmentType === 'ALL') {
                         nextCrewSchedule[dateKey] = [];
                     } else {
                         nextCrewSchedule[dateKey] = nextCrewSchedule[dateKey].filter(a => a.type !== assignmentType);
                     }
                     nextSchedule[crewId] = nextCrewSchedule;
                 }
                 return nextSchedule;
             });
             setTimeout(processStep, 0);
             return;
         }

         if (resValue.type === 'ASSIGNMENT') {
            const { crewId, date, assignment } = resValue;
            const dateKey = date.toISOString().split('T')[0];
            setSchedule(prev => {
                const nextSchedule = { ...prev };
                const nextCrewSchedule = { ...(nextSchedule[crewId] || {}) };
                let nextDayAssignments = [ ...(nextCrewSchedule[dateKey] || []) ];
                if (!nextDayAssignments.some(a => a.id === assignment.id)) {
                    nextDayAssignments.push(assignment);
                    nextCrewSchedule[dateKey] = sortAssignments(nextDayAssignments); 
                    nextSchedule[crewId] = nextCrewSchedule;
                }
                return nextSchedule;
            });
            setTimeout(processStep, 25);
         }
     };
     processStep();
  };

  const handleSaveToDB = async () => {
     await dbInstance.saveSchedule(schedule);
     await dbInstance.saveCrew(crew);
     await dbInstance.saveSettings({ regConfig: regulatoryConfig, metadata: scheduleMetadata });
     addLog("Dados salvos no banco de dados local.", 'success');
  };

  const handleOpenClearModal = () => setShowClearModal(true);

  const performClearMonth = async () => {
      // ... same as before
      const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const crewToRevert = new Set<string>();
      Object.keys(schedule).forEach(crewId => {
          const crewSchedule = schedule[crewId];
          Object.keys(crewSchedule).forEach(dateKey => {
              if (dateKey.startsWith(monthPrefix)) {
                  const hasXQR = crewSchedule[dateKey].some(a => a.type === 'XQR');
                  if (hasXQR) crewToRevert.add(crewId);
              }
          });
      });
      if (crewToRevert.size > 0) {
          setCrew(prev => {
              const next = prev.map(c => {
                  if (crewToRevert.has(c.id) && c.operationalTag === 'AVBL') {
                      return { ...c, operationalTag: 'EMI' as OperationalTag };
                  }
                  return c;
              });
              dbInstance.saveCrew(next);
              return next;
          });
          addLog(`${crewToRevert.size} tripulantes revertidos para EMI (Limpeza de XQR).`, 'warning');
      }
      setSchedule(prev => {
          const newSchedule = { ...prev };
          Object.keys(newSchedule).forEach(crewId => {
              const crewSchedule = { ...newSchedule[crewId] };
              Object.keys(crewSchedule).forEach(dateKey => {
                  if (dateKey.startsWith(monthPrefix)) delete crewSchedule[dateKey];
              });
              newSchedule[crewId] = crewSchedule;
          });
          return newSchedule;
      });
      setShowClearModal(false);
      addLog(`Escala de ${MONTHS[currentMonth]}/${currentYear} limpa com sucesso.`, 'warning');
  };

  const handleCopy = (assignments: Assignment[] | null) => {
     setClipboard(assignments);
     if (assignments && assignments.length > 0) {
         addLog(assignments.length > 1 ? `${assignments.length} atividades copiadas.` : "Atividade copiada.", 'info');
     }
  };

  const handlePaste = (crewId: string, date: Date) => {
     if (!clipboard || clipboard.length === 0) return;
     const dateKey = date.toISOString().split('T')[0];
     setSchedule(prev => {
         const crewData = prev[crewId] || {};
         let dayAssignments = crewData[dateKey] || [];
         const messages: string[] = [];
         clipboard.forEach(item => {
             const newId = `${crewId}-${dateKey}-${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
             const newAssignment = { ...item, id: newId };
             const { assignments: adjusted, logs } = autoAdjustOverlaps(dayAssignments, newAssignment);
             logs.forEach(l => { if (!messages.includes(l)) messages.push(l); });
             dayAssignments = [...adjusted, newAssignment];
         });
         messages.forEach(msg => addLog(msg, 'warning'));
         return {
             ...prev,
             [crewId]: { ...crewData, [dateKey]: sortAssignments(dayAssignments) }
         };
     });
     addLog("Atividades coladas.", 'success');
  };

  const handleSelectCrewForFatigue = (crewId: string) => {
      setSelectedCrewForFatigue(crewId);
      setActiveModule('FADIGA');
  };

  const handleUpdateCrew = (updatedCrew: CrewMember) => {
      setCrew(prev => {
          const oldCrew = prev.find(c => c.id === updatedCrew.id);
          if (!updatedCrew.tagHistory) updatedCrew.tagHistory = [];
          let finalCrew = updatedCrew;
          if (oldCrew) {
              const tagsChanged = 
                  oldCrew.operationalTag !== updatedCrew.operationalTag ||
                  oldCrew.adminTag !== updatedCrew.adminTag ||
                  oldCrew.instructionTag !== updatedCrew.instructionTag ||
                  oldCrew.syntheticTag !== updatedCrew.syntheticTag;
              const startDateChanged = oldCrew.tagDateStart !== updatedCrew.tagDateStart;
              if (tagsChanged || startDateChanged) {
                  if (updatedCrew.tagDateStart) {
                      const newStart = new Date(updatedCrew.tagDateStart);
                      if (!isNaN(newStart.getTime())) {
                          const archiveEnd = new Date(newStart);
                          archiveEnd.setDate(newStart.getDate() - 1);
                          if (!isNaN(archiveEnd.getTime())) {
                              const archiveEndStr = archiveEnd.toISOString().split('T')[0];
                              const historyEntry: TagHistoryEntry = {
                                  startDate: oldCrew.tagDateStart || '2000-01-01',
                                  endDate: archiveEndStr,
                                  adminTag: oldCrew.adminTag,
                                  operationalTag: oldCrew.operationalTag,
                                  instructionTag: oldCrew.instructionTag,
                                  syntheticTag: oldCrew.syntheticTag
                              };
                              const history = [...(oldCrew.tagHistory || [])];
                              history.push(historyEntry);
                              history.sort((a, b) => b.startDate.localeCompare(a.startDate));
                              finalCrew = { ...updatedCrew, tagHistory: history };
                          }
                      }
                  }
              }
          }
          const next = prev.map(c => c.id === finalCrew.id ? finalCrew : c);
          dbInstance.saveCrew(next); 
          return next;
      });
      addLog(`Dados de ${updatedCrew.name} atualizados com sucesso.`, 'success');
  };

  const handleAddCrew = (newCrew: CrewMember) => {
      setCrew(prev => {
          if (!newCrew.tagHistory) newCrew.tagHistory = [];
          if (newCrew.admissionDate) {
              newCrew.operationalTag = 'GS' as OperationalTag;
              const hasHistory = newCrew.tagHistory.some(h => h.startDate === newCrew.admissionDate);
              if (!hasHistory) {
                  newCrew.tagHistory.push({
                      startDate: newCrew.admissionDate,
                      endDate: '2099-12-31', 
                      adminTag: newCrew.adminTag,
                      operationalTag: 'GS' as OperationalTag, 
                      instructionTag: newCrew.instructionTag,
                      syntheticTag: newCrew.syntheticTag
                  });
                  newCrew.tagHistory.sort((a, b) => b.startDate.localeCompare(a.startDate));
              }
          }
          const next = [...prev, newCrew];
          dbInstance.saveCrew(next);
          return next;
      });
      addLog(`Tripulante ${newCrew.name} adicionado com sucesso (GS na Admissão).`, 'success');
  };

  const handleUpdateFlight = (originalCode: string, updatedFlight: Flight) => {
      setFlights(prev => {
          const next = prev.map(f => f.code === originalCode ? updatedFlight : f);
          dbInstance.saveFlights(next);
          return next;
      });
      addLog(`Voo ${updatedFlight.code} atualizado com sucesso.`, 'success');
  };

  const handleExportSchedule = () => {
      const dataStr = JSON.stringify({ 
          global_schedule: schedule, 
          crew_data: crew, 
          aircraft_data: aircraft, 
          fleet_data: fleet, 
          flights_data: flights, 
          custom_blocks: customBlocks, 
          activities_data: activities, 
          qualifications_data: qualifications, 
          app_settings: { regConfig: regulatoryConfig, metadata: scheduleMetadata },
          logs_data: logs 
      }, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" }); 
      const url = URL.createObjectURL(blob); 
      const link = document.createElement('a'); 
      link.href = url; 
      link.download = `skyplan_backup_${new Date().toISOString().split('T')[0]}.json`; 
      link.click(); 
  };

  const handleImportSchedule = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; 
      if (!file) return; 
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const result = event.target?.result;
              if (typeof result !== 'string') return;
              const parsed = JSON.parse(result);
              if (parsed.global_schedule) {
                  setSchedule(parsed.global_schedule);
                  await dbInstance.saveSchedule(parsed.global_schedule);
              }
              if (parsed.crew_data) {
                const healed = healCrewData(parsed.crew_data, parsed.qualifications || qualifications);
                setCrew(healed);
                await dbInstance.saveCrew(healed);
              }
              if (parsed.aircraft_data) {
                  setAircraft(parsed.aircraft_data);
                  await dbInstance.saveAircraft(parsed.aircraft_data);
              }
              if (parsed.fleet_data) {
                  setFleet(parsed.fleet_data);
                  await dbInstance.saveFleet(parsed.fleet_data);
              }
              if (parsed.flights_data) {
                  setFlights(parsed.flights_data);
                  await dbInstance.saveFlights(parsed.flights_data);
              }
              if (parsed.custom_blocks) {
                  setCustomBlocks(parsed.custom_blocks);
                  await dbInstance.saveCustomBlocks(parsed.custom_blocks);
              }
              if (parsed.activities_data) {
                  setActivities(parsed.activities_data);
                  await dbInstance.saveActivities(parsed.activities_data);
              }
              if (parsed.qualifications_data) {
                  const finalMerged = mergeQualifications(parsed.qualifications_data);
                  setQualifications(finalMerged);
                  await dbInstance.saveQualifications(finalMerged);
              } else {
                  const defaults = getDefaultQualifications();
                  setQualifications(defaults);
                  await dbInstance.saveQualifications(defaults);
              }
              if (parsed.app_settings) {
                  setRegulatoryConfig(parsed.app_settings.regConfig);
                  setScheduleMetadata(parsed.app_settings.metadata);
                  await dbInstance.saveSettings(parsed.app_settings);
              }
              if (parsed.logs_data) {
                const restoredLogs = parsed.logs_data.map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) }));
                setLogs(restoredLogs);
              }

              // Merge existing local qualifications if JSON is old
              const curCrew = parsed.crew_data ? healCrewData(parsed.crew_data, parsed.qualifications || qualifications).map(newC => {
                  // Attempt to preserve qualifications if the loaded ones are empty but local has them
                  const existingC = crew.find(c => c.id === newC.id);
                  const newQualsLen = newC.qualifications ? Object.keys(newC.qualifications).length : 0;
                  if (existingC && existingC.qualifications && newQualsLen === 0) {
                      return { ...newC, qualifications: existingC.qualifications };
                  }
                  return newC;
              }) : crew;

              const curSchedule = parsed.global_schedule || schedule;
              let curQuals = mergeQualifications(parsed.qualifications_data || null);

              const updatedCrew = syncQualificationsFromSchedule(curCrew, curSchedule, curQuals);
              
              setCrew(updatedCrew);
              await dbInstance.saveCrew(updatedCrew);

              addLog(`Backup restaurado e certificados sincronizados com sucesso.`, 'success');
          } catch (err) { 
              console.error(err);
              addLog('Falha ao ler backup.', 'error'); 
          }
      }; 
      reader.readAsText(file); 
      e.target.value = '';
  };

  const handleExportCsv = () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "seqtripulante,nomeguerra,codcargo,seqfrota,dtinicselecfolhao,prog_d01,prog_d02,prog_d03,prog_d04,prog_d05,prog_d06,prog_d07,prog_d08,prog_d09,prog_d10,prog_d11,prog_d12,prog_d13,prog_d14,prog_d15,prog_d16,prog_d17,prog_d18,prog_d19,prog_d20,prog_d21,prog_d22,prog_d23,prog_d24,prog_d25,prog_d26,prog_d27,prog_d28,prog_d29,prog_d30,prog_d31\n";
      
      const startDate = viewStartDate;
      
      crew.forEach(c => {
          let row = `${c.id},${c.name},${c.role},1,${startDate.toLocaleDateString('pt-BR')}`;
          for (let i = 0; i < 31; i++) {
              const d = new Date(startDate);
              d.setDate(startDate.getDate() + i);
              const dateKey = d.toISOString().split('T')[0];
              const assignments = schedule[c.id]?.[dateKey] || [];
              if (assignments.length > 0) {
                  row += `,${assignments[0].code || assignments[0].type}`;
              } else {
                  row += `,`;
              }
          }
          csvContent += row + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `escala_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addLog("CSV exportado com sucesso.", "success");
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; 
      if (!file) return; 
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const result = event.target?.result;
              if (typeof result !== 'string') return;
              
              const lines = result.split('\n').map(l => l.trim()).filter(l => l);
              if (lines.length < 2) {
                  addLog("Arquivo CSV vazio ou inválido.", "error");
                  return;
              }
              
              const delimiter = lines[0].includes(';') ? ';' : ',';
              const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
              
              const newSchedule = { ...schedule };
              const newCrew = [...crew];
              let importedCount = 0;
              let newCrewCount = 0;
              
              for (let i = 1; i < lines.length; i++) {
                  const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
                  const getValue = (colName: string) => {
                      const idx = headers.indexOf(colName.toLowerCase());
                      return idx !== -1 ? cols[idx] : '';
                  };
                  
                  const nomeguerraRaw = getValue('nomeguerra');
                  const codcargo = getValue('codcargo');
                  const dtinicselecfolhao = getValue('dtinicselecfolhao');
                  const frota = getValue('frota') || getValue('equipamento');
                  const senioridadeRaw = getValue('senioridade');
                  
                  if (!nomeguerraRaw || !dtinicselecfolhao) continue;
                  
                  const parts = dtinicselecfolhao.split('/');
                  if (parts.length !== 3) continue;
                  const [day, month, year] = parts.map(Number);
                  const startDate = new Date(year, month - 1, day);
                  
                  // Find crew member by name (ignoring [XX] prefix)
                  const cleanName = nomeguerraRaw.replace(/\[\d+\]\s*/, '').trim().toUpperCase();
                  let crewMember = newCrew.find(c => c.name.toUpperCase().includes(cleanName) || cleanName.includes(c.name.toUpperCase()));
                  
                  if (!crewMember) {
                      const baseRaw = getValue('base');
                      crewMember = {
                          id: crypto.randomUUID(),
                          name: cleanName,
                          role: (codcargo.toUpperCase() === 'FO' || codcargo.toUpperCase() === 'COP') ? 'FO' : 'CAPT',
                          systemSeniority: senioridadeRaw ? parseInt(senioridadeRaw) : 9999,
                          groupSeniority: senioridadeRaw ? parseInt(senioridadeRaw) : 9999,
                          companySeniority: senioridadeRaw ? parseInt(senioridadeRaw) : 9999,
                          isOn: true,
                          fleet: frota ? frota.toUpperCase() : 'A320/321',
                          base: baseRaw ? baseRaw.toUpperCase() : 'GRU',
                          phone: '',
                          email: '',
                          hireDate: '2020-01-01',
                          equipment: [frota ? frota.toUpperCase() : 'A321'],
                          qualifications: { ETOPS: true, 'CAT II': true, 'CAT III': true },
                          monthlyHours: 0,
                          fatigueStatus: 'FIT'
                      } as CrewMember;
                      newCrew.push(crewMember);
                      newCrewCount++;
                  }
                  
                  const crewId = crewMember.id;
                  if (!newSchedule[crewId]) newSchedule[crewId] = {};
                  
                  for (let d = 1; d <= 36; d++) {
                      const dayStr = d.toString().padStart(2, '0');
                      const progCode = getValue(`prog_d${dayStr}`);
                      const texto = getValue(`texto_d${dayStr}`);
                      
                      if (!progCode) continue;
                      
                      const currentDate = new Date(startDate);
                      currentDate.setDate(startDate.getDate() + (d - 1));
                      const dateKey = currentDate.toISOString().split('T')[0];
                      
                      let start = '00:00';
                      let end = '23:59';
                      if (texto) {
                          // Extract HH:MM formats robustly
                          const matches = texto.match(/\d{2}:\d{2}/g);
                          if (matches && matches.length >= 2) {
                              start = matches[0];
                              end = matches[1];
                          }
                      }
                      
                      let type: AssignmentType = 'VOO';
                      const cleanProg = progCode.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
                      
                      if (cleanProg === 'FS' || cleanProg === 'FR') type = cleanProg as AssignmentType;
                      else if (cleanProg.includes('FERIAS') || cleanProg === 'VAC') type = 'VAC';
                      else if (cleanProg.startsWith('ADM') || cleanProg.startsWith('AGD') || cleanProg.startsWith('LIC') || cleanProg.startsWith('ATE') || cleanProg.startsWith('INAT')) type = 'INAT';
                      else if (cleanProg === 'SA' || cleanProg.startsWith('SBR') || cleanProg.includes('SOBREAVISO') || cleanProg.startsWith('S.A')) type = 'SA';
                      else if (cleanProg === 'RE' || cleanProg.startsWith('RES') || cleanProg === 'RVA' || cleanProg === 'RSV') type = 'RE';
                      else if (cleanProg.startsWith('SIM') || cleanProg === 'SML') type = 'SIM';
                      else if (cleanProg.startsWith('GS') || cleanProg.includes('GROUND') || ['PBN', 'LVP', 'EFB', 'CRM', 'RVS', 'GRF', 'CBT', 'AVSEC', 'DGR', 'PPSP', 'SIGLA'].some(c => cleanProg.includes(c))) type = 'GS';
                      else if (cleanProg.startsWith('DLS') || cleanProg.startsWith('EXT') || cleanProg.includes('DESLOC')) type = 'DLS';
                      else if (cleanProg.startsWith('XQR')) type = 'XQR';
                      
                      const assignment: Assignment = {
                          id: crypto.randomUUID(),
                          type,
                          code: progCode.trim().toUpperCase(),
                          details: texto ? texto.trim() : undefined,
                          start,
                          end
                      };
                      
                      if (!newSchedule[crewId][dateKey]) {
                          newSchedule[crewId][dateKey] = [];
                      }
                      
                      // Check for exact duplicates to prevent double-import stacking
                      const alreadyExists = newSchedule[crewId][dateKey].some(a => 
                          a.type === assignment.type && 
                          a.code === assignment.code && 
                          a.start === assignment.start && 
                          a.end === assignment.end
                      );
                      
                      if (!alreadyExists) {
                          newSchedule[crewId][dateKey].push(assignment);
                      }
                  }
                  importedCount++;
              }
              
              setSchedule(newSchedule);
              setCrew(newCrew);
              await dbInstance.saveSchedule(newSchedule);
              await dbInstance.saveCrew(newCrew);
              addLog(`Escala importada: ${importedCount} processados (${newCrewCount} novos tripulantes).`, "success");
              
          } catch (error) {
              console.error(error);
              addLog("Erro ao importar CSV.", "error");
          }
      };
      reader.readAsText(file);
      if (e.target) e.target.value = '';
  };

  const handleToggleRegConfig = (key: keyof RegulatoryConfig) => {
    setRegulatoryConfig(prev => {
        const val = prev[key];
        if (typeof val === 'boolean') {
            return { ...prev, [key]: !val };
        }
        return prev;
    });
  };

  const handleUpdateMetadata = (key: keyof ScheduleMetadata, value: any) => {
    setScheduleMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdateRbacAppendix = (val: 'A' | 'B_PLUS') => {
    setRegulatoryConfig(prev => ({ ...prev, rbac117Appendix: val }));
  };

  const handleAddActivity = (newActivity: ActivityDefinition) => {
      setActivities(prev => {
          const next = [...prev, newActivity];
          dbInstance.saveActivities(next);
          return next;
      });
      addLog(`Nova atividade ${newActivity.code} criada com sucesso.`, 'success');
  };

  const handleEditActivityFromSidebar = (id: string) => {
      setActivityEditId(id);
      setShowActivities(true);
  };

  const handleConfirmCopy = (startDateStr: string, endDateStr: string, originCrewId: string, targets: any[]) => {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      setSchedule(prev => {
          const nextSchedule = { ...prev };
          const loopDate = new Date(start);
          while (loopDate <= end) {
              const dateKey = loopDate.toISOString().split('T')[0];
              const sourceAssignments = nextSchedule[originCrewId]?.[dateKey] || [];
              if (sourceAssignments.length > 0) {
                  targets.forEach(target => {
                      const { crewId: destId, mode } = target;
                      if (!nextSchedule[destId]) nextSchedule[destId] = {};
                      const existingDest = nextSchedule[destId][dateKey] || [];
                      const newAssigns = sourceAssignments.map(orig => {
                          const copy = { ...orig };
                          copy.id = `${destId}-${dateKey}-${orig.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                          if (orig.type === 'VOO' || orig.type === 'SIM') {
                              if (mode === 'ALUNO') { copy.functionCode = 'ALU'; } 
                              else if (mode === 'INSTRUTOR') { copy.functionCode = 'INS'; } 
                              else if (mode === 'XQR') { copy.type = 'XQR'; copy.functionCode = 'XQR'; } 
                              else if (mode === 'EXM') { copy.functionCode = 'EXM'; }
                          }
                          if (mode === 'XQR' && orig.type !== 'VOO') { copy.type = 'XQR'; }
                          return copy;
                      });
                      nextSchedule[destId][dateKey] = sortAssignments([...existingDest, ...newAssigns]);
                  });
              }
              loopDate.setDate(loopDate.getDate() + 1);
          }
          return nextSchedule;
      });
      addLog(`Cópia de programação realizada de ${originCrewId} para ${targets.length} tripulantes.`, 'success');
  };

  // --- NEW SAVING LOGIC EXTRACTION ---
  const handleAssignmentSave = (updates: Partial<Assignment>) => {
      if (!editingAssignment) return false;

      const dateKey = editingAssignment.date.toISOString().split('T')[0];
      const isNew = editingAssignment.isCreating;
      
      let finalAssignment = { ...editingAssignment.assignment, ...updates };

      const validation = validateAssignment(editingAssignment.crewId, editingAssignment.date, finalAssignment, schedule, regulatoryConfig, flights, crew, scheduleMetadata, generationParams);
      if (!validation.valid) {
          if (validation.conversionAction === 'TO_FR') {
              finalAssignment = { ...finalAssignment, type: 'FR', details: 'FR (Auto-Convert)', start: '00:00', end: '23:59' };
              addLog(`Conversão Automática: ${validation.message}`, 'warning', validation.lawReference);
          } else {
              addLog(`Bloqueio: ${validation.message}`, 'error', validation.lawReference);
              setAssignmentAlert({ message: validation.message || 'Erro de validação', type: 'error' });
              return false;
          }
      } else if (validation.isWarning) {
          // Special case for EMI: only log, don't show blocking alert
          if (validation.message?.includes('EMI') || validation.message?.includes('Instrução em Rota')) {
              addLog(`Aviso: ${validation.message}`, 'warning', validation.lawReference);
          } else {
              // If it's a warning and we ALREADY acknowledged it, allow save
              if (warningAcknowledged === validation.message) {
                  setWarningAcknowledged(null);
              } else {
                  addLog(`Aviso: ${validation.message}`, 'warning', validation.lawReference);
                  setAssignmentAlert({ message: validation.message || 'Aviso de validação', type: 'warning' });
                  return false; // Don't close modal yet, let them see warning
              }
          }
      }

      setWarningAcknowledged(null); // Clear any stale warning acknowledgement

      if (isNew) {
          addLog(`Nova programação criada para ${crew.find(c => c.id === editingAssignment.crewId)?.name}`, 'success');
      }

      // Proactive Qualification Sync: if this is a training/qualification activity
      const isGS = finalAssignment.type === 'GS' || (finalAssignment.code && ['AVSEC', 'SIGLA', 'PPSP', 'CHT', 'CMA'].includes(finalAssignment.code.toUpperCase()));
      
      const newSchedule = { 
        ...schedule, 
        [editingAssignment.crewId]: { 
            ...(schedule[editingAssignment.crewId] || {}), 
            [dateKey]: isNew 
                ? [...(schedule[editingAssignment.crewId]?.[dateKey] || []), finalAssignment]
                : (schedule[editingAssignment.crewId]?.[dateKey] || []).map(a => a.id === finalAssignment.id ? finalAssignment : a)
        }
      };

      const currentCrew = crew.find(c => c.id === editingAssignment.crewId);

      if (isGS) {
        const syncedCrew = syncQualificationsFromSchedule(crew, newSchedule, qualifications);
        setCrew(syncedCrew);
        dbInstance.saveCrew(syncedCrew);
        addLog(`Certificados de ${currentCrew?.name} atualizados automaticamente.`, 'info');
      }

      // -------------------------------------------------------------------------
      // AUTOMATIC TAG UPDATE LOGIC (CONSOLIDATED)
      // -------------------------------------------------------------------------
      const isTypeXqr = finalAssignment.type === 'XQR';
      const isTypeSim = finalAssignment.type === 'SIM';
      const hasXqrDetail = (finalAssignment.details && finalAssignment.details.includes('XQR')) || 
                          (finalAssignment.functionCode && finalAssignment.functionCode.includes('XQR'));
      const isSimRoute = !finalAssignment.route || finalAssignment.route === '';
      
      const isXqrSimEvent = (isTypeXqr && isSimRoute) || (isTypeSim && hasXqrDetail);
      
      if (currentCrew) {
          let nextTag: OperationalTag | undefined;
          let logMsg = '';

          if (isXqrSimEvent) {
              if (currentCrew.operationalTag === 'GS' || currentCrew.operationalTag === 'REQ') {
                  nextTag = 'EMI';
                  logMsg = `Status de ${currentCrew.name} alterado para EMI (XQR-SIM).`;
              }
          } 
          else if (isTypeXqr && !isSimRoute) {
              if (currentCrew.operationalTag !== 'AVBL') {
                  nextTag = 'AVBL';
                  logMsg = `Status de ${currentCrew.name} alterado para AVBL (Cheque em Rota).`;
              }
          }

          if (nextTag) {
              setCrew(prev => {
                  const next = prev.map(cm => {
                      if (cm.id === editingAssignment.crewId) {
                          return { ...cm, operationalTag: nextTag! };
                      }
                      return cm;
                  });
                  dbInstance.saveCrew(next);
                  return next;
              });
              if (logMsg) addLog(logMsg, 'success');
          }
      }

      const isSim = finalAssignment.type === 'SIM' || 
                      (finalAssignment.details && finalAssignment.details.includes('SIM')) ||
                      (finalAssignment.type === 'XQR' && !finalAssignment.route); 

      const isTRI = finalAssignment.functionCode === 'XQR-TRI' || 
                      (finalAssignment.details && finalAssignment.details.includes('TRI'));
                      
      const isTRE = finalAssignment.functionCode === 'XQR-TRE' || 
                      (finalAssignment.details && finalAssignment.details.includes('TRE'));

      if (isSim && (isTRI || isTRE)) {
          setCrew(prev => {
              const next = prev.map(c => {
                  if (c.id === editingAssignment.crewId) {
                      return {
                          ...c,
                          instructionTag: (isTRI ? 'TRI' : 'TRE') as InstructionTag,
                          syntheticTag: (isTRI ? 'SFI' : 'SFE') as SyntheticTag,
                          operationalTag: 'AVBL' as OperationalTag 
                      };
                  }
                  return c;
              });
              dbInstance.saveCrew(next);
              return next;
          });
          addLog(`Qualificação ${isTRI ? 'TRI/SFI' : 'TRE/SFE'} ativada e Tripulante liberado (AVBL).`, 'success');
      }

      if (finalAssignment.details === 'DEMISS' || finalAssignment.code === 'DEMISS') {
          const dateStr = editingAssignment.date.toISOString().split('T')[0];
          setCrew(prev => {
              const next = prev.map(c => {
                  if (c.id === editingAssignment.crewId) {
                      return { ...c, isOn: false, resignationDate: dateStr };
                  }
                  return c;
              });
              dbInstance.saveCrew(next);
              return next;
          });
          addLog(`Tripulante desligado (DEMISS) em ${editingAssignment.date.toLocaleDateString()}.`, 'warning');
      }

      if (finalAssignment.type === 'VAC') {
          setCrew(prev => {
              const next = prev.map(c => {
                  if (c.id === editingAssignment.crewId) {
                      return { ...c, isOn: false };
                  }
                  return c;
              });
              dbInstance.saveCrew(next);
              return next;
          });
          addLog(`Tripulante inativado por Férias (VAC) em ${editingAssignment.date.toLocaleDateString()}.`, 'info');
      }

      setSchedule(prev => {
          let updatedSchedule = { ...prev };
          
          if (finalAssignment.type === 'MNT' && finalAssignment.maintenanceDates) {
              const start = new Date(finalAssignment.maintenanceDates.startDate);
              start.setUTCHours(12, 0, 0, 0); // safe timezone parsing
              const end = new Date(finalAssignment.maintenanceDates.endDate);
              end.setUTCHours(12, 0, 0, 0);
              
              const crewData = updatedSchedule[editingAssignment.crewId] || {};
              updatedSchedule[editingAssignment.crewId] = { ...crewData };
              
              if (end >= start) {
                  // Iterar sobre cada dia
                  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                      const dKey = d.toISOString().split('T')[0];
                      const dayData = updatedSchedule[editingAssignment.crewId][dKey] || [];
                      
                      // Clone assignment to ensure different IDs if needed (for React keys, etc.)
                      // For multi-day, maybe give unique ids per day if it's new
                      const cloneAssign = { ...finalAssignment, id: isNew ? `ASG-MNT-${editingAssignment.crewId}-${dKey}-${Date.now()}` : finalAssignment.id };
                      
                      const { assignments: dayDataWithTrimmed, logs } = autoAdjustOverlaps(dayData, cloneAssign);
                      if (dKey === dateKey) logs.forEach(msg => addLog(msg, 'warning'));
                      
                      let newList;
                      if (isNew) {
                         newList = [...dayDataWithTrimmed, cloneAssign];
                      } else {
                         newList = dayDataWithTrimmed.some(a => a.id === cloneAssign.id) 
                            ? dayDataWithTrimmed.map(a => a.id === cloneAssign.id ? cloneAssign : a)
                            : [...dayDataWithTrimmed, cloneAssign];
                      }
                      updatedSchedule[editingAssignment.crewId][dKey] = sortAssignments(newList);
                  }
              }
              return updatedSchedule;
          }

          // NORMAL SINGLE DAY LOGIC
          const crewData = prev[editingAssignment.crewId] || {};
          const dayData = crewData[dateKey] || [];
          let newList;
          
          if (isNew) finalAssignment.id = `ASG-${editingAssignment.crewId}-${dateKey}-${Date.now()}`;

          const { assignments: dayDataWithTrimmed, logs } = autoAdjustOverlaps(dayData, finalAssignment);
          
          logs.forEach(msg => addLog(msg, 'warning'));

          if (isNew) {
              newList = [...dayDataWithTrimmed, finalAssignment];
          } else {
              newList = dayDataWithTrimmed.map(a => a.id === finalAssignment.id ? finalAssignment : a);
          }
          
          return { 
              ...prev, 
              [editingAssignment.crewId]: { 
                  ...crewData, 
                  [dateKey]: sortAssignments(newList)
              } 
          };
      });
      return true;
  };

  if (!session) {
    return <LoginScreen onLoginSuccess={(newSession) => setSession(newSession)} />;
  }

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans overflow-hidden">
      {activeModule !== 'FADIGA' && (
          <Sidebar 
            currentYear={currentYear} currentMonth={currentMonth} flights={flights} customBlocks={customBlocks}
            activities={activities} regulatoryConfig={regulatoryConfig} scheduleMetadata={scheduleMetadata}
            collapsed={collapsed} isGenerating={isGenerating} activeModule={activeModule}
            onToggleCollapse={() => setCollapsed(!collapsed)} onMonthChange={setCurrentMonth} onYearChange={setCurrentYear}
            onGenerate={handleGenerate} onClear={handleOpenClearModal} onSave={handleSaveToDB}
            onExport={handleExportSchedule} onImport={handleImportSchedule}
            onGoToToday={handleGoToToday}
            onToggleFlight={(code) => setFlights(prev => prev.map(f => f.code === code ? { ...f, active: !f.active } : f))}
            onToggleFlightDay={handleToggleFlightDay} 
            onAddFlight={(f) => setFlights(prev => { const next = [...prev, f]; dbInstance.saveFlights(next); return next; })}
            onAddCustomBlock={(b) => setCustomBlocks(prev => [...prev, b])}
            onDeleteCustomBlock={(id) => setCustomBlocks(prev => prev.filter(b => b.id !== id))}
            onToggleFavoriteActivity={(id) => setActivities(prev => prev.map(a => a.id === id ? {...a, isFavorite: !a.isFavorite} : a))}
            generationStartDay={generationStartDay} onUpdateGenerationStart={setGenerationStartDay}
            generationDayLimit={generationDayLimit} onUpdateGenerationLimit={setGenerationDayLimit}
            onOpenGenerationSettings={() => setShowGenerationSettings(true)} onOpenFlightNetwork={() => setShowFlightNetwork(true)}
            onToggleRegConfig={handleToggleRegConfig}
            onUpdateMetadata={handleUpdateMetadata}
            onUpdateRbacAppendix={handleUpdateRbacAppendix}
            onUpdateFlight={handleUpdateFlight}
            onAddActivity={handleAddActivity}
            onEditActivity={handleEditActivityFromSidebar}
            generationParams={generationParams} 
            onUpdateGenerationParams={setGenerationParams}
            showCaptains={showCaptains}
            onToggleCaptains={() => setShowCaptains(!showCaptains)}
            showFirstOfficers={showFirstOfficers}
            onToggleFirstOfficers={() => setShowFirstOfficers(!showFirstOfficers)}
            onImportCsv={handleImportCsv}
            onExportCsv={handleExportCsv}
          />
      )}
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
         <Header 
            schedule={schedule} crew={crew} bases={bases} clipboard={clipboard} flights={flights} qualifications={qualifications}
            alerts={logs.filter(l => l.type === 'error').length} viewMode={viewMode}
            activeModule={activeModule} onOpenActivities={() => setShowActivities(true)}
            onOpenBases={() => setShowBases(true)}
            onOpenQualifications={() => setShowQualifications(true)} onOpenCopyModal={() => setShowCopyModal(true)}
            onOpenAircraft={() => setShowAircraftModal(true)} onOpenFleet={() => setShowFleetModal(true)}
            onToggleViewMode={() => setViewMode(prev => prev === 'CREW' ? 'AIRCRAFT' : 'CREW')}
            onModuleChange={(m) => setActiveModule(m)} 
            onDeleteCrew={(id) => setCrew(prev => prev.filter(c => c.id !== id))}
            onUpdateCrew={handleUpdateCrew}
            onAddCrew={handleAddCrew}
            onSyncQualifications={handleSyncQualifications}
            showCaptains={showCaptains}
            onToggleCaptains={() => setShowCaptains(!showCaptains)}
            showFirstOfficers={showFirstOfficers}
            onToggleFirstOfficers={() => setShowFirstOfficers(!showFirstOfficers)}
            currentUser={session.username}
            onLogout={() => {
              logoutUser();
              setSession(null);
            }}
         />
         
         {activeModule === 'FADIGA' ? (
             <FatigueModule 
                crewList={filteredCrewList} 
                schedule={schedule} 
                startDate={viewStartDate}
                selectedCrewId={selectedCrewForFatigue}
                onSelectCrew={handleSelectCrewForFatigue}
                activities={activities} 
             />
         ) : (
             <ScheduleGrid 
                days={days} crewList={filteredCrewList} aircraftList={aircraft} schedule={schedule}
                flights={flights} viewMode={viewMode} activeModule={activeModule}
                regulatoryConfig={regulatoryConfig} scheduleMetadata={scheduleMetadata}
                onDrop={handleDrop} onDeleteAssignment={handleDeleteAssignment}
                onDeleteColumn={handleDeleteColumn}
                onToggleCrewStatus={(id) => setCrew(prev => prev.map(c => c.id === id ? { ...c, isOn: !c.isOn } : c))}
                onUpdateCrewTag={(id, type, val) => setCrew(prev => prev.map(c => c.id === id ? { ...c, [type === 'admin' ? 'adminTag' : type === 'operational' ? 'operationalTag' : type === 'synthetic' ? 'syntheticTag' : 'instructionTag']: val } : c))}
                onToggleFatigue={(id) => setCrew(prev => prev.map(c => c.id === id ? { ...c, fatigueStatus: c.fatigueStatus === 'FIT' ? 'FATIGUED' : 'FIT' } : c))}
                onToggleAircraftApu={(id, currentStatus) => setAircraft(prev => prev.map(ac => ac.id === id ? { ...ac, apuStatus: currentStatus === 'AVLB' ? 'NAVLB' : 'AVLB' } : ac))}
                onCopy={handleCopy} onPaste={handlePaste}
                onEdit={(assign, crewId, date) => setEditingAssignment({ assignment: assign, crewId, date, isCreating: false })}
                onAdd={(crewId, date) => setEditingAssignment({ assignment: { id: `NEW-${Date.now()}`, type: 'VOO', start:'08:00', end:'12:00' }, crewId, date, isCreating: true })}
                onPrevDay={handlePrevDay}
                onNextDay={handleNextDay}
                onNameClick={handleSelectCrewForFatigue}
                activities={activities}
             />
         )}
      </div>

      {activeModule !== 'FADIGA' && (
          <RightSidebar schedule={schedule} crew={crew} logs={logs} collapsed={rightSidebarCollapsed} onToggleCollapse={() => setRightSidebarCollapsed(!rightSidebarCollapsed)} onClearLogs={clearLogs} onReviewMonth={handleReviewMonth} isReviewing={isReviewing} />
      )}

      {showClearModal && <ClearScheduleModal onClose={() => setShowClearModal(false)} onConfirm={performClearMonth} monthName={MONTHS[currentMonth]} year={currentYear} />}
      {showGenerationSettings && <GenerationSettingsModal onClose={() => setShowGenerationSettings(false)} params={generationParams} onUpdateParams={setGenerationParams} />}
      {showFlightNetwork && <FlightNetworkModal onClose={() => setShowFlightNetwork(false)} flights={flights} />}
      {editingAssignment && (
         <EditAssignmentModal 
            key={editingAssignment.assignment.id} 
            assignment={editingAssignment.assignment} crewName={crew.find(c => c.id === editingAssignment.crewId)?.name || aircraft.find(a => a.id === editingAssignment.crewId)?.registration || ''}
            date={editingAssignment.date} onClose={() => setEditingAssignment(null)}
            isCreating={editingAssignment.isCreating}
            isAircraftView={viewMode === 'AIRCRAFT'}
            onSave={(updates) => handleAssignmentSave(updates)}
            onSaveAndNew={(updates) => {
               const success = handleAssignmentSave(updates);
               if (success === false) return false;
               // Force new assignment state without closing modal
               setEditingAssignment({ 
                   assignment: { id: `NEW-${Date.now()}`, type: 'VOO', start:'08:00', end:'12:00' }, 
                   crewId: editingAssignment.crewId, 
                   date: editingAssignment.date, 
                   isCreating: true 
               });
               return true;
            }}
            onDelete={() => {
                handleDeleteAssignment(editingAssignment.crewId, editingAssignment.date, editingAssignment.assignment.id);
                setEditingAssignment(null);
            }}
            activities={activities}
         />
      )}
      
      {assignmentAlert && (
        <div 
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setAssignmentAlert(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 w-[500px] h-[250px] rounded-xl shadow-2xl flex flex-col items-center justify-center p-8 relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setAssignmentAlert(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            
            <div className={`${assignmentAlert.type === 'error' ? 'text-red-400' : 'text-amber-400'} font-bold text-2xl mb-4 uppercase tracking-widest`}>
                {assignmentAlert.type === 'error' ? 'Bloqueio' : 'Atenção'}
            </div>
            
            <div className="text-slate-300 text-lg leading-relaxed font-medium">
                {assignmentAlert.message}
            </div>

            {assignmentAlert.type === 'warning' && (
                <button 
                    onClick={() => {
                        setWarningAcknowledged(assignmentAlert.message);
                        setAssignmentAlert(null);
                    }} 
                    className="mt-6 px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-transform active:scale-95 shadow-lg"
                >
                    PROSSEGUIR
                </button>
            )}
          </div>
        </div>
      )}
      {showActivities && <ActivitiesModal activities={activities} onClose={() => { setShowActivities(false); setActivityEditId(null); }} onSave={(acts) => { setActivities(acts); dbInstance.saveActivities(acts); }} initialSelectedId={activityEditId} />}
      {showBases && <BasesModal bases={bases} onClose={() => setShowBases(false)} onSave={(newBases) => { setBases(newBases); dbInstance.saveBases(newBases); }} />}
      {showQualifications && <QualificationModal qualifications={qualifications} onClose={() => setShowQualifications(false)} onSave={(quals) => { setQualifications(quals); dbInstance.saveQualifications(quals); }} />}
      {showCopyModal && <ProgrammingCopyModal crewList={crew} onClose={() => setShowCopyModal(false)} onConfirm={handleConfirmCopy} />}
      {showAircraftModal && <AircraftSearchModal aircraft={aircraft} onClose={() => setShowAircraftModal(false)} onAddAircraft={(ac) => setAircraft(prev => [...prev, ac])} />}
      {showFleetModal && <FleetTypeModal fleetTypes={fleet} onClose={() => setShowFleetModal(false)} onAddFleet={(ft) => setFleet(prev => [...prev, ft])} />}
    </div>
  );
};

export default App;

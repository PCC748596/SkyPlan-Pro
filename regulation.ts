
import { 
  Assignment, 
  ScheduleMap, 
  CrewMember, 
  Flight, 
  RegulatoryConfig, 
  ScheduleMetadata, 
  GenerationParams, 
  ValidationResult, 
  AssignmentType,
  ActivityDefinition,
  EquityResult,
  AdminTag,
  OperationalTag,
  InstructionTag,
  SyntheticTag
} from './types';

export const STANDARD_TIMES: Record<string, { start: string; end: string }> = {
  'RE': { start: '06:00', end: '18:00' },
  'SA': { start: '06:00', end: '18:00' },
  'GS': { start: '08:00', end: '17:00' },
  'SIM': { start: '08:00', end: '12:00' },
  'DLS': { start: '08:00', end: '12:00' },
  'FR': { start: '00:00', end: '00:00' },
  'FS': { start: '00:00', end: '00:00' },
  'VAC': { start: '00:00', end: '00:00' },
  'INAT': { start: '00:00', end: '00:00' },
  'REPO': { start: '00:00', end: '00:00' },
  'ADM 1': { start: '08:00', end: '18:00' },
  'ADM 2': { start: '08:00', end: '17:00' },
  'AGD INS': { start: '00:00', end: '00:00' },
  'AGD REQ': { start: '00:00', end: '00:00' },
  'DEICE': { start: '08:00', end: '17:00' },
  'UPRT': { start: '08:00', end: '17:00' },
  'FM': { start: '00:00', end: '00:00' }, // Monofolga
};

export interface FatigueDataPoint {
  x: number; // Hour offset from start
  y: number; // Score
  score: number;
}

export interface FatigueBlock {
    start: number; // Hour offset
    end: number; // Hour offset
    type: string;
    label: string;
    code?: string;
    route?: string;
    isFlight: boolean;
    isPositioning: boolean; // NEW: Track if block is EXT/DLS
    durationHours: number;
    // Formatting strings
    dutyStartStr: string;
    dutyEndStr: string;
    startStr: string;
    endStr: string;
}

export interface FatigueTimelineResult {
    points: { hourOffset: number, score: number }[];
    blocks: FatigueBlock[];
    maxScore: number;
}

export const getMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const getTimes = (assignment: Assignment): { start: number, end: number } => {
  const s = assignment.actualStart || assignment.start || '00:00';
  const e = assignment.actualEnd || assignment.end || '00:00';
  const start = getMinutes(s);
  let end = getMinutes(e);
  if (end < start) end += 1440;
  return { start, end };
};

export const isMadrugadaAssignment = (assignment: Assignment): boolean => {
  const { start, end } = getTimes(assignment);
  // Simple check: touches 00:00 - 06:00 (0 to 360 min)
  return (start < 360) || (end > 1440);
};

// --- RBAC 117 TABLE A IMPLEMENTATION (Flight Time Limits) ---
export const getFlightTimeLimit = (startMin: number, legs: number): number => {
    // Start Time is in minutes from 00:00 (Horário de Apresentação)
    // Returns Limit in minutes (Tripulação Simples)
    const s = startMin % 1440;

    // Table A (Tripulação Simples)
    // 05:00 - 13:59 -> 9h30 (570m)
    // 14:00 - 19:59 -> 9h00 (540m)
    // 20:00 - 04:59 -> 8h00 (480m)

    let limit = 480; // Default 8h (Night)

    if (s >= 300 && s < 840) limit = 570; // 05:00 - 13:59 -> 9h30
    else if (s >= 840 && s < 1200) limit = 540; // 14:00 - 19:59 -> 9h00
    
    return limit;
};

// --- RBAC 117 TABLE B IMPLEMENTATION (Duty Time Limits) ---
export const getDailyDutyLimit = (startMin: number, legs: number): number => {
    // Start Time is in minutes from 00:00 (Horário de Apresentação)
    // Returns Limit in minutes
    
    // Normalize startMin to 24h
    const s = startMin % 1440;

    // Table B (Tripulação Simples)
    // 00:00 - 03:59 (0 - 239) -> 9h (540m)
    // 04:00 - 04:59 (240 - 299) -> 10h (600m)
    // 05:00 - 05:59 (300 - 359) -> 11h (660m)
    // 06:00 - 13:59 (360 - 839) -> 12h (720m)
    // 14:00 - 15:59 (840 - 959) -> 11h (660m)
    // 16:00 - 16:59 (960 - 1019) -> 10h (600m)
    // 17:00 - 23:59 (1020 - 1439) -> 9h (540m)

    let limit = 540; // Default 9h (Night)

    if (s >= 240 && s < 300) limit = 600; // 04:00 - 04:59 -> 10h
    else if (s >= 300 && s < 360) limit = 660; // 05:00 - 05:59 -> 11h
    else if (s >= 360 && s < 840) limit = 720; // 06:00 - 13:59 -> 12h
    else if (s >= 840 && s < 960) limit = 660; // 14:00 - 15:59 -> 11h
    else if (s >= 960 && s < 1020) limit = 600; // 16:00 - 16:59 -> 10h
    // Rest is 540 (9h)
    
    if (legs >= 5 && legs <= 6) limit -= 60; // -1h penalty
    if (legs >= 7) limit -= 120; // -2h penalty

    return limit;
};

export const resolveCrewTags = (crew: CrewMember, date: Date): { 
    adminTag: AdminTag, 
    operationalTag: OperationalTag, 
    instructionTag: InstructionTag, 
    syntheticTag: SyntheticTag
} => {
    const dateStr = date.toISOString().split('T')[0];

    if (crew.tagHistory && crew.tagHistory.length > 0) {
        const relevantHistory = crew.tagHistory.find(h => 
            dateStr >= h.startDate && dateStr <= h.endDate
        );
        if (relevantHistory) {
            return {
                adminTag: relevantHistory.adminTag,
                operationalTag: relevantHistory.operationalTag,
                instructionTag: relevantHistory.instructionTag,
                syntheticTag: relevantHistory.syntheticTag
            };
        }
    }

    if (crew.tagDateStart && dateStr < crew.tagDateStart) {
        return {
            adminTag: null,
            operationalTag: 'AVBL',
            instructionTag: null,
            syntheticTag: null
        };
    }

    return {
        adminTag: crew.adminTag,
        operationalTag: crew.operationalTag,
        instructionTag: crew.instructionTag,
        syntheticTag: crew.syntheticTag
    };
};

export const getLastAssignment = (schedule: ScheduleMap, crewId: string, date: Date): Assignment | undefined => {
    for (let i = 1; i <= 5; i++) {
        const d = new Date(date);
        d.setDate(d.getDate() - i);
        const k = d.toISOString().split('T')[0];
        const assigns = schedule[crewId]?.[k];
        if (assigns && assigns.length > 0) {
            // Sort to ensure we get the chronological last one, regardless of stored order
            const sorted = [...assigns].sort((a, b) => getMinutes(a.start || '00:00') - getMinutes(b.start || '00:00'));
            return sorted[sorted.length - 1];
        }
    }
    return undefined;
};

const getLocationFromAssignment = (assign: Assignment, base: string = 'VCP'): string | null => {
    // 1. Explicit airport field
    if (assign.airport) return assign.airport; 
    
    // 2. Combine inputs for parsing
    const textToParse = assign.details ? `${assign.code || ''} ${assign.details}` : (assign.code || '');
    const combinedStr = `${assign.route || ''} ${textToParse}`.toUpperCase();
    
    // Debug
    if (combinedStr.includes('DSL') || combinedStr.includes('DLS')) {
        console.log('DEBUG: Parsing DSL/DLS:', combinedStr, 'Type:', assign.type);
    }

    // 3. User Rule: "Só tem mudança de localidade por VOO ou DSL." and "Só após '>' é localidade."
    const isVooOrDls = assign.type === 'VOO' || assign.type === 'DLS' || assign.type === 'DSL' || assign.type === 'XQR' || combinedStr.includes('DLS') || combinedStr.includes('DSL');

    if (isVooOrDls) {
        if (combinedStr.includes('>')) {
            const parts = combinedStr.split('>');
            if (parts.length > 1) {
                const afterGreater = parts[1].trim().split(/[\s-]+/)[0]; 
                if (afterGreater.length >= 3) {
                    return afterGreater.substring(0, 3);
                }
            }
        }

        // Keep standard split for explicit VOO/DLS `route` field (e.g. from Auto Gen algorithm)
        if (assign.route) {
            const parts = assign.route.split(/[-:>]/);
            if (parts.length >= 2) {
                return parts[1].trim().substring(0, 3);
            }
        }
    }
    
    // FR-MAO case explicitly checked to maintain out-of-base rest
    if (['FR', 'FS', 'VAC', 'REPO'].includes(assign.type)) {
        if (combinedStr.includes('-')) {
            const potentialLoc = combinedStr.split('-').pop()?.trim().substring(0, 3) || null;
            // Basic sanity check to avoid matching noise
            if (potentialLoc && potentialLoc.length === 3 && /^[A-Z]{3}$/.test(potentialLoc)) {
                 return potentialLoc;
            }
        }
    }

    return null;
};

export const getCrewLocation = (
    crewId: string, 
    date: Date, 
    schedule: ScheduleMap, 
    crew: CrewMember,
    referenceTime?: string 
): string => {
    // 1. Check current day UP TO referenceTime
    if (referenceTime) {
        const dateKey = date.toISOString().split('T')[0];
        const dayAssignments = schedule[crewId]?.[dateKey];
        
        if (dayAssignments && dayAssignments.length > 0) {
            const sorted = [...dayAssignments].sort((a, b) => getMinutes(a.start || '00:00') - getMinutes(b.start || '00:00'));
            const refMin = getMinutes(referenceTime);
            
            // Search backwards from the assignment immediately preceding referenceTime
            for (let i = sorted.length - 1; i >= 0; i--) {
                const assign = sorted[i];
                // Only consider assignments that started before reference time
                if (getMinutes(assign.start || '00:00') < refMin) {
                     const loc = getLocationFromAssignment(assign, crew.base || 'VCP');
                     if (loc) return loc;
                }
            }
        }
    }

    // 2. Check previous days (Lookback up to 7 days)
    // We iterate day by day backwards, and within each day, assignments backwards.
    // The first assignment (most recent) that yields a location is the winner.
    for (let i = 1; i <= 7; i++) {
        const d = new Date(date);
        d.setDate(d.getDate() - i);
        const k = d.toISOString().split('T')[0];
        const assigns = schedule[crewId]?.[k];
        
        if (assigns && assigns.length > 0) {
            const sorted = [...assigns].sort((a, b) => getMinutes(a.start || '00:00') - getMinutes(b.start || '00:00'));
            // iterate backwards
            for (let j = sorted.length - 1; j >= 0; j--) {
                const loc = getLocationFromAssignment(sorted[j], crew.base || 'VCP');
                if (loc) return loc;
            }
        }
    }

    return crew.base || 'VCP';
};

export const checkCrewEligibility = (crew: CrewMember, date: Date, assignmentOrType?: Assignment | string): ValidationResult => {
    const isVacationOrInat = (typeof assignmentOrType === 'object' && ['VAC', 'INAT', 'LVS'].includes(assignmentOrType.type)) ||
                             (typeof assignmentOrType === 'string' && ['VAC', 'INAT', 'LVS'].includes(assignmentOrType));

    if (!crew.isOn) {
        if (isVacationOrInat) return { valid: true };
        const dateKey = date.toISOString().split('T')[0];
        if (crew.resignationDate) {
            if (dateKey > crew.resignationDate) {
                 return { valid: false, message: 'Tripulante inativo' };
            }
        } else {
            return { valid: false, message: 'Tripulante inativo' };
        }
    }

    if (!crew.licenseValid) return { valid: false, message: 'Licença inválida' };
    
    const tags = resolveCrewTags(crew, date);
    if (tags.operationalTag === 'OFF') return { valid: false, message: 'Tripulante em OFF (Afastado/Licença)' };
    
    if (tags.operationalTag === 'EMI') {
        return { 
            valid: true, 
            isWarning: true, 
            message: `Tripulante ${crew.name} : Disponível Instrução em Rota. Voo com Instrutor.` 
        };
    }
    
    if (tags.operationalTag === 'GS' || tags.operationalTag === 'REQ' || tags.operationalTag === 'AGD') {
        let type = '';
        let isSim = false;

        if (typeof assignmentOrType === 'object') {
            type = assignmentOrType.type;
            const det = (assignmentOrType.details || '').toUpperCase();
            if (type === 'SIM' || det.includes('SIM') || det.includes('SFI') || det.includes('SFE') || assignmentOrType.functionCode?.includes('SFI') || assignmentOrType.functionCode?.includes('SFE')) {
                isSim = true;
            }
        } else if (typeof assignmentOrType === 'string') {
            type = assignmentOrType;
            if (type === 'SIM') isSim = true;
        }

        if (!isSim && ['VOO', 'RE', 'SA', 'XQR'].includes(type)) {
             const tagName = tags.operationalTag;
             return { valid: false, message: `Tripulante com tag ${tagName} restrito a atividades de solo.` };
        }
    }

    return { valid: true };
};

export const validateRestBetweenDuties = (
    date: Date, 
    assignment: Assignment, 
    schedule: ScheduleMap, 
    crewId: string, 
    flights: Flight[],
    params?: GenerationParams
): ValidationResult => {
    return { valid: true }; 
};

export const validateMonofolgaPresentation = (
    assignment: Assignment, 
    date: Date, 
    schedule: ScheduleMap, 
    crewId: string, 
    params?: GenerationParams
): ValidationResult => {
    if (!params?.enableMonofolga) return { valid: true };
    if (['FR', 'FS', 'VAC', 'INAT', 'REPO'].includes(assignment.type) || assignment.details === 'FM') {
        return { valid: true };
    }

    const d1 = new Date(date);
    d1.setDate(date.getDate() - 1);
    const k1 = d1.toISOString().split('T')[0];

    const d2 = new Date(date);
    d2.setDate(date.getDate() - 2);
    const k2 = d2.toISOString().split('T')[0];

    const assigns1 = schedule[crewId]?.[k1] || [];
    const assigns2 = schedule[crewId]?.[k2] || [];

    const isFolga = (assigns: Assignment[]) => {
        return assigns.some(a =>
            ['FR', 'FS', 'VAC', 'INAT', 'REPO'].includes(a.type) ||
            (a.details && a.details.toUpperCase() === 'FM') 
        );
    };

    const isDay1Folga = isFolga(assigns1);
    const isDay2Folga = isFolga(assigns2);

    if (isDay1Folga && !isDay2Folga) {
        const startMin = getMinutes(assignment.actualStart || assignment.start || '00:00');
        if (startMin < 600) {
             return {
                 valid: false,
                 message: 'Alerta de Monofolga: Apresentação antes das 10:00 após folga única (RBAC 117 / SGRF).'
             };
        }
    }

    return { valid: true };
};

export const validateMadrugadaRules = (assignment: Assignment, date: Date, schedule: ScheduleMap, crewId: string, params?: GenerationParams): ValidationResult => { return { valid: true }; };
export const validateConsecutiveDutyDays = (assignment: Assignment, date: Date, schedule: ScheduleMap, crewId: string, params?: GenerationParams): ValidationResult => { return { valid: true }; };
export const validateConsecutiveInat = (assignment: Assignment, date: Date, schedule: ScheduleMap, crewId: string, params?: GenerationParams): ValidationResult => { return { valid: true }; };

export const validateLocationRules = (
    assignment: Assignment,
    date: Date,
    schedule: ScheduleMap,
    crewId: string,
    crew: CrewMember
): ValidationResult => {
    const loc = getCrewLocation(crewId, date, schedule, crew, assignment.start);
    
    if (assignment.type === 'VOO' && assignment.route) {
        const origin = assignment.route.split(/[-:>]/)[0];
        if (origin !== loc) {
            return { valid: false, message: `Tripulante em ${loc}, voo sai de ${origin}` };
        }
    }
    return { valid: true };
};

export const validateOffDayLocation = (
    assignment: Assignment,
    date: Date,
    schedule: ScheduleMap,
    crew: CrewMember
): ValidationResult => {
    if (!['FR', 'FS', 'FA', 'FP', 'FM'].includes(assignment.type) && !(assignment.details && assignment.details.startsWith('FR'))) return { valid: true };
    
    const tags = resolveCrewTags(crew, date);
    if (tags.operationalTag === 'GS' || tags.operationalTag === 'REQ') {
        return { valid: true };
    }
    const location = getCrewLocation(crew.id, date, schedule, crew, assignment.start);
    const base = crew.base || 'VCP';

    if (location !== base) {
        // Exception: Check if there is a SIM scheduled in the window [Date-4, Date+4]
        // This indicates the crew is out of base for Simulator training.
        let hasSimNearby = false;
        
        for (let i = -4; i <= 4; i++) {
            const checkDate = new Date(date);
            checkDate.setDate(date.getDate() + i);
            const dateKey = checkDate.toISOString().split('T')[0];
            const dayAssignments = schedule[crew.id]?.[dateKey];

            if (dayAssignments && dayAssignments.some(a => 
                a.type === 'SIM' || 
                (a.details && a.details.toUpperCase().includes('SIM'))
            )) {
                hasSimNearby = true;
                break;
            }
        }

        if (hasSimNearby) {
            return { valid: true };
        }

        return { 
            valid: false, 
            message: `Folga fora da base (${location}) não permitida. Apenas para GS, REQ ou adjacente a SIM.` 
        };
    }
    return { valid: true };
};

export const validateAssignment = (
    crewId: string,
    date: Date,
    newAssignment: Assignment,
    schedule: ScheduleMap,
    config: RegulatoryConfig,
    flights: Flight[],
    crewList: CrewMember[],
    meta: ScheduleMetadata,
    params?: GenerationParams
): ValidationResult & { conversionAction?: 'TO_FR' } => {
    const crew = crewList.find(c => c.id === crewId);
    if (!crew) return { valid: false, message: 'Tripulante não encontrado' };

    const checkDate = new Date(date);
    checkDate.setHours(23, 59, 59, 999);

    let isExpired = false;
    let expiredQualName = '';
    
    if (crew.qualifications) {
        for (const code in crew.qualifications) {
            const qual = crew.qualifications[code];
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
                    if (exactExpDate.getTime() < checkDate.getTime()) {
                        isExpired = true;
                        expiredQualName = code;
                        break;
                    }
                }
            }
        }
    }

    if (isExpired && newAssignment.type === 'VOO' && newAssignment.code?.toUpperCase().startsWith('LV')) {
        return { valid: false, message: `Tripulante com carteira vencida (${expiredQualName}). Voo LV não permitido.` };
    }

    const isDemiss = newAssignment.details === 'DEMISS' || newAssignment.code === 'DEMISS' || (newAssignment.details && newAssignment.details.includes('DEMISS'));
    const isVac = newAssignment.type === 'VAC';
    const isExtOrDls = newAssignment.type === 'DLS' || (newAssignment.type === 'VOO' && newAssignment.functionCode === 'EXT') || (newAssignment.details && (newAssignment.details.includes('DLS') || newAssignment.details.includes('DSL')));

    const eligibility = checkCrewEligibility(crew, date, newAssignment);
    
    if (eligibility.isWarning) {
        // Warning case: valid: true, but with a warning message
        return eligibility as any; 
    }
    
    if (!eligibility.valid) {
        if (isDemiss || isVac) return { valid: true };
        if (eligibility.message && eligibility.message.includes('OFF')) return eligibility;
        if (isExtOrDls) return { valid: true };
        return eligibility;
    }

    const restCheck = validateRestBetweenDuties(date, newAssignment, schedule, crewId, flights, params);
    if (!restCheck.valid) {
        if (isExtOrDls) return { valid: true, message: `Aviso: ${restCheck.message} (Liberado EXT/DLS)` };
        return restCheck;
    }

    const monofolgaCheck = validateMonofolgaPresentation(newAssignment, date, schedule, crewId, params);
    if (!monofolgaCheck.valid) return monofolgaCheck;

    const madrugadaCheck = validateMadrugadaRules(newAssignment, date, schedule, crewId, params);
    if (!madrugadaCheck.valid) return madrugadaCheck;

    const consecutiveCheck = validateConsecutiveDutyDays(newAssignment, date, schedule, crewId, params);
    if (!consecutiveCheck.valid) return consecutiveCheck;

    const inatCheck = validateConsecutiveInat(newAssignment, date, schedule, crewId, params);
    if (!inatCheck.valid) return inatCheck;

    const locCheck = validateLocationRules(newAssignment, date, schedule, crewId, crew);
    if (!locCheck.valid) return locCheck;

    const offDayCheck = validateOffDayLocation(newAssignment, date, schedule, crew);
    if (!offDayCheck.valid) return offDayCheck;

    const dateKey = date.toISOString().split('T')[0];
    const existingAssignments = schedule[crewId]?.[dateKey] || [];
    const { start: newStart, end: newEnd } = getTimes(newAssignment);
    
    if (newStart !== newEnd) {
        for (const assign of existingAssignments) {
            if (assign.id === newAssignment.id) continue;
            const { start: exStart, end: exEnd } = getTimes(assign);
            if (Math.max(newStart, exStart) < Math.min(newEnd, exEnd)) {
                 return { valid: false, message: `Sobreposição com ${assign.code || assign.type}` };
            }
        }
    }
    return { valid: true };
};

export const validateFlightCompleteness = (
    flightCode: string, 
    date: Date, 
    assignedCrew: CrewMember[], 
    flights: Flight[]
): ValidationResult => {
    if (assignedCrew.length === 0) {
        return { valid: false, message: 'Tripulação não atribuída' };
    }
    return { valid: true };
};

export const validateTagApplication = () => { return { valid: true }; };
export const validateFlightCompositionAdd = () => { return { valid: true }; };
export const validateSchedulePublication = () => { return { valid: true }; };

export const calculateDutyWindow = (assignment: Assignment, flight?: Flight): { start: number, end: number, duration: number } => {
    const { start, end } = getTimes(assignment);
    let duration = end - start;
    if (duration < 0) duration += 1440;
    return { start, end, duration };
};

export const calculateRequiredRest = (dutyDuration: number, isFlight: boolean, timezones: number, params?: GenerationParams): number => {
    if (!params) return 12 * 60;
    return params.minRestDefault; 
};

export const calculateFatigueTimeline = (
    assignments: Assignment[], 
    startDate: Date, 
    hoursToShow: number, 
    activities?: ActivityDefinition[],
    admissionDate?: Date
): FatigueTimelineResult => {
    const points: { hourOffset: number, score: number }[] = [];
    
    const getGlobalHour = (dateStr: string, timeStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const [hh, mm] = timeStr.split(':').map(Number);
        const assignDate = new Date(y, m-1, d, hh, mm);
        const diffMs = assignDate.getTime() - startDate.getTime();
        return diffMs / (1000 * 60 * 60);
    };

    const formatHourOffset = (offsetHours: number) => {
        const d = new Date(startDate.getTime() + offsetHours * 3600000);
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        return `${hh}:${mm}`;
    };

    const rawBlocks: FatigueBlock[] = [];

    assignments.forEach(a => {
        let dateStr = (a as any)._date;
        if (!dateStr) {
            const parts = a.id.split('-');
            const datePartIdx = parts.findIndex(p => p.startsWith('20'));
            if (datePartIdx !== -1) {
                dateStr = `${parts[datePartIdx]}-${parts[datePartIdx+1]}-${parts[datePartIdx+2]}`;
            }
        }
        
        if (!dateStr) return;

        const startT = a.actualStart || a.start || '00:00';
        const endT = a.actualEnd || a.end || '00:00';
        
        let startHour = getGlobalHour(dateStr, startT);
        let endHour = getGlobalHour(dateStr, endT);
        
        if (endHour < startHour) endHour += 24;
        
        if (startHour === endHour && ['FR', 'FS', 'VAC', 'INAT', 'REPO'].includes(a.type)) {
            endHour += 24;
        }

        if (['FR', 'FS', 'VAC', 'INAT', 'REPO'].includes(a.type)) {
            rawBlocks.push({
                start: startHour, end: endHour,
                type: a.type, label: a.details || a.type,
                dutyStartStr: formatHourOffset(startHour), 
                dutyEndStr: formatHourOffset(endHour), 
                startStr: startT, 
                endStr: endT, 
                isFlight: false,
                isPositioning: false,
                durationHours: endHour - startHour
            });
            return;
        }

        const isExt = 
            a.type === 'DLS' || 
            a.functionCode === 'EXT' || 
            (a.details && (a.details.toUpperCase().includes('DLS') || a.details.toUpperCase().includes('EXT') || a.details.toUpperCase().includes('DSL')));

        const isFlightAssignment = 
            a.type === 'VOO' || 
            (a.type === 'XQR' && !!a.route && a.route.includes('-')) ||
            (!!a.route && a.route.includes('-') && a.functionCode && ['EXM', 'XQR', 'XQR-TRI', 'XQR-TRE', 'XQR-SFI', 'XQR-SFE', 'EXPREC'].includes(a.functionCode));

        let dutyStart = startHour;
        let dutyEnd = endHour;
        
        if (isFlightAssignment) {
            let presentationMin = 30;
            if (a.route && a.route.toUpperCase().startsWith('VCP')) presentationMin = 60;
            dutyStart = startHour - (presentationMin / 60);
            dutyEnd = endHour + (30 / 60); 
        }

        rawBlocks.push({
            start: dutyStart,
            end: dutyEnd,
            type: a.type,
            code: a.code,
            route: a.route,
            label: a.code || a.details || a.type,
            dutyStartStr: formatHourOffset(dutyStart),
            dutyEndStr: formatHourOffset(dutyEnd),
            startStr: startT,
            endStr: endT,
            isFlight: isFlightAssignment,
            isPositioning: isExt,
            durationHours: dutyEnd - dutyStart
        });
    });

    const workBlocks = rawBlocks.filter(b => 
        !['FR', 'FS', 'VAC', 'INAT', 'REPO'].includes(b.type) &&
        !['AGD REQ', 'AGD INS', 'DEMISS'].includes(b.label || '') &&
        !b.type.includes('DEMISS') &&
        !(b.label && b.label.includes('DEMISS'))
    );
    workBlocks.sort((a, b) => a.start - b.start);

    const blocksWithSleep = [...rawBlocks];
    const generatedSleeps: FatigueBlock[] = [];

    const lookback = 48;
    const startSimTime = startDate.getTime() - (lookback * 3600000);
    const endSimTime = startDate.getTime() + (hoursToShow * 3600000);
    
    let currentSimDate = new Date(startSimTime);
    currentSimDate.setHours(12, 0, 0, 0); 
    if (currentSimDate.getTime() > startSimTime) {
        currentSimDate.setDate(currentSimDate.getDate() - 1);
    }

    while (currentSimDate.getTime() < endSimTime) {
        const currentNoonHour = (currentSimDate.getTime() - startDate.getTime()) / 3600000;
        
        const standardStart = currentNoonHour + 11; 
        const standardEnd = standardStart + 8;

        let bestStart = standardStart;
        let bestEnd = standardEnd;
        let found = false;

        const isValidWindow = (s: number, e: number) => {
            const workOverlap = workBlocks.some(b => Math.max(s, b.start) < Math.min(e, b.end));
            if (workOverlap) return false;
            const sleepOverlap = generatedSleeps.some(b => Math.max(s, b.start) < Math.min(e, b.end));
            if (sleepOverlap) return false;
            return true;
        };

        if (isValidWindow(standardStart, standardEnd)) {
            bestStart = standardStart;
            bestEnd = standardEnd;
            found = true;
        } else {
            const nextDuty = workBlocks.find(b => b.start >= standardStart && b.start < standardStart + 24);
            if (nextDuty) {
                const preStart = nextDuty.start - 1.0 - 8.0; 
                const preEnd = nextDuty.start - 1.0;
                if (isValidWindow(preStart, preEnd)) {
                    bestStart = preStart;
                    bestEnd = preEnd;
                    found = true;
                }
            }

            if (!found) {
                const relevantDuties = workBlocks.filter(b => b.end <= standardEnd + 4 && b.end >= standardStart - 12);
                if (relevantDuties.length > 0) {
                    const lastDuty = relevantDuties[relevantDuties.length - 1]; 
                    const postStart = lastDuty.end + 1.0; 
                    const postEnd = postStart + 8.0;
                    if (isValidWindow(postStart, postEnd)) {
                        bestStart = postStart;
                        bestEnd = postEnd;
                        found = true;
                    }
                }
            }
        }

        if (found) {
            const newSleep: FatigueBlock = {
                start: bestStart,
                end: bestEnd,
                type: 'GENERATED_SLEEP',
                label: 'SLEEP',
                dutyStartStr: formatHourOffset(bestStart),
                dutyEndStr: formatHourOffset(bestEnd),
                startStr: '',
                endStr: '',
                isFlight: false,
                isPositioning: false,
                durationHours: 8
            };
            blocksWithSleep.push(newSleep);
            generatedSleeps.push(newSleep);
        }

        currentSimDate.setDate(currentSimDate.getDate() + 1);
    }

    blocksWithSleep.sort((a, b) => a.start - b.start);

    const isFatiguingBlock = (b: FatigueBlock) => {
        if (b.isFlight) return true;
        if (['GENERATED_SLEEP', 'REPO'].includes(b.type)) return false;
        if (b.label === 'DEMISS' || b.type === 'DEMISS' || (b.label && b.label.includes('DEMISS'))) return false;
        if (activities) {
            const exactMatch = activities.find(a => a.code === b.label);
            if (exactMatch) return exactMatch.fadiga;
            const typeConfig = activities.find(a => a.code === b.type);
            if (typeConfig) return typeConfig.fadiga;
        }
        if (['FR', 'FS', 'VAC', 'INAT', 'REPO'].includes(b.type)) return false;
        if (['AGD REQ', 'AGD INS'].includes(b.label)) return false; 
        return true; 
    };

    const LOOKBACK_HOURS = 48;
    let fatigue = 2.0; 
    const step = 0.25; 
    let lastState = 'AWAKE'; 
    let maxScore = 0;

    let admissionDateWithTime: Date | undefined = undefined;
    let preAdmissionTime = 0;
    if (admissionDate) {
        admissionDateWithTime = new Date(admissionDate);
        admissionDateWithTime.setHours(8, 0, 0, 0); 
        preAdmissionTime = admissionDateWithTime.getTime() - (9 * 3600000); 
    }

    for (let h = -LOOKBACK_HOURS; h <= hoursToShow; h += step) {
        const currentSimMs = startDate.getTime() + h * 3600000;
        const currentSimDateObj = new Date(currentSimMs);
        const hourOfDay = currentSimDateObj.getHours() + (currentSimDateObj.getMinutes() / 60);
        
        let totalScore = 0;

        const hasDemissHappened = assignments.some(a => {
            const isDemissAssign = a.details === 'DEMISS' || a.code === 'DEMISS' || (a.details && a.details.includes('DEMISS'));
            if (!isDemissAssign) return false;
            
            let dateStr = (a as any)._date;
            if (!dateStr) {
                const parts = a.id.split('-');
                const datePartIdx = parts.findIndex(p => p.startsWith('20'));
                if (datePartIdx !== -1) {
                    dateStr = `${parts[datePartIdx]}-${parts[datePartIdx+1]}-${parts[datePartIdx+2]}`;
                }
            }
            if (!dateStr) return false;
            const parts = dateStr.split('-');
            const assignMs = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
            return currentSimMs >= assignMs;
        });

        if (hasDemissHappened) {
            fatigue = 2.0;
            totalScore = 2.0;
        } else if (preAdmissionTime > 0 && currentSimMs < preAdmissionTime) {
            fatigue = 8.0; 
            totalScore = 8.0;
        } else {
            let state = 'AWAKE';
            const sleepBlock = blocksWithSleep.find(b => h >= b.start && h < b.end && ['GENERATED_SLEEP', 'REPO'].includes(b.type));
            const flightBlock = blocksWithSleep.find(b => h >= b.start && h < b.end && b.isFlight);
            const dutyBlock = blocksWithSleep.find(b => h >= b.start && h < b.end && !b.isFlight && !['GENERATED_SLEEP', 'REPO'].includes(b.type));

            if (sleepBlock) state = 'SLEEP';
            else if (flightBlock) state = 'FLIGHT';
            else if (dutyBlock) {
                if (isFatiguingBlock(dutyBlock)) state = 'DUTY';
                else state = 'AWAKE';
            }

            if (lastState === 'SLEEP' && state !== 'SLEEP') {
                const wakeHour = currentSimDateObj.getHours();
                if (wakeHour >= 3 && wakeHour < 6) fatigue += 1.5;
                else fatigue += 1.0;
            }
            lastState = state;

            if (state === 'SLEEP') {
                const currentHour = currentSimDateObj.getHours();
                let efficiency = 0.5;
                if (currentHour >= 22 || currentHour < 6) efficiency = 1.0; 
                else if (currentHour >= 6 && currentHour < 9) efficiency = 0.8;
                else if (currentHour >= 17 && currentHour < 22) efficiency = 0.7;
                
                const baseDecay = 0.92; 
                const decayFactor = Math.pow(baseDecay, efficiency);
                fatigue = 2.0 + (fatigue - 2.0) * decayFactor;
            } else {
                let riseRate = 0.25; // REVERTED TO 0.25
                const activeBlock = flightBlock || dutyBlock;
                if (activeBlock && activeBlock.isPositioning) {
                    riseRate = 0.125; // REVERTED TO 0.125
                }
                fatigue += (riseRate * step);
            }

            fatigue = Math.max(0.0, Math.min(16, fatigue)); 

            const circadianPhase = 7; // Adjusted to 7 to match user expectation (alertness starts ~07:00)
            const circadianAmplitude = 2.2; // REVERTED TO 2.2
            const circadian = Math.cos(((hourOfDay - circadianPhase) / 24) * 2 * Math.PI) * circadianAmplitude; 
            
            totalScore = fatigue + circadian;
            totalScore = Math.max(0, Math.min(16, totalScore)); 
        }
        
        if (h >= 0) {
            points.push({ hourOffset: h, score: totalScore });
            if (totalScore > maxScore) maxScore = totalScore;
        }
    }

    const finalBlocks = blocksWithSleep.filter(b => {
        if (b.start >= hoursToShow || b.end <= 0) return false;
        if (b.type === 'GENERATED_SLEEP') return true;
        if (b.label === 'DEMISS' || b.type === 'DEMISS' || (b.label && b.label.includes('DEMISS'))) return false;
        if (activities) {
            const exactMatch = activities.find(a => a.code === b.label);
            if (exactMatch) return exactMatch.fadiga;
            const typeConfig = activities.find(a => a.code === b.type);
            if (typeConfig) return typeConfig.fadiga;
        }
        if (['FR', 'FS', 'VAC', 'INAT', 'REPO'].includes(b.type)) return false;
        if (['AGD REQ', 'AGD INS'].includes(b.label)) return false;
        return true;
    });

    return { points, blocks: finalBlocks, maxScore: Math.round(maxScore * 10) / 10 };
};

export const calculateMaxFatigueScore = (
    assignments: Assignment[],
    year: number,
    month: number,
    activities?: ActivityDefinition[],
    admissionDate?: Date
): number => {
    const startDate = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0).getDate();
    const hoursToShow = lastDay * 24;
    const timeline = calculateFatigueTimeline(assignments, startDate, hoursToShow, activities, admissionDate);
    return timeline.maxScore;
};

export const calculateSmartFolgaStartTime = (prevAssign?: Assignment, flights?: Flight[]): string => {
    if (!prevAssign) return '00:00';
    
    const details = prevAssign.details?.toUpperCase() || '';

    if (
        ['FR', 'FS', 'VAC', 'INAT', 'REPO'].includes(prevAssign.type) ||
        details === 'AGD INS' || 
        details === 'AGD REQ' ||
        details === 'FM'
    ) {
        const end = prevAssign.actualEnd || prevAssign.end || '00:00';
        return end === '23:59' ? '00:00' : end;
    }

    const { end } = getTimes(prevAssign);
    let startMin = end + 12 * 60; 
    if (startMin >= 1440) startMin -= 1440;
    
    const h = Math.floor(startMin / 60);
    const m = startMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const analyzeEquity = (crewList: CrewMember[]): EquityResult[] => {
    const roles = ['CMTE', 'COP', 'COM', 'MEC'] as const;
    const results: EquityResult[] = [];
    
    roles.forEach(role => {
        const filtered = crewList.filter(c => c.role === role && c.isOn);
        if (filtered.length === 0) return;
        
        const totalHours = filtered.reduce((acc, c) => acc + c.stats.flightHours, 0);
        const avg = totalHours / filtered.length;
        
        const discrepancy = filtered.map(c => ({
            name: c.name,
            hours: c.stats.flightHours,
            diff: avg > 0 ? ((c.stats.flightHours - avg) / avg) * 100 : 0
        })).filter(d => Math.abs(d.diff) > 20); 
        
        if (discrepancy.length > 0) {
            results.push({ role, averageHours: Math.round(avg), discrepancyCrew: discrepancy });
        }
    });
    
    return results;
};

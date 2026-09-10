
import { 
    DayData, 
    ScheduleMap, 
    CrewMember, 
    Assignment, 
    Flight, 
    RegulatoryConfig, 
    ScheduleMetadata, 
    GenerationParams, 
    GenerationResult,
    InstructionTag,
    OperationalTag,
    AssignmentType
} from './types';
import { validateAssignment, getCrewLocation, getMinutes, resolveCrewTags, isMadrugadaAssignment, getDailyDutyLimit, getFlightTimeLimit } from './regulation';

// Helper local para conversão de tempo
const timeToMin = (time: string): number => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const minToTime = (min: number): string => {
    let m = min;
    while (m < 0) m += 1440;
    m = m % 1440;
    const hh = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
};

// Helper para calcular duração do voo em horas decimais
const getFlightDurationHours = (start: string, end: string): number => {
    const s = timeToMin(start);
    let e = timeToMin(end);
    if (e < s) e += 1440;
    return (e - s) / 60;
};

// Helper para verificar status de instrução
const isTRI = (c: CrewMember) => c.instructionTag === 'TRI';
const isTRE = (c: CrewMember) => c.instructionTag === 'TRE';
const isEMI = (c: CrewMember) => c.operationalTag === 'EMI'; // Assume EMI = Aluno em Instrução
const isAVBL = (c: CrewMember) => c.operationalTag === 'AVBL' || !c.operationalTag;

// Helper robusto para identificar instrutor (Geral)
const isInstructor = (c: CrewMember) => 
    c.instructionTag === 'TRI' || 
    c.instructionTag === 'TRE' || 
    c.syntheticTag === 'SFI' || 
    c.syntheticTag === 'SFE' || 
    c.syntheticTag === 'BANCA'; 

// Helper para verificar se é dia de folga/inatividade
const isDayOff = (assignments: Assignment[]) => {
    return assignments.some(a => ['FR', 'FS', 'VAC', 'INAT', 'REPO'].includes(a.type));
};

// Helpers de Ordenação
const sortBySeniority = (a: CrewMember, b: CrewMember) => {
    const sA = parseInt(a.seniority || '999999');
    const sB = parseInt(b.seniority || '999999');
    return sA - sB;
};

const sortByHours = (a: CrewMember, b: CrewMember) => a.stats.flightHours - b.stats.flightHours;

// HELPER: Calcular duração da viagem (ida e volta) em dias
const calculateTripDuration = (outboundFlight: Flight, dayOfWeek: number, allFlights: Flight[]): number => {
    if (!outboundFlight.route) return 1;
    
    const parts = outboundFlight.route.split(/[-:>]/);
    if (parts.length < 2) return 1;

    const origin = parts[0].trim().toUpperCase();
    const dest = parts[1].trim().toUpperCase();

    let duration = 1;
    const maxLookahead = 5; 

    for (let d = 0; d < maxLookahead; d++) {
        const checkDay = (dayOfWeek + d) % 7;
        const returnFlight = allFlights.find(f => {
            if (!f.active || !f.daysOfWeek.includes(checkDay)) return false;
            const rParts = f.route.split(/[-:>]/);
            if (rParts.length < 2) return false;
            return rParts[0].trim().toUpperCase() === dest && rParts[1].trim().toUpperCase() === origin;
        });

        if (returnFlight) {
            if (d === 0) {
                const startMin = timeToMin(outboundFlight.end); 
                const returnMin = timeToMin(returnFlight.start); 
                if (returnMin > startMin + 45) { 
                    return 1;
                }
            } else {
                return d + 1; 
            }
        }
    }
    if (['MAO', 'REC', 'FOR', 'BEL'].includes(dest)) return 2;
    return 1;
};

// Type definition for CrewState within the generator
type CrewStateMap = Record<string, { 
    daysOff: number, 
    fsCount: number, 
    hasSocialWeekend: boolean, 
    saCount: number, 
    consecutiveDuty: number,
    consecutiveMadrugadas: number, // NEW: Track consecutive early starts
    accumulatedHours: number, // Monthly accumulated
    pendingXQR: number,
    currentLocation: string,
    nextAvailability: number,
    blockStartTs: number | null,
    dutyFlightTime: number; // NEW: Track flight time within current duty period
}>;

// ADDED: Missing helper function findBestPair
const findBestPair = (
    pool: CrewMember[], 
    flight: Flight, 
    crewState: CrewStateMap,
    slotsNeeded: number = 2
): { pair: CrewMember[], type: string } | null => {
    // 1. Separate by Role
    const cmtes = pool.filter(c => c.role === 'CMTE');
    const cops = pool.filter(c => c.role === 'COP');

    // Helper to get total hours (Annual + Current Month Acc) for balancing
    const getHours = (c: CrewMember) => (c.stats.annualFlightHours || 0) - (c.stats.flightHours || 0) + (crewState[c.id]?.accumulatedHours || 0);

    // Standard Sort function: use the array index from the pre-sorted pool to respect priority rules
    const getPriority = (c: CrewMember) => pool.findIndex(p => p.id === c.id);
    const sortFnPriority = (a: CrewMember, b: CrewMember) => getPriority(a) - getPriority(b);

    const pair: CrewMember[] = [];
    let pairType = 'PADRAO';

    // 2. Check for Instruction Needs
    // If pool has EMI (Student), prioritize finding an Instructor for them
    // Prioritize Captain Students first
    const allStudents = pool.filter(c => isEMI(c)).sort(sortBySeniority);
    
    let student: CrewMember | undefined;
    let instructor: CrewMember | undefined;

    for (const s of allStudents) {
        // Find best instructor in the pool - ONLY Flight Instructors (TRI or TRE)
        const instructors = cmtes.filter(c => (isTRI(c) || isTRE(c)) && c.id !== s.id && !pair.some(p => p.id === c.id));
        
        // Check if student needs a checkride (XQR) soon
        const duration = getFlightDurationHours(flight.start, flight.end);
        const sState = crewState[s.id];
        // Calculate HST subtracting current month's preexisting flights to avoid double-counting with accumulatedHours
        const sHST = (s.stats?.annualFlightHours || 0) - (s.stats?.flightHours || 0) + (sState?.accumulatedHours || 0);
        const sNextHST = sHST + duration;
        
        // CORREÇÃO: Limite de horas apenas para EMI
        let isCheck = false;
        if (isEMI(s)) {
            const threshold = s.isAqExp ? 100.5 : 25.5;
            isCheck = sHST < threshold && sNextHST >= threshold;
        }

        let tempInst: CrewMember | undefined;

        if (isCheck) {
            // Prioritize TRE for Checkride
            const tres = instructors.filter(c => isTRE(c)).sort(sortFnPriority);
            if (tres.length > 0) {
                tempInst = tres[0];
            } else {
                // Fallback to TRI (Check will likely be skipped/downgraded)
                tempInst = instructors.sort(sortFnPriority)[0];
            }
        } else {
            // Standard instruction (PADRAO): 
            const sortedInstructors = instructors.sort((a, b) => {
                // 1. Balanceamento de Horas (Principal)
                const diff = getPriority(a) - getPriority(b);
                if (Math.abs(diff) > 10) return diff; 
                // wait, getPriority returns array index difference, not hours difference!
                // the array is already sorted heavily by out of base, and hours!
                // So getPriority covers hours nicely.
                
                // 2. Desempate: Preferência por TRI para poupar TRE para cheques
                const aIsTri = isTRI(a);
                const bIsTri = isTRI(b);
                if (aIsTri && !bIsTri) return -1;
                if (!aIsTri && bIsTri) return 1;

                return diff; 
            });
            tempInst = sortedInstructors[0];
        }

        if (tempInst) {
            student = s;
            instructor = tempInst;
            pair.push(instructor, student);
            pairType = 'INSTRUCAO';
            break; // Found one instructor-student pair
        }
    }

    // Fill remaining slots
    const remainingSlots = slotsNeeded - pair.length;
    
    if (remainingSlots > 0) {
        let cmtesNeeded = Math.ceil(remainingSlots / 2);
        let copsNeeded = Math.floor(remainingSlots / 2);

        // Adjust if we already have specific roles (only valid if slotsNeeded was > 2 and pair has some)
        // Actually, it's safer to just calculate based on what's missing for the WHOLE pairing
        let totalCmtesNeeded = 0;
        let totalCopsNeeded = 0;
        
        if (slotsNeeded === 2) {
            totalCmtesNeeded = 1;
            totalCopsNeeded = 1;
        } else if (slotsNeeded === 3) {
            totalCmtesNeeded = 2;
            totalCopsNeeded = 1;
        } else if (slotsNeeded === 4) {
            totalCmtesNeeded = 2;
            totalCopsNeeded = 2;
        } else {
            totalCmtesNeeded = Math.ceil(slotsNeeded / 2);
            totalCopsNeeded = Math.floor(slotsNeeded / 2);
        }

        let neededC = totalCmtesNeeded - pair.filter(c => c.role === 'CMTE').length;
        let neededP = totalCopsNeeded - pair.filter(c => c.role === 'COP').length;
        
        const availableCmtes = cmtes.filter(c => !isEMI(c) && !pair.some(p => p.id === c.id)).sort(sortFnPriority);
        const availableCops = cops.filter(c => !isEMI(c) && !pair.some(p => p.id === c.id)).sort(sortFnPriority);

        for (let i = 0; i < neededC && availableCmtes.length > 0; i++) {
            pair.push(availableCmtes.shift()!);
        }

        for (let i = 0; i < neededP && availableCops.length > 0; i++) {
            pair.push(availableCops.shift()!);
        }

        // If still missing slots, fill with whatever is available (fallback: CMTE acts as COP)
        while (pair.length < slotsNeeded) {
            if (availableCmtes.length > 0) {
                pair.push(availableCmtes.shift()!);
                if (pairType === 'PADRAO') pairType = `PADRAO (${pair.length} CMTE)`;
            } else if (availableCops.length > 0) {
                pair.push(availableCops.shift()!);
            } else {
                break;
            }
        }
    }

    // Very basic sanity check: must have at least one CMTE
    if (pair.length === slotsNeeded && pair.some(c => c.role === 'CMTE')) {
        return { pair, type: pairType };
    }

    return null;
};

export function* generateSchedule(
  crewList: CrewMember[],
  days: DayData[],
  flights: Flight[],
  currentSchedule: ScheduleMap,
  config: RegulatoryConfig,
  metadata: ScheduleMetadata,
  params: GenerationParams
): Generator<GenerationResult> {
    if (!metadata.logs) metadata.logs = [];
    yield { type: 'LOG', message: '--- INICIANDO GERAÇÃO (LIMITES RIGOROSOS ATIVADOS) ---', level: 'info' };
    
    // --- LIMITES DOS PARÂMETROS ---
    const MIN_DAYS_OFF = params.minDaysOffMonth || 10;
    const MAX_SA = params.maxStandbyMonth || 8;
    const MAX_FS = params.maxFsMonth || 2; // Cota de FS
    const MAX_FLIGHT_HOURS_MONTH = params.maxFlightHoursMonth || 90;
    const MAX_FLIGHT_HOURS_YEAR = params.maxFlightHoursYear || 900;
    const MAX_CONSECUTIVE_DUTY = params.maxConsecutiveDutyDays || 6;
    const MAX_CONSECUTIVE_MADRUGADAS = params.maxConsecutiveMadrugadas || 2;
    
    // Configurações de Repouso (Minutos)
    const REST_POST_FLIGHT = params.minRestPostFlight || 750; // 12h30 (Padrão para fim de jornada)
    const REST_POST_SA = params.minRestPostStandby || 600;    // 10h00
    const REST_DEFAULT = params.minRestDefault || 720;        // 12h00
    const TURNAROUND_TIME = params.turnaroundTime || 45; // Tempo entre voos no mesmo dia
    
    // Limite de Jornada Consecutiva em MS (Baseado no Parametro)
    const MAX_CONSECUTIVE_BLOCK_MS = MAX_CONSECUTIVE_DUTY * 24 * 60 * 60 * 1000;
    
    // REMOVIDO: DAILY_DUTY_LIMIT_MS fixo. Agora usa função getDailyDutyLimit.

    const workingSchedule: ScheduleMap = JSON.parse(JSON.stringify(currentSchedule));
    
    // Estado Dinâmico dos Tripulantes
    const crewState: CrewStateMap = {};

    const sortByDynamicHours = (a: CrewMember, b: CrewMember) => {
        const hoursA = (a.stats.annualFlightHours || 0) - (a.stats.flightHours || 0) + (crewState[a.id]?.accumulatedHours || 0);
        const hoursB = (b.stats.annualFlightHours || 0) - (b.stats.flightHours || 0) + (crewState[b.id]?.accumulatedHours || 0);
        return hoursA - hoursB;
    };

    let localCrewList = crewList.map(c => ({...c}));

    // --- 0. LOG DE VOOS JÁ EXISTENTES (Solicitado pelo usuário) ---
    const generationStartDate = days[0].date;
    const monthPrefix = generationStartDate.toISOString().slice(0, 7); // YYYY-MM
    
    yield { type: 'LOG', message: '--- VOOS PRÉ-EXISTENTES NA ESCALA ---', level: 'info' };
    let hasManualFlights = false;

    // Varredura apenas para log
    for (const [crewId, crewDays] of Object.entries(workingSchedule)) {
        const crewMember = localCrewList.find(c => c.id === crewId);
        if (!crewMember) continue;

        for (const [dateKey, assigns] of Object.entries(crewDays)) {
            if (dateKey.startsWith(monthPrefix)) {
                for (const a of assigns) {
                    if (a.type === 'VOO' && a.code) {
                        const dayPart = dateKey.split('-')[2];
                        const label = a.functionCode ? `${a.functionCode}-${a.code}` : a.code;
                        const dateObj = new Date(dateKey);
                        const monthName = dateObj.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
                        
                        yield { 
                            type: 'LOG', 
                            message: `[MANUAL] ${crewMember.name}: ${label} dia ${dayPart} ${monthName}`, 
                            level: 'warning' 
                        };
                        hasManualFlights = true;
                    }
                }
            }
        }
    }

    if (!hasManualFlights) {
        yield { type: 'LOG', message: 'Nenhum voo pré-agendado encontrado.', level: 'info' };
    }
    yield { type: 'LOG', message: '---------------------------------------', level: 'info' };


    // --- 1. REIDRATAÇÃO INTELIGENTE (SCAN DO MÊS) ---
    localCrewList.forEach(c => {
        let daysOff = 0;
        let fsCount = 0;
        let saCount = 0;
        let accHours = 0; // Acumulado no mês corrente
        let hasSocialWeekend = false;
        
        const cSched = workingSchedule[c.id] || {};
        
        // SCAN TOTAL: Verifica TODO o mês (passado e futuro já agendado manualmente)
        Object.entries(cSched).forEach(([k, assigns]) => {
            if (k.startsWith(monthPrefix)) {
                if (isDayOff(assigns)) {
                    daysOff++;
                    if (assigns.some(a => a.type === 'FS')) fsCount++;
                } else {
                    // Work day
                    if (assigns.some(a => a.type === 'SA')) saCount++;
                    
                    // Flight Hours calculation
                    assigns.forEach(a => {
                        if (a.type === 'VOO' && a.start && a.end) {
                            accHours += getFlightDurationHours(a.start, a.end);
                        }
                    });
                }

                // Check for Social Weekend (Saturday + Sunday)
                const [y, m, d] = k.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d); 
                
                if (dateObj.getDay() === 6) { // Saturday
                    const hasSatFS = assigns.some(a => a.type === 'FS');
                    if (hasSatFS) {
                        // Check Sunday
                        const sunDate = new Date(dateObj);
                        sunDate.setDate(dateObj.getDate() + 1);
                        const sunKey = sunDate.toISOString().split('T')[0];
                        const sunAssigns = cSched[sunKey] || [];
                        const hasSunFS = sunAssigns.some(a => a.type === 'FS');
                        if (hasSunFS) {
                            hasSocialWeekend = true;
                        }
                    }
                }
            }
        });

        // 2. Determinar Localização e Disponibilidade (Lookback a partir do dia de início)
        const location = getCrewLocation(c.id, generationStartDate, workingSchedule, c);
        
        let consecutive = 0;
        let madrugadas = 0;
        let blockStartTs: number | null = null;
        let nextAvail = 0;
        
        // Retroceder a partir de D-1 para encontrar início da jornada atual e repouso necessário
        let loopDate = new Date(generationStartDate);
        loopDate.setDate(loopDate.getDate() - 1);

        for (let i = 0; i < 15; i++) { // Lookback 15 dias
            const k = loopDate.toISOString().split('T')[0];
            const assigns = cSched[k] || [];

            if (assigns.length > 0) {
                if (isDayOff(assigns)) {
                    break; // Fim do bloco de trabalho (encontrou folga)
                }
                consecutive++;
                
                // Check Madrugada logic for previous days (simplified lookback)
                const hasMadr = assigns.some(a => isMadrugadaAssignment(a));
                if (hasMadr) madrugadas++;
                else madrugadas = 0; // Reset if chain broken

                // Calcular repouso se for o dia imediatamente anterior (D-1)
                if (i === 0) {
                    const sorted = [...assigns].sort((a,b) => timeToMin(a.end || '00:00') - timeToMin(b.end || '00:00'));
                    const lastAssign = sorted[sorted.length - 1];
                    const endMin = timeToMin(lastAssign.actualEnd || lastAssign.end || '00:00');
                    // Timestamp do fim da atividade
                    const endDateTs = new Date(loopDate).setHours(0,0,0,0) + (endMin * 60000) + (endMin < timeToMin(lastAssign.start || '00:00') ? 86400000 : 0);
                    
                    let restNeeded = REST_DEFAULT;
                    if (lastAssign.type === 'VOO') restNeeded = REST_POST_FLIGHT;
                    else if (lastAssign.type === 'SA') restNeeded = REST_POST_SA;
                    
                    nextAvail = endDateTs + (restNeeded * 60000);
                }
                
                // Track start of block (first activity of the block chain)
                const first = [...assigns].sort((a,b) => timeToMin(a.start || '00:00') - timeToMin(b.start || '00:00'))[0];
                const startMin = timeToMin(first.actualStart || first.start || '00:00');
                blockStartTs = new Date(loopDate).setHours(0,0,0,0) + (startMin * 60000) - (params.presentationBase * 60000); // Approx presentation
            } else {
                break; // Empty day is break
            }
            loopDate.setDate(loopDate.getDate() - 1);
        }

        crewState[c.id] = { 
            daysOff, 
            fsCount, 
            hasSocialWeekend, 
            saCount, 
            consecutiveDuty: consecutive,
            consecutiveMadrugadas: madrugadas,
            accumulatedHours: accHours,
            pendingXQR: 0,
            currentLocation: location,
            nextAvailability: nextAvail,
            blockStartTs: blockStartTs,
            dutyFlightTime: 0
        };
    });

    let flightsAssignedTotal = 0;

    // --- LOOP PRINCIPAL: DIA A DIA ---
    for (const day of days) {
        const dateKey = day.date.toISOString().split('T')[0];
        const dayOfWeek = day.date.getDay(); 
        const dayStartTimestamp = new Date(day.date).setHours(0,0,0,0);
        
        let dailyRECount = 0;
        let dailySACount = 0;

        const isSaturday = dayOfWeek === 6;
        const isSunday = dayOfWeek === 0;
        const isPriorityFS = day.dayOfMonth > 20; 

        yield { type: 'LOG', message: `Processando Dia: ${day.dayOfMonth}/${day.date.getMonth()+1}`, level: 'info' };

        // 1. Identificar voos da malha que DEVEM ocorrer
        const dailyFlights = flights.filter(f => f.active && f.daysOfWeek.includes(dayOfWeek));
        
        // 2. Identificar voos JÁ ALOCADOS MANUALMENTE neste dia
        const manuallyAssignedCodes = new Set<string>();
        
        // NOVO: Coletar especificamente voos manuais de ALUNO para pareamento de instrutor
        const manualStudentRequests: { crewId: string, assign: Assignment }[] = [];

        Object.keys(workingSchedule).forEach(cid => {
            const assigns = workingSchedule[cid][dateKey] || [];
            assigns.forEach(a => {
                if (a.type === 'VOO' && a.code) {
                    manuallyAssignedCodes.add(a.code);
                    
                    // Identifica se é um aluno manual sem instrutor alocado
                    // Verifica se a tag é ALU ou se details contém ALU
                    if (a.functionCode === 'ALU' || (a.details && a.details.includes('ALU'))) {
                        manualStudentRequests.push({ crewId: cid, assign: a });
                    }
                }
            });
        });

        // 2.5 ALOCAÇÃO AUTOMÁTICA DE INSTRUTOR PARA ALUNOS MANUAIS (Prioritário)
        if (manualStudentRequests.length > 0) {
            yield { type: 'LOG', message: `Verificando ${manualStudentRequests.length} alunos manuais para alocação de instrutor...`, level: 'info' };
            
            for (const req of manualStudentRequests) {
                const flightCode = req.assign.code!;
                // Verificar se JÁ EXISTE um instrutor alocado para este voo neste dia
                let instructorAlreadyAssigned = false;
                
                Object.keys(workingSchedule).forEach(cid => {
                    if (cid === req.crewId) return; // Skip the student themselves
                    const assigns = workingSchedule[cid][dateKey] || [];
                    const isInstr = assigns.some(a => 
                        a.code === flightCode && 
                        (a.functionCode === 'INS' || a.functionCode === 'EXM' || isInstructor(localCrewList.find(x => x.id === cid)!))
                    );
                    if (isInstr) instructorAlreadyAssigned = true;
                });

                if (instructorAlreadyAssigned) {
                    continue; // Instrutor já existe (Provavelmente manual também)
                }

                // PRECISA ENCONTRAR UM INSTRUTOR
                yield { type: 'LOG', message: `Buscando instrutor para ALU no voo ${flightCode}...`, level: 'warning' };
                
                // Determinar origem do voo para verificar localização
                let origin = 'VCP';
                if (req.assign.route) {
                    origin = req.assign.route.split(/[-:>]/)[0].trim().toUpperCase();
                } else {
                    // Tenta achar na malha
                    const meshFlight = dailyFlights.find(f => f.code === flightCode);
                    if (meshFlight) origin = meshFlight.route.split(/[-:>]/)[0].trim().toUpperCase();
                }

                const flightStartMin = timeToMin(req.assign.start || '00:00');
                const flightStartTs = dayStartTimestamp + (flightStartMin * 60000);

                // Filtrar Candidados:
                // 1. Deve ser Instrutor (TRI ou TRE)
                // 2. Deve estar na Origem
                // 3. Deve estar Disponível (Repouso)
                // 4. NÃO deve ter voo neste dia (pois estamos preenchendo lacuna manual)
                const candidates = localCrewList.filter(c => {
                    if (!c.isOn) return false;
                    // FIX: Allow only TRI or TRE for Flights
                    if (!isTRI(c) && !isTRE(c)) return false;
                    
                    const insAssign: Assignment = {
                        id: `${c.id}-${dateKey}-VOO-${flightCode}-TEST`,
                        type: 'VOO',
                        code: flightCode,
                        route: req.assign.route, // Make sure route exists or fallback
                        start: req.assign.start,
                        end: req.assign.end,
                        functionCode: 'INS', // We will assign as INS
                        isManual: false
                    };

                    // Only check validateAssignment. currentLocation and nextAvailability aren't strictly checked by validateAssignment if it's not a start of duty?
                    // wait, validateAssignment does location and availability checks via getCrewLocation!
                    const val = validateAssignment(c.id, day.date, insAssign, workingSchedule, config, flights, localCrewList, metadata, params);

                    if (!val.valid) {
                        metadata.logs.push({ timestamp: new Date().toISOString(), message: `INS_BLOCK: ${c.id} for ${flightCode} blocked by ${val.message}` });
                    }

                    return val.valid;
                });

                // Ordenar: Balanceamento de Horas (Sem privilégio TRI forçado)
                candidates.sort(sortByDynamicHours);

                const bestInstructor = candidates[0];

                if (bestInstructor) {
                    // ALOCAR INSTRUTOR
                    const flightDurationHours = getFlightDurationHours(req.assign.start || '00:00', req.assign.end || '00:00');
                    const cState = crewState[bestInstructor.id];
                    
                    // CORREÇÃO: ALU sempre com INS (Mesmo que o instrutor seja TRE)
                    // Regra: "INS- com ALU-"
                    const codeFunc = 'INS';

                    const insAssign: Assignment = {
                        id: `${bestInstructor.id}-${dateKey}-VOO-${flightCode}-AUTO-INS`,
                        type: 'VOO',
                        code: flightCode,
                        route: req.assign.route,
                        start: req.assign.start,
                        end: req.assign.end,
                        functionCode: codeFunc, // CORRETO: INS para acompanhar ALU
                        details: 'AUTO INSTR'
                    };

                    yield { type: 'ASSIGNMENT', crewId: bestInstructor.id, date: day.date, assignment: insAssign };
                    
                    // Atualizar Estado Local
                    if (!workingSchedule[bestInstructor.id]) workingSchedule[bestInstructor.id] = {};
                    if (!workingSchedule[bestInstructor.id][dateKey]) workingSchedule[bestInstructor.id][dateKey] = [];
                    workingSchedule[bestInstructor.id][dateKey].push(insAssign);

                    // Atualizar CrewState
                    let presentation = params.presentationBase;
                    if (cState.currentLocation !== (bestInstructor.base || 'VCP')) presentation = params.presentationOutstation;
                    if (cState.consecutiveDuty === 0 || cState.blockStartTs === null) {
                        cState.blockStartTs = flightStartTs - (presentation * 60000);
                        cState.dutyFlightTime = 0; // Reset Flight Time on new Duty
                    }
                    cState.consecutiveDuty++;
                    cState.accumulatedHours += flightDurationHours;
                    cState.dutyFlightTime += (flightDurationHours * 60);
                    
                    // Destino
                    let dest = 'VCP';
                    if (req.assign.route) dest = req.assign.route.split(/[-:>]/)[1].trim().toUpperCase();
                    cState.currentLocation = dest;

                    // Repouso - Para voo manual, assume repouso padrão por enquanto
                    // Mas para permitir dobras, vamos usar a mesma lógica do auto
                    const endMin = timeToMin(req.assign.end || '00:00');
                    const flightEndTs = dayStartTimestamp + (endMin * 60000) + (endMin < flightStartMin ? 86400000 : 0);
                    cState.nextAvailability = flightEndTs + (TURNAROUND_TIME * 60000); 

                    yield { type: 'LOG', message: `Instrutor ${bestInstructor.name} (${bestInstructor.instructionTag}) alocado para aluno manual no voo ${flightCode}.`, level: 'success' };
                    
                    flightsAssignedTotal++;
                } else {
                    yield { type: 'LOG', message: `Nenhum instrutor disponível em ${origin} para o voo manual ${flightCode}.`, level: 'error' };
                }
            }
        }

        // Voos que precisam ser alocados AGORA (exclui manuais)
        const flightsToAssign = dailyFlights.filter(f => !manuallyAssignedCodes.has(f.code));
        // CRÍTICO: ORDENAR VOOS POR HORÁRIO DE INÍCIO
        // Isso garante que VCP-REC (08:00) seja alocado antes de REC-VCP (13:00)
        flightsToAssign.sort((a,b) => timeToMin(a.start) - timeToMin(b.start));
        
        // Rastreia voos efetivamente na escala (Manuais + Gerados Agora) para fins de RE/SA
        const activeFlightCodesOnDay = new Set<string>(manuallyAssignedCodes);

        // --- FILTRAGEM TRIPULAÇÃO DISPONÍVEL ---
        let availableCrew = localCrewList.filter(c => {
            if (!c.isOn) return false;
            
            // Tripulantes que estão bloqueados para voos normais
            if (c.operationalTag === 'GS' || c.operationalTag === 'REQ') return false;
            
            // Check manual schedule
            const hasManual = workingSchedule[c.id]?.[dateKey] && workingSchedule[c.id][dateKey].length > 0;
            if (hasManual) {
                // If they have manual flight, we usually skip, unless we are filling gaps?
                // For simplicity, skip those with ANY manual assignment to avoid conflicts
                return false;
            }

            return true;
        });

        // --- MAPEAMENTO DE DISPONIBILIDADE POR LOCALIDADE (CENSO) ---
        const locationCounts: Record<string, string[]> = {}; // Store names
        const activeOrigins = new Set(dailyFlights.map(f => f.route.split(/[-:>]/)[0].trim().toUpperCase()));
        
        availableCrew.forEach(c => {
            const loc = crewState[c.id].currentLocation;
            // Only count relevant locations to avoid clutter
            if (activeOrigins.has(loc) || loc !== (c.base || 'VCP')) {
                if (!locationCounts[loc]) locationCounts[loc] = [];
                locationCounts[loc].push(c.name);
            }
        });
        
        // Log Availability for debugging logic with Names
        const availLog = Object.entries(locationCounts)
            .map(([loc, names]) => `${loc}: ${names.length} (${names.join(', ')})`)
            .join(' | ');
        if (availLog) {
            yield { type: 'LOG', message: `[DISPONIBILIDADE] ${availLog}`, level: 'info' };
        }

        // 3. Alocação de Voos (Apenas os pendentes)
        for (const flight of flightsToAssign) {
            const origin = flight.route.split(/[-:>]/)[0].trim().toUpperCase();
            const destination = flight.route.split(/[-:>]/)[1].trim().toUpperCase();
            const flightStartMin = timeToMin(flight.start);
            const flightStartTs = dayStartTimestamp + (flightStartMin * 60000);
            
            // Calculate flight duration to check limits
            const flightDurationHours = getFlightDurationHours(flight.start, flight.end);

            const debugLogs: string[] = [];

            // Filter by location AND Rest Availability AND Social Weekend Protection AND FLIGHT LIMITS
            let crewAtLocation = availableCrew.filter(c => {
                const state = crewState[c.id];
                const loc = state.currentLocation;
                const isRested = state.nextAvailability <= flightStartTs;
                
                // PROTEÇÃO FS DE DOMINGO:
                if (isSunday) {
                    const prevDate = new Date(day.date);
                    prevDate.setDate(day.date.getDate() - 1);
                    const prevKey = prevDate.toISOString().split('T')[0];
                    const prevAssigns = workingSchedule[c.id]?.[prevKey] || [];
                    if (prevAssigns.some(a => a.type === 'FS')) return false; 
                }

                // *** CHEQUE RIGOROSO DE LIMITES DE HORAS ***
                // Monthly Limit Check
                if ((state.accumulatedHours + flightDurationHours) > MAX_FLIGHT_HOURS_MONTH) {
                    return false;
                }
                
                // Annual Limit Check
                const currentTotalAnnual = (c.stats.annualFlightHours || 0) - (c.stats.flightHours || 0) + state.accumulatedHours;
                if ((currentTotalAnnual + flightDurationHours) > MAX_FLIGHT_HOURS_YEAR) {
                    return false;
                }

                // Retrieve last assignment end to determine if it's a new duty block
                const todaysAssignments = workingSchedule[c.id]?.[dateKey] || [];
                const sortedAssigns = [...todaysAssignments].sort((a,b) => timeToMin(a.end || '00:00') - timeToMin(b.end || '00:00'));
                let hasPrevDutyToday = false;
                
                if (sortedAssigns.length > 0) {
                    hasPrevDutyToday = true;
                }

                // Determine effective Duty Start
                // If NO active block (blockStartTs is null) OR no previous duty today, calculate new presentation
                let effectiveDutyStartTs = state.blockStartTs;
                let presentation = params.presentationBase;
                if (loc !== (c.base || 'VCP')) presentation = params.presentationOutstation;
                
                const newDutyStartTs = flightStartTs - (presentation * 60000);
                
                // Logic: If blockStartTs is null, it means we are starting a fresh duty (e.g. after Nightly Rest)
                if (!hasPrevDutyToday && state.blockStartTs === null) {
                     effectiveDutyStartTs = newDutyStartTs;
                } else if (!hasPrevDutyToday && state.blockStartTs !== null) {
                     // Safety fallback: If somehow blockStartTs wasn't cleared but day changed and no flight today yet, assume new start.
                     // Ideally, Nightly Rest clears it.
                     effectiveDutyStartTs = newDutyStartTs;
                }

                // *** CHEQUE DE LIMITE DE JORNADA DIÁRIA (RBAC 117 - TABELA B) ***
                if (effectiveDutyStartTs) {
                    const flightEndMin = timeToMin(flight.end);
                    const flightEndTs = dayStartTimestamp + (flightEndMin * 60000) + (flightEndMin < flightStartMin ? 86400000 : 0);
                    // Debriefing 30m
                    const dutyEndTs = flightEndTs + (30 * 60000); 
                    
                    const projectedDutyMin = (dutyEndTs - effectiveDutyStartTs) / 60000;
                    
                    // Count legs so far for this crew today + 1
                    const legsToday = sortedAssigns.filter(a => a.type === 'VOO' || a.type === 'XQR').length;
                    const nextLegCount = legsToday + 1;

                    // Calculate Start Time of Duty (Presentation) relative to 00:00
                    const dutyStartMinFromDay = (effectiveDutyStartTs - dayStartTimestamp) / 60000;
                    
                    // Lookup Limit in Regulation Table
                    const dutyLimitMin = getDailyDutyLimit(dutyStartMinFromDay, nextLegCount);

                    if (projectedDutyMin > dutyLimitMin) {
                        debugLogs.push(`[DEBUG] Blocked by Table B Limit: Crew ${c.id}, Projected: ${projectedDutyMin}, Limit: ${dutyLimitMin}`);
                        return false;
                    }
                }

                // *** CHEQUE DE LIMITE DE TEMPO DE VOO (RBAC 117 - TABELA A) ***
                // Sum previously accumulated flight time in this duty + new flight time
                // If new duty (blockStartTs reset), start from 0
                let currentDutyFlightTime = state.dutyFlightTime;
                
                // If we determined this is a new duty start above, reset counter for check
                if (!hasPrevDutyToday && state.blockStartTs === null) {
                    currentDutyFlightTime = 0;
                }

                const newFlightTimeMin = flightDurationHours * 60;
                const totalFlightTimeMin = currentDutyFlightTime + newFlightTimeMin;
                
                // Lookup Table A Limit using Presentation Time
                const dutyStartMinForTableA = (effectiveDutyStartTs! - dayStartTimestamp) / 60000;
                const flightTimeLimit = getFlightTimeLimit(dutyStartMinForTableA, 1); 

                if (totalFlightTimeMin > flightTimeLimit) {
                    debugLogs.push(`[DEBUG] Blocked by Table A Limit: Crew ${c.id}, Total: ${totalFlightTimeMin}, Limit: ${flightTimeLimit}`);
                    return false;
                }

                if (!(loc === origin)) {
                    // Too noisy to log every person not at origin
                    // debugLogs.push(`[DEBUG] Blocked by Loc!=Origin: Crew ${c.id}, loc: ${loc}, origin: ${origin}`);
                } else if (!isRested) {
                    debugLogs.push(`[DEBUG] Blocked by isRested: Crew ${c.id}, avail: ${new Date(state.nextAvailability)}, start: ${new Date(flightStartTs)}`);
                }

                return loc === origin && isRested;
            });
            
            for (const msg of debugLogs) {
                 yield { type: 'LOG', message: msg, level: 'warning' };
            }
            
            // PRIORITIZE CREW RETURNING TO BASE
            // If origin is NOT base, and flight goes TO base, heavily prioritize crew whose base IS destination.
            crewAtLocation.sort((a, b) => {
                const stateA = crewState[a.id];
                const stateB = crewState[b.id];
                const baseA = a.base || 'VCP';
                const baseB = b.base || 'VCP';
                
                // Condition: Crew is at origin, origin is NOT their base, destination IS their base.
                const needsReturnA = (stateA.currentLocation !== baseA) && (destination === baseA);
                const needsReturnB = (stateB.currentLocation !== baseB) && (destination === baseB);

                if (needsReturnA && !needsReturnB) return -1; // A Priority
                if (!needsReturnA && needsReturnB) return 1;  // B Priority
                
                // Secondary: Just being out of base (anywhere) vs In Base
                const outOfBaseA = stateA.currentLocation !== baseA;
                const outOfBaseB = stateB.currentLocation !== baseB;
                
                if (outOfBaseA && !outOfBaseB) return -1;
                if (!outOfBaseA && outOfBaseB) return 1;

                // Tertiary: Hours
                const getH = (c: CrewMember) => (c.stats.annualFlightHours || 0) - (c.stats.flightHours || 0) + (crewState[c.id]?.accumulatedHours || 0);
                return getH(a) - getH(b);
            });

            let slotsNeeded = 2; 
            if (flight.composition === 'REVEZAMENTO') slotsNeeded = 4;
            else if (flight.composition === 'COMPOSTA') slotsNeeded = 3;

            if (crewAtLocation.length < slotsNeeded) {
                yield { type: 'LOG', message: `Falta tripulação em ${origin} para ${flight.code} (Repouso/Local/Limites). Disp: ${crewAtLocation.length}`, level: 'warning' };
                continue;
            }

            // --- RETRY LOGIC START ---
            let flightAssigned = false;
            const ignoredCrewIds: string[] = [];

            while (!flightAssigned) {
                const currentPool = crewAtLocation.filter(c => !ignoredCrewIds.includes(c.id));
                if (currentPool.length < slotsNeeded) {
                    yield { type: 'LOG', message: `Quantidade insuficiente de tripulantes em ${origin} (Necessário: ${slotsNeeded}, Disponível: ${currentPool.length}) para o voo ${flight.code}.`, level: 'error' };
                    break; 
                }

                // Pass crewState to findBestPair for dynamic sorting inside the pairing logic
                const pairResult = findBestPair(currentPool, flight, crewState, slotsNeeded);
                if (!pairResult) {
                    const cmtesNum = currentPool.filter(c => c.role === 'CMTE').length;
                    const copsNum = currentPool.filter(c => c.role === 'COP').length;
                    yield { type: 'LOG', message: `Tripulação insuficiente ou incompatível em ${origin} para formar tripulação de ${slotsNeeded} (Disp: ${currentPool.length} | CMTE: ${cmtesNum}, COP: ${copsNum}). Voos REQ ignorados.`, level: 'error' };
                    break;
                }

                const pair = pairResult.pair;
                const pairType = pairResult.type;

                // PRE-VALIDATE PAIR
                const validMembers: CrewMember[] = [];
                const invalidMembersIds: string[] = [];

                for (const crew of pair) {
                    const cState = crewState[crew.id];
                    let presentation = params.presentationBase;
                    if (cState.currentLocation !== (crew.base || 'VCP')) presentation = params.presentationOutstation;
                    
                    const assignStartTs = dayStartTimestamp + timeToMin(flight.start) * 60000;
                    const assignEndTs = dayStartTimestamp + timeToMin(flight.end) * 60000 + (timeToMin(flight.end) < timeToMin(flight.start) ? 86400000 : 0);
                    // REST CHECK: 
                    // Se este for o último voo da jornada, ele vai precisar de 12h de repouso.
                    // O repouso conta dentro do bloco de 144h? Não, o bloco é tempo de serviço.
                    // Aqui checamos se o bloco + repouso cabe.
                    const restEndTs = assignEndTs + (REST_POST_FLIGHT * 60000); 

                    let effectiveBlockStart = cState.blockStartTs;
                    if (cState.consecutiveDuty === 0 || effectiveBlockStart === null) {
                        effectiveBlockStart = assignStartTs - (presentation * 60000);
                    }

                    if (restEndTs - effectiveBlockStart > MAX_CONSECUTIVE_BLOCK_MS) {
                        yield { type: 'LOG', message: `Tripulante ${crew.name} inválido para voo ${flight.code}: Limite de tempo de serviço excedido`, level: 'error' };
                        invalidMembersIds.push(crew.id);
                        continue;
                    }

                    // INS_BLOCK check
                    const insAssign = {
                        id: 'temp', crewId: crew.id, date: day.date.toISOString(), type: 'VOO',
                        code: flight.code, start: flight.start, end: flight.end, route: flight.route
                    } as Assignment;

                    const val = validateAssignment(crew.id, day.date, insAssign, workingSchedule, config, flights, localCrewList, metadata, params);

                    if (!val.valid) {
                        yield { type: 'LOG', message: `Tripulante ${crew.name} inválido para voo ${flight.code} (INS): ${val.message}`, level: 'error' };
                        invalidMembersIds.push(crew.id);
                        continue;
                    }
                    
                    // CHECK MADRUGADA LIMIT
                    const tempAssign: Assignment = { id: 'temp', type: 'VOO', start: flight.start, end: flight.end };
                    if (isMadrugadaAssignment(tempAssign)) {
                        if (cState.consecutiveMadrugadas >= MAX_CONSECUTIVE_MADRUGADAS) {
                            yield { type: 'LOG', message: `Tripulante ${crew.name} inválido para voo ${flight.code}: Máximo de madrugadas consecutivas atingido`, level: 'error' };
                            invalidMembersIds.push(crew.id);
                            continue;
                        }
                    }

                    const testAssign: Assignment = {
                        id: `TEST-${crew.id}`,
                        type: 'VOO', 
                        code: flight.code,
                        route: flight.route,
                        start: flight.start,
                        end: flight.end
                    };
                    const validation = validateAssignment(crew.id, day.date, testAssign, workingSchedule, config, flights, localCrewList, metadata, params);
                    
                    if (validation.valid) {
                        validMembers.push(crew);
                    } else {
                        yield { type: 'LOG', message: `Tripulante ${crew.name} inválido para voo ${flight.code}: ${validation.message}`, level: 'error' };
                        invalidMembersIds.push(crew.id);
                    }
                }

                if (invalidMembersIds.length > 0) {
                    ignoredCrewIds.push(...invalidMembersIds);
                    continue; 
                }

                // --- IF WE REACH HERE, PAIR IS VALID ---
                flightAssigned = true;
                activeFlightCodesOnDay.add(flight.code); // MARK AS ASSIGNED (GENERATED)

                const flightDurationMin = getMinutes(flight.end) - getMinutes(flight.start) + (getMinutes(flight.end) < getMinutes(flight.start) ? 1440 : 0);
                const flightHours = flightDurationMin / 60;
                
                yield { type: 'LOG', message: `Voo ${flight.code}: Pareamento ${pairType} (${pair.map(c => c.name).join(' + ')})`, level: 'success' };

                // Identificar Cheques
                const xqrCandidates: string[] = [];
                // Identificar Papeis
                const studentMember = pair.find(c => isEMI(c));
                // If there is a student, the OTHER member is the instructor, period.
                const instructorMember = studentMember 
                    ? pair.find(c => c.id !== studentMember.id)
                    : pair.find(c => isInstructor(c)); // Fallback if no student

                for (const crew of pair) {
                    const cState = crewState[crew.id];
                    
                    // Month total limit uses only accumulatedHours
                    const currentTotalMonth = cState.accumulatedHours;
                    const nextTotalMonth = currentTotalMonth + flightHours;

                    // HST uses annualFlightHours minus flightHours to avoid double-counting current month
                    const currentTotal = (crew.stats.annualFlightHours || 0) - (crew.stats.flightHours || 0) + cState.accumulatedHours;
                    const nextTotal = currentTotal + flightHours;

                    // NEW: AQEXP Logic (100.5h vs 25.5h) - ONLY FOR EMI
                    if (isEMI(crew)) {
                        const CHECK_THRESHOLD = crew.isAqExp ? 100.5 : 25.5;
                        if (currentTotal < CHECK_THRESHOLD && nextTotal >= CHECK_THRESHOLD) {
                            if (crew.role === 'CMTE') cState.pendingXQR = 1; 
                            if (crew.role === 'COP') cState.pendingXQR = 2;  
                            yield { type: 'LOG', message: `${crew.name} atingiu ${CHECK_THRESHOLD}h. Cheque agendado.`, level: 'warning' };
                        }
                    }
                    if (cState.pendingXQR > 0) xqrCandidates.push(crew.id);
                }

                const realCandidates = xqrCandidates.filter(id => !instructorMember || id !== instructorMember.id);
                const isCheckRide = realCandidates.length > 0 && !!instructorMember;

                for (const crew of pair) {
                    const cState = crewState[crew.id];
                    let assignType: 'VOO' | 'XQR' = 'VOO';
                    let functionCode: 'INS' | 'ALU' | 'XQR' | 'EXM' | undefined = undefined;

                    const isTheStudent = studentMember && crew.id === studentMember.id;
                    const isTheInstructor = instructorMember && crew.id === instructorMember.id;
                    const needsCheck = realCandidates.includes(crew.id);

                    if (isCheckRide) {
                        if (isTheInstructor) {
                            // CORREÇÃO: EXM apenas para TRE. TRI recebe INS.
                            if (isTRE(crew)) {
                                functionCode = 'EXM';
                            } else {
                                functionCode = 'INS';
                            }
                            assignType = 'VOO'; 
                        } else if (needsCheck) {
                            // Validar se o instrutor pode dar cheque (TRE)
                            // Se for TRI, não pode dar cheque XQR, então downgrade para ALU/INS
                            if (instructorMember && isTRE(instructorMember)) {
                                assignType = 'XQR';
                                functionCode = 'XQR';
                                cState.pendingXQR--; 
                                if (cState.pendingXQR === 0) {
                                    yield { type: 'CREW_UPDATE', crewId: crew.id, updates: { operationalTag: 'AVBL' } };
                                    crew.operationalTag = 'AVBL'; 
                                    yield { type: 'LOG', message: `Tag de ${crew.name} atualizada para AVBL (Cheque Concluído).`, level: 'success' };
                                }
                            } else {
                                // Instrutor é TRI -> Downgrade para ALU
                                functionCode = 'ALU';
                                yield { type: 'LOG', message: `Cheque adiado para ${crew.name}: Instrutor é TRI, requer TRE.`, level: 'warning' };
                            }
                        } else if (isTheStudent) {
                            functionCode = 'ALU';
                        }
                    } else {
                        // FORCE INS TAG FOR INSTRUCTOR IF STUDENT IS PRESENT
                        if (isTheStudent) functionCode = 'ALU';
                        else if (isTheInstructor && studentMember) functionCode = 'INS';
                    }

                    const newAssign: Assignment = {
                        id: `${crew.id}-${dateKey}-${assignType}-${flight.code}-AUTO-${Date.now()}`,
                        type: assignType, 
                        code: flight.code,
                        route: flight.route,
                        start: flight.start,
                        end: flight.end,
                        details: assignType === 'XQR' ? 'CHEQUE' : 'AUTO GEN',
                        functionCode: functionCode 
                    };

                    yield { type: 'ASSIGNMENT', crewId: crew.id, date: day.date, assignment: newAssign };
                    
                    if (!workingSchedule[crew.id]) workingSchedule[crew.id] = {};
                    if (!workingSchedule[crew.id][dateKey]) workingSchedule[crew.id][dateKey] = [];
                    workingSchedule[crew.id][dateKey].push(newAssign);

                    // Update Block Start if new block
                    let presentation = params.presentationBase;
                    if (cState.currentLocation !== (crew.base || 'VCP')) presentation = params.presentationOutstation;
                    
                    // Increment duty count only if first flight of day
                    const todaysFlightCount = workingSchedule[crew.id][dateKey].filter(a => ['VOO', 'XQR', 'SIM', 'DLS'].includes(a.type)).length;
                    if (todaysFlightCount === 1) { 
                        cState.consecutiveDuty++;
                        // It's the first activity of the day, so this is the fresh daily block start!
                        cState.blockStartTs = flightStartTs - (presentation * 60000);
                        cState.dutyFlightTime = 0;
                    }
                    
                    cState.accumulatedHours += flightHours;
                    cState.dutyFlightTime += (flightHours * 60); // Accumulate Flight Time in minutes
                    cState.currentLocation = destination; 
                    
                    // Update Madrugada Count - Apenas incrementa se for a primeira madrugada no dia?
                    // Para ser rigoroso, se houver QUALQUER voo de madrugada no dia, deve contar 1 para o dia.
                    // Assumimos incrementos por dia aqui também.
                    if (isMadrugadaAssignment(newAssign)) {
                        const madrugadasToday = workingSchedule[crew.id][dateKey].filter(a => isMadrugadaAssignment(a)).length;
                        if (madrugadasToday === 1) {
                            cState.consecutiveMadrugadas++;
                        }
                    } else if (todaysFlightCount === 1) {
                        cState.consecutiveMadrugadas = 0;
                    }
                    
                    // UPDATE REST: 
                    // MODIFICAÇÃO CHAVE: Não aplicar repouso final (12h) imediatamente.
                    // Aplicar apenas Turnaround (45 min) para permitir outra etapa no mesmo dia.
                    // O repouso de 12h será verificado ao final do dia para garantir descanso noturno.
                    const flightEndTs = flightStartTs + (flightDurationMin * 60000);
                    cState.nextAvailability = flightEndTs + (TURNAROUND_TIME * 60000);

                    // NÃO remover da lista de tripulantes disponíveis, pois podem assumir outro voo no dia
                    // availableCrew = availableCrew.filter(c => c.id !== crew.id); 
                    // Apenas atualiza o estado para que na próxima iteração do loop de voos eles sejam reavaliados
                }
            } // END RETRY LOOP
            
            if (!flightAssigned) {
                yield { type: 'LOG', message: `Falta tripulação em ${origin} para ${flight.code} (Nenhum par válido). Disp: ${crewAtLocation.length}`, level: 'error' };
            }
        }

        // --- NIGHTLY REST APPLICATION (FIM DO DIA) ---
        // Agora que todos os voos do dia foram processados, aplicamos o repouso regulamentar (12h)
        // para quem voou, garantindo que não sejam escalados cedo demais no dia seguinte.
        localCrewList.forEach(c => {
            const todaysAssignments = workingSchedule[c.id]?.[dateKey] || [];
            // Verifica se teve atividade de voo hoje (VOO, XQR, etc)
            const hadActivity = todaysAssignments.some(a => ['VOO', 'XQR', 'SIM', 'DLS', 'RE', 'SA'].includes(a.type));
            
            if (hadActivity) {
                // Encontrar o término da última atividade do dia
                let maxDutyEndTs = 0;
                
                todaysAssignments.forEach(a => {
                    if (['VOO', 'XQR', 'SIM', 'DLS', 'RE', 'SA'].includes(a.type)) {
                        const em = timeToMin(a.end || '00:00');
                        const sm = timeToMin(a.start || '00:00');
                        let endTs = dayStartTimestamp + (em * 60000);
                        if (em < sm) endTs += 86400000; // Termina no dia seguinte
                        
                        if (endTs > maxDutyEndTs) {
                            maxDutyEndTs = endTs;
                        }
                    }
                });

                // Calcular Timestamp do fim da última jornada
                // Assume 30m debriefing at the end of the day's last activity
                let dutyEndTs = maxDutyEndTs + (30 * 60000);
                
                // Aplicar Repouso Regulamentar (Padrão 12h ou conforme config)
                crewState[c.id].nextAvailability = dutyEndTs + (REST_POST_FLIGHT * 60000);
                
                // RESET JORNADA DIÁRIA (IMPORTANTE PARA VOO DO DIA SEGUINTE):
                // Se o tripulante repousa à noite (12h), a jornada diária encerra.
                // Resetamos blockStartTs para null para que no próximo dia (e.g. MAO>VCP)
                // o sistema calcule uma nova apresentação e não some com a jornada anterior.
                crewState[c.id].blockStartTs = null;
                crewState[c.id].dutyFlightTime = 0;
                
                // NOVO: Sincronizar localização para refletir o fim de qualquer voo (manual ou não)
                const checkDate = new Date(day.date);
                checkDate.setDate(checkDate.getDate() + 1);
                crewState[c.id].currentLocation = getCrewLocation(c.id, checkDate, workingSchedule, c);
            }
        });

        // --- GERAÇÃO DE SLOTS RE/SA (COM BASE EM activeFlightCodesOnDay) ---
        interface DutySlot { 
            type: 'RE' | 'SA'; 
            start: string; 
            end: string; 
            base: string; 
            tripDuration: number;
            filled: boolean; 
            priority: number;
            startMin: number; // Minutos absolutos no dia
        }
        const dutySlots: DutySlot[] = [];
        const flightsByOrigin: Record<string, Flight[]> = {};
        
        // Scan current schedule to count EXISTING SA/RE slots to avoid duplication
        const existingSAMap = new Map<number, number>();
        const existingREMap = new Map<number, number>();
        
        Object.values(workingSchedule).forEach(crewDayMap => {
             const assigns = crewDayMap[dateKey] || [];
             assigns.forEach(a => {
                 if (a.type === 'SA') {
                     const s = timeToMin(a.start || '00:00');
                     existingSAMap.set(s, (existingSAMap.get(s) || 0) + 1);
                 }
                 if (a.type === 'RE') {
                     const s = timeToMin(a.start || '00:00');
                     existingREMap.set(s, (existingREMap.get(s) || 0) + 1);
                 }
             });
        });

        // Usa todos os voos previstos (malha) para calcular slots, mas só ativa se o voo "existe" na escala (manual ou gerado)
        dailyFlights.forEach(f => {
            if (f.route) {
                const origin = f.route.split(/[-:>]/)[0].trim().toUpperCase();
                if (!flightsByOrigin[origin]) flightsByOrigin[origin] = [];
                flightsByOrigin[origin].push(f);
            }
        });

        Object.entries(flightsByOrigin).forEach(([origin, baseFlights]) => {
            baseFlights.sort((a,b) => timeToMin(a.start) - timeToMin(b.start));
            baseFlights.forEach((f) => {
                const fStart = timeToMin(f.start);
                const duration = calculateTripDuration(f, dayOfWeek, flights);

                // RE: 1h antes (Condicional via Params + VCP Only + Flight Scheduled)
                if (params.generateRE && origin === 'VCP' && activeFlightCodesOnDay.has(f.code)) {
                    const reStartMin = fStart - 60;
                    const existingCount = existingREMap.get(reStartMin) || 0;
                    
                    if (existingCount > 0) {
                        // Consome um slot existente e NÃO gera um novo
                        existingREMap.set(reStartMin, existingCount - 1);
                    } else {
                        const reDuration = params.defaultDurationRE || 180; // Use Config or 3h default
                        dutySlots.push({
                            type: 'RE',
                            start: minToTime(reStartMin),
                            end: minToTime(reStartMin + reDuration),
                            base: origin,
                            tripDuration: duration,
                            filled: false,
                            priority: 1,
                            startMin: reStartMin
                        });
                    }
                }

                // SA: 2h antes (Condicional via Params + VCP Only + Flight Scheduled)
                if (params.generateSA && origin === 'VCP' && activeFlightCodesOnDay.has(f.code)) {
                    const saStartMin = fStart - 120;
                    const existingCount = existingSAMap.get(saStartMin) || 0;

                    if (existingCount > 0) {
                        // Consome um slot existente e NÃO gera um novo
                        existingSAMap.set(saStartMin, existingCount - 1);
                    } else {
                        const saDuration = params.defaultDurationSA || 360; // Use Config or 6h default
                        dutySlots.push({
                            type: 'SA',
                            start: minToTime(saStartMin),
                            end: minToTime(saStartMin + saDuration),
                            base: origin,
                            tripDuration: duration,
                            filled: false,
                            priority: 1,
                            startMin: saStartMin
                        });
                    }
                }
            });
        });

        dutySlots.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'SA' ? -1 : 1;
            return b.tripDuration - a.tripDuration; 
        });

        // 4. Preenchimento de Lacunas (RE, SA, FR, FS)
        // Somente tripulantes que AINDA NÃO FORAM ALOCADOS (Available Crew)
        // Recalcular availableCrew pois alguns podem ter voado hoje
        const unassignedCrew = localCrewList.filter(c => {
            if (!c.isOn) return false;
            // Se tem voo hoje, não está disponível para RE/SA/FR
            const hasSchedule = workingSchedule[c.id]?.[dateKey] && workingSchedule[c.id][dateKey].length > 0;
            return !hasSchedule;
        });

        // Ordenação dinâmica para distribuição de folgas/reservas também
        // APPLY DYNAMIC ROTATION ONLY TO AVBL/TRI/TRE. EMI = SENIORITY.
        unassignedCrew.sort((a, b) => {
            const isBaseA = crewState[a.id].currentLocation === 'VCP';
            const isBaseB = crewState[b.id].currentLocation === 'VCP';
            if (isBaseA && !isBaseB) return -1;
            if (!isBaseA && isBaseB) return 1;
            
            const isEmiA = isEMI(a);
            const isEmiB = isEMI(b);
            
            // EMI prioritizes seniority (Static) to allow max hours
            if (isEmiA && isEmiB) {
                return sortBySeniority(a, b);
            }
            if (isEmiA) return -1;
            if (isEmiB) return 1;

            // NEW SORT FOR BALANCE RE/SA DISTRIBUTION:
            // 1. Prioritize Crew with Lowest SA Count (Balance Load)
            const saDiff = crewState[a.id].saCount - crewState[b.id].saCount;
            if (saDiff !== 0) return saDiff;

            // 2. Then by Flight Hours (Lowest first)
            return sortByDynamicHours(a, b);
        });

        for (const crew of unassignedCrew) {
            // Verificação extra de segurança (redundante mas segura)
            if (workingSchedule[crew.id]?.[dateKey] && workingSchedule[crew.id][dateKey].length > 0) {
                continue;
            }

            let type: AssignmentType | 'AGD REQ' = 'FR'; 
            let start = '00:00';
            let end = '23:59';
            let details = 'FR'; 
            let bookedDuration = 1;

            const state = crewState[crew.id];
            const tags = resolveCrewTags(crew, day.date);
            const currentLocation = state.currentLocation;

            // --- DEFINIÇÃO DE ELEGIBILIDADE (LISTAS) ---
            const isEligibleForSA = state.saCount < MAX_SA; // "crewAvailableForSA" List Check
            const needsFS = state.fsCount < MAX_FS; // "crewWithoutFS" List Check

            // --- LÓGICA DE FOLGA SOCIAL (FS) ---
            let assignFS = false;
            
            // FIX: MANDATORY FS IF NONE BY DAY 21
            const isCriticalFS = day.dayOfMonth > 20 && state.fsCount === 0;

            if (isSunday) {
                const prevDate = new Date(day.date);
                prevDate.setDate(day.date.getDate() - 1);
                const prevKey = prevDate.toISOString().split('T')[0];
                const prevAssigns = workingSchedule[crew.id]?.[prevKey] || [];
                // Se Sábado teve FS, Domingo DEVE ser FS para fechar o Fim de Semana Social
                if (prevAssigns.some(a => a.type === 'FS')) {
                    assignFS = true;
                    state.hasSocialWeekend = true;
                }
            } else if (isSaturday) {
                // PRIORITY 0: CRITICAL FS (Bug Fix)
                if (isCriticalFS) {
                     const nextDate = new Date(day.date);
                     nextDate.setDate(day.date.getDate() + 1);
                     const nextKey = nextDate.toISOString().split('T')[0];
                     // Check if Sunday is free
                     if (!workingSchedule[crew.id]?.[nextKey] || workingSchedule[crew.id][nextKey].length === 0) {
                        assignFS = true;
                        state.hasSocialWeekend = true; // Mark as satisfied
                        yield { type: 'LOG', message: `FS Obrigatória aplicada para ${crew.name} (Crítica > Dia 21)`, level: 'warning' };
                     }
                }
                // PRIORITY 1: Ensure at least one Social Weekend
                else if (!state.hasSocialWeekend) {
                    const nextDate = new Date(day.date);
                    nextDate.setDate(day.date.getDate() + 1);
                    const nextKey = nextDate.toISOString().split('T')[0];
                    // Check if Sunday is free (no manual assignment)
                    if (!workingSchedule[crew.id]?.[nextKey] || workingSchedule[crew.id][nextKey].length === 0) {
                        assignFS = true; 
                    }
                }
                // PRIORITY 2: Meet minimum FS count if late in month
                // ONLY IF NEEDS FS (Uses the "list" logic)
                else if (isPriorityFS && needsFS) {
                     const nextDate = new Date(day.date);
                     nextDate.setDate(day.date.getDate() + 1);
                     const nextKey = nextDate.toISOString().split('T')[0];
                     if (!workingSchedule[crew.id]?.[nextKey] || workingSchedule[crew.id][nextKey].length === 0) {
                        assignFS = true; 
                     }
                }
            }

            // LIMITE DE JORNADA: 6 DIAS CONSECUTIVOS -> FOLGA OBRIGATÓRIA (Approx check)
            // *** USAR LIMITE PARAMETRIZADO ***
            const forceOffDueToDuty = state.consecutiveDuty >= MAX_CONSECUTIVE_DUTY;

            if (assignFS) {
                type = 'FS'; details = 'FS';
            } else if (forceOffDueToDuty) {
                type = 'FR'; details = 'FR';
            } else if ((tags.operationalTag as string) === 'REQ') {
                if (dayOfWeek >= 1 && dayOfWeek <= 4) { 
                    type = 'AGD REQ'; 
                    details = 'AGD REQ'; 
                    start = '08:00';
                    end = '18:00';
                } 
                else type = 'FR';
            } else {
                const daysRemaining = days.length - day.dayOfMonth; 
                const neededOff = MIN_DAYS_OFF - state.daysOff;
                const forceOff = neededOff >= daysRemaining;

                // Determine Fallback Type
                // Logic: If out of base, cannot be FR unless GS/REQ.
                const isOutOfBase = currentLocation !== (crew.base || 'VCP');
                const isGsOrReq = tags.operationalTag === 'GS'; // Simplified, REQ handled in else if
                
                let defaultOffType: AssignmentType = 'FR';
                if (isOutOfBase && !isGsOrReq) {
                    defaultOffType = 'FR'; // Revert back to FR
                }

                if (forceOff) {
                    type = defaultOffType; 
                    details = isOutOfBase ? `${type}-${currentLocation}` : type;
                } else {
                    let slotIndex = -1;

                    // Helper to check rest availability for a specific slot
                    const isAvailableForSlot = (slot: DutySlot) => {
                        const slotStartTs = dayStartTimestamp + (slot.startMin * 60000);
                        return state.nextAvailability <= slotStartTs;
                    };

                    // Helper to check 144h limit for slot (Parametrized)
                    const fits144hRule = (slot: DutySlot) => {
                        let presentation = params.presentationBase;
                        if (currentLocation !== (crew.base || 'VCP')) presentation = params.presentationOutstation;
                        
                        const assignStartTs = dayStartTimestamp + (slot.startMin * 60000);
                        // SA = 10h rest, RE = 12h rest (Standard) - Using config
                        const restDur = slot.type === 'SA' ? REST_POST_SA : REST_DEFAULT;
                        const assignEndTs = dayStartTimestamp + timeToMin(slot.end) * 60000 + (timeToMin(slot.end) < timeToMin(slot.start) ? 86400000 : 0);
                        const restEndTs = assignEndTs + (restDur * 60000);

                        let effectiveBlockStart = state.blockStartTs;
                        if (state.consecutiveDuty === 0 || effectiveBlockStart === null) {
                            effectiveBlockStart = assignStartTs - (presentation * 60000);
                        }
                        
                        return (restEndTs - effectiveBlockStart) <= MAX_CONSECUTIVE_BLOCK_MS;
                    };

                    // PREFERÊNCIA POR FUNÇÃO E DISPONIBILIDADE
                    if (crew.role === 'CMTE') {
                        slotIndex = dutySlots.findIndex(s => 
                            s.base === currentLocation && 
                            !s.filled && 
                            s.type === 'RE' &&
                            isAvailableForSlot(s) &&
                            fits144hRule(s)
                        );
                        
                        // Only try SA if no RE found AND Limit not reached (List Check)
                        if (slotIndex === -1 && isEligibleForSA) {
                            slotIndex = dutySlots.findIndex(s => 
                                s.base === currentLocation && 
                                !s.filled && 
                                s.type === 'SA' &&
                                isAvailableForSlot(s) &&
                                fits144hRule(s)
                            );
                        }
                    } else {
                        // COP: Try SA First (Only if Limit Not Reached - List Check)
                        if (isEligibleForSA) {
                            slotIndex = dutySlots.findIndex(s => 
                                s.base === currentLocation && 
                                !s.filled && 
                                s.type === 'SA' &&
                                isAvailableForSlot(s) &&
                                fits144hRule(s)
                            );
                        }

                        // Fallback to RE
                        if (slotIndex === -1) {
                            slotIndex = dutySlots.findIndex(s => 
                                s.base === currentLocation && 
                                !s.filled && 
                                s.type === 'RE' &&
                                isAvailableForSlot(s) &&
                                fits144hRule(s)
                            );
                        }
                    }
                    
                    if (slotIndex !== -1) {
                        const slot = dutySlots[slotIndex];
                        type = slot.type;
                        details = slot.type;
                        start = slot.start;
                        end = slot.end;
                        bookedDuration = slot.tripDuration;
                        dutySlots[slotIndex].filled = true;

                        if (type === 'RE') dailyRECount++;
                        if (type === 'SA') {
                            dailySACount++;
                            state.saCount++;
                        }
                    } else {
                        // Fallback
                        type = defaultOffType;
                        details = isOutOfBase ? `${type}-${currentLocation}` : type;
                    }
                }
            }

            const gapAssign: Assignment = {
                id: `${crew.id}-${dateKey}-${type.replace(' ','')}-AUTO-${Date.now()}`,
                type: type === 'AGD REQ' ? 'GS' : (type as any), 
                details: details,
                start,
                end
            };

            const val = validateAssignment(crew.id, day.date, gapAssign, workingSchedule, config, flights, localCrewList, metadata, params);
            
            if (!val.valid) {
                // Determine fallback if validation fails (e.g. still out of base)
                const isOutOfBase = currentLocation !== (crew.base || 'VCP');
                const isGsOrReq = tags.operationalTag === 'GS' || (tags.operationalTag as string) === 'REQ';
                const fallbackType = 'FR'; 
                
                gapAssign.type = fallbackType;
                gapAssign.details = fallbackType;
            }

            yield { type: 'ASSIGNMENT', crewId: crew.id, date: day.date, assignment: gapAssign };
            
            if (!workingSchedule[crew.id]) workingSchedule[crew.id] = {};
            if (!workingSchedule[crew.id][dateKey]) workingSchedule[crew.id][dateKey] = [];
            workingSchedule[crew.id][dateKey].push(gapAssign);

            if (['FR', 'FS'].includes(gapAssign.type)) {
                state.daysOff++;
                if (gapAssign.type === 'FS') state.fsCount++;
                state.consecutiveDuty = 0; // RESET ON OFF DAY
                state.consecutiveMadrugadas = 0; // RESET ON OFF DAY
                state.blockStartTs = null; // Reset Block Start
            } else {
                // Update Block Start if needed
                let presentation = params.presentationBase;
                if (state.currentLocation !== (crew.base || 'VCP')) presentation = params.presentationOutstation;
                
                const assignStartTs = dayStartTimestamp + timeToMin(start) * 60000;
                
                // If it's a new day's assignment (which it usually is for RE/SA), reset blockStartTs
                state.blockStartTs = assignStartTs - (presentation * 60000);
                state.consecutiveDuty++;
                
                // UPDATE REST FOR DUTY
                const endMin = timeToMin(end);
                // Handle midnight wrap if needed, though rare for generated RE/SA templates
                const dutyEndTs = dayStartTimestamp + (endMin * 60000) + (endMin < timeToMin(start) ? 86400000 : 0);
                
                let restMin = REST_DEFAULT; // 12h Default
                if (gapAssign.type === 'SA') restMin = REST_POST_SA; // 10h for SA
                
                state.nextAvailability = dutyEndTs + (restMin * 60000);
            }

            // Continuidade RE/SA (Future Days)
            // Note: Does not check 144h deeply for future days here to keep simple, assuming short blocks.
            // Ideally should check.
            if (['RE', 'SA'].includes(type) && bookedDuration > 1) {
                const currentDateObj = new Date(day.date);
                for (let i = 1; i < bookedDuration; i++) {
                    const nextDate = new Date(currentDateObj);
                    nextDate.setDate(currentDateObj.getDate() + i);
                    const nextKey = nextDate.toISOString().split('T')[0];

                    if (!workingSchedule[crew.id][nextKey] || workingSchedule[crew.id][nextKey].length === 0) {
                        
                        // FORÇAR PROGRESSÃO COMO 'SA' (Sobreaviso)
                        const futureType = 'SA'; 
                        const limitSA = params.maxStandbyMonth || 8;
                        
                        // *** VERIFICAÇÃO RIGOROSA DO LIMITE DE SA ***
                        // Impede a extensão se o limite já foi atingido, a menos que seja RE
                        if (futureType === 'SA' && state.saCount >= limitSA && type !== 'RE') {
                            yield { type: 'LOG', message: `Extensão de SA cancelada para ${crew.name} (Limite Mensal Atingido: ${state.saCount}).`, level: 'warning' };
                            break; // Interrompe a continuidade imediatamente
                        }
                        
                        const futureAssign: Assignment = {
                            id: `${crew.id}-${nextKey}-${futureType}-AUTO-CONT-${Date.now()}`,
                            type: futureType as any,
                            details: futureType, 
                            start: start, 
                            end: end
                        };

                        if (!workingSchedule[crew.id][nextKey]) workingSchedule[crew.id][nextKey] = [];
                        workingSchedule[crew.id][nextKey].push(futureAssign);
                        
                        yield { type: 'ASSIGNMENT', crewId: crew.id, date: nextDate, assignment: futureAssign };
                        
                        state.consecutiveDuty++;
                        state.saCount++; // Progressions count as SA
                        
                        // Update Rest for future duty
                        const futStartTs = nextDate.getTime(); // approximate 00:00
                        const futEndMin = timeToMin(end);
                        const futEndTs = futStartTs + (futEndMin * 60000);
                        let restMinFut = REST_POST_SA; // Always use SA rest for progressions
                        state.nextAvailability = futEndTs + (restMinFut * 60000);
                    }
                }
            }
        }
    }

    yield { type: 'LOG', message: `Geração Concluída. ${flightsAssignedTotal} etapas distribuídas.`, level: 'success' };
}

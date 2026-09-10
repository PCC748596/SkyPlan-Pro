
import React, { useRef, useState, useMemo } from 'react';
import { CrewMember, DayData, ScheduleMap, Assignment, Flight, RegulatoryConfig, ScheduleMetadata, Aircraft, ActivityDefinition } from '../types';
import { ACTIVITY_DESCRIPTIONS, MONTHS, ACTIVITY_COLORS } from '../constants';
import { validateFlightCompleteness, validateAssignment, getCrewLocation } from '../regulation';
import { SystemModule } from '../App';
import CrewInfo from './CrewInfo';
import AircraftInfo from './AircraftInfo';
import ScheduleCell from './ScheduleCell';
import TwoDayTimelineModal from './TwoDayTimelineModal';
import { ChevronLeft, ChevronRight, Plane } from 'lucide-react';

interface ScheduleGridProps {
  days: DayData[];
  crewList: CrewMember[];
  aircraftList: Aircraft[];
  schedule: ScheduleMap;
  flights: Flight[];
  viewMode: 'CREW' | 'AIRCRAFT';
  activeModule: SystemModule;
  onDrop: (crewId: string, date: Date, type: string) => void;
  onDeleteAssignment: (crewId: string, date: Date, assignmentId?: string) => void;
  onDeleteColumn?: (date: Date) => void;
  onToggleCrewStatus: (id: string) => void;
  onUpdateCrewTag: (id: string, type: 'admin' | 'operational' | 'instruction' | 'synthetic', value: string | null) => void;
  onToggleFatigue: (id: string) => void;
  onToggleAircraftApu?: (id: string, currentStatus: string) => void;
  onCopy: (assignments: Assignment[] | null) => void; 
  onPaste: (crewId: string, date: Date) => void;
  onEdit: (assignment: Assignment, crewId: string, date: Date) => void;
  onAdd: (crewId: string, date: Date) => void; 
  onPrevDay?: () => void;
  onNextDay?: () => void;
  onNameClick?: (crewId: string) => void; 
  regulatoryConfig: RegulatoryConfig;
  scheduleMetadata: ScheduleMetadata;
  activities?: ActivityDefinition[]; 
}

interface TooltipData {
  visible: boolean;
  day: DayData;
  assignment: Assignment;
  relatedCrew: { name: string; role: string; functionCode?: string }[];
  completenessError?: string;
  currentLocation?: string;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ 
  days, 
  crewList, 
  aircraftList,
  schedule, 
  flights,
  viewMode,
  activeModule,
  onDrop,
  onDeleteAssignment,
  onDeleteColumn,
  onToggleCrewStatus,
  onUpdateCrewTag,
  onToggleFatigue,
  onToggleAircraftApu,
  onCopy,
  onPaste,
  onEdit,
  onAdd,
  onPrevDay,
  onNextDay,
  onNameClick,
  regulatoryConfig,
  scheduleMetadata,
  activities
}) => {
  const [tooltipContent, setTooltipContent] = useState<TooltipData | null>(null);
  const [twoDayTimelineStart, setTwoDayTimelineStart] = useState<Date | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTimelineView = activeModule === 'COORDENAÇÃO' || activeModule === 'PLANEJAMENTO';

  const visibleDays = days;
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  const validationIssues = useMemo(() => {
     const issues = new Map<string, string>();
     const flightMap = new Map<string, CrewMember[]>();
     Object.keys(schedule).forEach(crewId => {
        const crewMember = crewList.find(c => c.id === crewId);
        if (!crewMember) return;
        Object.entries(schedule[crewId]).forEach(([dateKey, assignments]) => {
           (assignments as Assignment[]).forEach(assign => {
               // CHANGED: Treat XQR as a flight for grouping
               if ((assign.type === 'VOO' || assign.type === 'XQR') && assign.code) {
                  const key = `${dateKey}_${assign.code}`;
                  if (!flightMap.has(key)) flightMap.set(key, []);
                  flightMap.get(key)!.push(crewMember);
               }
           });
        });
     });
     flightMap.forEach((assignedCrew, key) => {
        const [dateKey, flightCode] = key.split('_');
        const check = validateFlightCompleteness(flightCode, new Date(dateKey), assignedCrew, flights);
        if (!check.valid && check.message) issues.set(key, check.message);
     });
     crewList.forEach(crew => {
        days.forEach(day => {
            const dateKey = day.date.toISOString().split('T')[0];
            const assignments = schedule[crew.id]?.[dateKey] || [];
            assignments.forEach(assign => {
                const res = validateAssignment(crew.id, day.date, assign, schedule, regulatoryConfig, flights, crewList, scheduleMetadata);
                if (res.message && !res.isWarning) issues.set(assign.id, res.message);
            });
        });
     });
     return issues;
  }, [schedule, crewList, flights, regulatoryConfig, scheduleMetadata, days]);
  
  const handleCellMouseEnter = (e: React.MouseEvent, day: DayData, assignment: Assignment, currentCrewId: string) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    
    let related: { name: string; role: string; functionCode?: string }[] = [];
    
    const dateKey = day.date.toISOString().split('T')[0];
    
    // CHANGED: Treat XQR as VOO for grouping related crew
    const isFlightLike = (assignment.type === 'VOO' || assignment.type === 'XQR') && assignment.code;

    if (isFlightLike) {
      related = crewList
        .filter(c => { 
            const assigns = schedule[c.id]?.[dateKey]; 
            // Check for VOO or XQR with same code
            return assigns && assigns.some(a => (a.type === 'VOO' || a.type === 'XQR') && a.code === assignment.code); 
        })
        .map(c => {
            const assigns = schedule[c.id]?.[dateKey];
            const specificAssign = assigns?.find(a => (a.type === 'VOO' || a.type === 'XQR') && a.code === assignment.code);
            return { name: c.name, role: c.role, functionCode: specificAssign?.functionCode };
        });
    } else {
      const c = crewList.find(c => c.id === currentCrewId);
      if (c) related.push({ name: c.name, role: c.role, functionCode: assignment.functionCode });
    }
    
    let completenessError = undefined;
    if (validationIssues.has(assignment.id)) completenessError = validationIssues.get(assignment.id);
    else if (isFlightLike) { const key = `${dateKey}_${assignment.code}`; completenessError = validationIssues.get(key); }
    
    // UPDATED: Use getCrewLocation from regulation.ts for consistent logic
    const currentLocation = viewMode === 'CREW' 
        ? getCrewLocation(currentCrewId, day.date, schedule, crewList.find(c => c.id === currentCrewId)!) 
        : 'VCP';
    
    hoverTimeout.current = setTimeout(() => { setTooltipContent({ visible: true, day, assignment, relatedCrew: related, completenessError, currentLocation }); if (tooltipRef.current) updateTooltipPosition(e.clientX, e.clientY); }, 400);
  };

  const handleCellMouseMove = (e: React.MouseEvent) => { if (tooltipContent?.visible && tooltipRef.current) updateTooltipPosition(e.clientX, e.clientY); };
  const handleCellMouseLeave = () => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); setTooltipContent(null); };

  const updateTooltipPosition = (x: number, y: number) => {
    if (!tooltipRef.current) return;
    const offset = 15;
    let top = y + offset;
    let left = x + offset;
    const rect = tooltipRef.current.getBoundingClientRect();
    if (left + rect.width > window.innerWidth) left = x - rect.width - offset;
    if (top + rect.height > window.innerHeight) top = y - rect.height - offset;
    tooltipRef.current.style.top = `${top}px`;
    tooltipRef.current.style.left = `${left}px`;
  };

  const getTooltipTitle = (assignment: Assignment) => {
      if (assignment.type === 'VOO' || assignment.type === 'XQR') {
          const code = assignment.code || assignment.type;
          // EXM or XQR Prefix
          if (assignment.functionCode === 'EXM') return `EXM-${code}`;
          if (assignment.functionCode === 'XQR' || assignment.type === 'XQR') return `XQR-${code}`;
          if (assignment.functionCode) return `${assignment.functionCode}-${code}`;
          return code;
      }
      const STANDALONE_LABELS = ['ADM 1', 'ADM 2', 'AGD INS', 'UPRT', 'DEICE'];
      if (assignment.details && STANDALONE_LABELS.includes(assignment.details)) return assignment.details;
      if (assignment.type === 'DLS' && assignment.details) return `DLS-${assignment.details}`;
      return assignment.type;
  };

  const getTooltipSubtitle = (assignment: Assignment) => {
      if (assignment.type === 'VOO' || assignment.type === 'XQR') return assignment.route;
      if (assignment.details) {
          const descriptions: Record<string, string> = { 'UPRT': 'Upset Prevention and Recovery Training', 'DEICE': 'Ground De-Icing/Anti-Icing', 'ADM 1': 'Administrativo (Dia Completo)', 'ADM 2': 'Administrativo (Horário Reduzido)', 'AGD INS': 'Aguardando Instrução', };
          if (descriptions[assignment.details]) return descriptions[assignment.details];
      }
      if (assignment.type === 'DLS') return 'Tripulante Extra a Serviço';
      return ACTIVITY_DESCRIPTIONS[assignment.type] || assignment.details || assignment.type;
  };

  const timeToMinutes = (timeStr: string | undefined): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const CoordinationAssignmentBlock: React.FC<{ assignment: Assignment; day: DayData; crewId: string }> = ({ assignment, day, crewId }) => {
    const plannedStart = timeToMinutes(assignment.start);
    let plannedEnd = timeToMinutes(assignment.end);
    if (plannedEnd < plannedStart) plannedEnd += 1440;
    
    const actualStartVal = assignment.actualStart || assignment.start;
    const actualEndVal = assignment.actualEnd || assignment.end;
    
    const actualStart = timeToMinutes(actualStartVal);
    let actualEnd = timeToMinutes(actualEndVal);
    if (actualEnd < actualStart) actualEnd += 1440;

    const MINUTE_WIDTH = 5 / 60; 

    const colorClass = ACTIVITY_COLORS[assignment.type] || 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100';
    const origin = (assignment.route || 'VCP-').split('-')[0];
    const destination = (assignment.route || '-VCP').split('-')[1];

    const plannedLeft = plannedStart * MINUTE_WIDTH;
    const plannedWidth = (plannedEnd - plannedStart) * MINUTE_WIDTH;

    const actualLeft = actualStart * MINUTE_WIDTH;
    const actualWidth = (actualEnd - actualStart) * MINUTE_WIDTH;

    const hasExecutedData = !!assignment.actualStart;

    return (
      <div 
        className="absolute top-0 h-full group/block select-none"
        style={{ left: 0, width: '100%' }}
      >
        <div 
          className={`absolute top-2 h-9 border border-white/10 shadow flex items-center justify-between cursor-pointer transition-all hover:brightness-110 px-2 ${colorClass}`}
          style={{ left: `${plannedLeft}rem`, width: `${plannedWidth}rem`, minWidth: '4.5rem' }}
          onMouseEnter={(e) => handleCellMouseEnter(e, day, assignment, crewId)}
          onMouseMove={handleCellMouseMove}
          onMouseLeave={handleCellMouseLeave}
          onClick={() => onEdit(assignment, crewId, day.date)}
          onContextMenu={(e) => { e.preventDefault(); onDeleteAssignment(crewId, day.date, assignment.id); }}
        >
           <span className="text-[9px] font-bold text-white/50 font-mono shrink-0">{origin}</span>
           <span className="text-[11px] font-black font-mono tracking-tighter truncate px-1 flex-1 text-center">
             {assignment.code || assignment.details || assignment.type}
           </span>
           <span className="text-[9px] font-bold text-white/50 font-mono shrink-0">{destination}</span>
        </div>

        <div 
          className={`absolute top-[3.2rem] h-9 border shadow-md flex items-center justify-center opacity-90 transition-all hover:brightness-110 ${hasExecutedData ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-200/50 dark:bg-slate-800/30 border-slate-300 dark:border-slate-700 border-dashed'}`}
          style={{ left: `${actualLeft}rem`, width: `${actualWidth}rem`, minWidth: '4rem' }}
          onMouseEnter={(e) => handleCellMouseEnter(e, day, assignment, crewId)}
          onMouseMove={handleCellMouseMove}
          onMouseLeave={handleCellMouseLeave}
          onClick={() => onEdit(assignment, crewId, day.date)}
        >
           {actualWidth > 4.5 && (
             <span className={`text-[10px] font-black font-mono tracking-wider uppercase ${hasExecutedData ? 'text-white' : 'text-slate-500 dark:text-slate-600'}`}>
                {hasExecutedData ? 'EXECUTADO' : 'PLANEJADO'}
             </span>
           )}
        </div>
      </div>
    );
  };

  const handleHeaderClick = (e: React.MouseEvent, date: Date) => {
    if (e.ctrlKey && onDeleteColumn) {
      e.preventDefault();
      e.stopPropagation();
      onDeleteColumn(date);
    }
  };

  return (
    <div className={`flex-1 ${twoDayTimelineStart ? 'overflow-hidden' : 'overflow-auto'} bg-slate-50 dark:bg-slate-950 relative custom-scrollbar h-full`}>
      <div className="inline-block min-w-full relative z-10 flex flex-col">
        
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0">
          <div className="flex flex-col items-center opacity-[0.04] rotate-[-15deg] scale-100 transition-all duration-700">
            <Plane size={450} className="-rotate-45 text-slate-900 dark:text-white" />
            <h1 className="text-[120px] font-black tracking-tighter text-slate-900 dark:text-white -mt-20 whitespace-nowrap">SKYPLAN PRO</h1>
          </div>
        </div>

        {/* HEADER ROW */}
        <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 shadow-md flex">
            {/* Sticky Left Corner */}
            <div className="sticky left-0 z-50 border-r border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 w-[296px]">
                <div className="h-14 flex items-center justify-center gap-3 p-2 relative group">
                    <span className="text-[12px] text-slate-500 font-mono font-bold tracking-wider whitespace-nowrap overflow-hidden uppercase shrink-0">
                       {viewMode === 'AIRCRAFT' ? 'AERONAVE / DATA' : 'TRIPULAÇÃO / DATA'}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={onPrevDay} className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-90 shadow-lg" title="Recuar 1 dia">
                        <ChevronLeft size={14} className="stroke-[3]" />
                      </button>
                      <button onClick={onNextDay} className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-90 shadow-lg" title="Avançar 1 dia">
                        <ChevronRight size={14} className="stroke-[3]" />
                      </button>
                    </div>
                </div>
            </div>

            {/* Date Columns */}
            {visibleDays.map((day) => {
                const isToday = new Date().toISOString().split('T')[0] === day.date.toISOString().split('T')[0];
                return (
                <div key={day.date.toISOString()} className={`border-r border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 ${isTimelineView ? 'w-[120rem]' : 'w-[95px]'}`}>
                   <div className="flex flex-col h-full">
                      <div 
                        onClick={(e) => {
                          handleHeaderClick(e, day.date);
                          setTwoDayTimelineStart(day.date);
                        }}
                        className={`h-14 flex flex-col items-center justify-center cursor-pointer transition-all group/header whitespace-nowrap px-2 relative ${isToday ? 'bg-yellow-400 text-black hover:bg-yellow-500' : `hover:bg-slate-100 dark:hover:bg-slate-800/40 ${day.isWeekend ? 'text-slate-500 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}`}
                        title="Clique para abrir a escala detalhada de 2 dias. Ctrl + Clique para deletar toda a coluna"
                      >
                        <span className={`text-[12px] font-bold uppercase transition-transform group-hover:header:scale-105 ${!isToday && day.isWeekend ? 'text-blue-600 dark:text-blue-400' : ''}`}>{day.dayOfMonth} {MONTHS[day.date.getMonth()]}</span>
                        {!isTimelineView && <span className={`text-[11px] font-mono uppercase mt-0.5 ${isToday ? 'opacity-80' : 'opacity-60'}`}>{day.dayOfWeek}</span>}
                        <span className="text-[9px] text-blue-500 font-mono font-bold opacity-0 group-hover/header:opacity-100 transition-opacity">🔍 2 Dias</span>
                      </div>
                      {isTimelineView && (
                        <div className="flex w-full">
                          {hours.map((h) => (
                            <div key={h} className="min-w-[5rem] h-6 border-r border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-[8px] font-mono text-slate-800 dark:text-white">
                              {h}
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                </div>
                );
            })}
        </div>

        {/* BODY */}
        <div className="flex flex-col">
            {/* CREW ROWS - Fixed Height (min-h-[66px]) */}
            {viewMode === 'CREW' && crewList.map((crew, idx) => {
                const crewSchedule = schedule[crew.id] || {};
                
                // CHECK IF CREW HAS VACATION IN SCHEDULE
                const hasVacation = (Object.values(crewSchedule).flat() as Assignment[]).some(a => a.type === 'VAC');

                return (
                  <div key={crew.id} className="flex border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors relative group min-h-[66px]">
                     {/* Sticky Left CrewInfo */}
                     <CrewInfo 
                         crew={crew} 
                         index={idx} 
                         isCoordinationMode={isTimelineView} 
                         onToggleStatus={onToggleCrewStatus} 
                         onUpdateTag={onUpdateCrewTag} 
                         onToggleFatigue={onToggleFatigue}
                         onNameClick={onNameClick}
                         hasVacation={hasVacation} 
                     />
                     {/* Day Cells */}
                     {visibleDays.map((day) => {
                        const dateKey = day.date.toISOString().split('T')[0];
                        const assignments = crewSchedule[dateKey] || [];
                        return (
                           <div key={dateKey} className={`border-r border-slate-200 dark:border-slate-800/50 shrink-0 relative ${isTimelineView ? 'w-[120rem] bg-transparent' : 'w-[95px]'}`}>
                              {!isTimelineView ? (
                                 <ScheduleCell 
                                    day={day} 
                                    assignments={assignments} 
                                    onDrop={(d, type) => onDrop(crew.id, d, type)} 
                                    onDelete={(assignmentId) => onDeleteAssignment(crew.id, day.date, assignmentId)} 
                                    onMouseEnter={(e, assign) => handleCellMouseEnter(e, day, assign, crew.id)} 
                                    onMouseMove={handleCellMouseMove} 
                                    onMouseLeave={handleCellMouseLeave} 
                                    onCopy={onCopy} 
                                    onPaste={() => onPaste(crew.id, day.date)} 
                                    onEdit={(assign) => onEdit(assign, crew.id, day.date)}
                                    onDoubleClick={() => onAdd(crew.id, day.date)} 
                                    activities={activities}
                                    validationIssues={validationIssues}
                                 />
                              ) : (
                                 <div className="relative h-[97px] bg-transparent w-full" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                                      const rawData = e.dataTransfer.getData('application/skyplan-data');
                                      if (rawData) onDrop(crew.id, day.date, rawData);
                                  }}>
                                    <div className="absolute inset-0 flex pointer-events-none">
                                       {hours.map(h => <div key={h} className="w-[5rem] h-full border-r border-slate-200 dark:border-slate-800/10 last:border-0" />)}
                                    </div>
                                    {assignments.map(assign => (
                                       <CoordinationAssignmentBlock key={assign.id} assignment={assign} day={day} crewId={crew.id} />
                                    ))}
                                  </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
                );
            })}

            {/* AIRCRAFT ROWS */}
            {viewMode === 'AIRCRAFT' && aircraftList.map((ac, idx) => {
                return (
                  <div key={ac.id} className="flex border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors relative group h-[101px]">
                     {/* Sticky Left AircraftInfo */}
                     <AircraftInfo aircraft={ac} onToggleApu={onToggleAircraftApu} />
                     {/* Day Cells */}
                     {visibleDays.map((day) => {
                        const dateKey = day.date.toISOString().split('T')[0];
                        const linkedAssignments: Assignment[] = [];
                        const seenCodes = new Set<string>();
                        
                        Object.entries(schedule).forEach(([ownerId, crewDayMap]) => {
                            const map = crewDayMap as Record<string, Assignment[]>;
                            const dayAssigns = map[dateKey];
                            if (dayAssigns) {
                                dayAssigns.forEach((a: Assignment) => {
                                    if (viewMode === 'AIRCRAFT') {
                                        const isRegularFlight = a.type === 'VOO' && a.code?.startsWith('LV');
                                        const isFlightCheck = a.type === 'XQR' && a.code?.startsWith('LV') && !a.code.includes('SIM') && !a.details?.includes('SIM');
                                        const isMaintenance = a.type === 'MNT';
                                        if (!isRegularFlight && !isFlightCheck && !isMaintenance) {
                                            return;
                                        }
                                    }
                                    
                                    // Only show VOO or XQR that is an actual flight on the aircraft.
                                    const isRegularFlight = a.type === 'VOO';
                                    const isFlightCheck = a.type === 'XQR' && a.code && !a.code.includes('SIM') && !a.details?.includes('SIM');
                                    const isFlightLike = isRegularFlight || isFlightCheck;
                                    let effectiveAcId = a.aircraftId || (isFlightLike ? 'A1' : null);
                                    if (a.type === 'MNT') effectiveAcId = ownerId;
                                    
                                    if (effectiveAcId === ac.id) {
                                        const uniqueKey = a.code && isFlightLike ? a.code : a.id;
                                        if (!seenCodes.has(uniqueKey)) {
                                            linkedAssignments.push(a);
                                            seenCodes.add(uniqueKey);
                                        }
                                    }
                                });
                            }
                        });

                        return (
                           <div key={dateKey} className={`border-r border-slate-200 dark:border-slate-800/50 shrink-0 relative ${isTimelineView ? 'w-[120rem] bg-transparent' : 'w-[95px]'}`}>
                              {!isTimelineView ? (
                                 <ScheduleCell 
                                    day={day} 
                                    assignments={linkedAssignments} 
                                    onDrop={(d, type) => onDrop(ac.id, d, type)} 
                                    onDelete={(assignmentId) => onDeleteAssignment(ac.id, day.date, assignmentId)} 
                                    onMouseEnter={(e, assign) => handleCellMouseEnter(e, day, assign, ac.id)} 
                                    onMouseMove={handleCellMouseMove} 
                                    onMouseLeave={handleCellMouseLeave} 
                                    onCopy={onCopy} 
                                    onPaste={() => onPaste(ac.id, day.date)} 
                                    onEdit={(assign) => onEdit(assign, ac.id, day.date)} 
                                    onDoubleClick={() => onAdd(ac.id, day.date)}
                                    activities={activities}
                                    validationIssues={validationIssues}
                                    isAircraftView={viewMode === 'AIRCRAFT'}
                                 />
                              ) : (
                                 <div className="relative h-[97px] bg-transparent w-full" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                                      const rawData = e.dataTransfer.getData('application/skyplan-data');
                                      if (rawData) onDrop(ac.id, day.date, rawData);
                                  }}>
                                    <div className="absolute inset-0 flex pointer-events-none">
                                       {hours.map(h => <div key={h} className="w-[5rem] h-full border-r border-slate-200 dark:border-slate-800/10 last:border-0" />)}
                                    </div>
                                    {linkedAssignments.map(assign => (
                                       <CoordinationAssignmentBlock key={assign.id} assignment={assign} day={day} crewId={ac.id} />
                                    ))}
                                  </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
                );
            })}
        </div>

      </div>
      {tooltipContent && (
        <div ref={tooltipRef} className={`fixed z-[100] bg-white dark:bg-slate-900/95 border rounded-lg shadow-2xl p-4 min-w-[220px] pointer-events-none backdrop-blur-sm animate-in fade-in duration-200 ${tooltipContent.completenessError ? 'border-orange-500/50' : 'border-slate-300 dark:border-slate-600'}`} style={{ top: 0, left: 0 }}>
          <div className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider mb-2 uppercase border-b border-slate-200 dark:border-slate-700 pb-1 flex justify-between"><span>{tooltipContent.day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>{tooltipContent.completenessError && <span className="text-orange-500 font-bold">⚠️ ATENÇÃO</span>}</div>
          {viewMode === 'CREW' && <div className="text-xs font-mono text-slate-500 mt-1 mb-2 flex items-center gap-1">Local: <span className="text-slate-900 dark:text-white font-bold">{tooltipContent.currentLocation || 'VCP'}</span></div>}
          <div className="text-slate-900 dark:text-white text-xl font-bold font-mono leading-tight">{getTooltipTitle(tooltipContent.assignment)}</div>
          <div className="text-blue-600 dark:text-blue-400 text-sm font-mono mb-3">{getTooltipSubtitle(tooltipContent.assignment)}</div>
          {tooltipContent.completenessError && <div className="mb-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 p-2 rounded text-xs text-orange-600 dark:text-orange-200 font-bold">{tooltipContent.completenessError}</div>}
          <div className="space-y-1.5">{tooltipContent.relatedCrew.map((c, i) => ( <div key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${c.role === 'CMTE' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400'}`}>{c.role}.</span><span className="font-medium">{c.name}{c.functionCode && <span className="text-slate-500 font-mono text-xs ml-1">({c.functionCode})</span>}</span></div> ))}</div>
        </div>
      )}

      {/* 2-DAY TIMELINE MODAL */}
      {twoDayTimelineStart && (
        <TwoDayTimelineModal 
          startDate={twoDayTimelineStart}
          onClose={() => setTwoDayTimelineStart(null)}
          schedule={schedule}
          crewList={crewList}
          aircraftList={aircraftList}
          viewMode={viewMode}
          activities={activities}
          onEdit={onEdit}
          onAdd={onAdd}
          onToggleCrewStatus={onToggleCrewStatus}
          onUpdateCrewTag={onUpdateCrewTag}
          onToggleFatigue={onToggleFatigue}
          onNameClick={onNameClick}
          onToggleAircraftApu={onToggleAircraftApu}
        />
      )}
    </div>
  );
};

export default ScheduleGrid;

import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Search, 
  AlertTriangle
} from 'lucide-react';
import { 
  ScheduleMap, 
  CrewMember, 
  Aircraft, 
  Assignment, 
  DayData,
  ActivityDefinition 
} from '../types';
import { ACTIVITY_COLORS } from '../constants';
import CrewInfo from './CrewInfo';
import AircraftInfo from './AircraftInfo';

interface TwoDayTimelineModalProps {
  startDate: Date;
  onClose: () => void;
  schedule: ScheduleMap;
  crewList: CrewMember[];
  aircraftList: Aircraft[];
  viewMode: 'CREW' | 'AIRCRAFT';
  activities?: ActivityDefinition[];
  onEdit: (assignment: Assignment, targetId: string, date: Date) => void;
  onAdd: (targetId: string, date: Date) => void;
  onToggleCrewStatus: (id: string) => void;
  onUpdateCrewTag: (id: string, type: 'admin' | 'operational' | 'instruction' | 'synthetic', value: string | null) => void;
  onToggleFatigue: (id: string) => void;
  onNameClick?: (id: string) => void;
  onToggleAircraftApu?: (id: string, currentStatus: string) => void;
}

export const TwoDayTimelineModal: React.FC<TwoDayTimelineModalProps> = ({
  startDate,
  onClose,
  schedule,
  crewList,
  aircraftList,
  viewMode,
  activities,
  onEdit,
  onAdd,
  onToggleCrewStatus,
  onUpdateCrewTag,
  onToggleFatigue,
  onNameClick,
  onToggleAircraftApu
}) => {
  const [currentStartDate, setCurrentStartDate] = useState<Date>(new Date(startDate));
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredAssignment, setHoveredAssignment] = useState<{
    assignment: Assignment;
    targetId: string;
    date: Date;
    x: number;
    y: number;
  } | null>(null);

  // Compute next day
  const nextDate = new Date(currentStartDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const weekDays = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
  const weekDaysShort = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const day1Key = formatDateKey(currentStartDate);
  const day2Key = formatDateKey(nextDate);

  const handlePrevDay = () => {
    const prev = new Date(currentStartDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentStartDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentStartDate);
    next.setDate(next.getDate() + 1);
    setCurrentStartDate(next);
  };

  // Filter crew list
  const filteredCrew = crewList.filter(crew => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        crew.name.toLowerCase().includes(q) ||
        (crew.seniority && crew.seniority.toString().includes(q)) ||
        crew.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter aircraft list
  const filteredAircraft = aircraftList.filter(ac => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ac.registration.toLowerCase().includes(q) ||
        ac.model.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const hoursTicks = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

  const timeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const getPositionAndWidth = (assignment: Assignment) => {
    const startStr = assignment.start || assignment.actualStart || '00:00';
    const endStr = assignment.end || assignment.actualEnd || '24:00';

    const startMinutes = timeToMinutes(startStr);
    let endMinutes = timeToMinutes(endStr);

    if (endMinutes <= startMinutes && endStr !== '00:00') {
      endMinutes += 24 * 60; // Next day wrap
    } else if (endStr === '24:00' || endStr === '00:00') {
      endMinutes = 24 * 60;
    }

    const durationMinutes = Math.max(15, endMinutes - startMinutes);
    const leftPercent = (startMinutes / 1440) * 100;
    const widthPercent = (durationMinutes / 1440) * 100;

    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.min(100 - leftPercent, widthPercent)}%`
    };
  };

  const getActivityStyle = (type: string, code?: string) => {
    const key = code || type;
    return ACTIVITY_COLORS[key] || ACTIVITY_COLORS[type] || 'bg-slate-700 border-slate-500 text-slate-100';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 text-blue-400 p-2 rounded-lg border border-blue-500/30">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Linha do Tempo Detalhada (2 Dias)
              <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-700/50 font-mono">
                {viewMode === 'CREW' ? 'Visão por Tripulação' : 'Visão por Aeronaves'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Exibindo programações de <strong>{currentStartDate.getDate()} {monthNames[currentStartDate.getMonth()]} ({weekDaysShort[currentStartDate.getDay()]})</strong> e <strong>{nextDate.getDate()} {monthNames[nextDate.getMonth()]} ({weekDaysShort[nextDate.getDay()]})</strong>
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-3">
          {/* Day Navigator */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 gap-1">
            <button 
              onClick={handlePrevDay} 
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Dia Anterior"
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>
            <div className="px-3 text-xs font-bold font-mono text-blue-400 border-x border-slate-800">
              {currentStartDate.getDate()} {monthNames[currentStartDate.getMonth()]} → {nextDate.getDate()} {monthNames[nextDate.getMonth()]}
            </div>
            <button 
              onClick={handleNextDay} 
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Próximo Dia"
            >
              <span>Próximo</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
            <input 
              type="text"
              placeholder={viewMode === 'CREW' ? "Filtrar tripulante..." : "Filtrar aeronave..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 w-48 font-mono"
            />
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
            title="Fechar Visualização 2 Dias"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* MAIN TIMELINE GRID AREA */}
      <div className="flex-1 overflow-auto relative bg-slate-950 custom-scrollbar">
        
        {/* TIMELINE RULER HEADER */}
        <div className="sticky top-0 z-40 flex bg-slate-900 border-b border-slate-800 shrink-0 shadow-lg">
          {/* Left Sticky Title Cell */}
          <div className="sticky left-0 z-50 w-[296px] bg-slate-900 border-r border-slate-800 p-2.5 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
              {viewMode === 'CREW' ? `TRIPULAÇÃO (${filteredCrew.length})` : `AERONAVES (${filteredAircraft.length})`}
            </span>
          </div>

          {/* 2 DAYS TIMELINE RULERS */}
          <div className="flex flex-1">
            
            {/* DAY 1 COLUMN RULER */}
            <div className="flex-1 border-r-2 border-blue-500/40 bg-slate-900/90 flex flex-col">
              <div className="py-1 px-3 text-center text-xs font-bold font-mono text-blue-400 bg-blue-950/40 border-b border-slate-800 flex items-center justify-center gap-2">
                <span>{currentStartDate.getDate()} {monthNames[currentStartDate.getMonth()]} {currentStartDate.getFullYear()}</span>
                <span className="text-[10px] text-blue-300 font-semibold bg-blue-900/60 px-1.5 py-0.2 rounded">
                  {weekDays[currentStartDate.getDay()]}
                </span>
              </div>
              <div className="flex justify-between px-1 py-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/60">
                {hoursTicks.map((tick, i) => (
                  <span key={i} className="w-8 text-center">{tick}</span>
                ))}
              </div>
            </div>

            {/* DAY 2 COLUMN RULER */}
            <div className="flex-1 bg-slate-900/90 flex flex-col">
              <div className="py-1 px-3 text-center text-xs font-bold font-mono text-indigo-400 bg-indigo-950/40 border-b border-slate-800 flex items-center justify-center gap-2">
                <span>{nextDate.getDate()} {monthNames[nextDate.getMonth()]} {nextDate.getFullYear()}</span>
                <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-900/60 px-1.5 py-0.2 rounded">
                  {weekDays[nextDate.getDay()]}
                </span>
              </div>
              <div className="flex justify-between px-1 py-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/60">
                {hoursTicks.map((tick, i) => (
                  <span key={i} className="w-8 text-center">{tick}</span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* TIMELINE ROWS CONTAINER */}
        <div className="flex flex-col">
          {viewMode === 'CREW' ? (
            filteredCrew.map((crew, idx) => {
              const crewSchedule = schedule[crew.id] || {};
              const day1Assignments: Assignment[] = crewSchedule[day1Key] || [];
              const day2Assignments: Assignment[] = crewSchedule[day2Key] || [];
              const hasVacation = (Object.values(crewSchedule).flat() as Assignment[]).some(a => a.type === 'VAC');

              return (
                <div 
                  key={crew.id} 
                  className="flex border-b border-slate-800/70 hover:bg-slate-900/60 transition-colors min-h-[66px] relative group"
                >
                  {/* Sticky Left Crew Card */}
                  <div className="sticky left-0 z-30 border-r border-slate-800 bg-slate-950 shrink-0">
                    <CrewInfo 
                      crew={crew}
                      index={idx}
                      isCoordinationMode={false}
                      onToggleStatus={onToggleCrewStatus}
                      onUpdateTag={onUpdateCrewTag}
                      onToggleFatigue={onToggleFatigue}
                      onNameClick={onNameClick}
                      hasVacation={hasVacation}
                    />
                  </div>

                  {/* 2 DAYS TIMELINE TRACKS */}
                  <div className="flex flex-1 relative">
                    
                    {/* DAY 1 TIMELINE TRACK */}
                    <div 
                      className="flex-1 relative h-full border-r-2 border-blue-500/40 bg-slate-950/40 hover:bg-slate-900/30 transition-colors min-h-[66px]"
                      onDoubleClick={() => onAdd(crew.id, currentStartDate)}
                    >
                      {/* Grid Lines for 2-hour intervals */}
                      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                        {hoursTicks.map((_, i) => (
                          <div key={i} className="border-r border-slate-700 h-full w-full" />
                        ))}
                      </div>

                      {/* Day 1 Assignments */}
                      {day1Assignments.map((ass) => {
                        const styleClass = getActivityStyle(ass.type, ass.code);
                        const pos = getPositionAndWidth(ass);
                        const isFlight = ass.type === 'VOO' || !!ass.route;

                        return (
                          <div
                            key={ass.id}
                            onClick={() => onEdit(ass, crew.id, currentStartDate)}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredAssignment({
                                assignment: ass,
                                targetId: crew.id,
                                date: currentStartDate,
                                x: rect.left,
                                y: rect.bottom
                              });
                            }}
                            onMouseLeave={() => setHoveredAssignment(null)}
                            className={`
                              absolute top-2 bottom-2 rounded-md p-1.5 flex flex-col justify-center cursor-pointer shadow-md transition-all
                              border hover:scale-[1.02] hover:z-20 overflow-hidden text-white
                              ${styleClass}
                            `}
                            style={{ left: pos.left, width: pos.width }}
                          >
                            {isFlight ? (
                              <div className="flex flex-col justify-center leading-tight">
                                <div className="text-[11px] font-extrabold flex items-center gap-1 truncate">
                                  <span>{ass.route || 'VOO'}</span>
                                  <span className="opacity-80 text-[10px] font-normal">| {ass.code || ass.type}</span>
                                </div>
                                <div className="text-[10px] font-mono opacity-90 mt-0.5">
                                  {ass.start || '00:00'} - {ass.end || '24:00'}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1 leading-none">
                                <span className="font-black text-[11px] tracking-tight uppercase truncate">
                                  {ass.code || ass.details || ass.type}
                                </span>
                                <span className="text-[10px] font-mono opacity-90 shrink-0 font-semibold">
                                  {ass.start || '00:00'} - {ass.end || '24:00'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* DAY 2 TIMELINE TRACK */}
                    <div 
                      className="flex-1 relative h-full bg-slate-950/20 hover:bg-slate-900/30 transition-colors min-h-[66px]"
                      onDoubleClick={() => onAdd(crew.id, nextDate)}
                    >
                      {/* Grid Lines for 2-hour intervals */}
                      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                        {hoursTicks.map((_, i) => (
                          <div key={i} className="border-r border-slate-700 h-full w-full" />
                        ))}
                      </div>

                      {/* Day 2 Assignments */}
                      {day2Assignments.map((ass) => {
                        const styleClass = getActivityStyle(ass.type, ass.code);
                        const pos = getPositionAndWidth(ass);
                        const isFlight = ass.type === 'VOO' || !!ass.route;

                        return (
                          <div
                            key={ass.id}
                            onClick={() => onEdit(ass, crew.id, nextDate)}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredAssignment({
                                assignment: ass,
                                targetId: crew.id,
                                date: nextDate,
                                x: rect.left,
                                y: rect.bottom
                              });
                            }}
                            onMouseLeave={() => setHoveredAssignment(null)}
                            className={`
                              absolute top-2 bottom-2 rounded-md p-1.5 flex flex-col justify-center cursor-pointer shadow-md transition-all
                              border hover:scale-[1.02] hover:z-20 overflow-hidden text-white
                              ${styleClass}
                            `}
                            style={{ left: pos.left, width: pos.width }}
                          >
                            {isFlight ? (
                              <div className="flex flex-col justify-center leading-tight">
                                <div className="text-[11px] font-extrabold flex items-center gap-1 truncate">
                                  <span>{ass.route || 'VOO'}</span>
                                  <span className="opacity-80 text-[10px] font-normal">| {ass.code || ass.type}</span>
                                </div>
                                <div className="text-[10px] font-mono opacity-90 mt-0.5">
                                  {ass.start || '00:00'} - {ass.end || '24:00'}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1 leading-none">
                                <span className="font-black text-[11px] tracking-tight uppercase truncate">
                                  {ass.code || ass.details || ass.type}
                                </span>
                                <span className="text-[10px] font-mono opacity-90 shrink-0 font-semibold">
                                  {ass.start || '00:00'} - {ass.end || '24:00'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            filteredAircraft.map((aircraft) => {
              const aircraftSchedule = schedule[aircraft.id] || {};
              const day1Assignments: Assignment[] = aircraftSchedule[day1Key] || [];
              const day2Assignments: Assignment[] = aircraftSchedule[day2Key] || [];

              return (
                <div 
                  key={aircraft.id} 
                  className="flex border-b border-slate-800/70 hover:bg-slate-900/60 transition-colors min-h-[101px] relative group"
                >
                  {/* Sticky Left Aircraft Card */}
                  <div className="sticky left-0 z-30 border-r border-slate-800 bg-slate-950 shrink-0">
                    <AircraftInfo 
                      aircraft={aircraft}
                      onToggleApu={onToggleAircraftApu}
                    />
                  </div>

                  {/* 2 DAYS TIMELINE TRACKS */}
                  <div className="flex flex-1 relative">
                    
                    {/* DAY 1 TIMELINE TRACK */}
                    <div 
                      className="flex-1 relative h-full border-r-2 border-blue-500/40 bg-slate-950/40 hover:bg-slate-900/30 transition-colors"
                      onDoubleClick={() => onAdd(aircraft.id, currentStartDate)}
                    >
                      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                        {hoursTicks.map((_, i) => (
                          <div key={i} className="border-r border-slate-700 h-full w-full" />
                        ))}
                      </div>

                      {day1Assignments.map((ass) => {
                        const styleClass = getActivityStyle(ass.type, ass.code);
                        const pos = getPositionAndWidth(ass);

                        return (
                          <div
                            key={ass.id}
                            onClick={() => onEdit(ass, aircraft.id, currentStartDate)}
                            className={`
                              absolute top-2 bottom-2 rounded-md p-2 flex flex-col justify-center cursor-pointer shadow-md transition-all
                              border hover:scale-[1.02] hover:z-20 overflow-hidden text-white
                              ${styleClass}
                            `}
                            style={{ left: pos.left, width: pos.width }}
                          >
                            <div className="text-[11px] font-extrabold flex items-center gap-1 truncate">
                              <span>{ass.route || 'ROTA'}</span>
                              <span className="opacity-80 text-[10px]">| Voo {ass.code || ass.type}</span>
                            </div>
                            <div className="text-[10px] font-mono opacity-90 mt-0.5">
                              {ass.start || '00:00'} - {ass.end || '24:00'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DAY 2 TIMELINE TRACK */}
                    <div 
                      className="flex-1 relative h-full bg-slate-950/20 hover:bg-slate-900/30 transition-colors"
                      onDoubleClick={() => onAdd(aircraft.id, nextDate)}
                    >
                      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                        {hoursTicks.map((_, i) => (
                          <div key={i} className="border-r border-slate-700 h-full w-full" />
                        ))}
                      </div>

                      {day2Assignments.map((ass) => {
                        const styleClass = getActivityStyle(ass.type, ass.code);
                        const pos = getPositionAndWidth(ass);

                        return (
                          <div
                            key={ass.id}
                            onClick={() => onEdit(ass, aircraft.id, nextDate)}
                            className={`
                              absolute top-2 bottom-2 rounded-md p-2 flex flex-col justify-center cursor-pointer shadow-md transition-all
                              border hover:scale-[1.02] hover:z-20 overflow-hidden text-white
                              ${styleClass}
                            `}
                            style={{ left: pos.left, width: pos.width }}
                          >
                            <div className="text-[11px] font-extrabold flex items-center gap-1 truncate">
                              <span>{ass.route || 'ROTA'}</span>
                              <span className="opacity-80 text-[10px]">| Voo {ass.code || ass.type}</span>
                            </div>
                            <div className="text-[10px] font-mono opacity-90 mt-0.5">
                              {ass.start || '00:00'} - {ass.end || '24:00'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* HOVER TOOLTIP OVERLAY */}
      {hoveredAssignment && (
        <div 
          className="fixed z-50 bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-2xl text-xs max-w-xs pointer-events-none"
          style={{ top: hoveredAssignment.y + 10, left: Math.min(hoveredAssignment.x, window.innerWidth - 260) }}
        >
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1 flex justify-between items-center">
            <span>{hoveredAssignment.assignment.code || hoveredAssignment.assignment.type}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {hoveredAssignment.assignment.start || '00:00'} - {hoveredAssignment.assignment.end || '24:00'}
            </span>
          </div>
          
          {hoveredAssignment.assignment.route && (
            <div className="text-blue-400 font-semibold mb-0.5">
              Rota: {hoveredAssignment.assignment.route}
            </div>
          )}

          {hoveredAssignment.assignment.details && (
            <div className="text-slate-400 text-[11px] italic mb-1">
              {hoveredAssignment.assignment.details}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default TwoDayTimelineModal;


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CrewMember, ScheduleMap, ActivityDefinition } from '../types';
import FatigueChart from './FatigueChart';
import FatigueSettingsModal, { FatigueSettings } from './FatigueSettingsModal';
import { User, Activity, AlertCircle, ChevronLeft, ChevronRight, MousePointer2, Settings, Zap } from 'lucide-react';

interface FatigueModuleProps {
  crewList: CrewMember[];
  schedule: ScheduleMap;
  startDate: Date;
  selectedCrewId: string | null;
  onSelectCrew: (id: string) => void;
  activities?: ActivityDefinition[];
}

const FatigueModule: React.FC<FatigueModuleProps> = ({ crewList, schedule, startDate: propStartDate, selectedCrewId, onSelectCrew, activities }) => {
  // Main View State
  const [viewRange, setViewRange] = useState<'12h' | '1d' | '3d' | '7d' | '10d'>('3d');
  const [currentDate, setCurrentDate] = useState(propStartDate);
  const [isDragging, setIsDragging] = useState(false);
  const navigatorRef = useRef<HTMLDivElement>(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [fatigueSettings, setFatigueSettings] = useState<FatigueSettings>({
      sleepEstimation: 'AUTO',
      timeMode: 'LOCAL',
      timezone: 'Z-3'
  });

  // Sync on month change from sidebar
  useEffect(() => {
      if (Math.abs(propStartDate.getTime() - currentDate.getTime()) > 1000 * 60 * 60 * 24 * 5) {
          setCurrentDate(propStartDate);
      }
  }, [propStartDate]);

  // Auto-select crew member if none is selected
  useEffect(() => {
      if (!selectedCrewId && crewList.length > 0) {
          // Find the crew member with the highest fatigue score, or fallback to the first one
          const crewWithHighestFatigue = [...crewList].sort((a, b) => (b.maxFatigueScore || 0) - (a.maxFatigueScore || 0))[0];
          onSelectCrew(crewWithHighestFatigue.id);
      }
  }, [selectedCrewId, crewList, onSelectCrew]);

  const selectedCrew = crewList.find(c => c.id === selectedCrewId);
  
  // Parse Admission Date
  const admissionDate = useMemo(() => {
      if (!selectedCrew?.admissionDate) return undefined;
      const [y, m, d] = selectedCrew.admissionDate.split('-').map(Number);
      return new Date(y, m - 1, d);
  }, [selectedCrew]);

  // Mapping options to hours
  const rangeOptions = [
      { label: '12h', value: '12h', hours: 12 },
      { label: '1d', value: '1d', hours: 24 },
      { label: '3d', value: '3d', hours: 72 },
      { label: '7d', value: '7d', hours: 168 },
      { label: '10d', value: '10d', hours: 240 },
  ];

  const currentHours = rangeOptions.find(r => r.value === viewRange)?.hours || 72;

  // Navigator State - Fixed Month Window
  const navStart = useMemo(() => {
      const d = new Date(currentDate);
      d.setDate(1); // Start of month
      d.setHours(0,0,0,0);
      return d;
  }, [currentDate.getMonth(), currentDate.getFullYear()]); 

  const navDays = 32; 
  const navHoursTotal = navDays * 24;

  // Calculate brush position relative to fixed NavStart
  const offsetHours = (currentDate.getTime() - navStart.getTime()) / (1000 * 60 * 60);
  const brushStartPercent = Math.max(0, Math.min(1, offsetHours / navHoursTotal));
  const brushWidthPercent = Math.max(0.01, Math.min(1, currentHours / navHoursTotal));

  const handlePrev = () => {
      const d = new Date(currentDate);
      d.setTime(d.getTime() - (currentHours * 3600000 * 0.5)); 
      setCurrentDate(d);
  };

  const handleNext = () => {
      const d = new Date(currentDate);
      d.setTime(d.getTime() + (currentHours * 3600000 * 0.5)); 
      setCurrentDate(d);
  };

  // --- DRAG LOGIC ---
  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      updateFromMouse(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          updateFromMouse(e.clientX);
      }
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const updateFromMouse = (clientX: number) => {
      if (!navigatorRef.current) return;
      const rect = navigatorRef.current.getBoundingClientRect();
      
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const ratio = x / rect.width;
      
      const targetTime = navStart.getTime() + (ratio * navHoursTotal * 3600000);
      const centeredTime = targetTime - (currentHours * 3600000 / 2);
      
      setCurrentDate(new Date(centeredTime));
  };

  // Flatten assignments for the chart
  const getCrewAssignments = () => {
      if (!selectedCrewId || !schedule[selectedCrewId]) return [];
      const flat = [];
      const keys = Object.keys(schedule[selectedCrewId]).sort();
      for (const key of keys) {
          // Inject dateKey as _date for reliable parsing in FatigueChart regardless of ID format
          const dayAssigns = schedule[selectedCrewId][key].map(a => ({ ...a, _date: key }));
          flat.push(...dayAssigns);
      }
      return flat;
  };

  const crewAssignments = getCrewAssignments();

  // Helper for color class based on score
  const getScoreColorClass = (score: number) => {
      if (score > 11) return 'text-red-500 font-black animate-pulse';
      if (score >= 8) return 'text-orange-400 font-bold';
      if (score >= 4) return 'text-yellow-400 font-bold';
      return 'text-emerald-400 font-bold';
  };

  return (
    <div 
        className="flex h-full bg-slate-50 dark:bg-slate-950 text-slate-200"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      
      {/* Sidebar: Crew List */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
         <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <User size={14} /> Tripulação
            </h3>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {crewList.map(crew => (
                <div 
                    key={crew.id}
                    onClick={() => onSelectCrew(crew.id)}
                    className={`px-4 py-3 border-b border-slate-200 dark:border-slate-800 cursor-pointer transition-colors hover:bg-slate-100 dark:bg-slate-800 flex items-center justify-between ${selectedCrewId === crew.id ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                >
                    <div className="flex flex-col">
                        <span className={`text-[15px] font-bold uppercase ${selectedCrewId === crew.id ? 'text-black dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{crew.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-slate-600 font-mono font-bold">{crew.role} • {crew.id}</span>
                        </div>
                    </div>
                    {/* Fatigue Score Display */}
                    <div className={`flex items-center gap-1 text-[15px] ${getScoreColorClass(crew.maxFatigueScore || 0)}`}>
                        <Zap size={12} className="fill-current" />
                        <span>{crew.maxFatigueScore || 0}</span>
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
         
         {/* Top Toolbar (Simplified) */}
         <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
             <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                     <div className="bg-yellow-500/10 p-1.5 rounded-lg border border-yellow-500/20">
                        <Activity size={18} className="text-yellow-500" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-tight leading-none">Fadiga</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Biomatemática</span>
                     </div>
                 </div>
                 {selectedCrew && (
                     <div className="h-8 w-px bg-slate-100 dark:bg-slate-800"></div>
                 )}
                 {selectedCrew && (
                     <div className="flex items-center gap-2">
                         <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">ANÁLISE:</span>
                         <span className="text-sm text-slate-900 dark:text-white font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded border border-slate-300 dark:border-slate-700">{selectedCrew.name}</span>
                     </div>
                 )}
             </div>
         </div>

         {/* Chart Area */}
         <div className="flex-1 p-6 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 gap-4">
             {selectedCrew ? (
                 <>
                    {/* DETAIL CHART (Top) */}
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner p-1 relative flex flex-col overflow-hidden transition-all duration-300">
                        <FatigueChart 
                            assignments={crewAssignments as any} 
                            startDate={currentDate} 
                            hoursToShow={currentHours} 
                            height={400} 
                            admissionDate={admissionDate}
                            activities={activities}
                        />
                    </div>

                    {/* CONTROL BAR (Moved Down) */}
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl">
                        {/* LEGEND - UPDATED COLORS: VOO=GRAY, JORNADA=BLUE */}
                        <div className="flex items-center gap-3 px-2">
                            <div className="flex items-center gap-1.5 text-[15px] font-bold text-slate-600 dark:text-slate-400">
                                <div className="w-2 h-2 bg-slate-500 rounded-sm"></div> VOO
                            </div>
                            <div className="flex items-center gap-1.5 text-[15px] font-bold text-slate-600 dark:text-slate-400">
                                <div className="w-2 h-2 bg-blue-500 rounded-sm"></div> JORNADA
                            </div>
                            <div className="flex items-center gap-1.5 text-[15px] font-bold text-slate-600 dark:text-slate-400">
                                <div className="w-2 h-2 bg-green-400 rounded-sm"></div> SLEEP
                            </div>
                            <div className="flex items-center gap-1.5 text-[15px] font-bold text-slate-600 dark:text-slate-400">
                                <div className="w-4 h-0.5 bg-yellow-500 rounded-full"></div> FADIGA (KSS)
                            </div>
                        </div>

                        {/* NAVIGATION */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm">
                             <button onClick={handlePrev} className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-700 rounded transition-colors">
                                <ChevronLeft size={16} />
                             </button>
                             <span className="text-xs font-mono font-bold text-slate-200 px-3 min-w-[120px] text-center border-x border-slate-300 dark:border-slate-700/50">
                                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', day: 'numeric' })}
                             </span>
                             <button onClick={handleNext} className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-700 rounded transition-colors">
                                <ChevronRight size={16} />
                             </button>
                        </div>

                        {/* RIGHT ACTIONS */}
                        <div className="flex items-center gap-2">
                             {/* Ranges */}
                             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-300 dark:border-slate-700 shadow-sm">
                                 {rangeOptions.map((opt) => (
                                     <button 
                                        key={opt.value}
                                        onClick={() => setViewRange(opt.value as any)}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded-[4px] transition-all duration-300 ease-in-out ${viewRange === opt.value ? 'bg-blue-600 text-slate-900 dark:text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-700'}`}
                                     >
                                        {opt.label}
                                     </button>
                                 ))}
                             </div>

                             {/* Settings Button */}
                             <button 
                                onClick={() => setShowSettings(true)}
                                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors shadow-sm"
                                title="Configurações de Fadiga"
                             >
                                <Settings size={16} />
                             </button>
                        </div>
                    </div>

                    {/* NAVIGATOR MAP (Bottom) - HEIGHT 116px */}
                    <div 
                        ref={navigatorRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        className={`h-[116px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner p-1 relative overflow-hidden shrink-0 cursor-ew-resize group transition-all duration-200 ${isDragging ? 'ring-2 ring-blue-500/50' : 'hover:border-slate-600'}`}
                    >
                        <div className="absolute inset-0 pointer-events-none">
                            <FatigueChart 
                                assignments={crewAssignments as any} 
                                startDate={navStart} 
                                hoursToShow={navHoursTotal} 
                                height={110}
                                hideLabels={true}
                                showBrush={{ startPercent: brushStartPercent, widthPercent: brushWidthPercent }}
                                admissionDate={admissionDate}
                                activities={activities}
                            />
                        </div>
                        <div className="absolute top-2 left-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/80 px-2 py-0.5 rounded pointer-events-none flex items-center gap-1">
                            <span>Mapa Mensal ({navStart.toLocaleDateString('pt-BR', { month: 'short' })})</span>
                            <MousePointer2 size={10} className="opacity-50" />
                        </div>
                    </div>
                 </>
             ) : (
                 <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-4">
                     <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-200 dark:border-slate-800">
                        <Activity size={40} className="opacity-50" />
                     </div>
                     <span className="text-sm font-medium">Selecione um tripulante para visualizar a análise.</span>
                 </div>
             )}
         </div>
      </div>

      <FatigueSettingsModal 
         isOpen={showSettings} 
         onClose={() => setShowSettings(false)}
         settings={fatigueSettings}
         onUpdateSettings={setFatigueSettings}
      />

    </div>
  );
};

export default FatigueModule;


import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Trash2, Zap, CheckCircle2, GripVertical, Plane, XCircle, ShieldAlert, FileSignature, Clock, BookOpen, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Minus, X, Save, Download, Upload, Database, Star, Loader2, Edit3, Repeat, Settings, Network, Sun, Moon, Users } from 'lucide-react';
import { MONTHS, ACTIVITY_COLORS } from '../constants';
import { Flight, RegulatoryConfig, ScheduleMetadata, AssignmentType, CustomBlock, ActivityDefinition, GenerationParams } from '../types';
import EditFlightModal from './EditFlightModal';
import { SystemModule } from '../App';

interface SidebarProps {
  currentYear: number;
  currentMonth: number;
  flights: Flight[];
  customBlocks: CustomBlock[];
  activities: ActivityDefinition[]; 
  regulatoryConfig: RegulatoryConfig;
  scheduleMetadata: ScheduleMetadata;
  collapsed: boolean;
  isGenerating: boolean;
  activeModule?: SystemModule;
  onToggleCollapse: () => void;
  onMonthChange: (monthIndex: number) => void;
  onYearChange: (year: number) => void;
  onGenerate: () => void;
  onClear: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGoToToday?: () => void;
  onToggleFlight: (code: string) => void;
  onToggleFlightDay: (code: string, dayIndex: number) => void;
  onUpdateFlight?: (originalCode: string, updatedFlight: Flight) => void;
  onToggleRegConfig: (key: keyof RegulatoryConfig) => void;
  onUpdateMetadata: (key: keyof ScheduleMetadata, value: any) => void;
  onUpdateRbacAppendix: (val: 'A' | 'B_PLUS') => void;
  onAddFlight: (flight: Flight) => void;
  onAddCustomBlock: (block: CustomBlock) => void;
  onDeleteCustomBlock: (id: string) => void;
  onToggleFavoriteActivity: (id: string) => void;
  generationStartDay?: number;
  onUpdateGenerationStart?: (day: number) => void;
  generationDayLimit?: number; 
  onUpdateGenerationLimit?: (day: number) => void;
  onOpenGenerationSettings?: () => void;
  onOpenFlightNetwork?: () => void;
  onAddActivity?: (activity: ActivityDefinition) => void;
  onEditActivity?: (id: string) => void; 
  // NEW: Generation Params for Quick Access
  generationParams?: GenerationParams;
  onUpdateGenerationParams?: (params: GenerationParams) => void;
  showCaptains?: boolean;
  onToggleCaptains?: () => void;
  showFirstOfficers?: boolean;
  onToggleFirstOfficers?: () => void;
  onImportCsv?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCsv?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentYear, 
  currentMonth, 
  flights,
  customBlocks,
  activities,
  regulatoryConfig,
  scheduleMetadata,
  collapsed,
  isGenerating,
  activeModule,
  onToggleCollapse,
  onMonthChange, 
  onYearChange,
  onGenerate, 
  onClear,
  onSave,
  onExport,
  onImport,
  onGoToToday,
  onToggleFlight,
  onToggleFlightDay,
  onUpdateFlight,
  onToggleRegConfig,
  onUpdateMetadata,
  onUpdateRbacAppendix,
  onAddFlight,
  onAddCustomBlock,
  onDeleteCustomBlock,
  onToggleFavoriteActivity,
  generationStartDay = 1,
  onUpdateGenerationStart,
  generationDayLimit = 31,
  onUpdateGenerationLimit,
  onOpenGenerationSettings,
  onOpenFlightNetwork,
  onAddActivity,
  onEditActivity,
  generationParams,
  onUpdateGenerationParams,
  showCaptains = true,
  onToggleCaptains,
  showFirstOfficers = true,
  onToggleFirstOfficers,
  onImportCsv,
  onExportCsv
}) => {

  const [isAddingFlight, setIsAddingFlight] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [newFlight, setNewFlight] = useState<Partial<Flight>>({
    code: '',
    route: '',
    start: '08:00',
    end: '12:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    composition: 'SIMPLES',
    serviceType: 'DOMESTICO',
    active: true
  });

  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);

  const [isAddingManual, setIsAddingManual] = useState(false);
  const [isActivitiesMinimized, setIsActivitiesMinimized] = useState(true);
  const [newManual, setNewManual] = useState({
    label: '',
    start: '08:00',
    end: '17:00',
    color: '#334155'
  });

  // Theme Toggle State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onYearChange(currentYear - 1);
      onMonthChange(11);
    } else {
      onMonthChange(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onYearChange(currentYear + 1);
      onMonthChange(0);
    } else {
      onMonthChange(currentMonth + 1);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const maxDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handleDragStart = (e: React.DragEvent, category: 'MANUAL' | 'FLIGHT' | 'CUSTOM' | 'ACTIVITY', data: any) => {
    const payload = JSON.stringify({ category, data });
    e.dataTransfer.setData('application/skyplan-data', payload);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleSaveFlight = () => {
    if (!newFlight.code || !newFlight.route || !newFlight.start || !newFlight.end) return;
    
    const flight: Flight = {
       ...newFlight as Flight,
       aircraftType: 'JATO',
       landings: 1,
       hasRestFacility: false,
       timezonesCrossed: 0
    };
    onAddFlight(flight);
    setIsAddingFlight(false);
    setNewFlight({
        code: '',
        route: '',
        start: '08:00',
        end: '12:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        composition: 'SIMPLES',
        serviceType: 'DOMESTICO',
        active: true
    });
  };

  const handleSaveManual = () => {
      if (!newManual.label || !newManual.start || !newManual.end) return;
      
      // If parent supports onAddActivity, we use that to create a full activity definition
      if (onAddActivity) {
          const newAct: ActivityDefinition = {
              id: `act-manual-${Date.now()}`,
              code: newManual.label.toUpperCase(),
              type: 'GS', // Default type for quick add
              description: 'PERSONALIZADO',
              start: newManual.start,
              end: newManual.end,
              isFavorite: true, // Automatically add to sidebar
              color: newManual.color,
              pagaDiaria: false,
              relatorio: true,
              bloqueado: false,
              descontaAlmoco: false,
              verificaRepouso: true,
              naoPagaPublicada: false,
              fadiga: false,
              horarioObrigatorio: true
          };
          onAddActivity(newAct);
      } else {
          // Fallback to old CustomBlock
          const block: CustomBlock = {
              id: `CUST-${Date.now()}`,
              label: newManual.label.toUpperCase(),
              start: newManual.start,
              end: newManual.end
          };
          onAddCustomBlock(block); 
      }
      
      setIsAddingManual(false);
      setNewManual({ label: '', start: '08:00', end: '17:00', color: '#334155' });
  };

  const handleSaveEditedFlight = (originalCode: string, updated: Flight) => {
      if (onUpdateFlight) {
          onUpdateFlight(originalCode, updated);
      }
      setEditingFlight(null);
  };

  const toggleGenParam = (key: keyof GenerationParams) => {
      if (generationParams && onUpdateGenerationParams) {
          onUpdateGenerationParams({
              ...generationParams,
              [key]: !generationParams[key]
          });
      }
  };

  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  
  const favoriteActivities = activities.filter(a => a.isFavorite);

  // Helper to determine text color based on background hex
  const getContrastColor = (hex?: string) => {
      if (!hex) return 'text-white';
      const c = hex.startsWith('#') ? hex.substring(1) : hex;
      const rgb = parseInt(c, 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >>  8) & 0xff;
      const b = (rgb >>  0) & 0xff;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; 
      return luma > 140 ? 'text-slate-900' : 'text-white';
  };

  // Helper for colors
  const getStyleForActivity = (act: ActivityDefinition) => {
      if (act.color) {
          const textColorClass = getContrastColor(act.color);
          return {
              style: { backgroundColor: act.color, borderColor: act.color },
              className: `border ${textColorClass}`
          };
      }

      // Fallback Logic
      const code = act.code;
      const type = act.type;

      if (code.toUpperCase() === 'AGD INS') {
          return { className: 'bg-slate-200 border-slate-300 text-black font-bold' };
      }

      let typeKey = type as AssignmentType;
      
      if (type === 'CURSO' || type === 'SOLO' || type === 'DIV') {
          typeKey = 'GS';
      }
      if (type === 'NPP' || type === 'INSS') {
          typeKey = 'INAT';
      }
      if (type === 'FERIAS') {
          typeKey = 'VAC';
      }
      
      if (code.toUpperCase().startsWith('ADM')) typeKey = 'GS';
      if (code.toUpperCase() === 'UPRT' || code.toUpperCase() === 'DEICE') typeKey = 'GS';
      if (code.toUpperCase().startsWith('DLS')) typeKey = 'DLS';
      if (code.toUpperCase() === 'RE' || code.toUpperCase() === 'SA') typeKey = code.toUpperCase() as AssignmentType;
      
      const tailwindClass = ACTIVITY_COLORS[typeKey] || 'bg-slate-800 border-slate-700 text-slate-300';
      return { className: tailwindClass };
  };

  const isModuleRestricted = activeModule === 'COORDENAÇÃO' || activeModule === 'PLANEJAMENTO';

  const handleDayLimitWheel = (e: React.WheelEvent) => {
      if (!onUpdateGenerationLimit) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1 : -1;
      const next = Math.max(generationStartDay, Math.min(maxDaysInMonth, generationDayLimit + delta));
      onUpdateGenerationLimit(next);
  };

  const handleDayStartWheel = (e: React.WheelEvent) => {
      if (!onUpdateGenerationStart) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1 : -1;
      const next = Math.max(1, Math.min(generationDayLimit, generationStartDay + delta));
      onUpdateGenerationStart(next);
  };

  const incrementStart = () => {
    if (onUpdateGenerationStart) {
        const next = Math.max(1, Math.min(generationDayLimit, generationStartDay + 1));
        onUpdateGenerationStart(next);
    }
  };

  const decrementStart = () => {
    if (onUpdateGenerationStart) {
        const next = Math.max(1, Math.min(generationDayLimit, generationStartDay - 1));
        onUpdateGenerationStart(next);
    }
  };

  const incrementLimit = () => {
    if (onUpdateGenerationLimit) {
        const next = Math.max(generationStartDay, Math.min(maxDaysInMonth, generationDayLimit + 1));
        onUpdateGenerationLimit(next);
    }
  };

  const decrementLimit = () => {
    if (onUpdateGenerationLimit) {
        const next = Math.max(generationStartDay, Math.min(maxDaysInMonth, generationDayLimit - 1));
        onUpdateGenerationLimit(next);
    }
  };

  return (
    <div className={`${collapsed ? 'w-24' : 'w-[338px]'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full flex-shrink-0 z-[100] shadow-xl transition-all duration-300 ease-in-out relative`}>
      
      {/* Collapse Toggle */}
      <button 
        onClick={onToggleCollapse}
        className="absolute -right-3 top-8 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-full p-0.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 shadow-md z-[110] transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand Header */}
      <div className={`h-20 flex ${collapsed ? 'flex-col justify-center items-center gap-1 px-0' : 'flex-row items-center px-6'} border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all`}>
        <div className="w-[37px] h-[37px] bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-900/50 flex-shrink-0">
          <Plane className="text-white -rotate-45" size={22} />
        </div>
        
        {collapsed ? (
           <div className="flex flex-col items-center gap-0.5 mt-1">
             <span className="text-xs font-bold text-slate-900 dark:text-white tracking-widest leading-none">SKYPLAN</span>
             <span className="px-1.5 py-0.5 text-[11px] font-black font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded uppercase tracking-wider">ADMIN</span>
           </div>
        ) : (
          <div className="ml-3 flex-1 flex items-center justify-between overflow-hidden">
            <div className="flex flex-col justify-center">
               <div className="flex items-center gap-2">
                 <h1 className="font-bold text-slate-900 dark:text-white text-xl leading-none tracking-tight">SKYPLAN</h1>
                 <span className="inline-flex items-center justify-center leading-none px-2 py-0.5 text-[12px] font-black font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 rounded-md uppercase tracking-wider shadow-sm self-center">
                   ADMIN
                 </span>
               </div>
               <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono tracking-wider font-semibold mt-0.5">OPS CONTROL</p>
            </div>
            
            <div className="flex flex-col items-end justify-center pl-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={onGoToToday} title="Ir para hoje">
               <span className="text-[14px] font-mono text-slate-600 dark:text-slate-400 font-bold leading-none">
                  {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
               </span>
               <div className="text-[12px] text-slate-400 dark:text-slate-600 font-mono text-right mt-0.5 leading-none">
                  {currentTime.toLocaleDateString('pt-BR')}
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col overflow-x-hidden">
        
        {/* Month & Year Selector + THEME TOGGLE */}
        <div className={`p-4 border-b border-slate-200 dark:border-slate-800 transition-all ${collapsed ? 'px-2 py-4 flex flex-col items-center' : ''}`}>
          {!collapsed ? (
            <>
              <div className="flex items-center justify-between mb-3 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600 dark:text-blue-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Período</span>
                </div>
                {/* Sun/Moon Toggle */}
                <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    title={isDarkMode ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
                >
                    {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                </button>
              </div>
              <div className="flex justify-between items-center mb-4 bg-slate-100 dark:bg-slate-800/80 py-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                  <button 
                    onClick={handlePrevMonth} 
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Mês Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white leading-none tracking-wider uppercase">
                    {MONTHS[currentMonth]} {String(currentYear).slice(-2)}
                  </span>
                  <button 
                    onClick={handleNextMonth} 
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Próximo Mês"
                  >
                    <ChevronRight size={16} />
                  </button>
              </div>

              <div className="flex items-center justify-between mb-3 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                    <Users size={18} className="text-blue-600 dark:text-blue-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Filtro de Tripulação</span>
                </div>
              </div>
              <div className="flex gap-2">
                  <button 
                      onClick={onToggleCaptains}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-black uppercase transition-all border-2 ${showCaptains ? 'bg-emerald-950/40 dark:bg-emerald-950/80 text-emerald-500 dark:text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-rose-950/40 dark:bg-rose-950/80 text-rose-500 dark:text-rose-400 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}
                  >
                      CMTE
                  </button>
                  <button 
                      onClick={onToggleFirstOfficers}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-black uppercase transition-all border-2 ${showFirstOfficers ? 'bg-emerald-950/40 dark:bg-emerald-950/80 text-emerald-500 dark:text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-rose-950/40 dark:bg-rose-950/80 text-rose-500 dark:text-rose-400 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}
                  >
                      COP
                  </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
               <div className="flex items-center gap-0.5">
                 <button 
                    onClick={handlePrevMonth}
                    className="w-4 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-l transition-colors"
                 >
                    <ChevronLeft size={14} />
                 </button>
                 <div className="px-1.5 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-900/40 z-10 select-none whitespace-nowrap font-mono">
                    {MONTHS[currentMonth]} {String(currentYear).slice(-2)}
                 </div>
                 <button 
                    onClick={handleNextMonth}
                    className="w-4 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-r transition-colors"
                 >
                    <ChevronRight size={14} />
                 </button>
               </div>
               <div className="flex flex-col gap-1 w-full px-1 mt-1">
                 <button
                   onClick={onToggleCaptains}
                   title="Comandante (CMTE)"
                   className={`w-full py-1 rounded text-[9px] font-mono font-black uppercase transition-all border-2 ${
                     showCaptains
                       ? 'bg-emerald-950/40 dark:bg-emerald-950/80 text-emerald-500 dark:text-emerald-400 border-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.25)]'
                       : 'bg-rose-950/40 dark:bg-rose-950/80 text-rose-500 dark:text-rose-400 border-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.25)]'
                   }`}
                 >
                   CMTE
                 </button>
                 <button
                   onClick={onToggleFirstOfficers}
                   title="Copiloto (COP)"
                   className={`w-full py-1 rounded text-[9px] font-mono font-black uppercase transition-all border-2 ${
                     showFirstOfficers
                       ? 'bg-emerald-950/40 dark:bg-emerald-950/80 text-emerald-500 dark:text-emerald-400 border-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.25)]'
                       : 'bg-rose-950/40 dark:bg-rose-950/80 text-rose-500 dark:text-rose-400 border-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.25)]'
                   }`}
                 >
                   COP
                 </button>
               </div>
            </div>
          )}
        </div>

        {/* Manual Programming / Activities (Favorites + Custom) */}
        <div className={`p-4 border-b border-slate-200 dark:border-slate-800 transition-all ${collapsed ? 'px-2' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center justify-between mb-2 text-slate-600 dark:text-slate-300">
               <button 
                  onClick={() => setIsActivitiesMinimized(!isActivitiesMinimized)}
                  className="flex items-center gap-2 text-left hover:text-slate-900 dark:hover:text-white transition-colors group cursor-pointer"
                  title={isActivitiesMinimized ? "Expandir Atividades" : "Minimizar Atividades"}
               >
                  <GripVertical size={18} className="text-emerald-500" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">ATIVIDADES</span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {favoriteActivities.length + customBlocks.length}
                  </span>
                  {isActivitiesMinimized ? <ChevronDown size={16} className="text-slate-400 group-hover:text-white transition-colors" /> : <ChevronUp size={16} className="text-slate-400 group-hover:text-white transition-colors" />}
               </button>
               <button 
                  onClick={() => { setIsActivitiesMinimized(false); setIsAddingManual(!isAddingManual); }} 
                  className="hover:text-slate-900 dark:hover:text-white transition-colors p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded" 
                  title="Nova Atividade Personalizada"
               >
                  <Plus size={14} />
               </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsActivitiesMinimized(!isActivitiesMinimized)}
              className="w-full flex justify-center text-slate-400 hover:text-white mb-2 p-1 rounded hover:bg-slate-800 transition-colors"
              title={isActivitiesMinimized ? "Expandir ATIVIDADES" : "Minimizar ATIVIDADES"}
            >
              {isActivitiesMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          )}

          {!isActivitiesMinimized && (
            <>
              {!collapsed && isAddingManual && (
                 <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 mb-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-slate-900 dark:text-white">Nova Personalizada</span>
                       <button onClick={() => setIsAddingManual(false)}><X size={14} className="text-slate-500 dark:text-slate-400" /></button>
                    </div>
                    <div className="space-y-2">
                       <input 
                          type="text" placeholder="Rótulo (Ex: CURSO, EXTRA)" 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs text-slate-900 dark:text-white uppercase"
                          value={newManual.label} onChange={e => setNewManual({...newManual, label: e.target.value.toUpperCase()})}
                       />
                       <div className="flex gap-2">
                          <input 
                             type="time" 
                             className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs text-slate-900 dark:text-white"
                             value={newManual.start} onChange={e => setNewManual({...newManual, start: e.target.value})}
                          />
                          <input 
                             type="time" 
                             className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs text-slate-900 dark:text-white"
                             value={newManual.end} onChange={e => setNewManual({...newManual, end: e.target.value})}
                          />
                       </div>
                       {/* Color Picker for Manual Add */}
                       <div className="flex items-center gap-2">
                           <label className="text-[10px] text-slate-500 dark:text-slate-400">Cor:</label>
                           <input 
                              type="color" 
                              className="w-full h-6 rounded bg-white dark:bg-slate-900 border-none cursor-pointer"
                              value={newManual.color}
                              onChange={e => setNewManual({...newManual, color: e.target.value})}
                           />
                       </div>
                       <button 
                          onClick={handleSaveManual}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 rounded"
                       >
                          CRIAR
                       </button>
                    </div>
                 </div>
              )}

              <div className={`${collapsed ? 'flex flex-col gap-2' : 'grid grid-cols-3 gap-2'}`}>
                 {favoriteActivities.map((act) => {
                   const { className, style } = getStyleForActivity(act);
                   return (
                     <div
                       key={act.id}
                       draggable
                       onDragStart={(e) => handleDragStart(e, 'ACTIVITY', act)}
                       onContextMenu={(e) => {
                           e.preventDefault();
                           if (onEditActivity) onEditActivity(act.id);
                       }}
                       className={`
                          ${className} border hover:brightness-110
                          font-mono rounded flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all shadow-sm select-none group relative
                          ${collapsed ? 'h-9 w-full' : 'h-10 gap-0.5'}
                       `}
                       style={style}
                       title={!collapsed ? "Clique direito para editar" : `${act.code} - ${act.description}`}
                     >
                        {!collapsed ? (
                            <>
                              <span className="text-[13px] font-bold leading-none truncate w-full text-center px-1 uppercase">{act.code}</span>
                              {(act.start !== '00:00' || act.end !== '00:00' && act.end !== '23:59') && (
                                  <span className="text-[12px] opacity-70 leading-none">
                                      {act.start.replace(':', '')}-{act.end.replace(':', '')}
                                  </span>
                              )}
                              <button 
                                   onClick={(e) => { e.stopPropagation(); onToggleFavoriteActivity(act.id); }}
                                   className="absolute -top-2 -right-2 bg-red-600 text-white border-2 border-white dark:border-slate-900 rounded-full p-1 hidden group-hover:flex w-5 h-5 items-center justify-center shadow-lg hover:bg-red-700 hover:scale-110 transition-all z-30"
                                   title="Remover das atividades"
                               >
                                  <X size={12} strokeWidth={3} />
                               </button>
                            </>
                        ) : (
                            <span className={collapsed ? 'text-xs font-bold uppercase' : 'font-bold uppercase'}>
                              {act.code.substring(0, 2)}
                            </span>
                        )}
      
                        {collapsed && (
                          <div className="absolute left-full top-0 ml-3 z-50 hidden group-hover:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-xl uppercase">
                            {act.code} - {act.description}
                          </div>
                        )}
                     </div>
                   );
                 })}

                 {customBlocks.map((block) => (
                    <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'CUSTOM', block)}
                        className={`
                            bg-violet-900 border-violet-700 text-violet-100 border hover:brightness-110
                            font-mono rounded flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all shadow-sm select-none group relative
                            ${collapsed ? 'h-9 w-full' : 'h-10 gap-0.5'}
                        `}
                    >
                        {!collapsed ? (
                           <>
                             <span className="text-[12px] font-bold leading-none truncate w-full text-center px-1 uppercase">{block.label}</span>
                             <button 
                                 onClick={(e) => { e.stopPropagation(); onDeleteCustomBlock(block.id); }}
                                 className="absolute -top-2 -right-2 bg-red-600 text-white border-2 border-white dark:border-slate-900 rounded-full p-1 hidden group-hover:flex w-5 h-5 items-center justify-center shadow-lg hover:bg-red-700 hover:scale-110 transition-all z-30"
                                 title="Excluir bloco"
                             >
                                <X size={12} strokeWidth={3} />
                             </button>
                           </>
                        ) : (
                            <span className="text-xs font-bold text-violet-300 uppercase">?</span>
                        )}

                        {collapsed && (
                            <div className="absolute left-full top-0 ml-3 z-50 hidden group-hover:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-xl uppercase">
                                {block.label} ({block.start}-{block.end})
                            </div>
                        )}
                    </div>
                 ))}
              </div>
            </>
          )}
        </div>

        {/* Flight Mesh */}
        <div className={`flex-1 p-4 flex flex-col ${collapsed ? 'px-2' : ''}`}>
          {!collapsed && (
            <div className="flex items-center justify-between mb-3 text-slate-600 dark:text-slate-300">
               <div className="flex items-center gap-2">
                 <CheckCircle2 size={18} className="text-purple-500" />
                 <span className="text-[10px] font-semibold uppercase tracking-wider">MALHA & FREQ.</span>
               </div>
               <button onClick={() => setIsAddingFlight(!isAddingFlight)} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Plus size={18} />
               </button>
            </div>
          )}
          
          {!collapsed && isAddingFlight && (
             <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 mb-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-slate-900 dark:text-white">Novo Voo</span>
                   <button onClick={() => setIsAddingFlight(false)}><X size={14} className="text-slate-500 dark:text-slate-400" /></button>
                </div>
                <div className="space-y-2">
                   <input 
                      type="text" placeholder="Código (ex: LV1234)" 
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs text-slate-900 dark:text-white uppercase"
                      value={newFlight.code} onChange={e => setNewFlight({...newFlight, code: e.target.value.toUpperCase()})}
                   />
                   <input 
                      type="text" placeholder="Rota (ex: VCP-GIG)" 
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs text-slate-900 dark:text-white uppercase"
                      value={newFlight.route} onChange={e => setNewFlight({...newFlight, route: e.target.value.toUpperCase()})}
                   />
                   <div className="flex gap-2">
                      <input 
                         type="time" 
                         className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs text-slate-900 dark:text-white"
                         value={newFlight.start} onChange={e => setNewFlight({...newFlight, start: e.target.value})}
                      />
                      <input 
                         type="time" 
                         className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs text-slate-900 dark:text-white"
                         value={newFlight.end} onChange={e => setNewFlight({...newFlight, end: e.target.value})}
                      />
                   </div>
                   <button 
                      onClick={handleSaveFlight}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 rounded uppercase"
                   >
                      ADICIONAR
                   </button>
                </div>
             </div>
          )}

          <div className="flex-1 space-y-3">
            {flights.map((flight) => (
              <div 
                key={flight.code} 
                draggable
                onDragStart={(e) => handleDragStart(e, 'FLIGHT', flight)}
                className={`
                  border rounded flex flex-col transition-all duration-200 cursor-grab active:cursor-grabbing group relative select-none
                  ${flight.active 
                    ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-500/50' 
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'}
                  ${collapsed ? 'items-center p-2' : ''}
                `}
                onClick={() => setEditingFlight(flight)}
                title="Clique para editar detalhes"
              >
                <div 
                  className={`${collapsed ? 'w-full flex justify-center' : 'p-3 hover:bg-slate-200 dark:hover:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700/50 rounded-t'}`}
                >
                  {collapsed ? (
                    <div className="flex flex-col items-center justify-center gap-0.5">
                       <Plane size={24} className={`${flight.active ? 'text-blue-400' : 'text-slate-600'} mb-0.5`} />
                       <span className="text-[10px] font-mono font-bold text-slate-400 tracking-tighter leading-none uppercase">
                          {flight.route.replace('-', '>')}
                       </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                       <span className={`font-bold text-[11px] font-mono tracking-tight flex items-center gap-1.5 ${flight.active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'} uppercase`}>
                          <span>{flight.code}</span> 
                          <span className="text-slate-400 dark:text-slate-600 font-light">|</span> 
                          <span>{flight.route.replace('-', '>')}</span>
                          <span className="text-slate-600 font-light">|</span>
                          <span className="text-slate-600 dark:text-slate-400 text-sm font-bold bg-slate-200/50 dark:bg-slate-900/50 px-1 rounded">{flight.start.replace(':','')} - {flight.end.replace(':','')}</span>
                       </span>
                       <button 
                          onClick={(e) => { e.stopPropagation(); onToggleFlight(flight.code); }}
                          className="focus:outline-none hover:scale-110 transition-transform p-1 rounded hover:bg-slate-300/50 dark:hover:bg-slate-700/50"
                          title={flight.active ? "Desativar" : "Ativar"}
                       >
                          {flight.active ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-600" />}
                       </button>
                    </div>
                  )}
                </div>

                {!collapsed && (
                  <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 grid grid-cols-7 gap-1 rounded-b">
                     {dayLabels.map((label, index) => {
                       const isDayActive = flight.daysOfWeek.includes(index);
                       return (
                         <button
                           key={index}
                           onClick={(e) => { e.stopPropagation(); onToggleFlightDay(flight.code, index); }}
                           disabled={!flight.active}
                           className={`text-[9px] font-bold py-1.5 rounded transition-colors uppercase ${!flight.active ? 'cursor-not-allowed opacity-30 text-slate-600 bg-slate-800' : isDayActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'}`}
                         >
                           {label}
                         </button>
                       );
                     })}
                  </div>
                )}
                {collapsed && (
                  <div className="absolute left-full top-0 ml-3 z-50 hidden group-hover:block bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white p-2 rounded shadow-xl w-48 uppercase">
                    <div className="font-bold text-sm text-blue-600 dark:text-blue-400 mb-1">{flight.code}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-mono mb-1">{flight.route}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">{flight.start} - {flight.end}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold">
                       {flight.active ? 'ATIVO' : 'INATIVO'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions (Compact in collapsed) */}
      <div className={`p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3 ${collapsed ? 'px-2' : ''} z-50 relative`}>
        
        {!collapsed && (
            <div className="flex flex-col gap-2 mb-1">
                {/* CONFIG & TRILHOS */}
                <div className="grid grid-cols-2 gap-2">
                    {onOpenGenerationSettings && (
                        <button 
                            onClick={onOpenGenerationSettings}
                            className="flex flex-col items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[9px] font-black uppercase py-2 rounded border border-slate-700 transition-all active:scale-95"
                        >
                            <Settings size={14} /> <span>Configurar</span>
                        </button>
                    )}
                    {onOpenFlightNetwork && (
                        <button 
                            onClick={onOpenFlightNetwork}
                            className="flex flex-col items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[9px] font-black uppercase py-2 rounded border border-slate-700 transition-all active:scale-95"
                        >
                            <Network size={14} /> <span>Gerar Trilhos</span>
                        </button>
                    )}
                </div>

                {/* NEW: QUICK ACCESS TOGGLES FOR RE/SA */}
                {generationParams && onUpdateGenerationParams && (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => toggleGenParam('generateRE')}
                            className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${generationParams.generateRE ? 'bg-emerald-900/60 text-emerald-400 border-emerald-800/50 hover:bg-emerald-800/80' : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700 hover:text-slate-300'}`}
                            title="Gerar Reserva (Automático)"
                        >
                            RE: {generationParams.generateRE ? 'ON' : 'OFF'}
                        </button>
                        <button 
                            onClick={() => toggleGenParam('generateSA')}
                            className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${generationParams.generateSA ? 'bg-emerald-900/60 text-emerald-400 border-emerald-800/50 hover:bg-emerald-800/80' : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700 hover:text-slate-300'}`}
                            title="Gerar Sobreaviso (Automático)"
                        >
                            SA: {generationParams.generateSA ? 'ON' : 'OFF'}
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* --- SECTION: GENERATE ESCALA --- */}
        <div className="flex flex-col gap-2">
           <div className="flex gap-2 items-stretch h-[54px]">
              <button 
                onClick={(e) => { e.preventDefault(); onGenerate(); }}
                disabled={isGenerating || isModuleRestricted}
                className={`w-[120px] shrink-0 ${isGenerating || isModuleRestricted ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-[#00A86B] hover:bg-[#00925c] text-white border-2 border-white'} font-black ${!collapsed ? 'rounded-xl' : 'rounded'} flex items-center justify-center transition-all shadow-[0_0_15px_rgba(0,168,107,0.3)] active:scale-95 ${collapsed ? 'h-full p-0' : 'px-2 gap-1.5 text-[10px] uppercase leading-tight'}`}
                title={isModuleRestricted ? "Disponível apenas no módulo Escala" : "Gerar Escala"}
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} className="fill-current" />}
                {!collapsed && (isGenerating ? 'Processando' : 'Gerar Escala')}
              </button>
              
              {!collapsed && onUpdateGenerationLimit && onUpdateGenerationStart && (
                  <div className="flex-1 flex gap-2">
                      {/* START DAY SELECTOR */}
                      <div 
                         onWheel={handleDayStartWheel}
                         className="flex-1 flex flex-col items-center justify-center bg-slate-800 rounded-xl border-2 border-slate-700 overflow-hidden group shadow-inner relative" 
                         title="Roda do mouse ou botões: Dia de INÍCIO"
                      >
                          <button onClick={incrementStart} className="w-full h-1/4 flex items-center justify-center hover:bg-emerald-500/20 text-slate-600 hover:text-emerald-400 transition-all">
                            <ChevronUp size={12} strokeWidth={4} />
                          </button>
                          <span className="text-slate-400 text-xl font-black font-mono group-hover:text-emerald-400 transition-colors my-auto">{generationStartDay}</span>
                          <button onClick={decrementStart} className="w-full h-1/4 flex items-center justify-center hover:bg-emerald-500/20 text-slate-600 hover:text-emerald-400 transition-all">
                            <ChevronDown size={12} strokeWidth={4} />
                          </button>
                      </div>

                      {/* LIMIT DAY SELECTOR */}
                      <div 
                         onWheel={handleDayLimitWheel}
                         className="flex-1 flex flex-col items-center justify-center bg-slate-800 rounded-xl border-2 border-slate-700 overflow-hidden group shadow-inner relative" 
                         title="Roda do mouse ou botões: Dia LIMITE"
                      >
                          <button onClick={incrementLimit} className="w-full h-1/4 flex items-center justify-center hover:bg-blue-500/20 text-slate-600 hover:text-blue-400 transition-all">
                            <ChevronUp size={12} strokeWidth={4} />
                          </button>
                          <span className="text-white text-xl font-black font-mono group-hover:text-blue-400 transition-colors my-auto">{generationDayLimit}</span>
                          <button onClick={decrementLimit} className="w-full h-1/4 flex items-center justify-center hover:bg-blue-500/20 text-slate-600 hover:text-blue-400 transition-all">
                            <ChevronDown size={12} strokeWidth={4} />
                          </button>
                      </div>
                  </div>
              )}
           </div>
           {!collapsed && (
              <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] text-center border-t border-slate-800/50 pt-1.5">
                 Processar: Dia {generationStartDay} até {generationDayLimit}
              </div>
           )}
        </div>

        <div className="flex gap-2 pt-1 border-t border-slate-800">
            <button 
              onClick={onExport}
              className={`flex-1 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white border border-slate-700 font-bold rounded-lg flex items-center justify-center transition-all active:scale-95 ${collapsed ? 'h-10 p-0' : 'py-2 px-4 gap-2 text-[10px] uppercase tracking-wide'}`}
              title="Exportar JSON"
            >
               <Download size={16} />
               {!collapsed && 'Backup'}
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white border border-slate-700 font-bold rounded-lg flex items-center justify-center transition-all active:scale-95 ${collapsed ? 'h-10 p-0' : 'py-2 px-4 gap-2 text-[10px] uppercase tracking-wide'}`}
              title="Importar JSON"
            >
               <Upload size={16} />
               {!collapsed && 'Restaurar'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={onImport} 
            />
        </div>

        <div className="flex gap-2 pt-1">
            <button 
              onClick={onExportCsv}
              className={`flex-1 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white border border-slate-700 font-bold rounded-lg flex items-center justify-center transition-all active:scale-95 ${collapsed ? 'h-10 p-0' : 'py-2 px-4 gap-2 text-[10px] uppercase tracking-wide'}`}
              title="Exportar CSV"
            >
               <Download size={16} />
               {!collapsed && 'Exportar'}
            </button>
            <button 
              onClick={() => csvFileInputRef.current?.click()}
              className={`flex-1 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white border border-slate-700 font-bold rounded-lg flex items-center justify-center transition-all active:scale-95 ${collapsed ? 'h-10 p-0' : 'py-2 px-4 gap-2 text-[10px] uppercase tracking-wide'}`}
              title="Importar CSV"
            >
               <Upload size={16} />
               {!collapsed && 'Importar'}
            </button>
            <input 
              type="file" 
              ref={csvFileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={onImportCsv} 
            />
        </div>

        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); onClear(); }}
          className={`w-full bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900 font-bold rounded-lg flex items-center justify-center transition-all active:scale-95 ${collapsed ? 'h-10 p-0' : 'py-2.5 px-4 gap-2 text-[10px] uppercase tracking-wide'}`}
          title="Limpar Escala"
        >
          <Trash2 size={18} />
          {!collapsed && 'Limpar'}
        </button>
      </div>

      {editingFlight && (
          <EditFlightModal 
             flight={editingFlight} 
             onClose={() => setEditingFlight(null)} 
             onSave={handleSaveEditedFlight} 
          />
      )}

    </div>
  );
};

export default Sidebar;


import React from 'react';
import { CrewMember, AdminTag, OperationalTag, InstructionTag, SyntheticTag } from '../types';
import { User, Shield, Clock, CalendarDays, Battery, ToggleLeft, ToggleRight, HeartPulse, MapPin, CalendarClock, Eye, Activity, Zap, Plane, Palmtree, GraduationCap } from 'lucide-react';

interface CrewInfoProps {
  crew: CrewMember;
  index: number;
  isCoordinationMode: boolean;
  onToggleStatus: (id: string) => void;
  onUpdateTag: (id: string, type: 'admin' | 'operational' | 'instruction' | 'synthetic', value: string | null) => void;
  onToggleFatigue: (id: string) => void;
  onNameClick?: (id: string) => void; 
  hasVacation?: boolean; // NEW PROP
}

const CrewInfo: React.FC<CrewInfoProps> = ({ crew, index, isCoordinationMode, onToggleStatus, onUpdateTag, onToggleFatigue, onNameClick, hasVacation }) => {
  
  const adminOptions: AdminTag[] = ['ADM.DO', 'ADM.PC', 'ADM.DSO', 'ADM.GK', 'ADM.GR', null];
  const opOptions: OperationalTag[] = ['GS', 'EMI', 'AVBL', 'REC', 'OFF', 'REQ', 'AGD'];
  const instrOptions: InstructionTag[] = ['TRI', 'TRE', null];
  const synthOptions: SyntheticTag[] = ['SFI', 'SFE', 'BANCA', null];

  const cycleTag = <T,>(current: T, options: T[], type: 'admin' | 'operational' | 'instruction' | 'synthetic') => {
    const idx = options.indexOf(current);
    const next = options[(idx + 1) % options.length];
    onUpdateTag(crew.id, type, next as unknown as string | null);
  };

  const getTagStyles = (tag: string | null) => {
    if (!tag) return 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-600 border-slate-300 dark:border-slate-700 border-dashed hover:border-solid';
    
    // 1. TRI/TRE/SFI/SFE/BANCA -> White 20%
    if (['TRI', 'TRE', 'SFI', 'SFE'].includes(tag)) return 'bg-slate-800/20 dark:bg-white/20 text-slate-900 dark:text-white border-slate-800/20 dark:border-white/20 font-black shadow-lg backdrop-blur-sm';
    
    // 2. EMI -> Yellow
    if (tag === 'EMI') return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/50 font-bold';
    
    // 3. GS / REQ / AGD -> Red
    if (tag === 'GS' || tag === 'REQ' || tag === 'AGD') return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-500 border-red-300 dark:border-red-500/50 font-bold';

    // Standard cases
    if (tag === 'AVBL') return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold';
    if (['REC', 'OFF'].includes(tag)) return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 font-bold';
    
    return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700';
  };

  const getAdminTagStyles = (tag: string | null) => {
    if (!tag) return 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-600 border-slate-300 dark:border-slate-700 border-dashed hover:border-solid';
    return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-bold';
  };
  
  const getBaseTagStyles = () => 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800/60 font-bold';
  const getEquipmentTagStyles = () => 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 font-bold';

  const getInstructionLabel = (tag: InstructionTag) => {
    return tag || 'TRI';
  };

  const getSyntheticLabel = (tag: SyntheticTag) => {
    return tag || 'SFI';
  };

  // Helper for Fatigue Tag Color - Matches FatigueChart Gradient - WITH 50% OPACITY
  const getFatigueColorClass = (score: number) => {
      if (score > 11) return 'bg-red-100 dark:bg-red-600/50 text-red-700 dark:text-white border-red-300 dark:border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse';
      if (score >= 8) return 'bg-orange-100 dark:bg-orange-500/50 text-orange-700 dark:text-white border-orange-300 dark:border-orange-400';
      if (score >= 4) return 'bg-yellow-100 dark:bg-yellow-400/50 text-yellow-700 dark:text-yellow-950 border-yellow-300 dark:border-yellow-500 font-extrabold';
      return 'bg-emerald-100 dark:bg-emerald-500/50 text-emerald-700 dark:text-white border-emerald-300 dark:border-emerald-400';
  };

  // Use maxFatigueScore if available, otherwise 0
  const displayFatigueScore = crew.maxFatigueScore ?? 0;

  const hasExpiredQualification = React.useMemo(() => {
    if (!crew.qualifications) return false;
    const today = new Date();
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
                // Handle 2-digit years
                if (y < 100) y += 2000;

                // If day is not computed, it assumes the end of the month
                if (!d) {
                    d = new Date(y, m, 0).getDate();
                }

                // The expirationDate now already factors in the grace period
                const expDate = new Date(y, m - 1, d, 23, 59, 59, 999);
                // If the expiration time is less than today's time (meaning it's in the past)
                if (expDate.getTime() < today.getTime()) {
                    return true;
                }
            }
        }
    }
    return false;
  }, [crew.qualifications]);

  if (isCoordinationMode) {
    return (
      <div className="sticky left-0 z-20 border-r border-b border-slate-200 dark:border-slate-700 min-h-[66px] h-full flex bg-white dark:bg-slate-900 shrink-0 transition-all duration-300 w-[296px] shadow-xl">
        <div className="flex-1 flex flex-col p-1 min-w-0 relative justify-center">
          <div className="flex items-center gap-1.5 mb-1">
             {/* Display Seniority instead of ID */}
             <span className="text-[12px] font-mono font-bold text-slate-500 shrink-0">#{crew.seniority || '-'}_</span>
             <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono tracking-tight shrink-0 ${crew.role === 'CMTE' ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50' : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'}`}>
                {crew.role}
             </span>
             <span 
                className={`font-black text-sm flex-1 leading-none uppercase tracking-tight truncate cursor-pointer transition-colors ${(hasExpiredQualification || crew.operationalTag === 'REQ') ? 'text-red-600 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400' : 'text-black dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400'}`}
                onClick={() => onNameClick && onNameClick(crew.id)}
             >
                {crew.name}
             </span>
             <button onClick={() => onNameClick && onNameClick(crew.id)} className="text-blue-400 hover:text-blue-300 transition-colors p-0.5 shrink-0"><Eye size={12} /></button>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
             <div className={`text-[10px] px-2 py-0.5 rounded border ${getEquipmentTagStyles()}`}>{crew.equipment || 'A320'}</div>
             <div className={`text-[10px] px-2 py-0.5 rounded border ${getBaseTagStyles()}`}>{crew.base || 'VCP'}</div>
             <div className={`text-[10px] px-2 py-0.5 rounded border ${getAdminTagStyles(crew.adminTag)}`}>{crew.adminTag || 'ADM.-'}</div>
             <div className={`text-[10px] px-2 py-0.5 rounded border ${getTagStyles(crew.operationalTag)}`}>{crew.operationalTag}</div>
             
             {/* INSTRUCTION/SYNTHETIC ONLY FOR CMTE */}
             {crew.role === 'CMTE' && (
                <>
                    <div className={`text-[10px] px-2 py-0.5 rounded border ${getTagStyles(crew.instructionTag)}`}>{getInstructionLabel(crew.instructionTag)}</div>
                    <div className={`text-[10px] px-2 py-0.5 rounded border ${getTagStyles(crew.syntheticTag)}`}>{getSyntheticLabel(crew.syntheticTag)}</div>
                </>
             )}

             {/* AQEXP TAG */}
             {crew.isAqExp && (
                <div className="text-[10px] px-2 py-0.5 rounded border font-bold bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 flex items-center gap-1 shadow-sm" title="Aquisição de Experiência">
                    <GraduationCap size={10} /> AQEXP
                </div>
             )}
             
             {/* DYNAMIC VACATION TAG - Only show if crew is Inactive */}
             {hasVacation && !crew.isOn && (
                <div className="text-[10px] px-2 py-0.5 rounded border font-bold bg-yellow-100 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/50 flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                    <Palmtree size={10} /> VAC
                </div>
             )}

             {/* FATIGUE TAG (INLINE BOTTOM RIGHT via ml-auto) */}
             {crew.isOn && (
                <div 
                    onClick={() => onNameClick && onNameClick(crew.id)}
                    className={`ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold font-mono tracking-tight ${getFatigueColorClass(displayFatigueScore)} transition-all duration-300 select-none cursor-pointer hover:scale-105`} 
                    title={`Nível Máximo de Fadiga do Mês: ${displayFatigueScore}`}
                >
                    <Zap size={10} strokeWidth={3} className={displayFatigueScore > 11 ? "animate-pulse" : ""} />
                    <span>{displayFatigueScore}</span>
                </div>
             )}
          </div>
        </div>

        {/* Stats Section - Coordination Mode */}
        <div className="w-[85px] border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col justify-around py-1.5 px-2 shrink-0 select-none">
           <div className="flex justify-between items-center text-[12px] font-mono leading-none">
              <span className="text-slate-500 font-bold tracking-tighter">HST</span>
              <span className="text-slate-900 dark:text-slate-200 font-black">{crew.stats.annualFlightHours}</span>
           </div>
           <div className="flex justify-between items-center text-[12px] font-mono leading-none">
              <span className="text-slate-500 font-bold tracking-tighter">HS</span>
              <span className="text-slate-900 dark:text-slate-200 font-black">{crew.stats.flightHours}</span>
           </div>
           <div className="flex justify-between items-center text-[12px] font-mono leading-none">
              <span className="text-slate-500 font-bold tracking-tighter">FR</span>
              <span className={`font-black ${crew.stats.frCount < (crew.stats.minFR ?? 8) ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>{crew.stats.frCount}</span>
           </div>
           <div className="flex justify-between items-center text-[12px] font-mono leading-none">
              <span className="text-slate-500 font-bold tracking-tighter">FS</span>
              <span className={`font-black ${crew.stats.fsCount < (crew.stats.minFS ?? 2) ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>{crew.stats.fsCount}</span>
           </div>
           <div className="flex justify-between items-center text-[12px] font-mono leading-none">
              <span className="text-slate-500 font-bold tracking-tighter">SA</span>
              <span className={`font-black ${crew.stats.standbyCount > 8 ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>{crew.stats.standbyCount}</span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      sticky left-0 z-20 border-r border-b border-slate-200 dark:border-slate-700 min-h-[66px] h-full flex shadow-[2px_0_10px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_10px_rgba(0,0,0,0.3)] shrink-0 transition-all duration-300 group w-[296px]
      ${crew.isOn ? 'bg-white dark:bg-slate-900' : 'bg-slate-100 dark:bg-slate-900/80 grayscale-[0.5]'}
    `}>
      {/* Left Section: Core Identity & Tags */}
      <div className="flex-1 flex flex-col p-1 min-w-0 relative justify-center">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {/* Display Seniority instead of ID */}
            <span className="text-[11px] font-mono text-slate-500 shrink-0" title={`Senioridade: ${crew.seniority || '-'}`}>#{crew.seniority || '-'}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono tracking-tight shrink-0 ${crew.role === 'CMTE' ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-800/50' : 'bg-blue-900/60 text-blue-400 border border-blue-800/50'}`}>{crew.role}</span>
            <span 
                className={`font-black text-sm leading-none uppercase tracking-tight truncate cursor-pointer transition-colors ${crew.isOn ? ((hasExpiredQualification || crew.operationalTag === 'REQ') ? 'text-red-500 hover:text-red-400' : 'text-slate-100 hover:text-blue-400') : 'text-slate-500 line-through decoration-slate-600 hover:text-slate-400'}`}
                onClick={() => onNameClick && onNameClick(crew.id)}
            >
                {crew.name}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={() => onToggleStatus(crew.id)} className={`shrink-0 transition-colors ${crew.isOn ? 'text-emerald-500 hover:text-emerald-400' : 'text-slate-600 hover:text-slate-500'}`}>{crew.isOn ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2 items-center">
          <div className={`text-[11px] px-2.5 py-0.5 rounded border font-mono font-bold flex items-center gap-1 cursor-help ${getEquipmentTagStyles()}`} title="Equipamento"><Plane size={10} />{crew.equipment || 'A320'}</div>
          <div className={`text-[11px] px-2.5 py-0.5 rounded border font-mono font-bold flex items-center gap-1 cursor-help ${getBaseTagStyles()}`} title="Base Contratual"><MapPin size={10} />{crew.base || 'VCP'}</div>
          <button onClick={() => cycleTag(crew.adminTag, adminOptions, 'admin')} className={`text-[11px] px-2.5 py-0.5 rounded border font-mono font-bold transition-all hover:brightness-110 ${getAdminTagStyles(crew.adminTag)}`}>{crew.adminTag || 'ADM.-'}</button>
          <button onClick={() => cycleTag(crew.operationalTag, opOptions, 'operational')} className={`text-[11px] px-2.5 py-0.5 rounded border font-mono font-bold transition-all hover:brightness-110 relative ${getTagStyles(crew.operationalTag)}`}>{crew.operationalTag}</button>
          
          {/* INSTRUCTION/SYNTHETIC ONLY FOR CMTE */}
          {crew.role === 'CMTE' && (
            <>
                <button onClick={() => cycleTag(crew.instructionTag, instrOptions, 'instruction')} className={`text-[11px] px-2.5 py-0.5 rounded border font-mono font-bold transition-all hover:brightness-110 ${getTagStyles(crew.instructionTag)}`}>{getInstructionLabel(crew.instructionTag)}</button>
                <button onClick={() => cycleTag(crew.syntheticTag, synthOptions, 'synthetic')} className={`text-[11px] px-2.5 py-0.5 rounded border font-mono font-bold transition-all hover:brightness-110 ${getTagStyles(crew.syntheticTag)}`}>{getSyntheticLabel(crew.syntheticTag)}</button>
            </>
          )}

          {/* AQEXP TAG */}
          {crew.isAqExp && (
            <div className="text-[11px] px-2.5 py-0.5 rounded border font-bold bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 flex items-center gap-1 cursor-help" title="Aquisição de Experiência (Req. 100h para Cheque)">
                <GraduationCap size={10} /> AQEXP
            </div>
          )}
          
          {/* DYNAMIC VACATION TAG - Only show if crew is Inactive */}
          {hasVacation && !crew.isOn && (
             <div className="text-[11px] px-2.5 py-0.5 rounded border font-bold bg-yellow-100 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/50 flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                 <Palmtree size={10} /> VAC
             </div>
          )}

          {/* FATIGUE TAG (INLINE BOTTOM RIGHT via ml-auto) */}
          {crew.isOn && (
             <div 
                onClick={() => onNameClick && onNameClick(crew.id)}
                className={`ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold font-mono tracking-tight ${getFatigueColorClass(displayFatigueScore)} transition-all duration-300 select-none cursor-pointer hover:scale-105`} 
                title={`Nível Máximo de Fadiga do Mês: ${displayFatigueScore}`}
             >
                <Zap size={10} strokeWidth={3} className={displayFatigueScore > 11 ? "animate-pulse" : ""} />
                <span>{displayFatigueScore}</span>
             </div>
          )}
        </div>
      </div>

      {/* Right Section: Stats Column - Compacted to fit 66px container */}
      <div className="w-[82px] border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col justify-evenly py-0.5 px-1.5 shrink-0 select-none">
        <div className="flex justify-between items-center text-[10px] font-mono leading-none" title="Horas Totais Acumuladas">
          <span className="text-slate-500 font-bold tracking-tighter uppercase">HST</span>
          <span className="text-slate-900 dark:text-slate-200 font-black text-[11px]">{crew.stats.annualFlightHours}h</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono leading-none" title="Horas de Voo Mensais">
          <span className="text-slate-500 font-bold tracking-tighter uppercase">HS</span>
          <span className="text-slate-900 dark:text-slate-200 font-black text-[11px]">{crew.stats.flightHours}h</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono leading-none" title="Folgas Regulamentares">
          <span className="text-slate-500 font-bold tracking-tighter uppercase">FR</span>
          <span className={`font-black text-[11px] ${crew.stats.frCount < (crew.stats.minFR ?? 8) ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>{crew.stats.frCount}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono leading-none" title="Folgas Sociais">
          <span className="text-slate-500 font-bold tracking-tighter uppercase">FS</span>
          <span className={`font-black text-[11px] ${crew.stats.fsCount < (crew.stats.minFS ?? 2) ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>{crew.stats.fsCount}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono leading-none" title="Sobreavisos">
          <span className="text-slate-500 font-bold tracking-tighter uppercase">SA</span>
          <span className={`font-black text-[11px] ${crew.stats.standbyCount > 8 ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>{crew.stats.standbyCount}</span>
        </div>
      </div>
    </div>
  );
};

export default CrewInfo;

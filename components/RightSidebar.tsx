
import React, { useMemo } from 'react';
import { FileText, Scale, TrendingUp, AlertTriangle, ChevronRight, ChevronLeft, Trash2, RefreshCcw } from 'lucide-react';
import { ScheduleMap, CrewMember, LogEntry, EquityResult } from '../types';
import { analyzeEquity } from '../regulation';

interface RightSidebarProps {
  schedule: ScheduleMap;
  crew: CrewMember[];
  logs: LogEntry[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClearLogs?: () => void;
  onReviewMonth?: () => void;
  isReviewing?: boolean;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ schedule, crew, logs, collapsed, onToggleCollapse, onClearLogs, onReviewMonth, isReviewing }) => {
  
  // Equity Analysis
  const equityResults: EquityResult[] = useMemo(() => {
     return analyzeEquity(crew);
  }, [crew]);

  return (
    <div className={`relative bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full flex-shrink-0 z-40 shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'w-10' : 'w-[356px]'}`}>
      
      {/* Collapse Toggle */}
      <button 
        onClick={onToggleCollapse}
        className="absolute left-1.5 top-8 bg-slate-100 dark:bg-slate-800 border border-slate-600 text-slate-700 dark:text-slate-300 rounded-full p-0.5 hover:text-slate-900 dark:text-white hover:bg-slate-700 shadow-md z-[110] transition-colors"
      >
        {collapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {!collapsed ? (
        <>
          {/* KPI Section - Scrollable (Now only Equity) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 gap-4 flex flex-col">
            
            {/* EQUITY MONITOR (Art. 28) */}
            <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400 mt-2">
               <TrendingUp size={18} />
               <span className="text-[12px] font-bold uppercase tracking-wider">Equidade (Art. 28)</span>
            </div>
            
            {equityResults.length === 0 ? (
               <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800 text-center">
                 <span className="text-[11px] text-slate-500">Distribuição Equilibrada</span>
               </div>
            ) : (
               equityResults.map((res, idx) => (
                 <div key={idx} className="bg-orange-950/20 border border-orange-900/30 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[11px] font-bold text-orange-400 uppercase">{res.role} (Méd: {res.averageHours}h)</span>
                       <AlertTriangle size={14} className="text-orange-500" />
                    </div>
                    {res.discrepancyCrew.map((c, i) => (
                       <div key={i} className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300 mb-1">
                          <span>{c.name}</span>
                          <span className={c.diff > 0 ? 'text-red-400' : 'text-blue-400'}>
                             {c.hours}h ({c.diff > 0 ? '+' : ''}{Math.round(c.diff)}%)
                          </span>
                       </div>
                    ))}
                 </div>
               ))
            )}
          </div>

          {/* Log Section - Bottom Fixed height */}
          <div className="h-80 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 p-4 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <FileText size={18} />
                <span className="text-[13px] font-bold uppercase tracking-wider">Log Técnico</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={onReviewMonth}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 text-[10px] font-black uppercase rounded border border-blue-800/50 transition-all active:scale-95 disabled:opacity-50"
                  disabled={isReviewing}
                  title="Revisar mês desde o início"
                >
                  <RefreshCcw size={14} className={isReviewing ? "animate-spin" : ""} /> Revisar Mês
                </button>
                <button 
                  onClick={onClearLogs}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-700/80 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase rounded border border-slate-300 dark:border-slate-700/50 transition-all active:scale-95"
                  title="Limpar log técnico"
                >
                  <Trash2 size={14} /> Limpar Log
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 font-mono text-[11px]">
              {logs.length === 0 && <span className="text-slate-600 italic">Nenhum evento registrado.</span>}
              {logs.slice().reverse().map((log, i) => (
                <div key={i} className="flex gap-1 border-l-2 border-slate-300 dark:border-slate-700 pl-3 mb-2 flex-col animate-in slide-in-from-left-1 duration-200">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[10px]">{log.timestamp.toLocaleTimeString()}</span>
                    {log.lawReference && (
                        <span className="flex items-center gap-1 text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 border border-slate-300 dark:border-slate-700">
                            <Scale size={10} /> {log.lawReference}
                    </span>
                    )}
                  </div>
                  <span className={`${log.type === 'error' ? 'text-red-400 font-bold' : log.type === 'warning' ? 'text-yellow-500' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-700 dark:text-slate-300'} leading-tight`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="h-full flex flex-col items-center pt-20 gap-8">
           <TrendingUp size={20} className="text-slate-600" />
           <FileText size={20} className="text-slate-600" />
           <Scale size={20} className="text-slate-600" />
        </div>
      )}

    </div>
  );
};

export default RightSidebar;

import React from 'react';
import { Aircraft } from '../types';
import { Activity, Clock, Settings, AlertTriangle, Boxes, Ruler, Info } from 'lucide-react';

interface AircraftInfoProps {
  aircraft: Aircraft;
  onToggleApu?: (id: string, currentStatus: string) => void;
}

const AircraftInfo: React.FC<AircraftInfoProps> = ({ aircraft, onToggleApu }) => {
  const getStatusColor = (status: string) => {
      switch(status) {
          case 'OPERATIONAL': return 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700';
          case 'MAINTENANCE': return 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700';
          case 'AOG': return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
          default: return 'text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
      }
  };

  const getStatusLabel = (status: string) => {
      switch(status) {
          case 'OPERATIONAL': return 'OPE';
          case 'MAINTENANCE': return 'MNTE';
          case 'AOG': return 'AOG';
          default: return 'INV';
      }
  };

  return (
    <div className="sticky left-0 z-20 border-r border-b border-slate-200 dark:border-slate-700 h-[101px] flex flex-col p-2 bg-white dark:bg-slate-900 shrink-0 transition-all duration-300 w-[296px] shadow-xl justify-center">
      {/* Top Section: ID + Registration + Model */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[14px] font-mono font-bold text-slate-500 shrink-0">#{aircraft.id}</span>
          <span className="text-[11px] px-1 py-0.5 rounded font-bold font-mono shrink-0 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50">{aircraft.model.substring(0,4)}</span>
          <span className="font-bold text-[18px] text-slate-900 dark:text-slate-100 tracking-tight">{aircraft.registration}</span>
        </div>
      </div>

      {/* Middle Tags Row - INCREASED SIZE */}
      <div className="flex items-center gap-1.5 mb-2 h-6">
        <div className={`text-[12px] px-2 py-0.5 rounded border font-mono font-bold flex items-center gap-1 ${getStatusColor(aircraft.status)}`}>
           <Activity size={12} />
           {getStatusLabel(aircraft.status)}
        </div>
        <div className="text-[12px] px-2 py-0.5 rounded border font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700">
           {aircraft.config}
        </div>
        <div className="text-[12px] px-2 py-0.5 rounded border font-mono font-bold bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-slate-300 dark:border-slate-700 flex items-center gap-1">
           <Boxes size={12} /> {aircraft.payload ? `${aircraft.payload / 1000}T` : (aircraft.cargoCapacity > 0 ? `${aircraft.cargoCapacity/1000}T` : `${aircraft.paxCapacity}P`)}
        </div>
        {aircraft.hasAPU && (
            <div 
              onClick={() => onToggleApu && onToggleApu(aircraft.id, aircraft.apuStatus || 'NAVLB')}
              className={`w-5 h-5 border rounded-sm flex items-center justify-center text-[10px] font-bold ${onToggleApu ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${aircraft.apuStatus === 'AVLB' ? 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400' : 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'}`} 
              title={`APU ${aircraft.apuStatus || 'NAVLB'}`}
            >
                A
            </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-1 mt-auto pt-1.5 border-t border-slate-200 dark:border-slate-800/80">
        <div className="flex flex-col items-center" title="Horas Totais">
          <div className="flex items-center gap-1 text-slate-500 mb-0.5">
              <Clock size={13} />
              <span className="text-[12px] font-bold">HST</span>
          </div>
          <span className="text-[13px] font-mono font-bold text-slate-700 dark:text-slate-300">
             {Math.floor(aircraft.hours)}:{Math.round((aircraft.hours - Math.floor(aircraft.hours)) * 60).toString().padStart(2, '0')}h
          </span>
        </div>
        <div className="flex flex-col items-center" title="Ciclos">
          <div className="flex items-center gap-1 text-slate-500 mb-0.5">
              <Settings size={13} />
              <span className="text-[12px] font-bold">C</span>
          </div>
          <span className="text-[13px] font-mono font-bold text-slate-700 dark:text-slate-300">{aircraft.cycles}</span>
        </div>
        <div className="flex flex-col items-center" title="Próximo Check">
          <AlertTriangle size={15} className="text-slate-500 mb-0.5" />
          <span className="text-[13px] font-mono font-bold text-slate-700 dark:text-slate-300">{aircraft.nextCheck.substring(0,5)}</span>
        </div>
      </div>
    </div>
  );
};

export default AircraftInfo;
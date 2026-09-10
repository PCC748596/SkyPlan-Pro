
import React from 'react';
import { X, Trash2, AlertTriangle, CalendarDays } from 'lucide-react';

interface ClearScheduleModalProps {
  onClose: () => void;
  onConfirm: () => void;
  monthName: string;
  year: number;
}

const ClearScheduleModal: React.FC<ClearScheduleModalProps> = ({ onClose, onConfirm, monthName, year }) => {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="w-[400px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-lg flex flex-col font-sans overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-100 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
             <AlertTriangle size={16} className="text-red-500" />
             <span className="text-red-100">Confirmação de Limpeza</span>
          </div>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border-2 border-red-900/50">
                <Trash2 size={32} className="text-red-500" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Limpar Escala Mensal?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Você está prestes a remover <strong className="text-red-400">TODAS</strong> as atividades programadas para:
            </p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-3 flex items-center justify-center gap-2">
             <CalendarDays size={16} className="text-blue-400" />
             <span className="text-lg font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {monthName} <span className="text-slate-500">/</span> {year}
             </span>
          </div>

          <div className="text-[10px] bg-red-950/30 border border-red-900/30 p-2 rounded text-red-300 font-bold">
             Atenção: Esta ação não pode ser desfeita.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex gap-2 justify-center">
           <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-700 rounded transition-colors border border-slate-600"
           >
              Cancelar
           </button>
           <button 
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-slate-900 dark:text-white text-xs font-bold rounded shadow-lg flex items-center justify-center gap-2 transition-colors border border-red-500"
           >
              <Trash2 size={14} /> Confirmar Limpeza
           </button>
        </div>

      </div>
    </div>
  );
};

export default ClearScheduleModal;

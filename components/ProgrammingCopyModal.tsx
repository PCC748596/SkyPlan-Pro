
import React, { useState, useMemo } from 'react';
import { X, Copy, Calendar, User, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { CrewMember } from '../types';

interface CopyTarget {
  id: string;
  crewId: string;
  mode: 'ORIGINAL' | 'ALUNO' | 'INSTRUTOR' | 'XQR' | 'EXM';
}

interface ProgrammingCopyModalProps {
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string, originCrewId: string, targets: CopyTarget[]) => void;
  crewList: CrewMember[];
}

const ProgrammingCopyModal: React.FC<ProgrammingCopyModalProps> = ({ onClose, onConfirm, crewList }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [originCrewId, setOriginCrewId] = useState('');
  
  // Initialize with 4 empty rows to match the look of the legacy form having multiple slots
  const [targets, setTargets] = useState<CopyTarget[]>([
    { id: '1', crewId: '', mode: 'ORIGINAL' },
    { id: '2', crewId: '', mode: 'ORIGINAL' },
    { id: '3', crewId: '', mode: 'ORIGINAL' },
    { id: '4', crewId: '', mode: 'ORIGINAL' },
  ]);

  const modes = [
    { value: 'ORIGINAL', label: 'Prog. Original' },
    { value: 'ALUNO', label: 'Aluno' },
    { value: 'INSTRUTOR', label: 'Instrutor' },
    { value: 'XQR', label: 'XQR' },
    { value: 'EXM', label: 'EXM' },
  ];

  const handleTargetChange = (id: string, field: 'crewId' | 'mode', value: string) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addRow = () => {
    setTargets(prev => [...prev, { id: Date.now().toString(), crewId: '', mode: 'ORIGINAL' }]);
  };

  const removeRow = (id: string) => {
    setTargets(prev => prev.filter(t => t.id !== id));
  };

  const handleConfirm = () => {
    if (!startDate || !endDate || !originCrewId) return;
    // Filter out empty rows
    const validTargets = targets.filter(t => t.crewId && t.crewId !== originCrewId);
    onConfirm(startDate, endDate, originCrewId, validTargets);
    onClose();
  };

  const sortedCrew = useMemo(() => [...crewList].sort((a, b) => a.name.localeCompare(b.name)), [crewList]);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in zoom-in-95 duration-200">
      <div className="w-[600px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-lg flex flex-col font-sans select-none">
        
        {/* Header */}
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
             <Copy size={16} className="text-amber-400" />
             <span>Cópia de Programação</span>
          </div>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          
          {/* Period Selection */}
          <div className="flex flex-col gap-1.5">
             <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Calendar size={12} /> Período
             </label>
             <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-300 dark:border-slate-700/50">
                <input 
                   type="date" 
                   className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs p-2 rounded focus:border-blue-500 outline-none flex-1 font-mono"
                   value={startDate}
                   onChange={e => setStartDate(e.target.value)}
                />
                <span className="text-slate-500 text-xs">até</span>
                <input 
                   type="date" 
                   className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs p-2 rounded focus:border-blue-500 outline-none flex-1 font-mono"
                   value={endDate}
                   onChange={e => setEndDate(e.target.value)}
                />
             </div>
          </div>

          {/* Origin Crew */}
          <div className="flex flex-col gap-1.5">
             <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <User size={12} /> Tripulante Origem (Fonte)
             </label>
             <input 
                list="crew-list"
                type="text" 
                placeholder="Digite o nome ou ID..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs p-2 rounded focus:border-blue-500 outline-none uppercase font-bold"
                value={originCrewId}
                onChange={e => setOriginCrewId(e.target.value)}
             />
          </div>

          {/* Destination Crew List */}
          <div className="flex flex-col gap-1.5">
             <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <User size={12} /> Tripulantes Destino
                </label>
                <button onClick={addRow} className="text-[10px] text-blue-400 hover:text-slate-900 dark:text-white flex items-center gap-1">
                   <Plus size={10} /> Adicionar
                </button>
             </div>
             
             <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                {targets.map((target, idx) => (
                   <div key={target.id} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                      <div className="w-6 text-[10px] text-slate-600 font-mono text-center">{idx + 1}</div>
                      <input 
                         list="crew-list"
                         placeholder="Tripulante Destino..."
                         className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs p-2 rounded focus:border-blue-500 outline-none uppercase"
                         value={target.crewId}
                         onChange={e => handleTargetChange(target.id, 'crewId', e.target.value)}
                      />
                      <select 
                         className="w-32 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs p-2 rounded focus:border-blue-500 outline-none"
                         value={target.mode}
                         onChange={e => handleTargetChange(target.id, 'mode', e.target.value as any)}
                      >
                         {modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      {targets.length > 1 && (
                        <button onClick={() => removeRow(target.id)} className="text-slate-600 hover:text-red-500 p-1">
                           <Trash2 size={12} />
                        </button>
                      )}
                   </div>
                ))}
             </div>
          </div>

          <datalist id="crew-list">
             {sortedCrew.map(c => (
                <option key={c.id} value={c.name}>{c.role} - {c.id}</option>
             ))}
          </datalist>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-end gap-2 rounded-b-lg">
           <button 
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-700 rounded transition-colors"
           >
              Cancelar
           </button>
           <button 
              onClick={handleConfirm}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-slate-900 dark:text-white text-xs font-bold rounded shadow-lg flex items-center gap-2 transition-colors"
           >
              <Copy size={14} /> Confirmar Cópia
           </button>
        </div>

      </div>
    </div>
  );
};

export default ProgrammingCopyModal;

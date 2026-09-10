import React, { useState } from 'react';
import { X, Play, Plus, Trash2, Save, MapPin } from 'lucide-react';
import { CrewBase } from '../types';

interface BasesModalProps {
  onClose: () => void;
  bases: CrewBase[];
  onSave: (bases: CrewBase[]) => void;
}

const BasesModal: React.FC<BasesModalProps> = ({ onClose, bases, onSave }) => {
  const [localBases, setLocalBases] = useState<CrewBase[]>(
    JSON.parse(JSON.stringify(bases))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleFieldChange = (id: string, field: keyof CrewBase, value: string) => {
    setLocalBases(prev => prev.map(b => 
      b.id === id ? { ...b, [field]: value.toUpperCase() } : b
    ));
  };

  const handleCityChange = (id: string, value: string) => {
    setLocalBases(prev => prev.map(b => 
      b.id === id ? { ...b, city: value.toUpperCase() } : b
    ));
  }

  const handleIdChange = (oldId: string, newId: string) => {
     setLocalBases(prev => prev.map(b => 
        b.id === oldId ? { ...b, id: newId.toUpperCase() } : b
      ));
      if (selectedId === oldId) {
         setSelectedId(newId.toUpperCase());
      }
  }

  const handleAdd = () => {
    const newBase: CrewBase = {
      id: `NEW_${Date.now()}`.substring(0, 10),
      city: ''
    };
    setLocalBases(prev => [...prev, newBase]);
    setSelectedId(newBase.id);
  };

  const handleDelete = () => {
    if (selectedId) {
      setLocalBases(prev => prev.filter(b => b.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleSave = () => {
    onSave(localBases);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[500px] h-[600px] bg-white dark:bg-slate-900 shadow-2xl border border-slate-300 dark:border-slate-700 select-none flex flex-col font-sans text-xs text-slate-700 dark:text-slate-300 rounded-lg overflow-hidden">
        
        {/* Title Bar */}
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 flex justify-between items-center cursor-default shrink-0 border-b border-slate-300 dark:border-slate-700">
          <div className="flex items-center gap-2">
             <MapPin size={16} className="text-blue-400" />
             <span className="font-bold tracking-wide text-sm text-slate-900 dark:text-white">
                Bases de Tripulante
             </span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-700 rounded-full p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-100 dark:bg-slate-800/50 border-b border-slate-300 dark:border-slate-700 p-2 flex gap-2">
           <button onClick={handleAdd} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white rounded font-bold transition-all active:scale-95 shadow">
              <Plus size={14} />
              <span>Novo</span>
           </button>
           <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-red-600/80 text-slate-900 dark:text-white rounded font-bold transition-all active:scale-95 shadow disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedId}>
              <Trash2 size={14} />
              <span>Excluir</span>
           </button>
           <div className="w-px bg-slate-700 mx-2"></div>
           <button onClick={handleSave} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white rounded font-bold transition-all active:scale-95 shadow ml-auto">
              <Save size={14} />
              <span>Salvar Alterações</span>
           </button>
        </div>

        {/* Grid Header */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-2">
           <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 h-full flex flex-col relative overflow-hidden rounded">
              {/* Header Row */}
              <div className="flex bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 select-none sticky top-0 z-10 uppercase tracking-wider">
                 <div className="w-8 border-r border-slate-300 dark:border-slate-700 flex items-center justify-center py-2"></div>
                 <div className="flex-1 border-r border-slate-300 dark:border-slate-700 px-2 py-2">Nome da Cidade</div>
                 <div className="w-32 px-2 py-2 text-center">Aeroporto</div>
              </div>

              {/* Rows */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {localBases.map((base) => {
                   const isSelected = base.id === selectedId;
                   return (
                     <div 
                        key={base.id} 
                        onClick={() => setSelectedId(base.id)}
                        className={`flex border-b border-slate-200 dark:border-slate-800 items-center h-8 text-[11px] hover:bg-slate-100 dark:bg-slate-800 cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/20' : ''}`}
                     >
                        {/* Selector Arrow */}
                        <div className="w-8 border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">
                           {isSelected && <Play size={8} className="fill-red-500 text-red-500" />}
                        </div>

                        {/* City */}
                        <div className="flex-1 border-r border-slate-200 dark:border-slate-800 h-full p-0.5">
                            <input 
                              type="text" 
                              className={`w-full h-full px-1 outline-none bg-transparent text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:bg-slate-800 rounded-sm`}
                              value={base.city}
                              onChange={e => handleCityChange(base.id, e.target.value)}
                           />
                        </div>

                        {/* ID / Airport */}
                        <div className="w-32 h-full p-0.5">
                           <input 
                              type="text" 
                              className={`w-full h-full px-1 outline-none text-center bg-transparent uppercase font-bold text-slate-900 dark:text-white focus:bg-slate-100 dark:bg-slate-800 rounded-sm`}
                              value={base.id}
                              onChange={e => handleIdChange(base.id, e.target.value)}
                           />
                        </div>

                     </div>
                   );
                 })}
                 {/* Empty row filler */}
                 <div className="flex-1 bg-slate-100 dark:bg-slate-900/50"></div>
              </div>
           </div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 h-8 flex items-center px-4 text-[10px] text-slate-600 dark:text-slate-400 justify-between shrink-0">
           <span>{localBases.length} bases cadastradas.</span>
        </div>

      </div>
    </div>
  );
};

export default BasesModal;


import React, { useState, useEffect } from 'react';
import { X, Play, Plus, Trash2, Save, FileText, Star, Palette } from 'lucide-react';
import { ActivityDefinition } from '../types';

interface ActivitiesModalProps {
  onClose: () => void;
  activities: ActivityDefinition[];
  onSave: (activities: ActivityDefinition[]) => void;
  initialSelectedId?: string | null;
}

const ActivitiesModal: React.FC<ActivitiesModalProps> = ({ onClose, activities, onSave, initialSelectedId }) => {
  const [localActivities, setLocalActivities] = useState<ActivityDefinition[]>(JSON.parse(JSON.stringify(activities)));
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);

  useEffect(() => {
    if (initialSelectedId) {
        // Short timeout to ensure render
        setTimeout(() => {
            const el = document.getElementById(`activity-row-${initialSelectedId}`);
            if (el) {
                el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }, 100);
    }
  }, [initialSelectedId]);

  const handleFieldChange = (id: string, field: keyof ActivityDefinition, value: any) => {
    setLocalActivities(prev => prev.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const handleAdd = () => {
    const newActivity: ActivityDefinition = {
      id: `act-${Date.now()}`,
      code: '',
      type: 'DIV',
      start: '00:00',
      end: '23:59',
      description: '',
      pagaDiaria: false,
      relatorio: false,
      bloqueado: false,
      descontaAlmoco: false,
      verificaRepouso: false,
      naoPagaPublicada: false,
      fadiga: false,
      horarioObrigatorio: false,
      isFavorite: false,
      color: '#334155' // Default slate-700
    };
    setLocalActivities(prev => [...prev, newActivity]);
    setSelectedId(newActivity.id);
    
    // Scroll to new item
    setTimeout(() => {
        const el = document.getElementById(`activity-row-${newActivity.id}`);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 50);
  };

  const handleDelete = () => {
    if (selectedId) {
      setLocalActivities(prev => prev.filter(a => a.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleSave = () => {
    onSave(localActivities);
    onClose();
  };

  // Mapped from screenshot + System types
  const activityTypes = ['FR', 'FS', 'CURSO', 'DIV', 'NPP', 'FERIAS', 'INSS', 'GS', 'SIM', 'VOO', 'SOLO', 'INAT'];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[1200px] h-[700px] bg-white dark:bg-slate-900 shadow-2xl border border-slate-300 dark:border-slate-700 select-none flex flex-col font-sans text-xs text-slate-700 dark:text-slate-300 rounded-lg overflow-hidden">
        
        {/* Title Bar */}
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 flex justify-between items-center cursor-default shrink-0 border-b border-slate-300 dark:border-slate-700">
          <div className="flex items-center gap-2">
             <FileText size={16} className="text-blue-400" />
             <span className="font-bold tracking-wide text-sm text-slate-900 dark:text-white">
                Cadastro de Atividades
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
                 <div className="w-10 border-r border-slate-300 dark:border-slate-700 flex items-center justify-center py-2"><Star size={10} /></div>
                 <div className="w-10 border-r border-slate-300 dark:border-slate-700 flex items-center justify-center py-2"><Palette size={10} /></div>
                 <div className="w-16 border-r border-slate-300 dark:border-slate-700 px-2 py-2">Cód.</div>
                 <div className="w-24 border-r border-slate-300 dark:border-slate-700 px-2 py-2">Tipo</div>
                 {/* W-20 for Start/End as requested */}
                 <div className="w-20 border-r border-slate-300 dark:border-slate-700 px-2 py-2 text-center">Início</div>
                 <div className="w-20 border-r border-slate-300 dark:border-slate-700 px-2 py-2 text-center">Fim</div>
                 <div className="flex-1 min-w-[150px] border-r border-slate-300 dark:border-slate-700 px-2 py-2">Descrição</div>
                 <div className="w-14 border-r border-slate-300 dark:border-slate-700 px-1 py-2 text-center text-[9px] leading-tight flex items-center justify-center">Paga<br/>Diária</div>
                 <div className="w-14 border-r border-slate-300 dark:border-slate-700 px-1 py-2 text-center text-[9px] leading-tight flex items-center justify-center">Relat.</div>
                 <div className="w-14 border-r border-slate-300 dark:border-slate-700 px-1 py-2 text-center text-[9px] leading-tight flex items-center justify-center">Bloq.</div>
                 <div className="w-14 border-r border-slate-300 dark:border-slate-700 px-1 py-2 text-center text-[9px] leading-tight flex items-center justify-center">Desc.<br/>Alm.</div>
                 <div className="w-14 border-r border-slate-300 dark:border-slate-700 px-1 py-2 text-center text-[9px] leading-tight flex items-center justify-center">Verif.<br/>Rep.</div>
                 <div className="w-14 border-r border-slate-300 dark:border-slate-700 px-1 py-2 text-center text-[9px] leading-tight flex items-center justify-center">Fadiga</div>
                 <div className="w-14 border-r border-slate-300 dark:border-slate-700 px-1 py-2 text-center text-[9px] leading-tight flex items-center justify-center">Hor.<br/>Obrig.</div>
              </div>

              {/* Rows */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {localActivities.map((act) => {
                   const isSelected = act.id === selectedId;
                   return (
                     <div 
                        key={act.id} 
                        id={`activity-row-${act.id}`}
                        onClick={() => setSelectedId(act.id)}
                        className={`flex border-b border-slate-200 dark:border-slate-800 items-center h-8 text-[11px] hover:bg-slate-100 dark:bg-slate-800 cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/20' : ''}`}
                     >
                        {/* Favorite Toggle */}
                        <div className="w-10 border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">
                           <button 
                              onClick={(e) => { e.stopPropagation(); handleFieldChange(act.id, 'isFavorite', !act.isFavorite); }}
                              className={`hover:scale-110 transition-transform ${act.isFavorite ? 'text-yellow-400' : 'text-slate-700 hover:text-slate-500'}`}
                           >
                              <Star size={14} fill={act.isFavorite ? "currentColor" : "none"} />
                           </button>
                        </div>

                        {/* Color Picker */}
                        <div className="w-10 border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center p-1">
                           <input 
                              type="color" 
                              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                              value={act.color || '#334155'}
                              onChange={e => handleFieldChange(act.id, 'color', e.target.value)}
                              title="Ajustar Cor"
                           />
                        </div>

                        {/* Code */}
                        <div className="w-16 border-r border-slate-200 dark:border-slate-800 h-full p-0.5">
                           <input 
                              type="text" 
                              className={`w-full h-full px-1 outline-none uppercase font-bold bg-transparent text-slate-900 dark:text-white focus:bg-slate-100 dark:bg-slate-800 rounded-sm`}
                              value={act.code}
                              onChange={e => handleFieldChange(act.id, 'code', e.target.value)}
                           />
                        </div>

                        {/* Type */}
                        <div className="w-24 border-r border-slate-200 dark:border-slate-800 h-full p-0.5">
                           <select
                              className={`w-full h-full px-1 outline-none bg-transparent text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:bg-slate-800 rounded-sm cursor-pointer`}
                              value={act.type}
                              onChange={e => handleFieldChange(act.id, 'type', e.target.value)}
                           >
                              {activityTypes.map(t => <option key={t} value={t} className="bg-white dark:bg-slate-900">{t}</option>)}
                           </select>
                        </div>

                        {/* Start (W-20) */}
                        <div className="w-20 border-r border-slate-200 dark:border-slate-800 h-full p-0.5">
                           <input 
                              type="time" 
                              className={`w-full h-full px-1 outline-none text-center bg-transparent text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:bg-slate-800 rounded-sm`}
                              value={act.start}
                              onChange={e => handleFieldChange(act.id, 'start', e.target.value)}
                           />
                        </div>

                        {/* End (W-20) */}
                        <div className="w-20 border-r border-slate-200 dark:border-slate-800 h-full p-0.5">
                           <input 
                              type="time" 
                              className={`w-full h-full px-1 outline-none text-center bg-transparent text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:bg-slate-800 rounded-sm`}
                              value={act.end}
                              onChange={e => handleFieldChange(act.id, 'end', e.target.value)}
                           />
                        </div>

                        {/* Description (min-w-150) */}
                        <div className="flex-1 min-w-[150px] border-r border-slate-200 dark:border-slate-800 h-full p-0.5">
                            <input 
                              type="text" 
                              className={`w-full h-full px-1 outline-none uppercase bg-transparent text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:bg-slate-800 rounded-sm`}
                              value={act.description}
                              onChange={e => handleFieldChange(act.id, 'description', e.target.value)}
                           />
                        </div>

                        {/* Checkboxes */}
                        {[
                          'pagaDiaria', 'relatorio', 'bloqueado', 
                          'descontaAlmoco', 'verificaRepouso', 
                          'fadiga', 'horarioObrigatorio'
                        ].map((field) => (
                           <div key={field} className="w-14 border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">
                              <input 
                                 type="checkbox" 
                                 checked={act[field as keyof ActivityDefinition] as boolean}
                                 onChange={e => handleFieldChange(act.id, field as keyof ActivityDefinition, e.target.checked)}
                                 className="h-3 w-3 accent-blue-600 bg-slate-100 dark:bg-slate-800 border-slate-600 rounded cursor-pointer"
                              />
                           </div>
                        ))}

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
           <span>{localActivities.length} atividades cadastradas.</span>
           <span className="text-yellow-500 flex items-center gap-1"><Star size={10} /> Itens marcados aparecem na aba "Manual"</span>
        </div>

      </div>
    </div>
  );
};

export default ActivitiesModal;

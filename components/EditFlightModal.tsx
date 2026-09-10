import React, { useState } from 'react';
import { X, Save, Plane, Clock } from 'lucide-react';
import { Flight, CrewCompositionType, FlightServiceType } from '../types';

interface EditFlightModalProps {
  flight: Flight;
  onClose: () => void;
  onSave: (originalCode: string, updatedFlight: Flight) => void;
}

const EditFlightModal: React.FC<EditFlightModalProps> = ({ flight, onClose, onSave }) => {
  const [formData, setFormData] = useState<Flight>({ ...flight });

  const handleChange = (field: keyof Flight, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (dayIndex: number) => {
    setFormData(prev => {
      const days = prev.daysOfWeek.includes(dayIndex)
        ? prev.daysOfWeek.filter(d => d !== dayIndex)
        : [...prev.daysOfWeek, dayIndex].sort();
      return { ...prev, daysOfWeek: days };
    });
  };

  const dayLabels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in zoom-in-95 duration-200">
      <div className="w-[650px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-lg flex flex-col font-sans">
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center rounded-t-lg">
          <span className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
            <Plane size={16} className="text-blue-400" /> Editar Voo
          </span>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="uppercase font-bold text-slate-500 dark:text-slate-400 text-[10px]">Código</label>
              <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none uppercase" value={formData.code} onChange={e => handleChange('code', e.target.value.toUpperCase())} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="uppercase font-bold text-slate-500 dark:text-slate-400 text-[10px]">Rota</label>
              <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none uppercase" value={formData.route} onChange={e => handleChange('route', e.target.value.toUpperCase())} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="uppercase font-bold text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1"><Clock size={10} /> Início</label>
              <input type="time" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none" value={formData.start} onChange={e => handleChange('start', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="uppercase font-bold text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1"><Clock size={10} /> Fim</label>
              <input type="time" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none" value={formData.end} onChange={e => handleChange('end', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
             <label className="uppercase font-bold text-slate-500 dark:text-slate-400 text-[10px]">Frequência</label>
             <div className="flex gap-1">
                {dayLabels.map((label, idx) => (
                   <button key={idx} onClick={() => toggleDay(idx)} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors border ${formData.daysOfWeek.includes(idx) ? 'bg-blue-600 border-blue-500 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>{label}</button>
                ))}
             </div>
          </div>
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-end gap-2 rounded-b-lg">
           <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300">Cancelar</button>
           <button onClick={() => onSave(flight.code, formData)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white text-xs font-bold rounded shadow-lg flex items-center gap-2">
              <Save size={14} /> Salvar
           </button>
        </div>
      </div>
    </div>
  );
};

export default EditFlightModal;
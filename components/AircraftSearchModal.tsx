
import React, { useState, useMemo } from 'react';
import { X, Play, Maximize2, Minimize2, Plane, Save, Trash2, Edit3, Plus } from 'lucide-react';
import { Aircraft } from '../types';

interface AircraftSearchModalProps {
  onClose: () => void;
  aircraft: Aircraft[];
  onDeleteAircraft?: (id: string) => void;
  onUpdateAircraft?: (aircraft: Aircraft) => void;
  onAddAircraft?: (aircraft: Aircraft) => void;
}

const AircraftSearchModal: React.FC<AircraftSearchModalProps> = ({ onClose, aircraft, onDeleteAircraft, onUpdateAircraft, onAddAircraft }) => {
  const [viewMode, setViewMode] = useState<'SEARCH' | 'RESULTS'>('SEARCH');
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<Aircraft | null>(null);

  const [formData, setFormData] = useState({
    frota: '',
    prefixo: '',
    empresa: '',
    tipoTransp: '',
    dataRef: '21/12/2025'
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => setViewMode('RESULTS');

  const handleRowDoubleClick = (ac: Aircraft) => {
    setEditingData({ ...ac });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editingData) {
      const isNew = !aircraft.some(a => a.id === editingData.id);
      if (isNew && onAddAircraft) {
        onAddAircraft(editingData);
      } else if (onUpdateAircraft) {
        onUpdateAircraft(editingData);
      }
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDeleteAircraft && editingData && window.confirm(`Excluir aeronave ${editingData.registration}?`)) {
      onDeleteAircraft(editingData.id);
      setIsEditing(false);
    }
  };

  const handleInsert = () => {
      const newAc: Aircraft = {
          id: `AC-${Date.now()}`,
          registration: '',
          model: 'A321-200',
          config: 'Y220',
          status: 'OPERATIONAL',
          hours: 0,
          cycles: 0,
          nextCheck: '00/00/0000',
          paxCapacity: 220,
          cargoCapacity: 0,
          hasAPU: true,
          hasStairs: false,
          hasSeat: true,
          isRestricted: false,
          notes: '',
          company: 'LEVU AIR CARGO',
          dateStart: '00/00/0000',
          dateEnd: '00/00/0000'
      };
      setEditingData(newAc);
      setIsEditing(true);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`
          bg-white dark:bg-slate-900 shadow-2xl border border-slate-300 dark:border-slate-700 select-none flex flex-col transition-all duration-300 relative
          ${viewMode === 'RESULTS' && !isEditing ? 'w-[1100px] h-[600px]' : isEditing ? 'w-[1100px] h-auto' : 'w-[500px] h-auto'}
      `}>
        
        {/* Title Bar */}
        <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-3 py-2 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
             <div className="w-4 h-4 rounded-sm bg-blue-600 flex items-center justify-center">
                <Play size={10} className="text-slate-900 dark:text-white fill-white" />
             </div>
             <span className="text-slate-200 text-[15px] font-bold tracking-wide font-mono uppercase">
                Cadastro de Aeronaves {isEditing ? '- Detalhes' : viewMode === 'RESULTS' ? '- Listagem' : '- Consulta'}
             </span>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-700 rounded transition-colors"><Minimize2 size={12} /></button>
            <button className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-700 rounded transition-colors"><Maximize2 size={12} /></button>
            <button onClick={onClose} className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-red-600 hover:text-slate-900 dark:text-white rounded transition-colors"><X size={14} /></button>
          </div>
        </div>

        {/* --- VIEW: SEARCH --- */}
        {viewMode === 'SEARCH' && (
          <>
            <div className="p-8 flex flex-col gap-4 font-sans text-[15px] text-slate-700 dark:text-slate-300 items-center">
              <div className="flex items-center w-full max-w-[350px]">
                <label className="w-28 text-right pr-3 text-slate-600 dark:text-slate-400 font-bold">Frota:</label>
                <select className="flex-1 h-8 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 font-bold px-1 outline-none rounded-sm" value={formData.frota} onChange={e => handleChange('frota', e.target.value)}>
                  <option value=""></option>
                  <option value="A321">A321F</option>
                  <option value="A320">A320F</option>
                </select>
              </div>
              <div className="flex items-center w-full max-w-[350px]">
                <label className="w-28 text-right pr-3 text-slate-600 dark:text-slate-400 font-bold">Prefixo:</label>
                <input type="text" className="flex-1 h-8 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-2 focus:border-blue-500 outline-none rounded-sm uppercase" value={formData.prefixo} onChange={e => handleChange('prefixo', e.target.value.toUpperCase())} />
              </div>
              <div className="flex items-center w-full max-w-[350px]">
                <label className="w-28 text-right pr-3 text-slate-600 dark:text-slate-400 font-bold">Empresa:</label>
                <select className="flex-1 h-8 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-1 outline-none rounded-sm" value={formData.empresa} onChange={e => handleChange('empresa', e.target.value)}>
                  <option value=""></option>
                  <option value="LEVU">LEVU AIR CARGO</option>
                </select>
              </div>
              <div className="flex items-center w-full max-w-[350px]">
                <label className="w-28 text-right pr-3 text-slate-600 dark:text-slate-400 font-bold">Tipo Transp.:</label>
                <select className="flex-1 h-8 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-1 outline-none rounded-sm" value={formData.tipoTransp} onChange={e => handleChange('tipoTransp', e.target.value)}>
                  <option value=""></option>
                  <option value="PAX">PASSAGEIRO</option>
                  <option value="CARGO">CARGA</option>
                </select>
              </div>
              <div className="flex items-center w-full max-w-[350px] mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="w-28 text-right pr-3 text-slate-600 dark:text-slate-400 font-bold">Dt. Ref.:</label>
                <input type="text" className="w-32 h-8 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-2 outline-none rounded-sm text-blue-400 font-mono font-bold" value={formData.dataRef} onChange={e => handleChange('dataRef', e.target.value)} />
              </div>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-center gap-3">
              <button onClick={handleSearch} className="min-w-[100px] py-2 bg-slate-700 border border-slate-600 text-slate-100 text-[14px] font-bold rounded shadow active:scale-95">Ok</button>
              <button onClick={onClose} className="min-w-[100px] py-2 bg-slate-700 border border-slate-600 text-slate-100 text-[14px] font-bold rounded shadow active:scale-95">Cancelar</button>
              <button onClick={() => setFormData(prev => ({...prev, frota: '', prefixo: ''}))} className="min-w-[100px] py-2 bg-slate-700 border border-slate-600 text-slate-100 text-[14px] font-bold rounded shadow active:scale-95">Limpar</button>
            </div>
          </>
        )}

        {/* --- VIEW: RESULTS --- */}
        {viewMode === 'RESULTS' && !isEditing && (
          <div className="flex flex-col h-full overflow-hidden">
             <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 grid grid-cols-[100px_100px_100px_80px_80px_100px_1fr] text-[13px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                <div className="px-2 py-2 border-r border-slate-300 dark:border-slate-700">Modelo</div>
                <div className="px-2 py-2 border-r border-slate-300 dark:border-slate-700">Matrícula</div>
                <div className="px-2 py-2 border-r border-slate-300 dark:border-slate-700 text-right">Payload</div>
                <div className="px-2 py-2 border-r border-slate-300 dark:border-slate-700 text-right">HST</div>
                <div className="px-2 py-2 border-r border-slate-300 dark:border-slate-700 text-right">Ciclos</div>
                <div className="px-2 py-2 border-r border-slate-300 dark:border-slate-700 text-center">APU</div>
                <div className="px-2 py-2">Empresa</div>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                {aircraft.map((ac, idx) => {
                   const isSelected = selectedRow === idx;
                   return (
                      <div key={ac.id} onClick={() => setSelectedRow(idx)} onDoubleClick={() => handleRowDoubleClick(ac)}
                           className={`grid grid-cols-[100px_100px_100px_80px_80px_100px_1fr] text-[13px] border-b border-slate-200 dark:border-slate-800 cursor-pointer font-mono ${isSelected ? 'bg-blue-900/30 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800'}`}>
                         <div className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-800/50 flex items-center relative">
                            {isSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-red-500 border-y-[4px] border-y-transparent"></div>}
                            <span className={isSelected ? 'pl-2' : ''}>{ac.model}</span>
                         </div>
                         <div className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-800/50 flex items-center font-bold tracking-tight">{ac.registration}</div>
                         <div className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-800/50 flex items-center justify-end">{ac.payload || ac.cargoCapacity || ac.paxCapacity}</div>
                         <div className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-800/50 flex items-center justify-end text-blue-500">{ac.hours}</div>
                         <div className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-800/50 flex items-center justify-end">{ac.cycles}</div>
                         <div className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-800/50 flex items-center justify-center font-bold">
                            <span className={ac.apuStatus === 'AVLB' ? 'text-emerald-500' : 'text-red-500'}>{ac.apuStatus || 'NAVLB'}</span>
                         </div>
                         <div className="px-2 py-1.5 flex items-center truncate">{ac.company}</div>
                      </div>
                   );
                })}
             </div>
             <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center text-[13px] text-slate-600 dark:text-slate-400">
                <span>{aircraft.length} registros encontrados.</span>
                <div className="flex gap-2">
                   <button onClick={() => setViewMode('SEARCH')} className="px-4 py-1.5 bg-slate-700 border border-slate-600 rounded text-slate-100">Nova Consulta</button>
                   <button onClick={handleInsert} className="px-4 py-1.5 bg-slate-700 border border-slate-600 rounded flex items-center gap-1 text-slate-100"><Plus size={14} /> Inserir</button>
                   <button onClick={onClose} className="px-4 py-1.5 bg-slate-700 border border-slate-600 rounded text-slate-100">Sair</button>
                </div>
             </div>
          </div>
        )}

        {/* --- VIEW: EDIT DETAILS --- */}
        {isEditing && editingData && (
           <div className="flex flex-col bg-white dark:bg-slate-900 p-4 gap-4">
              <div className="flex flex-wrap gap-x-2 gap-y-3 bg-slate-100 dark:bg-slate-800 p-3 border border-slate-300 dark:border-slate-700 rounded-sm">
                 <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-0.5">Prefixo</label><input type="text" className="w-24 h-7 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 outline-none font-bold" value={editingData.registration} onChange={e => setEditingData({...editingData, registration: e.target.value.toUpperCase()})} /></div>
                 <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-0.5">Frota</label><select className="w-28 h-7 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-500 text-[13px] px-1 outline-none font-bold" value={editingData.model} onChange={e => setEditingData({...editingData, model: e.target.value})}><option value="A321-200">A321-200</option><option value="A320-200">A320-200</option><option value="B737-800">B737-800</option></select></div>
                 <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-0.5">Config.</label><input type="text" className="w-20 h-7 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 outline-none" value={editingData.config} onChange={e => setEditingData({...editingData, config: e.target.value})} /></div>
                 <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-0.5">Ref. Reduz.</label><input type="text" className="w-24 h-7 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 outline-none bg-slate-200 dark:bg-slate-800" value={editingData.registration.split('-')[1] || ''} readOnly /></div>
                 <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase text-center mb-0.5">Pax</label><input type="text" className="w-16 h-7 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 text-center outline-none" value={editingData.paxCapacity} onChange={e => setEditingData({...editingData, paxCapacity: parseInt(e.target.value) || 0})} /></div>
                 <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase text-center mb-0.5">Payload</label><input type="text" className="w-24 h-7 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 text-center outline-none" value={editingData.payload || editingData.cargoCapacity} onChange={e => setEditingData({...editingData, payload: parseInt(e.target.value) || 0})} /></div>
                 <div className="flex flex-col items-center"><label className="text-[12px] font-bold text-slate-500 uppercase mb-0.5">APU</label><input type="checkbox" className="mt-1.5 w-4 h-4 cursor-pointer" checked={editingData.hasAPU} onChange={e => setEditingData({...editingData, hasAPU: e.target.checked})} /></div>
                 <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-0.5">APU Status</label><select className="w-24 h-7 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-1 outline-none" value={editingData.apuStatus || ''} onChange={e => setEditingData({...editingData, apuStatus: e.target.value as any})}><option value="NAVLB">NAVLB</option><option value="AVLB">AVLB</option></select></div>
                 <div className="flex flex-col items-center"><label className="text-[12px] font-bold text-slate-500 uppercase mb-0.5">Esc.</label><input type="checkbox" className="mt-1.5 w-4 h-4 cursor-pointer" checked={editingData.hasStairs} onChange={e => setEditingData({...editingData, hasStairs: e.target.checked})} /></div>
                 <div className="flex flex-col items-center"><label className="text-[12px] font-bold text-slate-500 uppercase mb-0.5">Ass.</label><input type="checkbox" className="mt-1.5 w-4 h-4 cursor-pointer" checked={editingData.hasSeat} onChange={e => setEditingData({...editingData, hasSeat: e.target.checked})} /></div>
                 <div className="flex flex-col items-center"><label className="text-[12px] font-bold text-slate-500 uppercase mb-0.5">Res.</label><input type="checkbox" className="mt-1.5 w-4 h-4 cursor-pointer" checked={editingData.isRestricted} onChange={e => setEditingData({...editingData, isRestricted: e.target.checked})} /></div>
                 <div className="flex flex-col flex-1"><label className="text-[12px] font-bold text-slate-500 uppercase mb-0.5">Texto Aeronave</label><input type="text" className="w-full h-7 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 outline-none" value={editingData.notes} onChange={e => setEditingData({...editingData, notes: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-[160px_160px_1fr_160px] gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                 <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2"><label className="w-14 text-[13px] text-slate-500 text-right font-bold">Início:</label><input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-500 text-[13px] px-2 h-7 outline-none font-mono" value={editingData.dateStart} onChange={e => setEditingData({...editingData, dateStart: e.target.value})} /></div>
                    <div className="flex items-center gap-2"><label className="w-14 text-[13px] text-slate-500 text-right font-bold">Fim:</label><input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-500 text-[13px] px-2 h-7 outline-none font-mono" value={editingData.dateEnd} onChange={e => setEditingData({...editingData, dateEnd: e.target.value})} /></div>
                 </div>
                 <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2"><label className="w-16 text-[13px] text-slate-500 text-right font-bold">Status:</label>
                        <select className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-1 h-7 outline-none font-bold" value={editingData.status} onChange={e => setEditingData({...editingData, status: e.target.value as any})}>
                            <option value="OPERATIONAL">OPERACIONAL</option>
                            <option value="MAINTENANCE">MANUTENÇÃO</option>
                            <option value="AOG">AOG</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2"><label className="w-16 text-[13px] text-slate-500 text-right font-bold">Check:</label><input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 h-7 outline-none font-mono" value={editingData.nextCheck} onChange={e => setEditingData({...editingData, nextCheck: e.target.value})} /></div>
                 </div>
                 <div className="flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-800/30 rounded border border-slate-200 dark:border-slate-800">
                    <Plane className="text-slate-700" size={64} />
                 </div>
                 <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2"><label className="w-24 text-[13px] text-slate-500 text-right font-bold">Hr. Inicial:</label><input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 h-7 outline-none text-right font-mono" value={editingData.hours} onChange={e => setEditingData({...editingData, hours: parseInt(e.target.value) || 0})} /></div>
                    <div className="flex items-center gap-2"><label className="w-24 text-[13px] text-slate-500 text-right font-bold">Cicl. Inicial:</label><input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 h-7 outline-none text-right font-mono" value={editingData.cycles} onChange={e => setEditingData({...editingData, cycles: parseInt(e.target.value) || 0})} /></div>
                 </div>
              </div>
              <div className="flex w-full justify-between items-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-3 -mx-4 -mb-4 mt-2 shrink-0 rounded-b-sm">
                 <div className="flex gap-2">
                    <button className="px-5 py-2 bg-slate-700 border border-slate-600 text-slate-100 text-[13px] font-bold rounded shadow active:scale-95 transition-transform">Inserir</button>
                    <button onClick={handleDelete} className="px-5 py-2 bg-slate-700 border border-slate-600 text-red-300 hover:bg-red-900/50 text-[13px] font-bold rounded shadow active:scale-95 flex items-center gap-2 transition-colors"><Trash2 size={16} /> Excluir</button>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={handleSave} className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[14px] font-bold rounded shadow-lg flex items-center gap-2 active:scale-95 transition-all"><Save size={16} /> Salvar</button>
                    <button onClick={() => setIsEditing(false)} className="px-5 py-2 bg-slate-700 border border-slate-600 text-slate-100 text-[13px] font-bold rounded shadow active:scale-95 flex items-center gap-2 transition-transform"><X size={16} /> Cancelar</button>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AircraftSearchModal;

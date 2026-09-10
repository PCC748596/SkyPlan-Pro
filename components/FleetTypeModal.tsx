
import React, { useState, useMemo } from 'react';
import { X, Play, Maximize2, Minimize2, Plane, Save, Trash2, Edit3, Settings } from 'lucide-react';
import { FleetType } from '../types';

interface FleetTypeModalProps {
  onClose: () => void;
  fleetTypes: FleetType[];
  onDeleteFleet?: (id: string) => void;
  onUpdateFleet?: (fleet: FleetType) => void;
  onAddFleet?: (fleet: FleetType) => void;
}

const FleetTypeModal: React.FC<FleetTypeModalProps> = ({ onClose, fleetTypes, onDeleteFleet, onUpdateFleet, onAddFleet }) => {
  const [viewMode, setViewMode] = useState<'SEARCH' | 'RESULTS'>('SEARCH');
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<FleetType | null>(null);

  const [searchData, setSearchData] = useState({
    codigo: '',
    fabricante: '',
    tipoTransporte: ''
  });

  const handleSearch = () => setViewMode('RESULTS');

  const handleRowDoubleClick = (fleet: FleetType) => {
    setEditingData({ ...fleet });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editingData) {
      if (onUpdateFleet) onUpdateFleet(editingData);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDeleteFleet && editingData && window.confirm(`Excluir modelo ${editingData.code}?`)) {
      onDeleteFleet(editingData.id);
      setIsEditing(false);
    }
  };

  const handleInsert = () => {
      const newFleet: FleetType = {
          id: `FLT-${Date.now()}`,
          code: 'NOVO',
          speed: 0,
          capaxPax: 0,
          capaxCarga: 0,
          fuel1: 0,
          fuel2: 0,
          fuelTaxi: 0,
          capaxMax: 0,
          iata: '',
          icao: '',
          internalCode: '',
          isCompanyFleet: true,
          color: 'Branco',
          qtyMaintenance: 0,
          isJet: true,
          isMVT: false,
          hourValue: 0,
          wingType: 'Fixa',
          manufacturer: '',
          transportType: 'Carga'
      };
      setEditingData(newFleet);
      setIsEditing(true);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`
          bg-white dark:bg-slate-900 shadow-2xl border border-slate-300 dark:border-slate-700 select-none flex flex-col transition-all duration-300 relative
          ${viewMode === 'RESULTS' && !isEditing ? 'w-[1100px] h-[600px]' : isEditing ? 'w-[1200px] h-auto' : 'w-[450px] h-auto'}
      `}>
        
        {/* Title Bar */}
        <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-3 py-2 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
             <div className="w-4 h-4 rounded-sm bg-blue-600 flex items-center justify-center">
                <Settings size={10} className="text-slate-900 dark:text-white fill-white" />
             </div>
             <span className="text-slate-200 text-xs font-bold tracking-wide font-mono uppercase">
                [C02] Cadastro de Frota {isEditing ? '- Detalhes' : viewMode === 'RESULTS' ? '- Listagem' : '- Consulta'}
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
            <div className="p-8 flex flex-col gap-4 font-sans text-[12px] text-slate-700 dark:text-slate-300 items-center">
              <div className="flex items-center w-full max-w-[300px]">
                <label className="w-24 text-right pr-3 text-slate-600 dark:text-slate-400 font-bold">Código:</label>
                <input type="text" className="flex-1 h-6 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 font-bold px-2 focus:border-blue-500 outline-none rounded-sm uppercase" value={searchData.codigo} onChange={e => setSearchData({...searchData, codigo: e.target.value.toUpperCase()})} />
              </div>
              <div className="flex items-center w-full max-w-[300px]">
                <label className="w-24 text-right pr-3 text-slate-600 dark:text-slate-400 font-bold">Fabricante:</label>
                <input type="text" className="flex-1 h-6 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-2 focus:border-blue-500 outline-none rounded-sm uppercase" value={searchData.fabricante} onChange={e => setSearchData({...searchData, fabricante: e.target.value.toUpperCase()})} />
              </div>
              <div className="flex items-center w-full max-w-[300px]">
                <label className="w-24 text-right pr-3 text-slate-600 dark:text-slate-400 font-bold">Transporte:</label>
                <select className="flex-1 h-6 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-1 outline-none rounded-sm" value={searchData.tipoTransporte} onChange={e => setSearchData({...searchData, tipoTransporte: e.target.value})}>
                  <option value=""></option>
                  <option value="Carga">CARGA</option>
                  <option value="Passageiro">PASSAGEIRO</option>
                  <option value="Misto">MISTO</option>
                </select>
              </div>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-center gap-3">
              <button onClick={handleSearch} className="min-w-[90px] py-1.5 bg-slate-700 border border-slate-600 text-slate-900 dark:text-white text-[11px] font-bold rounded shadow active:scale-95">Ok</button>
              <button onClick={onClose} className="min-w-[90px] py-1.5 bg-slate-700 border border-slate-600 text-slate-900 dark:text-white text-[11px] font-bold rounded shadow active:scale-95">Cancelar</button>
              <button onClick={() => setSearchData({codigo: '', fabricante: '', tipoTransporte: ''})} className="min-w-[90px] py-1.5 bg-slate-700 border border-slate-600 text-slate-900 dark:text-white text-[11px] font-bold rounded shadow active:scale-95">Limpar</button>
            </div>
          </>
        )}

        {/* --- VIEW: RESULTS --- */}
        {viewMode === 'RESULTS' && !isEditing && (
          <div className="flex flex-col h-full overflow-hidden">
             <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase overflow-x-auto shrink-0 custom-scrollbar">
                <div className="min-w-[80px] px-2 py-1.5 border-r border-slate-300 dark:border-slate-700">Código</div>
                <div className="min-w-[80px] px-2 py-1.5 border-r border-slate-300 dark:border-slate-700 text-right">Veloc.</div>
                <div className="min-w-[80px] px-2 py-1.5 border-r border-slate-300 dark:border-slate-700 text-right">Pax</div>
                <div className="min-w-[100px] px-2 py-1.5 border-r border-slate-300 dark:border-slate-700 text-right">Carga</div>
                <div className="min-w-[100px] px-2 py-1.5 border-r border-slate-300 dark:border-slate-700 text-right">Comb.</div>
                <div className="min-w-[100px] px-2 py-1.5 border-r border-slate-300 dark:border-slate-700 text-right">IATA/ICAO</div>
                <div className="min-w-[150px] px-2 py-1.5 border-r border-slate-300 dark:border-slate-700">Fabricante</div>
                <div className="min-w-[100px] px-2 py-1.5 border-r border-slate-300 dark:border-slate-700">Transporte</div>
                <div className="flex-1 px-2 py-1.5">Cor</div>
             </div>
             <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar bg-white dark:bg-slate-900">
                {fleetTypes.map((ft, idx) => {
                   const isSelected = selectedRow === idx;
                   return (
                      <div key={ft.id} onClick={() => setSelectedRow(idx)} onDoubleClick={() => handleRowDoubleClick(ft)}
                           className={`flex text-[10px] border-b border-slate-200 dark:border-slate-800 cursor-pointer font-mono shrink-0 min-w-max ${isSelected ? 'bg-blue-900/30 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800'}`}>
                         <div className="min-w-[80px] px-2 py-1 border-r border-slate-200 dark:border-slate-800/50 flex items-center relative">
                            {isSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-red-500 border-y-[4px] border-y-transparent"></div>}
                            <span className={isSelected ? 'pl-2' : ''}>{ft.code}</span>
                         </div>
                         <div className="min-w-[80px] px-2 py-1 border-r border-slate-200 dark:border-slate-800/50 flex items-center justify-end text-blue-400">{ft.speed}</div>
                         <div className="min-w-[80px] px-2 py-1 border-r border-slate-200 dark:border-slate-800/50 flex items-center justify-end">{ft.capaxPax}</div>
                         <div className="min-w-[100px] px-2 py-1 border-r border-slate-200 dark:border-slate-800/50 flex items-center justify-end">{ft.capaxCarga.toLocaleString()}</div>
                         <div className="min-w-[100px] px-2 py-1 border-r border-slate-200 dark:border-slate-800/50 flex items-center justify-end text-blue-400">{ft.fuel1.toLocaleString()}</div>
                         <div className="min-w-[100px] px-2 py-1 border-r border-slate-200 dark:border-slate-800/50 flex items-center justify-center">{ft.iata}/{ft.icao}</div>
                         <div className="min-w-[150px] px-2 py-1 border-r border-slate-200 dark:border-slate-800/50 flex items-center uppercase">{ft.manufacturer}</div>
                         <div className="min-w-[100px] px-2 py-1 border-r border-slate-200 dark:border-slate-800/50 flex items-center">{ft.transportType}</div>
                         <div className="flex-1 px-2 py-1 flex items-center">{ft.color}</div>
                      </div>
                   );
                })}
             </div>
             <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-400">
                <span>{fleetTypes.length} registros encontrados.</span>
                <div className="flex gap-2">
                   <button onClick={() => setViewMode('SEARCH')} className="px-3 py-1 bg-slate-700 border border-slate-600 rounded">Nova Consulta</button>
                   <button onClick={handleInsert} className="px-3 py-1 bg-slate-700 border border-slate-600 rounded">Novo Modelo</button>
                   <button onClick={onClose} className="px-3 py-1 bg-slate-700 border border-slate-600 rounded">Sair</button>
                </div>
             </div>
          </div>
        )}

        {/* --- VIEW: EDIT DETAILS --- */}
        {isEditing && editingData && (
           <div className="flex flex-col bg-white dark:bg-slate-900 p-4 gap-4 overflow-x-auto custom-scrollbar">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 border border-slate-300 dark:border-slate-700 rounded-sm flex items-center gap-1 shrink-0 overflow-x-auto custom-scrollbar whitespace-nowrap min-w-max">
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1">Código</label>
                    <input type="text" className="w-16 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[10px] px-1 outline-none font-bold" value={editingData.code} onChange={e => setEditingData({...editingData, code: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1 text-right">Velocidade</label>
                    <input type="text" className="w-16 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[10px] px-1 text-right outline-none" value={editingData.speed} onChange={e => setEditingData({...editingData, speed: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1 text-right">Pax</label>
                    <input type="text" className="w-16 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[10px] px-1 text-right outline-none" value={editingData.capaxPax} onChange={e => setEditingData({...editingData, capaxPax: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1 text-right">Carga</label>
                    <input type="text" className="w-20 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[10px] px-1 text-right outline-none" value={editingData.capaxCarga} onChange={e => setEditingData({...editingData, capaxCarga: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1 text-right">Combust.</label>
                    <input type="text" className="w-20 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[10px] px-1 text-right outline-none" value={editingData.fuel1} onChange={e => setEditingData({...editingData, fuel1: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1 text-right">Combust. 2</label>
                    <input type="text" className="w-20 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[10px] px-1 text-right outline-none" value={editingData.fuel2} onChange={e => setEditingData({...editingData, fuel2: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1 text-right">Comb. Táxi</label>
                    <input type="text" className="w-20 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[10px] px-1 text-right outline-none" value={editingData.fuelTaxi} onChange={e => setEditingData({...editingData, fuelTaxi: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1 text-right">Capac. MAX</label>
                    <input type="text" className="w-20 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[10px] px-1 text-right outline-none" value={editingData.capaxMax} onChange={e => setEditingData({...editingData, capaxMax: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1">IATA</label>
                    <input type="text" className="w-14 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[10px] px-1 outline-none uppercase" value={editingData.iata} onChange={e => setEditingData({...editingData, iata: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1">ICAO</label>
                    <input type="text" className="w-14 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[10px] px-1 outline-none uppercase" value={editingData.icao} onChange={e => setEditingData({...editingData, icao: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1">Cód. Int.</label>
                    <input type="text" className="w-16 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[10px] px-1 outline-none uppercase" value={editingData.internalCode} onChange={e => setEditingData({...editingData, internalCode: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="flex flex-col items-center"><label className="text-[9px] font-bold text-slate-500 uppercase">Empresa</label>
                    <input type="checkbox" className="mt-1" checked={editingData.isCompanyFleet} onChange={e => setEditingData({...editingData, isCompanyFleet: e.target.checked})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1">Cor</label>
                    <select className="w-20 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[10px] px-1 outline-none" value={editingData.color} onChange={e => setEditingData({...editingData, color: e.target.value})}>
                       <option value="Branco">Branco</option><option value="Azul">Azul</option><option value="Vermelho">Vermelho</option>
                    </select>
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1 text-right">Qtd. Mnt</label>
                    <input type="text" className="w-14 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[10px] px-1 text-right outline-none" value={editingData.qtyMaintenance} onChange={e => setEditingData({...editingData, qtyMaintenance: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="flex flex-col items-center"><label className="text-[9px] font-bold text-slate-500 uppercase">Jato</label>
                    <input type="checkbox" className="mt-1" checked={editingData.isJet} onChange={e => setEditingData({...editingData, isJet: e.target.checked})} />
                 </div>
                 <div className="flex flex-col items-center"><label className="text-[9px] font-bold text-slate-500 uppercase">MVT</label>
                    <input type="checkbox" className="mt-1" checked={editingData.isMVT} onChange={e => setEditingData({...editingData, isMVT: e.target.checked})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1 text-right">Valor Hr</label>
                    <input type="text" className="w-20 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[10px] px-1 text-right outline-none" value={editingData.hourValue} onChange={e => setEditingData({...editingData, hourValue: parseFloat(e.target.value) || 0})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1">Asa</label>
                    <select className="w-16 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[10px] px-1 outline-none" value={editingData.wingType} onChange={e => setEditingData({...editingData, wingType: e.target.value as any})}>
                       <option value="Fixa">Fixa</option><option value="Rotativa">Rotativa</option>
                    </select>
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1">Fabricante</label>
                    <input type="text" className="w-32 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[10px] px-1 outline-none font-bold" value={editingData.manufacturer} onChange={e => setEditingData({...editingData, manufacturer: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-500 uppercase px-1">Transporte</label>
                    <select className="w-24 h-5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[10px] px-1 outline-none" value={editingData.transportType} onChange={e => setEditingData({...editingData, transportType: e.target.value as any})}>
                       <option value="Carga">Carga</option><option value="Passageiro">Passageiro</option><option value="Misto">Misto</option>
                    </select>
                 </div>
              </div>

              <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 p-3 -m-4 mt-0 shrink-0">
                 <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-slate-700 border border-slate-600 text-slate-900 dark:text-white text-xs font-bold rounded shadow active:scale-95">Relatório</button>
                    <button onClick={handleDelete} className="px-4 py-1.5 bg-slate-700 border border-slate-600 text-red-400 text-xs font-bold rounded shadow active:scale-95 flex items-center gap-2"><Trash2 size={12} /> Excluir</button>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={handleSave} className="px-6 py-1.5 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white text-xs font-bold rounded shadow-lg flex items-center gap-2 active:scale-95 transition-all"><Save size={14} /> Salvar</button>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 bg-slate-700 border border-slate-600 text-slate-900 dark:text-white text-xs font-bold rounded shadow active:scale-95 flex items-center gap-2"><X size={14} /> Cancelar</button>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default FleetTypeModal;

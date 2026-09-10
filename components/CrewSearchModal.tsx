
import React, { useState, useMemo } from 'react';
import { X, Play, Plus, Trash2, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { CrewMember, QualificationDefinition, CrewBase } from '../types';
import CrewDetailsModal from './CrewDetailsModal';

interface CrewSearchModalProps {
  onClose: () => void;
  crew: CrewMember[];
  bases: CrewBase[];
  qualifications?: QualificationDefinition[];
  onDeleteCrew?: (id: string) => void;
  onUpdateCrew?: (updatedCrew: CrewMember) => void; 
  onAddCrew?: (newCrew: CrewMember) => void; 
  onSyncQualifications?: () => void;
}

const CrewSearchModal: React.FC<CrewSearchModalProps> = ({ onClose, crew, bases, qualifications, onDeleteCrew, onUpdateCrew, onAddCrew, onSyncQualifications }) => {
  const [viewMode, setViewMode] = useState<'SEARCH' | 'RESULTS'>('SEARCH');
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCrewForDetails, setSelectedCrewForDetails] = useState<any>(null);

  // Sorting & Filtering State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'senioridade', direction: 'asc' });
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  const [formData, setFormData] = useState({
    nomeGuerra: '',
    nome: '',
    matricula: '',
    codAnac: '',
    cargo: '',
    frota: '',
    base: '',
    funcao: '',
    ativo: true,
    dataRef: '03/01/2026'
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setViewMode('RESULTS');
  };

  // Helper to format YYYY-MM-DD to DD/MM/YYYY for display
  const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      if (dateStr.includes('/')) return dateStr; 
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
  };

  const toISODate = (dateStr: string) => {
      if (!dateStr || !dateStr.includes('/')) return dateStr;
      const [d, m, y] = dateStr.split('/');
      return `${y}-${m}-${d}`;
  };

  const enrichedCrew = useMemo(() => {
    return crew.map((c, idx) => {
      // Use actual data from state, fallback to empty string if missing
      return {
        ...c,
        codAnac: c.codAnac || '',
        matricula: c.matricula || c.id.padStart(3, '0'),
        cpf: c.cpf || '',
        admissao: formatDate(c.admissionDate) || '',
        desligamento: formatDate(c.resignationDate) || '',
        nascimento: c.nascimento || '',
        senioridade: c.seniority || '', // Use stored seniority or empty
        sexo: c.sexo || 'M',
        // Pass other fields required by modal
        endereco: c.endereco,
        cidade: c.cidade,
        uf: c.uf,
        pais: c.pais,
        cep: c.cep,
        bairro: c.bairro,
        email: c.email,
        celular: c.celular
      };
    });
  }, [crew]);

  const filteredAndSortedCrew = useMemo(() => {
      let data = [...enrichedCrew];

      // Filter
      if (showOnlyActive) {
          data = data.filter(c => c.isOn);
      }

      // Sort
      if (sortConfig) {
          data.sort((a, b) => {
              // Special handling for numeric fields if needed
              if (sortConfig.key === 'senioridade') {
                  const valA = parseInt(a.senioridade || '999999', 10);
                  const valB = parseInt(b.senioridade || '999999', 10);
                  return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
              }

              const valA = (a as any)[sortConfig.key]?.toString().toLowerCase() || '';
              const valB = (b as any)[sortConfig.key]?.toString().toLowerCase() || '';

              if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
              if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }

      return data;
  }, [enrichedCrew, sortConfig, showOnlyActive]);

  const toggleView = () => {
    if (viewMode === 'RESULTS') setViewMode('SEARCH');
  };
  
  const handleRowDoubleClick = (crewData: any) => {
    setSelectedCrewForDetails(crewData);
    setShowDetails(true);
  };

  const handleDelete = () => {
      if (selectedRow !== null && onDeleteCrew) {
          const crewToDelete = filteredAndSortedCrew[selectedRow];
          if (crewToDelete) {
              if (window.confirm(`Tem certeza que deseja excluir ${crewToDelete.name}?`)) {
                  onDeleteCrew(crewToDelete.id);
                  setSelectedRow(null);
              }
          }
      }
  };

  const handleInsert = () => {
      const nextId = (Math.max(...crew.map(c => parseInt(c.id) || 0), 0) + 1).toString();
      const newCrew = {
          id: nextId,
          name: '',
          role: 'COP', // Default
          category: 'TRIPULANTE_VOO',
          nationality: 'BRASILEIRO',
          licenseValid: true,
          base: 'VCP',
          equipment: 'A320', 
          adminTag: null,
          operationalTag: 'GS', // DEFAULT TO GS ON ADMISSION
          instructionTag: null,
          syntheticTag: null,
          tagHistory: [], // Initialized as empty array instead of null
          fatigueStatus: 'FIT',
          stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
          isOn: true,
          // Empty extra fields
          codAnac: '',
          matricula: '',
          cpf: '',
          admissao: '',
          nascimento: '',
          sexo: 'M',
          senioridade: '',
          isAqExp: false
      };
      setSelectedCrewForDetails(newCrew);
      setShowDetails(true);
  };

  const handleSaveDetails = (updatedData: any) => {
      const original = crew.find(c => c.id === updatedData.id);
      
      // Construct proper CrewMember object from the flat updatedData
      const crewObject: CrewMember = {
          ...(original || {
             id: updatedData.id,
             role: 'COP',
             category: 'TRIPULANTE_VOO',
             nationality: 'BRASILEIRO',
             licenseValid: true,
             base: 'VCP',
             equipment: 'A320',
             adminTag: null,
             operationalTag: 'GS', // Default for new
             instructionTag: null,
             syntheticTag: null,
             tagHistory: [],
             fatigueStatus: 'FIT',
             stats: { flightHours: 0, annualFlightHours: 0, baseAnnualHours: 0, instructionHours: 0, dutyTimeMonth: 0, dutyTimeWeek: 0, standbyCount: 0, daysOff: 0, frCount: 0, fsCount: 0, dutyDays: 0 },
             isOn: true
          }),
          name: updatedData.nome,
          admissionDate: updatedData.admissionDate, // Already ISO from modal
          resignationDate: updatedData.resignationDate, // Already ISO
          isOn: !updatedData.inativo,
          seniority: updatedData.senioridade, // Map senioridade back to seniority
          isAqExp: updatedData.isAqExp, // Correctly save isAqExp
          
          // TECHNICAL DATA MAPPING
          role: updatedData.role,
          base: updatedData.base,
          equipment: updatedData.equipment,
          adminTag: updatedData.adminTag,
          instructionTag: updatedData.instructionTag,
          syntheticTag: updatedData.syntheticTag,

          // Map Technical Data Dates
          roleDateStart: updatedData.roleDateStart,
          roleDateEnd: updatedData.roleDateEnd,
          equipmentDateStart: updatedData.equipmentDateStart,
          equipmentDateEnd: updatedData.equipmentDateEnd,
          baseDateStart: updatedData.baseDateStart,
          baseDateEnd: updatedData.baseDateEnd,
          tagDateStart: updatedData.tagDateStart,
          tagDateEnd: updatedData.tagDateEnd,
          qualifications: updatedData.qualifications,

          // Map extra fields back
          codAnac: updatedData.codAnac,
          matricula: updatedData.matricula,
          cpf: updatedData.cpf,
          nascimento: updatedData.nascimento,
          sexo: updatedData.sexo,
          email: updatedData.email,
          celular: updatedData.celular,
          endereco: updatedData.endereco,
          cidade: updatedData.cidade,
          uf: updatedData.uf,
          pais: updatedData.pais,
          cep: updatedData.cep,
          bairro: updatedData.bairro
      };

      if (original) {
          if (onUpdateCrew) onUpdateCrew(crewObject);
      } else {
          if (onAddCrew) onAddCrew(crewObject);
      }
      setShowDetails(false);
  };

  const handleSort = (key: string) => {
      setSortConfig(current => {
          if (current?.key === key) {
              return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
          }
          return { key, direction: 'asc' };
      });
  };

  const renderSortArrow = (key: string) => {
      if (sortConfig?.key === key) {
          return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline" /> : <ArrowDown size={12} className="ml-1 inline" />;
      }
      return null;
  };

  // Define grid columns layout - Added Seniority at start
  const gridColsClass = "grid-cols-[70px_1fr_2fr_100px_80px_120px_100px_100px]";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-900 shadow-2xl border border-slate-300 dark:border-slate-700 select-none flex flex-col transition-all duration-300 relative ${viewMode === 'RESULTS' ? 'w-[1200px] h-[780px]' : 'w-[840px] h-auto'}`}>
        <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-4 py-3 flex justify-between items-center cursor-default shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-5 h-5 rounded-sm bg-blue-600 flex items-center justify-center">
                <Play size={12} className="text-slate-900 dark:text-white fill-white" />
             </div>
             <span className="text-slate-200 text-sm font-bold tracking-wide font-mono">
                [C16] Cadastro de Tripulantes {viewMode === 'RESULTS' ? '- Listagem' : '- Consulta'}
             </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-red-600 hover:text-slate-900 dark:text-white rounded transition-colors"><X size={16} /></button>
          </div>
        </div>

        {viewMode === 'SEARCH' && (
          <div className="p-8 flex flex-col gap-4 font-sans text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-center"><label className="w-32 text-right pr-4 text-slate-600 dark:text-slate-400 font-bold text-sm">Nome de Guerra:</label><input type="text" className="w-48 h-8 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-3 outline-none rounded-sm uppercase text-sm" value={formData.nomeGuerra} onChange={(e) => handleChange('nomeGuerra', e.target.value)} /></div>
            <div className="flex items-center"><label className="w-32 text-right pr-4 text-slate-600 dark:text-slate-400 font-bold text-sm">Nome:</label><input type="text" className="flex-1 h-8 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-3 outline-none rounded-sm uppercase text-sm" value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} /></div>
            <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-end gap-3 mt-4">
              <button onClick={handleSearch} className="min-w-[100px] px-4 py-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white text-sm font-bold rounded shadow-lg">Ok</button>
              <button onClick={onClose} className="min-w-[100px] px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold rounded">Cancelar</button>
            </div>
          </div>
        )}

        {viewMode === 'RESULTS' && (
           <div className="flex flex-col h-full">
              {/* Increase column header height and font */}
              <div className={`bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 grid ${gridColsClass} text-sm font-bold text-slate-600 dark:text-slate-400 select-none`}>
                  <div className="px-3 py-2 border-r border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-700 hover:text-slate-900 dark:text-white transition-colors" onClick={() => handleSort('senioridade')}>Sen. {renderSortArrow('senioridade')}</div>
                  <div className="px-3 py-2 border-r border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-700 hover:text-slate-900 dark:text-white transition-colors" onClick={() => handleSort('name')}>Tripulante {renderSortArrow('name')}</div>
                  <div className="px-3 py-2 border-r border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-700 hover:text-slate-900 dark:text-white transition-colors" onClick={() => handleSort('name')}>Nome {renderSortArrow('name')}</div>
                  <div className="px-3 py-2 border-r border-slate-300 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-700 hover:text-slate-900 dark:text-white transition-colors" onClick={() => handleSort('codAnac')}>Cód. ANAC {renderSortArrow('codAnac')}</div>
                  <div className="px-3 py-2 border-r border-slate-300 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-700 hover:text-slate-900 dark:text-white transition-colors" onClick={() => handleSort('matricula')}>Matrícula {renderSortArrow('matricula')}</div>
                  <div className="px-3 py-2 border-r border-slate-300 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-700 hover:text-slate-900 dark:text-white transition-colors" onClick={() => handleSort('cpf')}>CPF {renderSortArrow('cpf')}</div>
                  <div className="px-3 py-2 border-r border-slate-300 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-700 hover:text-slate-900 dark:text-white transition-colors" onClick={() => handleSort('admissao')}>Admissão {renderSortArrow('admissao')}</div>
                  <div className="px-3 py-2 text-center cursor-pointer hover:bg-slate-700 hover:text-slate-900 dark:text-white transition-colors" onClick={() => handleSort('desligamento')}>Desligamento {renderSortArrow('desligamento')}</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                  {filteredAndSortedCrew.map((c, idx) => (
                    <div key={c.id} onClick={() => setSelectedRow(idx)} onDoubleClick={() => handleRowDoubleClick(c)} className={`grid ${gridColsClass} text-base border-b border-slate-200 dark:border-slate-800 cursor-pointer font-mono ${selectedRow === idx ? 'bg-blue-900/30 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800'}`}>
                       <div className="px-3 py-2 flex items-center justify-center border-r border-slate-200 dark:border-slate-800/50 font-bold text-slate-500 dark:text-slate-400">{c.senioridade}</div>
                       <div className="px-3 py-2 flex items-center border-r border-slate-200 dark:border-slate-800/50"><span>{c.name.split(' ')[0]}</span></div>
                       <div className="px-3 py-2 flex items-center border-r border-slate-200 dark:border-slate-800/50 overflow-hidden whitespace-nowrap">{c.name}</div>
                       <div className="px-3 py-2 flex items-center justify-center border-r border-slate-200 dark:border-slate-800/50">{c.codAnac}</div>
                       <div className="px-3 py-2 flex items-center justify-center border-r border-slate-200 dark:border-slate-800/50">{c.matricula}</div>
                       <div className="px-3 py-2 flex items-center justify-center border-r border-slate-200 dark:border-slate-800/50">{c.cpf}</div>
                       <div className="px-3 py-2 flex items-center justify-center border-r border-slate-200 dark:border-slate-800/50 font-bold text-blue-300">{c.admissao}</div>
                       <div className="px-3 py-2 flex items-center justify-center font-bold text-red-400">{c.desligamento}</div>
                    </div>
                  ))}
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                 <div className="flex items-center gap-6">
                     <span>{filteredAndSortedCrew.length} registros encontrados. (Duplo clique para editar)</span>
                     <label className="flex items-center gap-2 cursor-pointer text-blue-300 hover:text-blue-100 select-none transition-colors">
                         <input 
                            type="checkbox" 
                            checked={showOnlyActive} 
                            onChange={e => setShowOnlyActive(e.target.checked)} 
                            className="w-4 h-4 accent-blue-500 rounded cursor-pointer" 
                         />
                         <Filter size={14} /> Somente Ativos
                     </label>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={toggleView} className="px-4 py-2 bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-200 hover:bg-slate-600 shadow-sm transition-all active:scale-95 text-xs font-bold">Nova Consulta</button>
                    {onSyncQualifications && (
                        <button onClick={onSyncQualifications} className="px-4 py-2 bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-amber-500 hover:bg-slate-600 shadow-sm transition-all active:scale-95 flex items-center gap-2 text-xs font-bold">Sinc. Carteiras</button>
                    )}
                    <button onClick={handleInsert} className="px-4 py-2 bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-200 hover:bg-slate-600 shadow-sm transition-all active:scale-95 flex items-center gap-2 text-xs font-bold"><Plus size={14} /> Inserir</button>
                    <button onClick={handleDelete} disabled={selectedRow === null} className="px-4 py-2 bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-red-400 hover:bg-slate-600 shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold"><Trash2 size={14} /> Excluir</button>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-200 hover:bg-slate-600 shadow-sm transition-all active:scale-95 text-xs font-bold">Sair</button>
                 </div>
              </div>
           </div>
        )}
      </div>
      {showDetails && (
          <CrewDetailsModal 
              crewMember={selectedCrewForDetails}
              bases={bases}
              qualificationsDef={qualifications}
              onClose={() => setShowDetails(false)} 
              onSave={handleSaveDetails} 
              onDelete={onDeleteCrew}
          />
      )}
    </div>
  );
};

export default CrewSearchModal;

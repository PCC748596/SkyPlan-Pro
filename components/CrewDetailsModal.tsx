
import React, { useState } from 'react';
import { X, Save, Trash2, User, Calendar, MapPin, CreditCard, FileText, Plane, Camera, Play, ToggleLeft, ToggleRight } from 'lucide-react';
import { CrewMember, QualificationDefinition, CrewBase } from '../types';
import { calculateEligibilityDates } from '../utils';

interface CrewDetailsModalProps {
  crewMember?: any; // Using any here to support the enriched mock data structure
  bases?: CrewBase[];
  qualificationsDef?: QualificationDefinition[];
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void; 
}

const CrewDetailsModal: React.FC<CrewDetailsModalProps> = ({ crewMember, bases = [], qualificationsDef, onClose, onSave, onDelete }) => {
  const [activeTab, setActiveTab] = useState('PESSOAIS');
  
  // Helper to format YYYY-MM-DD to DD/MM/YYYY
  const formatIsoDate = (dateStr?: string) => {
      if (!dateStr) return '';
      if (dateStr.includes('/')) return dateStr;
      const parts = dateStr.split('-');
      if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (parts.length === 2) {
          return `${parts[1]}/${parts[0]}`;
      }
      return dateStr;
  };

  // Helper to convert DD/MM/YYYY to YYYY-MM-DD for backend
  const toISODate = (dateStr: string) => {
      if (!dateStr || !dateStr.includes('/')) return dateStr;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else if (parts.length === 2) {
          return `${parts[1]}-${parts[0]}`;
      }
      return dateStr;
  };

  // Initialize state dynamically from passed props
  const [formData, setFormData] = useState({
    id: crewMember?.id || '',
    tripulante: crewMember?.name?.split(' ')[0] || '',
    nome: crewMember?.name || '',
    primeiro: crewMember?.name?.split(' ')[0] || '',
    ultimo: crewMember?.name?.split(' ').pop() || '',
    matricula: crewMember?.matricula || '',
    admissao: crewMember?.admissao || formatIsoDate(crewMember?.admissionDate) || '',
    desligamento: crewMember?.desligamento || formatIsoDate(crewMember?.resignationDate) || '',
    cpf: crewMember?.cpf || '',
    identidade: crewMember?.identidade || '',
    sexo: crewMember?.sexo || 'M',
    nascimento: crewMember?.nascimento || '',
    nacionalidade: 'Brasil',
    naturalidade: 'RJ',
    endereco: crewMember?.endereco || '',
    cidadeNasc: 'Rio de Janeiro',
    cep: crewMember?.cep || '',
    bairro: crewMember?.bairro || '',
    cidade: crewMember?.cidade || '',
    uf: crewMember?.uf || '',
    pais: crewMember?.pais || 'Brazil',
    cidadePernoite: '',
    email: crewMember?.email || '',
    telefone: '',
    celular: crewMember?.celular || '',
    codAnac: crewMember?.codAnac || '',
    codLicenca: '',
    licenca: '',
    senioridade: crewMember?.senioridade || crewMember?.seniority || '',
    passaporte: '',
    paisPassaporte: '',
    validadePassaporte: '00/00/0000',
    aviso: false,
    inativo: !crewMember?.isOn,
    tripNovo: false,
    hrVooCongenere: '0',
    alteraSenha: true,
    observacao: 'ICAO 4',
    isAqExp: crewMember?.isAqExp || false, // NEW: Aquisição de Experiência
    // Technical Data Fields
    role: crewMember?.role || 'COP',
    base: crewMember?.base || 'VCP',
    equipment: crewMember?.equipment || 'A320',
    adminTag: crewMember?.adminTag || '',
    instructionTag: crewMember?.instructionTag || '',
    syntheticTag: crewMember?.syntheticTag || '',
    // Technical Data Dates (Editable)
    cargoInicio: crewMember?.roleDateStart ? formatIsoDate(crewMember.roleDateStart) : (crewMember?.admissao || formatIsoDate(crewMember?.admissionDate) || ''),
    cargoFim: crewMember?.roleDateEnd ? formatIsoDate(crewMember.roleDateEnd) : '',
    frotaInicio: crewMember?.equipmentDateStart ? formatIsoDate(crewMember.equipmentDateStart) : (crewMember?.admissao || formatIsoDate(crewMember?.admissionDate) || ''),
    frotaFim: crewMember?.equipmentDateEnd ? formatIsoDate(crewMember.equipmentDateEnd) : '',
    baseInicio: crewMember?.baseDateStart ? formatIsoDate(crewMember.baseDateStart) : (crewMember?.admissao || formatIsoDate(crewMember?.admissionDate) || ''),
    baseFim: crewMember?.baseDateEnd ? formatIsoDate(crewMember.baseDateEnd) : '',
    funcaoInicio: crewMember?.tagDateStart ? formatIsoDate(crewMember.tagDateStart) : (crewMember?.admissao || formatIsoDate(crewMember?.admissionDate) || ''),
    funcaoFim: crewMember?.tagDateEnd ? formatIsoDate(crewMember.tagDateEnd) : '',
    // Qualifications Map
    qualifications: Object.entries(crewMember?.qualifications || {}).reduce((acc: any, [k, v]: any) => {
       acc[k] = { 
           courseDate: formatIsoDate(v.courseDate),
           referenceDate: formatIsoDate(v.referenceDate), 
           expirationDate: formatIsoDate(v.expirationDate) 
       }; 
       return acc;
    }, {})
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const autoCalculateExpiration = (refDateStr: string, code: string) => {
      if (!refDateStr) return '';
      let m = NaN, y = NaN;

      if (refDateStr.length === 10) {
          const parts = refDateStr.split('/');
          m = parseInt(parts[1], 10);
          y = parseInt(parts[2], 10);
      } else if (refDateStr.length === 7 || refDateStr.length === 6) {
          const parts = refDateStr.split('/');
          m = parseInt(parts[0], 10);
          y = parseInt(parts[1], 10);
      }

      if (isNaN(m) || isNaN(y)) return '';

      // Handle 2-digit years
      if (y < 100) y += 2000;

      // Ensure expiration is at the end of the month FOLLOWING the reference month
      let expMonth = m + 1;
      let expYear = y;
      
      while (expMonth > 12) {
          expMonth -= 12;
          expYear += 1;
      }

      return `${expMonth.toString().padStart(2, '0')}/${expYear}`;
  };

  const formatDateInput = (value: string, isMonthYear = false) => {
      const numeric = value.replace(/[^\d]/g, '');
      if (isMonthYear) {
          if (numeric.length <= 2) return numeric;
          return `${numeric.slice(0, 2)}/${numeric.slice(2, 6)}`;
      }
      if (numeric.length <= 2) return numeric;
      if (numeric.length <= 4) return `${numeric.slice(0, 2)}/${numeric.slice(2)}`;
      return `${numeric.slice(0, 2)}/${numeric.slice(2, 4)}/${numeric.slice(4, 8)}`;
  };

  const handleQualificationChange = (code: string, field: 'courseDate' | 'referenceDate' | 'expirationDate', value: string) => {
      setFormData(prev => {
          const updatedQuals: any = { ...prev.qualifications };
          const cur = updatedQuals[code] || { courseDate: '', referenceDate: '', expirationDate: '' };
          
          let newCourse = cur.courseDate || '';
          let newRef = cur.referenceDate;
          let newExp = cur.expirationDate;

          const isMonthYearField = field === 'referenceDate' || field === 'expirationDate';
          const formattedValue = formatDateInput(value, isMonthYearField);
          const qualDef = qualificationsDef?.find(q => q.code === code);
          const validityMonths = qualDef?.validityMonths || 12;

          if (field === 'courseDate') {
              newCourse = formattedValue;
              if (formattedValue.length === 10 && value.length >= cur.courseDate?.length) {
                 const calc = calculateEligibilityDates(formattedValue, cur.referenceDate, validityMonths, code);
                 if (calc) {
                     newRef = calc.refDate;
                     newExp = calc.expDate;
                 }
              }
          } else if (field === 'referenceDate') {
              newRef = formattedValue;
              if ((formattedValue.length === 7 || formattedValue.length === 10) && value.length >= cur.referenceDate.length) {
                 newExp = autoCalculateExpiration(formattedValue, code);
              }
          } else {
              newExp = formattedValue;
          }

          updatedQuals[code] = { courseDate: newCourse, referenceDate: newRef, expirationDate: newExp };
          return { ...prev, qualifications: updatedQuals };
      });
  };

  const handleDelete = () => {
      if (onDelete && formData.id) {
          if (window.confirm(`Confirma exclusão de ${formData.nome}?`)) {
              onDelete(formData.id);
          }
      }
  };

  const handleSave = () => {
      const updatedData = {
          ...formData,
          // Map visual fields to data model fields
          admissionDate: toISODate(formData.admissao),
          resignationDate: toISODate(formData.desligamento),
          role: formData.role,
          base: formData.base,
          equipment: formData.equipment,
          seniority: formData.senioridade,
          isAqExp: formData.isAqExp,
          // Tags mapping (empty string -> null)
          adminTag: formData.adminTag || null,
          instructionTag: formData.instructionTag || null,
          syntheticTag: formData.syntheticTag || null,
          // Technical Dates Mapping
          roleDateStart: toISODate(formData.cargoInicio),
          roleDateEnd: toISODate(formData.cargoFim),
          equipmentDateStart: toISODate(formData.frotaInicio),
          equipmentDateEnd: toISODate(formData.frotaFim),
          baseDateStart: toISODate(formData.baseInicio),
          baseDateEnd: toISODate(formData.baseFim),
          tagDateStart: toISODate(formData.funcaoInicio),
          tagDateEnd: toISODate(formData.funcaoFim),
          // Qualifications
          qualifications: Object.entries(formData.qualifications || {}).reduce((acc: any, [k, v]: any) => {
               acc[k] = {
                   courseDate: toISODate(v.courseDate),
                   referenceDate: toISODate(v.referenceDate),
                   expirationDate: toISODate(v.expirationDate)
               };
               return acc;
          }, {})
      };
      onSave(updatedData);
      onClose();
  };

  const tabs = [
    { id: 'PESSOAIS', label: 'Dados Pessoais' },
    { id: 'TECNICOS', label: 'Dados Técnicos' },
    { id: 'VISTO', label: 'Carteira / Visto' },
    { id: 'INTEGRACAO', label: 'Integração' },
    { id: 'OUTROS', label: 'Outros' },
  ];

  // Helper for rendering a "Grid" section in Technical Data
  const renderTechnicalGrid = (columns: string[], children: React.ReactNode) => (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm overflow-hidden shadow-inner">
        <div className="bg-slate-700 px-2 py-1.5 border-b border-slate-600 flex gap-2 shrink-0">
            {columns.map((col, i) => (
                <div key={i} className={`text-xs font-bold text-slate-700 dark:text-slate-300 uppercase ${col === 'Temp.' ? 'w-10 text-center' : 'flex-1'}`}>
                    {col}
                </div>
            ))}
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 p-1.5 overflow-y-auto custom-scrollbar flex flex-col gap-1.5">
            {children}
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in zoom-in-95 duration-200">
      <div className="w-[1000px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Title Bar */}
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 flex justify-between items-center border-b border-slate-300 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
             <User size={16} className="text-blue-400" />
             <span className="text-slate-200 text-sm font-bold tracking-wide font-mono uppercase">
                Dados do Tripulante [{formData.nome.toUpperCase()} {formData.codAnac}]
             </span>
          </div>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-3 pt-2 gap-1 shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-5 py-2 text-[13px] font-bold rounded-t transition-colors border-t border-l border-r
                ${activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-900 text-blue-400 border-slate-300 dark:border-slate-700 border-b-slate-900 -mb-px z-10' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent hover:bg-slate-700 hover:text-slate-700 dark:text-slate-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 flex-1">
          
          {/* TAB: DADOS PESSOAIS */}
          {activeTab === 'PESSOAIS' && (
            <div className="grid grid-cols-[1fr_140px] gap-4">
              
              <div className="flex flex-col gap-2">
                {/* Row 1 */}
                <div className="flex gap-3">
                   <div className="flex flex-col w-1/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Tripulante</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none uppercase font-bold" value={formData.tripulante} onChange={e => handleChange('tripulante', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-2/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Nome</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none uppercase" value={formData.nome} onChange={e => handleChange('nome', e.target.value)} />
                   </div>
                </div>

                {/* Row 2 */}
                <div className="flex gap-3">
                   <div className="flex flex-col w-1/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Primeiro</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none uppercase" value={formData.primeiro} onChange={e => handleChange('primeiro', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-2/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Último</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none uppercase" value={formData.ultimo} onChange={e => handleChange('ultimo', e.target.value)} />
                   </div>
                </div>

                {/* Row 3 - UPDATED: Added AQEXP Toggle */}
                <div className="flex gap-3">
                   <div className="flex flex-col w-1/4">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Matrícula</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none text-center" value={formData.matricula} onChange={e => handleChange('matricula', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-1/4">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Admissão</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none text-center" value={formData.admissao} onChange={e => handleChange('admissao', e.target.value)} />
                   </div>
                   {/* AQEXP TOGGLE */}
                   <div className="flex flex-col justify-end pb-1 w-16 items-center">
                      <label className="text-[10px] text-blue-400 font-bold mb-1 cursor-help" title="Aquisição de Experiência (Limite XQR = 100h)">AQEXP</label>
                      <button 
                        onClick={() => handleChange('isAqExp', !formData.isAqExp)}
                        className={`transition-colors ${formData.isAqExp ? 'text-emerald-500' : 'text-slate-600'}`}
                      >
                        {formData.isAqExp ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                   </div>
                   <div className="flex flex-col w-1/4">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Desligamento</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none text-center" value={formData.desligamento} onChange={e => handleChange('desligamento', e.target.value)} />
                   </div>
                </div>

                {/* Row 4 */}
                <div className="flex gap-3">
                   <div className="flex flex-col w-1/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">CPF</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.cpf} onChange={e => handleChange('cpf', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-1/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Identidade</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.identidade} onChange={e => handleChange('identidade', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-1/3 pl-4 pt-5">
                      <div className="flex items-center gap-6">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="radio" name="sexo" value="M" checked={formData.sexo === 'M'} onChange={() => handleChange('sexo', 'M')} className="accent-blue-500 w-4 h-4" />
                              <span className="text-[13px] text-slate-700 dark:text-slate-300">M</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="radio" name="sexo" value="F" checked={formData.sexo === 'F'} onChange={() => handleChange('sexo', 'F')} className="accent-blue-500 w-4 h-4" />
                              <span className="text-[13px] text-slate-700 dark:text-slate-300">F</span>
                          </label>
                      </div>
                   </div>
                </div>

                {/* Row 5 */}
                <div className="flex gap-3">
                   <div className="flex flex-col w-1/4">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Nascimento</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none text-center" value={formData.nascimento} onChange={e => handleChange('nascimento', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-1/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Nacionalidade</label>
                      <select className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.nacionalidade} onChange={e => handleChange('nacionalidade', e.target.value)}>
                         <option value="Brasil">Brasil</option>
                         <option value="Estrangeiro">Estrangeiro</option>
                      </select>
                   </div>
                   <div className="flex flex-col w-1/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Naturalidade</label>
                      <select className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.naturalidade} onChange={e => handleChange('naturalidade', e.target.value)}>
                         <option value="RJ">RJ</option>
                         <option value="SP">SP</option>
                         <option value="MG">MG</option>
                      </select>
                   </div>
                </div>
              </div>

              {/* Right Column (Photo) */}
              <div className="flex flex-col pt-4">
                  <div className="w-full aspect-[3/4] bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-600 hover:text-slate-600 dark:text-slate-400 hover:border-slate-500 cursor-pointer transition-colors group">
                      <Camera size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">SEM FOTO</span>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'PESSOAIS' && (
             <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                {/* Address Row */}
                <div className="flex gap-3">
                   <div className="flex flex-col w-2/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Endereço</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none uppercase" value={formData.endereco} onChange={e => handleChange('endereco', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-1/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Cidade Nasc...</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none uppercase" value={formData.cidadeNasc} onChange={e => handleChange('cidadeNasc', e.target.value)} />
                   </div>
                </div>

                {/* CEP/Bairro Row */}
                <div className="flex gap-3">
                   <div className="flex flex-col w-1/4">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">CEP</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.cep} onChange={e => handleChange('cep', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-1/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Bairro</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none uppercase" value={formData.bairro} onChange={e => handleChange('bairro', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-1/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Cidade</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none uppercase" value={formData.cidade} onChange={e => handleChange('cidade', e.target.value)} />
                   </div>
                </div>

                 {/* UF/Pais/Pernoite Row */}
                 <div className="flex gap-3">
                   <div className="flex flex-col w-24">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">UF</label>
                      <select className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.uf} onChange={e => handleChange('uf', e.target.value)}>
                         <option value="RJ">RJ</option>
                         <option value="SP">SP</option>
                      </select>
                   </div>
                   <div className="flex flex-col w-1/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">País</label>
                      <select className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.pais} onChange={e => handleChange('pais', e.target.value)}>
                         <option value="Brazil">Brazil</option>
                      </select>
                   </div>
                   <div className="flex flex-col flex-1">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Cidade Pernoite...</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none uppercase" value={formData.cidadePernoite} onChange={e => handleChange('cidadePernoite', e.target.value)} />
                   </div>
                </div>

                {/* Email */}
                <div className="flex gap-3">
                   <div className="flex flex-col w-full">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">E-mail</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none underline" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                   </div>
                </div>

                 {/* Phones */}
                 <div className="flex gap-3">
                   <div className="flex flex-col w-1/2">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Telefone</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.telefone} onChange={e => handleChange('telefone', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-1/2">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Celular</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.celular} onChange={e => handleChange('celular', e.target.value)} />
                   </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                {/* Technical Info Row 1 */}
                 <div className="flex gap-3">
                   <div className="flex flex-col w-1/4">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Cód. ANAC</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-blue-400 font-bold text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.codAnac} onChange={e => handleChange('codAnac', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-1/4">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Cód. Licença</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.codLicenca} onChange={e => handleChange('codLicenca', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-1/3">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Licença</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none" value={formData.licenca} onChange={e => handleChange('licenca', e.target.value)} />
                   </div>
                   <div className="flex flex-col w-1/6">
                      <label className="text-xs text-slate-500 font-bold mb-0.5 text-right px-1">Senioridade</label>
                      <input type="text" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] px-2 py-1 rounded-sm focus:border-blue-500 outline-none text-center" value={formData.senioridade} onChange={e => handleChange('senioridade', e.target.value)} />
                   </div>
                </div>
             </div>
          )}

          {/* TAB: DADOS TÉCNICOS */}
          {activeTab === 'TECNICOS' && (
              <div className="grid grid-cols-2 grid-rows-3 gap-4 h-full">
                  {/* CARGO */}
                  {renderTechnicalGrid(['Cargo', 'Início', 'Fim'], (
                      <div className="flex gap-2 items-center bg-blue-900/20 border border-blue-800/50 p-1.5 rounded-sm">
                          <Play size={10} className="text-red-500 fill-red-500 ml-1" />
                          <select className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none" value={formData.role === 'CMTE' ? 'CAPTAIN' : 'FIRST OFFICER'} onChange={(e) => handleChange('role', e.target.value === 'CAPTAIN' ? 'CMTE' : 'COP')}>
                              <option value="CAPTAIN">CAPTAIN</option>
                              <option value="FIRST OFFICER">FIRST OFFICER</option>
                          </select>
                          <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.cargoInicio} onChange={(e) => handleChange('cargoInicio', e.target.value)} />
                          <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.cargoFim} onChange={(e) => handleChange('cargoFim', e.target.value)} />
                      </div>
                  ))}

                  {/* FROTA */}
                  {renderTechnicalGrid(['Cód. Frota', 'Início', 'Fim'], (
                       <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 p-1.5 rounded-sm">
                          <Play size={10} className="text-black fill-black ml-1" />
                          <select className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none" value={formData.equipment} onChange={(e) => handleChange('equipment', e.target.value)}>
                              <option value="A320">A320</option>
                              <option value="A321">A321</option>
                              <option value="ATR72">ATR72</option>
                              <option value="B737">B737</option>
                          </select>
                          <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.frotaInicio} onChange={(e) => handleChange('frotaInicio', e.target.value)} />
                          <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.frotaFim} onChange={(e) => handleChange('frotaFim', e.target.value)} />
                      </div>
                  ))}

                  {/* CIDADE */}
                  {renderTechnicalGrid(['Cidade', 'Início', 'Fim', 'Temp.'], (
                      <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 p-1.5 rounded-sm">
                          <Play size={10} className="text-black fill-black ml-1" />
                          <select className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none" value={formData.base} onChange={(e) => handleChange('base', e.target.value)}>
                              {bases.map(b => (
                                <option key={b.id} value={b.id}>{b.city || b.id}</option>
                              ))}
                          </select>
                          <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.baseInicio} onChange={(e) => handleChange('baseInicio', e.target.value)} />
                          <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.baseFim} onChange={(e) => handleChange('baseFim', e.target.value)} />
                          <div className="w-10 flex justify-center"><input type="checkbox" className="accent-blue-500 w-4 h-4" /></div>
                      </div>
                  ))}

                  {/* FUNCOES */}
                  {renderTechnicalGrid(['Cód. Função', 'Início', 'Fim'], (
                      <>
                          {/* Admin Tag */}
                          <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 p-1.5 rounded-sm">
                              <Play size={10} className="text-black fill-black ml-1" />
                              <select className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none" value={formData.adminTag || ''} onChange={(e) => handleChange('adminTag', e.target.value || null)}>
                                  <option value="">- FUNÇÃO ADM -</option>
                                  <option value="ADM.DO">CHIEF PILOT (ADM.DO)</option>
                                  <option value="ADM.PC">DOV (ADM.PC)</option>
                                  <option value="ADM.GR">GERENTE (ADM.GR)</option>
                                  <option value="ADM.DSO">DSO (ADM.DSO)</option>
                                  <option value="ADM.GK">GATE KEEPER</option>
                              </select>
                              <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.funcaoInicio} onChange={(e) => handleChange('funcaoInicio', e.target.value)} />
                              <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.funcaoFim} onChange={(e) => handleChange('funcaoFim', e.target.value)} />
                          </div>
                          
                          {/* Instruction Tag - ONLY FOR CMTE */}
                          {formData.role === 'CMTE' && (
                            <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 p-1.5 rounded-sm">
                                <Play size={10} className="text-black fill-black ml-1" />
                                <select className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none" value={formData.instructionTag || ''} onChange={(e) => handleChange('instructionTag', e.target.value || null)}>
                                    <option value="">- INSTRUÇÃO -</option>
                                    <option value="TRI">TYPE RATING INSTRUCTOR (TRI)</option>
                                    <option value="TRE">TYPE RATING EXAMINER (TRE)</option>
                                </select>
                                <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.funcaoInicio} onChange={(e) => handleChange('funcaoInicio', e.target.value)} />
                                <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.funcaoFim} onChange={(e) => handleChange('funcaoFim', e.target.value)} />
                            </div>
                          )}

                          {/* Synthetic Tag - ONLY FOR CMTE */}
                          {formData.role === 'CMTE' && (
                            <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 p-1.5 rounded-sm">
                                <Play size={10} className="text-black fill-black ml-1" />
                                <select className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none" value={formData.syntheticTag || ''} onChange={(e) => handleChange('syntheticTag', e.target.value || null)}>
                                    <option value="">- SINTÉTICO -</option>
                                    <option value="SFI">SYNTHETIC FLIGHT INSTRUCTOR (SFI)</option>
                                    <option value="SFE">SYNTHETIC FLIGHT EXAMINER (SFE)</option>
                                </select>
                                <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.funcaoInicio} onChange={(e) => handleChange('funcaoInicio', e.target.value)} />
                                <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-1.5 outline-none text-center" value={formData.funcaoFim} onChange={(e) => handleChange('funcaoFim', e.target.value)} />
                            </div>
                          )}
                      </>
                  ))}
              </div>
          )}

          {/* TAB: VISTO / CARTEIRAS */}
          {activeTab === 'VISTO' && (
             <div className="flex flex-col h-full">
                <div className="flex bg-slate-700 text-slate-200 text-xs font-bold uppercase px-2 py-1.5 rounded-t-sm items-center">
                    <div className="w-1/4">CERTIFICADOS/LICENÇAS</div>
                    <div className="w-1/4 text-center">Data Curso</div>
                    <div className="w-1/4 text-center">Data Ref.</div>
                    <div className="w-1/4 text-center text-[10px] leading-tight">Elegibilidade<br/>Máxima</div>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-b-sm p-1.5 flex flex-col gap-1 custom-scrollbar">
                    {(() => {
                        const sortedQuals = [...(qualificationsDef || [])].sort((a, b) => {
                            const dataA = (formData.qualifications as any)[a.code] || { referenceDate: '' };
                            const dataB = (formData.qualifications as any)[b.code] || { referenceDate: '' };
                            
                            const dStrA = dataA.referenceDate || '';
                            const dStrB = dataB.referenceDate || '';
                        
                            const valA = dStrA.length >= 7 ? dStrA.split('/').reverse().join('') : '99999999';
                            const valB = dStrB.length >= 7 ? dStrB.split('/').reverse().join('') : '99999999';
                        
                            if (valA !== valB) {
                                return valA.localeCompare(valB);
                            }
                            return a.code.localeCompare(b.code);
                        });

                        return sortedQuals.map((qdef) => {
                            const qdata = (formData.qualifications as any)[qdef.code] || { courseDate: '', referenceDate: '', expirationDate: '' };
                            return (
                               <div key={qdef.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 p-1 rounded-sm w-full">
                                   <div className="w-1/4 text-xs font-bold text-slate-700 dark:text-slate-300 pl-2">
                                       <span className="text-blue-500 truncate block" title={qdef.description}>{qdef.code}</span>
                                   </div>
                                   <div className="w-1/4">
                                       <input 
                                           type="text" 
                                           placeholder="DD/MM/YYYY"
                                           className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-2 outline-none text-center rounded-sm focus:border-blue-500 font-mono" 
                                           value={qdata.courseDate || ''} 
                                           onChange={e => handleQualificationChange(qdef.code, 'courseDate', e.target.value)} 
                                       />
                                   </div>
                                   <div className="w-1/4">
                                       <input 
                                           type="text" 
                                           placeholder="MM/YYYY"
                                           className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-2 outline-none text-center rounded-sm focus:border-blue-500 font-mono" 
                                           value={qdata.referenceDate || ''} 
                                           onChange={e => handleQualificationChange(qdef.code, 'referenceDate', e.target.value)} 
                                       />
                                   </div>
                                   <div className="w-1/4">
                                       <input 
                                           type="text" 
                                           placeholder="MM/YYYY"
                                           className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[12px] h-7 px-2 outline-none text-center rounded-sm focus:border-blue-500 font-mono" 
                                           value={qdata.expirationDate || ''} 
                                           onChange={e => handleQualificationChange(qdef.code, 'expirationDate', e.target.value)} 
                                       />
                                   </div>
                               </div>
                            );
                        });
                    })()}
                </div>
             </div>
          )}

          {activeTab !== 'PESSOAIS' && activeTab !== 'TECNICOS' && activeTab !== 'VISTO' && (
             <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-2 opacity-50">
                 <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {activeTab === 'INTEGRACAO' && <FileText size={40} />}
                    {activeTab === 'OUTROS' && <CreditCard size={40} />}
                 </div>
                 <span className="text-sm font-mono">Módulo em desenvolvimento</span>
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            <button className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-bold rounded shadow transition-all active:scale-95 border border-slate-600 flex items-center gap-1.5">
               <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center"><Play size={10} className="text-slate-900 dark:text-white fill-white rotate-90" /></div> Inserir
            </button>
            <button 
               onClick={handleDelete}
               className="px-5 py-2 bg-slate-700 hover:bg-red-900/50 hover:text-red-300 hover:border-red-900 text-slate-700 dark:text-slate-300 text-sm font-bold rounded shadow transition-all active:scale-95 border border-slate-600 flex items-center gap-2"
            >
               <Trash2 size={14} />
               Excluir
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              className="px-8 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-sm font-bold rounded shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
               <Save size={16} />
               Salvar
            </button>
            <button 
              onClick={onClose}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-bold rounded shadow transition-all active:scale-95 border border-slate-600 flex items-center gap-2"
            >
               <X size={16} />
               Cancelar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CrewDetailsModal;

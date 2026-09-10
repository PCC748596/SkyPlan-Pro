
import React, { useState, useEffect } from 'react';
import { X, Save, Clock, MapPin, Briefcase, Plane, FileText, CheckCircle, UserCheck, AlertTriangle, Monitor, Trash2, Plus } from 'lucide-react';
import { Assignment, AssignmentType, ActivityDefinition } from '../types';
import { STANDARD_TIMES } from '../regulation';

interface EditAssignmentModalProps {
  assignment: Assignment;
  crewName: string;
  date: Date;
  onClose: () => void;
  onSave: (updates: Partial<Assignment>) => boolean | void;
  onSaveAndNew?: (updates: Partial<Assignment>) => boolean | void;
  onDelete: () => void;
  activities?: ActivityDefinition[];
  isCreating: boolean; // Explicit flag
  isAircraftView?: boolean;
}

const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({ 
  assignment, 
  crewName, 
  date, 
  onClose, 
  onSave, 
  onSaveAndNew,
  onDelete,
  activities = [],
  isCreating,
  isAircraftView = false
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Use prop instead of ID parsing
  const isNew = isCreating;

  const [formData, setFormData] = useState({
    type: assignment.type,
    details: assignment.details || '',
    code: assignment.code || '',
    route: assignment.route || '',
    start: assignment.start || '00:00',
    end: assignment.end || '00:00',
    actualStart: assignment.actualStart || assignment.start || '',
    actualEnd: assignment.actualEnd || assignment.end || '',
    functionCode: assignment.functionCode || undefined,
    airport: assignment.airport || '', // Initialize airport
    checkNature: (assignment.details?.includes('SIM') || assignment.type === 'SIM' || (assignment.type === 'XQR' && !assignment.route)) ? 'SIM' : 'VOO' as 'VOO' | 'SIM',
    maintenanceStartDate: assignment.maintenanceDates?.startDate || date.toISOString().split('T')[0],
    maintenanceEndDate: assignment.maintenanceDates?.endDate || date.toISOString().split('T')[0]
  });

  // Base options
  const baseOptions = isAircraftView ? [
    { label: 'VOO', value: 'VOO' },
    { label: 'MANUTENÇÃO (MNT)', value: 'MNT' }
  ] : [
    { label: 'VOO', value: 'VOO' },
    { label: 'SIMULADOR (SIM)', value: 'SIM' },
    { label: 'GROUND SCHOOL (GS)', value: 'GS' },
    { label: 'DESLOCAMENTO (DLS)', value: 'DLS' },
    { label: 'FÉRIAS (VAC)', value: 'VAC' },
    { label: 'INATIVO (INAT)', value: 'INAT' },
    { label: 'REPOUSO (REPO)', value: 'REPO' },
    { label: 'DEICE', value: 'DEICE' },
    { label: 'UPRT', value: 'UPRT' }
  ];

  // Map custom activities into options, avoiding duplicates
  const activityMap = new Map<string, {label: string, value: string}>();
  
  // Add base options to map
  baseOptions.forEach(opt => {
      activityMap.set(opt.value, opt);
  });
  
  // Add all activities
  activities.forEach(act => {
      activityMap.set(act.code, {
          label: `${act.code} - ${act.description}`,
          value: act.code
      });
  });

  const activityOptions = isAircraftView 
    ? baseOptions 
    : Array.from(activityMap.values()).sort((a, b) => {
        if (a.value === 'VOO') return -1;
        if (b.value === 'VOO') return 1;
        return a.label.localeCompare(b.label);
    });

  const getCurrentActivityValue = () => {
    if (formData.type === 'VOO') return 'VOO';
    if (formData.type === 'MNT') return 'MNT';
    const isCustom = activities.some(a => a.code === formData.details);
    if (isCustom) return formData.details;

    const presets = ['ADM 1', 'ADM 2', 'AGD INS', 'AGD REQ', 'DEICE', 'UPRT', 'FM'];
    if (formData.details && presets.includes(formData.details)) return formData.details;
    return formData.type;
  };

  const addMinutes = (time: string, mins: number) => {
      const [h, m] = time.split(':').map(Number);
      let total = h * 60 + m + mins;
      while (total < 0) total += 1440;
      total = total % 1440;
      const hh = Math.floor(total / 60).toString().padStart(2, '0');
      const mm = (total % 60).toString().padStart(2, '0');
      return `${hh}:${mm}`;
  };

  const getDurationMinutes = (start: string, end: string) => {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let s = sh * 60 + sm;
      let e = eh * 60 + em;
      if (e < s) e += 1440; 
      return e - s;
  };

  const handleApplyDelay = () => {
      const baseStart = formData.actualStart || formData.start;
      const baseEnd = formData.actualEnd || formData.end;
      setFormData(prev => ({
          ...prev,
          actualStart: addMinutes(baseStart, 60),
          actualEnd: addMinutes(baseEnd, 60)
      }));
  };

  const handleActualStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newActualStart = e.target.value;
      const duration = getDurationMinutes(formData.start, formData.end);
      const newActualEnd = addMinutes(newActualStart, duration);
      setFormData(prev => ({
          ...prev,
          actualStart: newActualStart,
          actualEnd: newActualEnd
      }));
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStart = e.target.value;
      let newEnd = formData.end;

      // Auto-calculate end time for specific types
      // RE = +3h (180 min)
      // SA = +6h (360 min)
      // SIM = +4h (240 min)
      // DLS = +2h (120 min)
      if (formData.type === 'RE' || formData.details === 'RE') {
          newEnd = addMinutes(newStart, 180);
      } else if (formData.type === 'SA' || formData.details === 'SA') {
          newEnd = addMinutes(newStart, 360);
      } else if (formData.type === 'SIM' || formData.details === 'SIM' || formData.checkNature === 'SIM') {
          newEnd = addMinutes(newStart, 240);
      } else if (formData.type === 'DLS' || (formData.details && formData.details.startsWith('DLS'))) {
          newEnd = addMinutes(newStart, 120);
      }

      setFormData(prev => ({ ...prev, start: newStart, end: newEnd }));
  };

  const handleActivityChange = (value: string) => {
      let newType: AssignmentType;
      let newDetails = '';
      let newStart = formData.start;
      let newEnd = formData.end;

      const customAct = activities.find(a => a.code === value);
      
      if (customAct) {
          newType = customAct.type as AssignmentType;
          if (!['VOO', 'RE', 'SA', 'SIM', 'GS', 'FR', 'FS', 'INAT', 'DLS', 'XQR', 'VAC', 'REPO'].includes(newType)) {
             newType = 'GS';
          }
          newDetails = customAct.code;
          newStart = customAct.start;
          newEnd = customAct.end;
      } else {
          if (['ADM 1', 'ADM 2', 'AGD INS', 'AGD REQ', 'DEICE', 'UPRT', 'FM'].includes(value)) {
              if (value === 'FM') newType = 'FR';
              else newType = 'GS';
              newDetails = value;
          } else if (value === 'VOO') {
              newType = 'VOO';
          } else if (value === 'MNT') {
              newType = 'MNT';
              newDetails = 'PROGRAMADA'; // default
          } else {
              newType = value as AssignmentType;
              // UPDATED: Populate details for standard types as well to ensure fallback labels work
              if (['FR', 'FS', 'VAC', 'SIM', 'GS', 'RE', 'SA', 'DLS', 'XQR', 'INAT', 'REPO', 'MNT'].includes(value)) newDetails = value;
          }

          // Logic to calculate standard end times dynamically if RE/SA/SIM/DLS
          if (['RE', 'SA', 'SIM', 'DLS'].includes(newType) || ['RE', 'SA', 'SIM', 'DLS'].includes(newDetails) || (newDetails && newDetails.startsWith('DLS'))) {
              let duration = 0;
              if (newType === 'RE' || newDetails === 'RE') duration = 180; // +3h
              else if (newType === 'SA' || newDetails === 'SA') duration = 360; // +6h
              else if (newType === 'SIM' || newDetails === 'SIM') duration = 240; // +4h
              else if (newType === 'DLS' || (newDetails && newDetails.startsWith('DLS'))) duration = 120; // +2h
              
              if (duration > 0) {
                  // Use existing start time if switching between activities, or default standard start if needed
                  // Here we prioritize keeping the current start time unless it's 00:00 and standard has something else
                  const baseStart = (formData.start !== '00:00') ? formData.start : (STANDARD_TIMES[newType]?.start || '08:00');
                  newStart = baseStart;
                  newEnd = addMinutes(baseStart, duration);
              }
          } else {
              const timeKey = newDetails || newType;
              if (STANDARD_TIMES[timeKey]) {
                  newStart = STANDARD_TIMES[timeKey].start;
                  newEnd = STANDARD_TIMES[timeKey].end;
              }
          }
      }

      setFormData(prev => ({
          ...prev,
          type: newType,
          details: newDetails,
          start: newStart,
          end: newEnd,
          code: newType === 'VOO' || newType === 'XQR' ? prev.code : '',
          // PRESERVE ROUTE FOR DLS as well
          route: (newType === 'VOO' || newType === 'XQR' || newType === 'DLS') ? prev.route : '',
          checkNature: (newType === 'SIM' || (newType === 'XQR' && prev.checkNature === 'SIM')) ? 'SIM' : (newType === 'VOO' ? 'VOO' : prev.checkNature)
      }));
  };

  const handleSave = () => {
    const finalRoute = formData.checkNature === 'SIM' && (formData.type === 'XQR' || formData.type === 'SIM') ? '' : formData.route;
    
    const success = onSave({
      type: formData.type,
      details: formData.details,
      code: formData.code,
      route: finalRoute,
      start: formData.start,
      end: formData.end,
      actualStart: formData.actualStart,
      actualEnd: formData.actualEnd,
      functionCode: formData.functionCode as any,
      airport: formData.airport.toUpperCase(), // Save airport
      maintenanceDates: formData.type === 'MNT' ? { startDate: formData.maintenanceStartDate, endDate: formData.maintenanceEndDate } : undefined
    });
    if (success !== false) {
      onClose();
    }
  };

  const handleSaveAndNew = () => {
    const finalRoute = formData.checkNature === 'SIM' && (formData.type === 'XQR' || formData.type === 'SIM') ? '' : formData.route;
    
    if (onSaveAndNew) {
        const success = onSaveAndNew({
            type: formData.type,
            details: formData.details,
            code: formData.code,
            route: finalRoute,
            start: formData.start,
            end: formData.end,
            actualStart: formData.actualStart,
            actualEnd: formData.actualEnd,
            functionCode: formData.functionCode as any,
            airport: formData.airport.toUpperCase(),
            maintenanceDates: formData.type === 'MNT' ? { startDate: formData.maintenanceStartDate, endDate: formData.maintenanceEndDate } : undefined
        });
        
        if (success === false) {
           return; // Prevent reset/move to new
        }
    }
  };

  const handleDeleteClick = () => {
      if (isNew) {
          // If new, just discard without confirmation
          onDelete();
      } else {
          // If existing, show confirmation
          setShowConfirmDelete(true);
      }
  };

  const isCheckActivity = formData.type === 'XQR' || formData.type === 'SIM' || ['EXM', 'XQR', 'XQR-TRI', 'XQR-TRE', 'XQR-SFI', 'XQR-SFE', 'EXPREC'].includes(formData.functionCode || '');
  const showFunctionSelector = ['VOO', 'SIM', 'XQR'].includes(formData.type);
  const showFlightFields = formData.type === 'VOO' || (isCheckActivity && formData.checkNature === 'VOO' && formData.type !== 'SIM');
  const showDlsFields = formData.type === 'DLS';

  const functionOptions = [
    { label: 'TRIP. ATIVA', code: undefined, type: 'VOO', color: 'blue' },
    { label: 'EXTRA (EXT)', code: 'EXT', type: 'VOO', color: 'violet' },
    { label: 'OBSERVADOR (OBS)', code: 'OBS', type: 'VOO', color: 'slate' },
    { label: 'ALUNO (ALU)', code: 'ALU', type: 'VOO', color: 'slate' },
    { label: 'INSTRUTOR (INS)', code: 'INS', type: 'VOO', color: 'indigo' },
    { label: 'EXAMINADOR (EXM)', code: 'EXM', type: 'VOO', color: 'pink' },
    { label: 'CHECADO (XQR)', code: 'XQR', type: 'XQR', color: 'rose' },
    { label: 'XQR-TRI', code: 'XQR-TRI', type: 'XQR', color: 'rose' },
    { label: 'XQR-TRE', code: 'XQR-TRE', type: 'XQR', color: 'rose' },
    { label: 'XQR-SFI', code: 'XQR-SFI', type: 'XQR', color: 'rose' },
    { label: 'XQR-SFE', code: 'XQR-SFE', type: 'XQR', color: 'rose' },
    { label: 'EXP. REC. (EXPREC)', code: 'EXPREC', type: 'VOO', color: 'cyan' },
  ];

  if (showConfirmDelete) {
    return (
      <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
        <div className="w-[450px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-lg flex flex-col font-sans overflow-hidden">
          <div className="bg-slate-100 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-[18px]">
               <AlertTriangle size={24} className="text-red-500" />
               <span className="text-red-100">Confirmar Exclusão</span>
            </div>
            <button onClick={() => setShowConfirmDelete(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="p-6 flex flex-col gap-4 text-center">
            <p className="text-[18px] text-slate-700 dark:text-slate-300">Deseja realmente excluir esta programação?</p>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-300 dark:border-slate-700 text-[15px] font-mono text-blue-400">
              {formData.code || formData.details || formData.type} ({formData.start} - {formData.end})
            </div>
          </div>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex gap-2">
             <button onClick={() => setShowConfirmDelete(false)} className="flex-1 px-4 py-2 text-[15px] font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-700 rounded transition-colors border border-slate-600 uppercase">Cancelar</button>
             <button onClick={onDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-slate-900 dark:text-white text-[15px] font-bold rounded shadow-lg flex items-center justify-center gap-2 transition-colors border border-red-500 uppercase">
                <Trash2 size={20} /> Confirmar Exclusão
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in zoom-in-95 duration-200">
      <div className="w-[650px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-lg flex flex-col">
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center rounded-t-lg">
          <div className="flex flex-col">
             <span className="text-slate-900 dark:text-white font-bold text-[18px]">
               {isNew ? 'Nova Programação' : 'Editar Programação'}
             </span>
             <span className="text-slate-600 dark:text-slate-400 text-[15px] font-mono font-bold uppercase tracking-wide">{crewName} • {date.toLocaleDateString()}</span>
          </div>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"><X size={28} /></button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* ATIVIDADE + LOCAL */}
          <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="flex flex-col gap-1.5">
                 <label className="text-[13px] uppercase font-bold text-slate-500 tracking-wider">Atividade</label>
                 <select 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2.5 rounded text-slate-900 dark:text-white font-bold text-[17px] focus:border-blue-500 outline-none uppercase"
                    value={getCurrentActivityValue()}
                    onChange={(e) => handleActivityChange(e.target.value)}
                 >
                    {activityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-[13px] uppercase font-bold text-slate-500 flex items-center gap-1.5 tracking-wider"><MapPin size={16} /> Local / Aero</label>
                 <input 
                    type="text" 
                    placeholder="VCP" 
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-[17px] p-2.5 rounded outline-none uppercase font-mono" 
                    value={formData.airport} 
                    onChange={e => setFormData({...formData, airport: e.target.value.toUpperCase()})} 
                 />
              </div>
          </div>

          {/* DADOS DE MANUTENÇÃO (MNT) */}
          {formData.type === 'MNT' && (
             <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] uppercase font-bold text-slate-500 tracking-wider">Tipo Manutenção</label>
                    <select 
                       className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-[17px] p-2.5 rounded outline-none uppercase" 
                       value={formData.details} 
                       onChange={e => setFormData({...formData, details: e.target.value})} 
                    >
                       <option value="PROGRAMADA">PROGRAMADA</option>
                       <option value="NÃO PROGRAMADA">NÃO PROGRAMADA</option>
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                       <label className="text-[13px] uppercase font-bold text-slate-500 tracking-wider">Data Início</label>
                       <input 
                          type="date" 
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-[15px] p-2.5 rounded outline-none" 
                          value={formData.maintenanceStartDate} 
                          onChange={e => setFormData({...formData, maintenanceStartDate: e.target.value})} 
                       />
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <label className="text-[13px] uppercase font-bold text-slate-500 tracking-wider">Data Fim</label>
                       <input 
                          type="date" 
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-[15px] p-2.5 rounded outline-none" 
                          value={formData.maintenanceEndDate} 
                          onChange={e => setFormData({...formData, maintenanceEndDate: e.target.value})} 
                       />
                    </div>
                 </div>
             </div>
          )}

          {/* DADOS DE DESLOCAMENTO (DLS) */}
          {showDlsFields && (
             <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] uppercase font-bold text-slate-500 flex items-center gap-1.5 tracking-wider"><MapPin size={16} /> De (Origem)</label>
                    <input 
                       type="text" 
                       placeholder="VCP" 
                       className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-[17px] p-2.5 rounded outline-none uppercase font-mono" 
                       value={formData.route.split('-')[0] || ''} 
                       onChange={e => {
                           const val = e.target.value.toUpperCase();
                           const currentDest = formData.route.includes('-') ? formData.route.split('-')[1] : '';
                           setFormData({...formData, route: `${val}-${currentDest}`});
                       }} 
                    />
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] uppercase font-bold text-slate-500 flex items-center gap-1.5 tracking-wider"><MapPin size={16} /> Para (Destino)</label>
                    <input 
                       type="text" 
                       placeholder="GRU" 
                       className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-[17px] p-2.5 rounded outline-none uppercase font-mono" 
                       value={formData.route.includes('-') ? formData.route.split('-')[1] : ''} 
                       onChange={e => {
                           const val = e.target.value.toUpperCase();
                           const currentOrig = formData.route.split('-')[0] || '';
                           setFormData({...formData, route: `${currentOrig}-${val}`});
                       }} 
                    />
                 </div>
             </div>
          )}

          {/* DADOS TÉCNICOS (VOO / FUNÇÃO) */}
          {(showFlightFields || showFunctionSelector) && (
              <div className="flex flex-col gap-4">
                  {/* Campos de Voo */}
                  {showFlightFields && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] uppercase font-bold text-slate-500 flex items-center gap-1.5 tracking-wider"><Plane size={16} /> Voo</label>
                            <input type="text" placeholder="Ex: LH407" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-[17px] p-2.5 rounded outline-none uppercase font-mono" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] uppercase font-bold text-slate-500 tracking-wider">Rota</label>
                            <input type="text" placeholder="Ex: VCP-MAO" className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-[17px] p-2.5 rounded outline-none uppercase font-mono" value={formData.route} onChange={e => setFormData({...formData, route: e.target.value.toUpperCase()})} />
                        </div>
                    </div>
                  )}

                  {/* Função a Bordo Selector */}
                  {showFunctionSelector && (
                      <div className="flex flex-col gap-1.5">
                          <label className="text-[13px] uppercase font-bold text-slate-500 flex items-center gap-1.5 tracking-wider"><Briefcase size={16} /> Função / Qualificação</label>
                          <div className="grid grid-cols-4 gap-2">
                              {functionOptions.map((opt) => {
                                  const isActive = formData.functionCode === opt.code && (opt.code !== undefined || formData.type === 'VOO');
                                  // Determine styling
                                  // For TRIP. ATIVA (undefined code), check if type is VOO
                                  // For others, check functionCode matches
                                  
                                  const activeClass = isActive 
                                      ? `bg-${opt.color}-600 border-${opt.color}-500 text-slate-900 dark:text-white shadow-md`
                                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white';
                                  
                                  return (
                                      <button 
                                          key={opt.label}
                                          onClick={() => {
                                              let newType = opt.type as any;
                                              if ((formData.type === 'SIM' || formData.type === 'XQR') && opt.type === 'VOO') {
                                                  newType = formData.type;
                                              }
                                              setFormData({...formData, functionCode: opt.code as any, type: newType});
                                          }}
                                          className={`py-2 rounded border font-bold text-[10px] uppercase transition-all ${activeClass}`}
                                      >
                                          {opt.label}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                  )}

                  {/* Check Nature Selector (Only for checks/instruction) */}
                  {isCheckActivity && (
                      <div className="flex flex-col gap-1.5 p-3 bg-slate-100 dark:bg-slate-800/50 rounded border border-slate-300 dark:border-slate-700">
                          <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Natureza do Cheque/Instrução</label>
                          <div className="flex gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="checkNature" className="accent-blue-500" checked={formData.checkNature === 'VOO'} onChange={() => setFormData({...formData, checkNature: 'VOO'})} />
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">Em Voo (Rota)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="checkNature" className="accent-blue-500" checked={formData.checkNature === 'SIM'} onChange={() => setFormData({...formData, checkNature: 'SIM'})} />
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">Em Simulador</span>
                              </label>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* TEMPO E DATAS (Advanced) */}
          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] uppercase font-bold text-slate-500 flex items-center gap-1.5 tracking-wider"><Clock size={16} /> Horário Planejado</label>
                  <div className="flex items-center gap-2">
                      <input type="time" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-[17px] p-2.5 rounded outline-none text-center" value={formData.start} onChange={handleStartTimeChange} />
                      <span className="text-slate-500 font-bold">-</span>
                      <input type="time" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-[17px] p-2.5 rounded outline-none text-center" value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} />
                  </div>
              </div>
              <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] uppercase font-bold text-slate-500 flex items-center gap-1.5 tracking-wider justify-between">
                      <div className="flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-500" /> Executado</div>
                      <button onClick={handleApplyDelay} className="text-[10px] text-blue-400 hover:text-slate-900 dark:text-white uppercase font-bold bg-blue-900/30 px-2 py-0.5 rounded border border-blue-800/50 hover:bg-blue-800 transition-colors">Lançar Atraso</button>
                  </label>
                  <div className="flex items-center gap-2">
                      <input type="time" className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-400 font-bold text-[17px] p-2.5 rounded outline-none text-center focus:border-emerald-500 focus:bg-slate-50 dark:bg-slate-950 transition-colors" value={formData.actualStart} onChange={handleActualStartChange} />
                      <span className="text-slate-600 font-bold">-</span>
                      <input type="time" className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-400 font-bold text-[17px] p-2.5 rounded outline-none text-center focus:border-emerald-500 focus:bg-slate-50 dark:bg-slate-950 transition-colors" value={formData.actualEnd} onChange={e => setFormData({...formData, actualEnd: e.target.value})} />
                  </div>
              </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800/30 p-3 rounded border border-slate-200 dark:border-slate-800 flex items-start gap-3">
             <InfoIcon size={16} className="text-blue-500 mt-0.5" />
             <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong className="text-slate-700 dark:text-slate-300 block mb-1">Regulamentação:</strong>
                O sistema validará automaticamente os limites de jornada, repouso e as regras de folga (SGRF/RBAC 117) ao salvar.
             </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center rounded-b-lg">
           <button onClick={handleDeleteClick} className="px-4 py-2 bg-red-900/20 hover:bg-red-600/80 text-red-400 hover:text-slate-900 dark:text-white text-xs font-bold rounded shadow-sm border border-red-900/50 transition-all flex items-center gap-2 uppercase">
              <Trash2 size={16} /> Excluir
           </button>
           <div className="flex gap-3">
              <button onClick={onClose} className="px-6 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors uppercase">Cancelar</button>
              
              {/* Always show "Salvar e Novo" to allow rapid entry flow */}
              {onSaveAndNew && (
                  <button onClick={handleSaveAndNew} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white text-xs font-bold rounded shadow-lg flex items-center gap-2 transition-all active:scale-95 border border-slate-600 uppercase">
                      <Plus size={16} /> Salvar e Novo
                  </button>
              )}

              <button onClick={handleSave} className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white text-xs font-bold rounded shadow-lg flex items-center gap-2 transition-all active:scale-95 uppercase">
                  <Save size={16} /> Salvar
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// Helper Icon Component
const InfoIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);

export default EditAssignmentModal;


import React, { useState } from 'react';
import { X, Settings2, Repeat, Clock, Calendar, AlertTriangle, Moon, MapPin, Table2, Sunrise } from 'lucide-react';
import { GenerationParams } from '../types';

interface GenerationSettingsModalProps {
  onClose: () => void;
  params: GenerationParams;
  onUpdateParams: (newParams: GenerationParams) => void;
}

const GenerationSettingsModal: React.FC<GenerationSettingsModalProps> = ({
  onClose,
  params,
  onUpdateParams
}) => {
  const [activeTab, setActiveTab] = useState<'LOGIC' | 'LIMITS' | 'REST'>('LOGIC');

  const handleChange = (field: keyof GenerationParams, value: any) => {
      onUpdateParams({ ...params, [field]: value });
  };

  // Helpers for time conversion (minutes <-> HH:mm)
  const minToTime = (m: number) => {
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      return `${hh}:${mm}`;
  };

  const timeToMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="w-[1025px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-lg flex flex-col font-sans overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-100 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
             <Settings2 size={16} className="text-blue-400" />
             <span>Parâmetros de Geração</span>
          </div>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/30 px-2 pt-2 gap-1">
            <button 
                onClick={() => setActiveTab('LOGIC')}
                className={`px-4 py-2 text-[11px] font-bold rounded-t flex items-center gap-2 ${activeTab === 'LOGIC' ? 'bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'}`}
            >
                <Repeat size={14} /> Lógica & Padrões
            </button>
            <button 
                onClick={() => setActiveTab('LIMITS')}
                className={`px-4 py-2 text-[11px] font-bold rounded-t flex items-center gap-2 ${activeTab === 'LIMITS' ? 'bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'}`}
            >
                <Clock size={14} /> Limites
            </button>
            <button 
                onClick={() => setActiveTab('REST')}
                className={`px-4 py-2 text-[11px] font-bold rounded-t flex items-center gap-2 ${activeTab === 'REST' ? 'bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'}`}
            >
                <Moon size={14} /> Repouso & Apres.
            </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          
          {/* TAB 1: LOGIC */}
          {activeTab === 'LOGIC' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Padrão de Escala</label>
                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-300 dark:border-slate-700">
                        <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Escala 5x3 / 5x4</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Prioriza folgas e trabalho em blocos fixos.</span>
                        </div>
                        <div 
                            onClick={() => handleChange('usePattern5x3', !params.usePattern5x3)}
                            className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${params.usePattern5x3 ? "bg-amber-600" : "bg-slate-700"}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${params.usePattern5x3 ? "translate-x-5" : ""}`}></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Restrições Especiais</label>
                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-300 dark:border-slate-700">
                        <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Regra de Monofolga</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Evitar apresentação antes das 10:00 após folga isolada.</span>
                        </div>
                        <div 
                            onClick={() => handleChange('enableMonofolga', !params.enableMonofolga)}
                            className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${params.enableMonofolga ? "bg-blue-600" : "bg-slate-700"}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${params.enableMonofolga ? "translate-x-5" : ""}`}></div>
                        </div>
                    </div>
                </div>

                {/* NEW: RE/SA Auto-Generation Toggles */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Geração Automática</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-300 dark:border-slate-700">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Gerar Reserva (RE)</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Preencher lacunas com RE.</span>
                            </div>
                            <div 
                                onClick={() => handleChange('generateRE', !params.generateRE)}
                                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${params.generateRE ? "bg-emerald-600" : "bg-slate-700"}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${params.generateRE ? "translate-x-5" : ""}`}></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-300 dark:border-slate-700">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Gerar Sobreaviso (SA)</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Preencher lacunas com SA.</span>
                            </div>
                            <div 
                                onClick={() => handleChange('generateSA', !params.generateSA)}
                                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${params.generateSA ? "bg-emerald-600" : "bg-slate-700"}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${params.generateSA ? "translate-x-5" : ""}`}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Duração Padrão (Gerador)</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300 dark:border-slate-700">
                            <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Período de RE</label>
                            <input type="time" 
                                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                                value={minToTime(params.defaultDurationRE)}
                                onChange={(e) => handleChange('defaultDurationRE', timeToMin(e.target.value))}
                            />
                        </div>
                        <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300 dark:border-slate-700">
                            <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Período de SA</label>
                            <input type="time" 
                                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                                value={minToTime(params.defaultDurationSA)}
                                onChange={(e) => handleChange('defaultDurationSA', timeToMin(e.target.value))}
                            />
                        </div>
                    </div>
                </div>
              </div>
          )}

          {/* TAB 2: LIMITS */}
          {activeTab === 'LIMITS' && (
              <div className="flex flex-col gap-6">
                
                {/* Standard Limits */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-300 dark:border-slate-700">
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Máx. Horas Voo (Mês)</label>
                        <input 
                        type="number" 
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                        value={params.maxFlightHoursMonth}
                        onChange={(e) => handleChange('maxFlightHoursMonth', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-300 dark:border-slate-700">
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Máx. Horas Voo (Ano)</label>
                        <input 
                        type="number" 
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                        value={params.maxFlightHoursYear}
                        onChange={(e) => handleChange('maxFlightHoursYear', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-300 dark:border-slate-700">
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Máx. Sobreavisos (Mês)</label>
                        <input 
                        type="number" 
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                        value={params.maxStandbyMonth}
                        onChange={(e) => handleChange('maxStandbyMonth', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-300 dark:border-slate-700">
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Total Folgas (Mín)</label>
                        <input 
                        type="number" 
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                        value={params.minDaysOffMonth}
                        onChange={(e) => handleChange('minDaysOffMonth', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    {/* NEW: Specific Day Off Limits */}
                    <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-300 dark:border-slate-700">
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Folgas Reg. (Mín)</label>
                        <input 
                        type="number" 
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                        value={params.minFrMonth}
                        onChange={(e) => handleChange('minFrMonth', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-300 dark:border-slate-700">
                        <div className="flex flex-col flex-1">
                            <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">FS (Mín)</label>
                            <input 
                            type="number" 
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                            value={params.minFsMonth}
                            onChange={(e) => handleChange('minFsMonth', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex flex-col flex-1">
                            <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">FS (Máx)</label>
                            <input 
                            type="number" 
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                            value={params.maxFsMonth}
                            onChange={(e) => handleChange('maxFsMonth', parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-300 dark:border-slate-700">
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Máx. INAT Consecutivos</label>
                        <input 
                        type="number" 
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                        value={params.maxConsecutiveInat}
                        onChange={(e) => handleChange('maxConsecutiveInat', parseInt(e.target.value) || 0)}
                        />
                    </div>

                    {/* NEW SETTING: Max Consecutive Duty Days */}
                    <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-300 dark:border-slate-700">
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold flex items-center gap-2">
                           <span>Períodos Máx. Consecutivos (incl. Repouso)</span>
                           <span className="text-[8px] bg-blue-900/50 text-blue-300 px-1.5 rounded">INAT conta como período</span>
                        </label>
                        <input 
                        type="number" 
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                        value={params.maxConsecutiveDutyDays}
                        onChange={(e) => handleChange('maxConsecutiveDutyDays', parseInt(e.target.value) || 0)}
                        />
                    </div>

                    {/* NEW SETTING: Max Duty for EXT */}
                    <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800/50 p-2 rounded border border-slate-300 dark:border-slate-700 col-span-2">
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold flex items-center gap-2">
                           <span>Jornada Máx. EXT (100% Extra)</span>
                           <span className="text-[8px] bg-purple-900/50 text-purple-300 px-1.5 rounded">Aplicado se apenas EXT</span>
                        </label>
                        <input 
                        type="time" 
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                        value={minToTime(params.maxDutyExt || 960)}
                        onChange={(e) => handleChange('maxDutyExt', timeToMin(e.target.value))}
                        />
                    </div>
                </div>

                {/* Madrugada Rules */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Sunrise size={14} className="text-orange-400" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Regras de Madrugada (00h-06h)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300 dark:border-slate-700">
                            <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Máx. Consecutivas</label>
                            <input type="number" 
                                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                                value={params.maxConsecutiveMadrugadas}
                                onChange={(e) => handleChange('maxConsecutiveMadrugadas', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300 dark:border-slate-700">
                            <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Máx. Período (168h)</label>
                            <input type="number" 
                                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                                value={params.maxMadrugadasIn168h}
                                onChange={(e) => handleChange('maxMadrugadasIn168h', parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 italic px-1">
                       * A 3ª madrugada consecutiva é permitida apenas como Extra a Serviço (DLS) retornando à base.
                    </p>
                </div>

                {/* RBAC 117 Reference Table */}
                <div className="border border-slate-300 dark:border-slate-700 rounded overflow-hidden">
                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 flex items-center gap-2 border-b border-slate-300 dark:border-slate-700">
                        <Table2 size={14} className="text-slate-600 dark:text-slate-400" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Limites de Jornada e Voo - RBAC 117 (Simples)</span>
                    </div>
                    <div className="grid grid-cols-6 text-[11px] text-center bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                        <div className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold">Início</div>
                        <div className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold">1-2 Etapas</div>
                        <div className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold">3-4 Etapas</div>
                        <div className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold">5 Etapas</div>
                        <div className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold">6 Etapas</div>
                        <div className="p-2 font-bold">7+ Etapas</div>
                    </div>
                    {[
                        ['06:00 - 06:59', '11 (9)', '11 (9)', '10 (8)', '9 (8)', '9 (8)'],
                        ['07:00 - 07:59', '12 (9,5)', '12 (9)', '11 (9)', '10 (8)', '9 (8)'],
                        ['08:00 - 11:59', '12 (10)', '12 (9,5)', '12 (9)', '11 (9)', '10 (8)'],
                        ['12:00 - 13:59', '12 (9,5)', '12 (9)', '11 (9)', '10 (8)', '9 (8)'],
                        ['14:00 - 15:59', '11 (9)', '11 (9)', '10 (8)', '9 (8)', '9 (8)'],
                        ['16:00 - 17:59', '10 (8)', '10 (8)', '9 (8)', '9 (8)', '9 (8)'],
                        ['18:00 - 05:59', '9 (8)', '9 (8)', '9 (7)', '9 (7)', '9 (7)']
                    ].map((row, i) => (
                        <div key={i} className="grid grid-cols-6 text-[12px] text-center bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            <div className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono text-blue-400 font-bold">{row[0]}</div>
                            <div className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono">{row[1]}</div>
                            <div className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono">{row[2]}</div>
                            <div className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono">{row[3]}</div>
                            <div className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono">{row[4]}</div>
                            <div className="p-2 font-mono">{row[5]}</div>
                        </div>
                    ))}
                </div>
              </div>
          )}

          {/* TAB 3: REST & PRESENTATION */}
          {activeTab === 'REST' && (
              <div className="flex flex-col gap-6">
                  
                  {/* Rest Settings */}
                  <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 mb-1">
                          <Moon size={14} className="text-purple-400" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Regras de Repouso (Mínimo)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300 dark:border-slate-700">
                              <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Pós-Voo</label>
                              <input type="time" 
                                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                                  value={minToTime(params.minRestPostFlight)}
                                  onChange={(e) => handleChange('minRestPostFlight', timeToMin(e.target.value))}
                              />
                          </div>
                          <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300 dark:border-slate-700">
                              <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Pós-Sobreaviso (SA)</label>
                              <input type="time" 
                                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                                  value={minToTime(params.minRestPostStandby)}
                                  onChange={(e) => handleChange('minRestPostStandby', timeToMin(e.target.value))}
                              />
                          </div>
                          <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300 dark:border-slate-700">
                              <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Outros (Padrão)</label>
                              <input type="time" 
                                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                                  value={minToTime(params.minRestDefault)}
                                  onChange={(e) => handleChange('minRestDefault', timeToMin(e.target.value))}
                              />
                          </div>
                      </div>
                  </div>

                  {/* Presentation Settings */}
                  <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 mb-1">
                          <MapPin size={14} className="text-emerald-400" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Apresentação (Antecedência)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300 dark:border-slate-700">
                              <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Na Base (Minutos)</label>
                              <input type="number" 
                                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                                  value={params.presentationBase}
                                  onChange={(e) => handleChange('presentationBase', parseInt(e.target.value) || 0)}
                              />
                          </div>
                          <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300 dark:border-slate-700">
                              <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Fora da Base (Minutos)</label>
                              <input type="number" 
                                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500"
                                  value={params.presentationOutstation}
                                  onChange={(e) => handleChange('presentationOutstation', parseInt(e.target.value) || 0)}
                              />
                          </div>
                      </div>
                  </div>

              </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-end">
           <button 
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white text-xs font-bold rounded shadow-lg transition-colors"
           >
              Salvar Configuração
           </button>
        </div>

      </div>
    </div>
  );
};

export default GenerationSettingsModal;

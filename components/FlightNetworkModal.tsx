
import React, { useState } from 'react';
import { X, Table2, Zap, Info, Plus, Trash2, Save, Loader2, Network, Clock, Grid2X2, GripVertical, Search, Plane } from 'lucide-react';
import { Flight } from '../types';

interface FlightNetworkModalProps {
  onClose: () => void;
  flights: Flight[];
}

interface MeshAssignment {
  type: 'FLIGHT_CHAIN' | 'BLOCK' | 'DSL' | 'REC';
  label: string;
  flights: {
      code: string;
      route: string;
      times: string;
      start: string;
      end: string;
  }[];
  colorClass: string;
  lastDestination: string;
}

const FlightNetworkModal: React.FC<FlightNetworkModalProps> = ({ onClose, flights: initialFlights }) => {
  const [activeTab, setActiveTab] = useState<'INPUT' | 'MANUAL' | 'AUTO'>('INPUT');
  
  // Grade de 7 dias (DOM=0 até SAB=6) representando a semana padrão (Template)
  const [weekDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // FIGURA 1: Dados da Planilha (Recursos Reais)
  const [meshInputs, setMeshInputs] = useState<Flight[]>(initialFlights.map(f => ({...f})));

  // FIGURA 2: Visualização dos Trilhos (Jornadas)
  const [meshAssignments, setMeshAssignments] = useState<Record<string, MeshAssignment>>({});

  const [patterns] = useState<{id: string, name: string}[]>([
      { id: 'p1', name: 'TRILHO ALPHA' },
      { id: 'p2', name: 'TRILHO BRAVO' },
      { id: 'p3', name: 'TRILHO CHARLIE' },
      { id: 'p4', name: 'TRILHO DELTA' },
      { id: 'p5', name: 'TRILHO ECHO' },
      { id: 'p6', name: 'TRILHO FOXTROT' },
  ]);

  const weekLabels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  const timeToMin = (time: string): number => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const handleUpdateInput = (index: number, field: keyof Flight, value: any) => {
    const next = [...meshInputs];
    next[index] = { ...next[index], [field]: value };
    setMeshInputs(next);
  };

  const toggleInputDay = (index: number, dayIdx: number) => {
    const next = [...meshInputs];
    const currentDays = next[index].daysOfWeek;
    if (currentDays.includes(dayIdx)) {
        next[index].daysOfWeek = currentDays.filter(d => d !== dayIdx);
    } else {
        next[index].daysOfWeek = [...currentDays, dayIdx].sort();
    }
    setMeshInputs(next);
  };

  const handleAddInputRow = () => {
    const newFlight: Flight = {
        code: `LV${Math.floor(1000 + Math.random() * 9000)}`,
        route: 'VCP-MAO',
        start: '08:00',
        end: '12:00',
        active: true,
        daysOfWeek: [1, 3, 5],
        composition: 'SIMPLES',
        serviceType: 'DOMESTICO',
        aircraftType: 'JATO',
        landings: 1,
        hasRestFacility: false,
        timezonesCrossed: 0
    };
    setMeshInputs([...meshInputs, newFlight]);
  };

  const handleAddGenericRow = () => {
    const newProg: Flight = {
        code: `PRG${Math.floor(100 + Math.random() * 899)}`,
        route: 'RESERVA',
        start: '06:00',
        end: '18:00',
        active: true,
        daysOfWeek: [1, 2, 3, 4, 5],
        composition: 'SIMPLES',
        serviceType: 'DOMESTICO',
        aircraftType: 'JATO',
        landings: 0,
        hasRestFacility: false,
        timezonesCrossed: 0
    };
    setMeshInputs([...meshInputs, newProg]);
  };

  // --- OTIMIZAÇÃO: DISTRIBUIÇÃO RECORRENTE (TEMPLATE SEMANAL) ---
  const handleAutoGenerateMesh = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
        const newAssignments: Record<string, MeshAssignment> = {};
        
        interface FlightOccurence {
            flight: Flight;
            day: number;
            used: boolean;
        }
        const pool: FlightOccurence[] = [];
        meshInputs.filter(f => f.active).forEach(f => {
            f.daysOfWeek.forEach(d => {
                pool.push({ flight: { ...f }, day: d, used: false });
            });
        });

        pool.sort((a, b) => {
            if (a.day !== b.day) return a.day - b.day;
            return timeToMin(a.flight.start) - timeToMin(b.flight.start);
        });

        const journeys: FlightOccurence[][] = [];
        for (let i = 0; i < pool.length; i++) {
            if (pool[i].used) continue;
            
            const outbound = pool[i];
            const [origin, dest] = outbound.flight.route.split('-');

            if (origin === 'VCP') {
                outbound.used = true;
                const currentJourney = [outbound];
                
                const inbound = pool.find(occ => 
                    !occ.used && 
                    occ.flight.route === `${dest}-${origin}` &&
                    (occ.day === outbound.day || occ.day === (outbound.day + 1) % 7) &&
                    (occ.day !== outbound.day || timeToMin(occ.flight.start) >= timeToMin(outbound.flight.end) + 60)
                );

                if (inbound) {
                    inbound.used = true;
                    currentJourney.push(inbound);
                }
                journeys.push(currentJourney);
            }
        }

        let railPtr = 0;
        journeys.forEach((journey) => {
            const rail = patterns[railPtr % patterns.length];
            
            journey.forEach(occ => {
                const f = occ.flight;
                const key = `${rail.id}-${occ.day}`;
                
                if (!newAssignments[key]) {
                    newAssignments[key] = {
                        type: 'FLIGHT_CHAIN',
                        label: 'FLIGHT',
                        flights: [],
                        colorClass: 'bg-emerald-900/60 text-emerald-400 border-emerald-800/50',
                        lastDestination: f.route.split('-')[1]
                    };
                }
                
                newAssignments[key].flights.push({
                    code: f.code,
                    route: f.route.replace('-', '>'),
                    times: `${f.start.replace(':','')}-${f.end.replace(':','')}`,
                    start: f.start,
                    end: f.end
                });
                
                newAssignments[key].flights.sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
            });
            railPtr++;
        });

        setMeshAssignments(newAssignments);
        setIsProcessing(false);
        setActiveTab('MANUAL'); 
    }, 600);
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleRouteDragStart = (e: React.DragEvent, flight: Flight) => {
    e.dataTransfer.setData('application/skyplan-route', JSON.stringify(flight));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleRouteDrop = (e: React.DragEvent, patternId: string, day: number) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('application/skyplan-route');
    if (!rawData) return;
    
    try {
        const flight = JSON.parse(rawData) as Flight;
        const key = `${patternId}-${day}`;
        
        setMeshAssignments(prev => {
            const current = prev[key];
            const newFlights = current ? [...current.flights] : [];
            
            newFlights.push({
                code: flight.code,
                route: flight.route.replace('-', '>'),
                times: `${flight.start.replace(':','')}-${flight.end.replace(':','')}`,
                start: flight.start,
                end: flight.end
            });
            
            newFlights.sort((a, b) => timeToMin(a.start) - timeToMin(b.start));

            return {
                ...prev,
                [key]: {
                    type: 'FLIGHT_CHAIN',
                    label: 'FLIGHT',
                    flights: newFlights,
                    colorClass: 'bg-emerald-900/60 text-emerald-400 border-emerald-800/50',
                    lastDestination: flight.route.split('-')[1]
                }
            };
        });
    } catch (err) {
        console.error("Erro no drop da rota:", err);
    }
  };

  const removeAssignment = (patternId: string, day: number) => {
      setMeshAssignments(prev => {
          const next = { ...prev };
          delete next[`${patternId}-${day}`];
          return next;
      });
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200 p-8">
      <div className="w-full h-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col font-sans overflow-hidden">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-5">
             <div className="w-12 h-12 bg-[#00A86B] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
                <Grid2X2 size={28} className="text-slate-900 dark:text-white" />
             </div>
             <div>
                <h2 className="text-slate-900 dark:text-white font-black text-2xl uppercase tracking-tighter leading-tight">Configurador de Trilhos</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Grade Semanal de Distribuição de Recursos</p>
             </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-all">
            <X size={28} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900/30 px-8 pt-4 gap-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <button 
                onClick={() => setActiveTab('INPUT')}
                className={`px-10 py-4 text-xs font-black rounded-t-xl flex items-center gap-3 transition-all border-x border-t ${activeTab === 'INPUT' ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-blue-400' : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
            >
                <Table2 size={18} /> 1. PLANILHA DE MALHA (FIG 1)
            </button>
            <button 
                onClick={() => setActiveTab('MANUAL')}
                className={`px-10 py-4 text-xs font-black rounded-t-xl flex items-center gap-3 transition-all border-x border-t ${activeTab === 'MANUAL' ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-[#00A86B]' : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
            >
                <Network size={18} /> 2. TRILHOS RECORRENTES (FIG 2)
            </button>
        </div>

        <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-950">
            {activeTab === 'INPUT' && (
                <div className="flex-1 p-10 overflow-auto custom-scrollbar">
                    <div className="bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-inner">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex flex-col">
                                <h3 className="text-slate-900 dark:text-white font-black text-lg uppercase tracking-widest flex items-center gap-3">
                                    <Info size={20} className="text-blue-400" /> Definição de Malha Recorrente
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mt-1">Voos selecionados aqui serão distribuídos pela semana nos trilhos técnicos.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleAddGenericRow} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white text-xs font-black rounded-lg uppercase transition-all flex items-center gap-3 shadow-lg shadow-slate-900/20 active:scale-95">
                                    <Plus size={18} /> Nova Programação
                                </button>
                                <button onClick={handleAddInputRow} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white text-xs font-black rounded-lg uppercase transition-all flex items-center gap-3 shadow-lg shadow-blue-900/20 active:scale-95">
                                    <Plus size={18} /> Novo Voo
                                </button>
                            </div>
                        </div>

                        <div className="w-full overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100 dark:bg-slate-800/80 text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-6 py-5 border-r border-slate-300 dark:border-slate-700 w-16 text-center">ON</th>
                                        <th className="px-6 py-5 border-r border-slate-300 dark:border-slate-700">Código</th>
                                        <th className="px-6 py-5 border-r border-slate-300 dark:border-slate-700">Rota</th>
                                        <th className="px-6 py-5 border-r border-slate-300 dark:border-slate-700 text-center">Início</th>
                                        <th className="px-6 py-5 border-r border-slate-300 dark:border-slate-700 text-center">Fim</th>
                                        <th className="px-6 py-5 text-center min-w-[440px]">Frequência Semanal (Template)</th>
                                        <th className="px-6 py-5 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-slate-100 dark:bg-slate-900/40">
                                    {meshInputs.map((f, idx) => (
                                        <tr key={idx} className="border-t border-slate-200 dark:border-slate-800 hover:bg-blue-900/5 transition-colors group">
                                            <td className="px-6 py-4 border-r border-slate-200 dark:border-slate-800 text-center">
                                                <input type="checkbox" checked={f.active} onChange={e => handleUpdateInput(idx, 'active', e.target.checked)} className="accent-blue-500 w-5 h-5 rounded" />
                                            </td>
                                            <td className="px-6 py-4 border-r border-slate-200 dark:border-slate-800">
                                                <input type="text" value={f.code} onChange={e => handleUpdateInput(idx, 'code', e.target.value.toUpperCase())} className="bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-black text-sm outline-none focus:border-blue-500 px-3 py-1.5 rounded w-28" />
                                            </td>
                                            <td className="px-6 py-4 border-r border-slate-200 dark:border-slate-800">
                                                <input type="text" value={f.route} onChange={e => handleUpdateInput(idx, 'route', e.target.value.toUpperCase())} className="bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-black text-sm outline-none focus:border-blue-500 px-3 py-1.5 rounded w-40" />
                                            </td>
                                            <td className="px-6 py-4 border-r border-slate-200 dark:border-slate-800 text-center">
                                                <input type="time" value={f.start} onChange={e => handleUpdateInput(idx, 'start', e.target.value)} className="bg-transparent border-none text-blue-300 font-mono font-black text-[17px] text-center" />
                                            </td>
                                            <td className="px-6 py-4 border-r border-slate-200 dark:border-slate-800 text-center">
                                                <input type="time" value={f.end} onChange={e => handleUpdateInput(idx, 'end', e.target.value)} className="bg-transparent border-none text-blue-300 font-mono font-black text-[17px] text-center" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    {[1, 2, 3, 4, 5, 6, 0].map(day => (
                                                        <button key={day} onClick={() => toggleInputDay(idx, day)} className={`w-[50px] h-10 rounded-lg border-2 font-black text-[11px] transition-all ${f.daysOfWeek.includes(day) ? 'bg-blue-600 border-blue-400 text-slate-900 dark:text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}>
                                                            {weekLabels[day]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => setMeshInputs(meshInputs.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-500 transition-all p-2 hover:bg-red-500/10 rounded-lg"><Trash2 size={20} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'MANUAL' && (
                <div className="flex-1 flex overflow-hidden">
                    {/* Painel Lateral de Rotas (Drag Panel) */}
                    <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/20">
                            <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <Plane size={14} /> Rotas Disponíveis (FIG 1)
                            </h4>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                                <input type="text" placeholder="Filtrar rotas..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-9 pr-4 text-[10px] text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
                            {meshInputs.filter(f => f.active).map((flight) => (
                                <div 
                                    key={flight.code}
                                    draggable
                                    onDragStart={(e) => handleRouteDragStart(e, flight)}
                                    className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 p-3 rounded-xl flex flex-col gap-1 cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:bg-slate-800 hover:border-slate-300 dark:border-slate-600 transition-all group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className="text-[11px] font-black text-slate-900 dark:text-white font-mono">{flight.code}</span>
                                        <div className="w-6 h-6 bg-white dark:bg-slate-900 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-blue-400 transition-colors">
                                            <GripVertical size={14} />
                                        </div>
                                    </div>
                                    <div className="text-[13px] font-black text-blue-400 font-mono tracking-tight relative z-10">
                                        {flight.route.replace('-', ' → ')}
                                    </div>
                                    <div className="flex gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 relative z-10">
                                        <Clock size={12} className="shrink-0" />
                                        <span>{flight.start} - {flight.end}</span>
                                    </div>
                                    <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Plane size={48} className="-rotate-45" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grid de Trilhos */}
                    <div className="flex-1 overflow-auto custom-scrollbar p-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/40 via-transparent to-transparent">
                        <div className="min-w-max bg-white/5 p-8 rounded-2xl border border-white/10 shadow-2xl relative">
                            {/* Header de Dias Semanais (Template Recorrente) */}
                            <div className="flex mb-12 sticky top-0 bg-slate-50 dark:bg-slate-950/95 backdrop-blur-md z-20 pb-4 border-b border-white/5">
                                <div className="w-48 shrink-0"></div>
                                <div className="flex flex-1">
                                    {weekDays.map((d) => (
                                        <div key={d} className="w-[210px] shrink-0 text-center">
                                            <div className="text-sm font-black uppercase text-slate-100 mb-1">{weekLabels[d]}</div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold uppercase tracking-widest">TEMPLATE</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Trilhos Técnicos (Visualização da Semana Recorrente) */}
                            <div className="space-y-10">
                                {patterns.map((pat) => (
                                    <div key={pat.id} className="flex h-16 items-center">
                                        <div className="w-48 shrink-0 flex flex-col justify-center pr-6">
                                            <span className="text-[11px] font-black text-slate-100 uppercase tracking-widest leading-none">{pat.name}</span>
                                            <span className="text-[8px] font-bold text-slate-600 mt-1 uppercase">RECURSO OPERACIONAL</span>
                                        </div>
                                        <div className="flex flex-1 h-full relative">
                                            <div className="absolute inset-0 flex pointer-events-none opacity-5">
                                               {weekDays.map((d) => <div key={d} className="w-[210px] border-l border-white h-full"></div>)}
                                            </div>

                                            {weekDays.map((d) => {
                                                const assign = meshAssignments[`${pat.id}-${d}`];
                                                
                                                return (
                                                    <div 
                                                        key={d} 
                                                        className="w-[210px] h-full flex items-center px-1"
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={(e) => handleRouteDrop(e, pat.id, d)}
                                                    >
                                                        {!assign ? (
                                                            <div className="w-full h-10 border border-slate-300 dark:border-slate-700 border-dashed rounded-sm flex items-center justify-center opacity-20 hover:opacity-100 transition-all hover:bg-blue-600/5 group">
                                                                <Plus size={14} className="text-slate-500 dark:text-slate-400 group-hover:text-blue-400" />
                                                            </div>
                                                        ) : (
                                                            <div className={`w-full min-h-[2.5rem] flex flex-row items-stretch justify-center gap-[2px] transition-all cursor-pointer relative group`}>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); removeAssignment(pat.id, d); }}
                                                                    className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-slate-300 dark:border-slate-700 hover:text-red-400 z-30"
                                                                >
                                                                    <X size={10} />
                                                                </button>
                                                                {assign.flights.map((f, i) => (
                                                                    <div key={i} className="flex-1 flex flex-col items-center justify-center leading-[1.1] bg-emerald-900/60 text-emerald-400 border border-emerald-800/50 rounded-sm shadow-md py-1.5 px-1 hover:bg-emerald-800/80 transition-all">
                                                                        <span className="text-[9px] truncate w-full text-center font-black tracking-tighter">{f.route}</span>
                                                                        <span className="text-[7px] font-mono font-bold opacity-80">{f.code}</span>
                                                                    </div>
                                                                ))}
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                                                                    {assign.flights.map(f => `${f.route} (${f.start}-${f.end})`).join(' / ')}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-8 flex justify-between items-center shrink-0">
            <div className="flex flex-col">
                <span className="text-[14px] text-slate-900 dark:text-white font-black uppercase tracking-tight">Status do Configurador</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mt-1 tracking-widest">Semana Única: Recurso por dia não duplicável • Trilhos: {patterns.length}</span>
            </div>
            <div className="flex gap-4">
                <button onClick={onClose} className="px-14 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-700 transition-colors">Fechar</button>
                {activeTab === 'MANUAL' && (
                    <button 
                        onClick={handleAutoGenerateMesh}
                        disabled={isProcessing}
                        className="px-14 py-4 bg-[#00A86B] text-slate-900 dark:text-white text-xs font-black uppercase rounded-xl hover:bg-[#00925c] border-2 border-white shadow-[0_0_30px_rgba(0,168,107,0.3)] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                        <span>GERAR TRILHOS</span>
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default FlightNetworkModal;

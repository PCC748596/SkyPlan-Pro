
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Plane, Users, User, Printer, UserCog, Key, LogOut, X, ChevronRight, LayoutGrid, Clock, Map, Activity, IdCard } from 'lucide-react';
import { ScheduleMap, CrewMember, Assignment, Flight, SystemModule, QualificationDefinition, CrewBase } from '../types';
import CrewSearchModal from './CrewSearchModal';

interface HeaderProps {
  schedule: ScheduleMap;
  crew: CrewMember[];
  bases?: CrewBase[];
  qualifications?: QualificationDefinition[];
  clipboard?: Assignment[] | null; // CHANGED to array
  flights?: Flight[];
  alerts?: number;
  viewMode?: 'CREW' | 'AIRCRAFT';
  activeModule: SystemModule;
  onOpenBases: () => void;
  onOpenActivities: () => void;
  onOpenQualifications?: () => void;
  onOpenCopyModal?: () => void;
  onOpenAircraft?: () => void;
  onOpenFleet?: () => void;
  onToggleViewMode?: () => void;
  onModuleChange: (module: SystemModule) => void;
  onDeleteCrew?: (id: string) => void;
  onUpdateCrew?: (updatedCrew: CrewMember) => void; // New prop
  onAddCrew?: (newCrew: CrewMember) => void; // New prop for Adding
  onSyncQualifications?: () => void;
  showCaptains?: boolean;
  onToggleCaptains?: () => void;
  showFirstOfficers?: boolean;
  onToggleFirstOfficers?: () => void;
}

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass: string;
  onClick?: () => void;
  isActive?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, colorClass, onClick, isActive = true }) => (
  <div 
    onClick={onClick}
    className={`flex flex-col p-2.5 rounded-lg border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 backdrop-blur-sm ${colorClass} shadow-md dark:shadow-lg transition-all hover:border-slate-400 dark:hover:border-slate-600 min-w-[100px] ${onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''} ${!isActive ? 'opacity-40 grayscale' : ''}`}
  >
    <div className="flex justify-between items-start mb-1 gap-4">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
      <div className="opacity-80 scale-90">{icon}</div>
    </div>
    <span className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">{value}</span>
  </div>
);

const Header: React.FC<HeaderProps> = ({ 
  schedule, 
  crew,
  bases,
  qualifications,
  onOpenBases,
  onOpenActivities, 
  onOpenQualifications,
  onOpenCopyModal,
  onOpenAircraft,
  onOpenFleet,
  clipboard,
  flights,
  alerts,
  activeModule, 
  onModuleChange,
  viewMode = 'CREW',
  onToggleViewMode,
  onDeleteCrew,
  onUpdateCrew,
  onAddCrew,
  onSyncQualifications,
  showCaptains = true,
  onToggleCaptains,
  showFirstOfficers = true,
  onToggleFirstOfficers
}) => {
  const stats = useMemo(() => {
    const totalCMTE = crew.filter(c => c.role === 'CMTE' && c.isOn).length;
    const totalCOP = crew.filter(c => c.role === 'COP' && c.isOn).length;
    
    const filteredCMTE = crew.filter(c => c.role === 'CMTE' && c.isOn && showCaptains).length;
    const filteredCOP = crew.filter(c => c.role === 'COP' && c.isOn && showFirstOfficers).length;
    
    return { 
        totalCMTE: filteredCMTE, 
        totalCOP: filteredCOP,
        allCMTE: totalCMTE,
        allCOP: totalCOP,
        activeAircraft: 1
    };
  }, [crew, showCaptains, showFirstOfficers]);

  const [expireFilter, setExpireFilter] = useState<30 | 60 | 90>(30);

  const expiringQualifications = useMemo(() => {
    const expired: { crewName: string; qualCode: string; expirationDate: string, diffDays: number, isCurrentMonth: boolean }[] = [];
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    crew.forEach(member => {
        if (!member.isOn || !member.qualifications) return;
        
        Object.entries(member.qualifications).forEach(([code, qual]) => {
            if (qual.expirationDate && qual.expirationDate.length >= 6) {
               let m: number | undefined, y: number | undefined, d: number | undefined;
               if (qual.expirationDate.includes('/')) {
                   const parts = qual.expirationDate.split('/');
                   if (parts.length === 3) {
                       d = parseInt(parts[0], 10);
                       m = parseInt(parts[1], 10);
                       y = parseInt(parts[2], 10);
                   } else if (parts.length === 2) {
                       m = parseInt(parts[0], 10);
                       y = parseInt(parts[1], 10);
                   }
               } else if (qual.expirationDate.includes('-')) {
                   const p = qual.expirationDate.split('-');
                   y = parseInt(p[0], 10);
                   m = parseInt(p[1], 10);
                   if (p.length > 2) d = parseInt(p[2], 10);
               }
               if (m && y) {
                   if (y < 100) y += 2000;
                   if (!d) d = new Date(y, m, 0).getDate();

                   const expDate = new Date(y, m - 1, d, 23, 59, 59, 999);
                   const diffTime = expDate.getTime() - today.getTime();
                   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                   
                    const formattedDate = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
                   expired.push({
                      crewName: member.name,
                      qualCode: code,
                      expirationDate: formattedDate,
                      diffDays,
                      isCurrentMonth: (m === currentMonth && y === currentYear)
                   });
               }
            }
        });
    });
    return expired.sort((a, b) => a.crewName.localeCompare(b.crewName));
  }, [crew]);

  const filteredExpiringQualifications = useMemo(() => {
    return expiringQualifications.filter(q => q.diffDays <= expireFilter);
  }, [expiringQualifications, expireFilter]);

  const rawExpiringCurrentMonthCount = useMemo(() => {
    return expiringQualifications.filter(q => q.isCurrentMonth).length;
  }, [expiringQualifications]);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showCrewSearch, setShowCrewSearch] = useState(false);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [showChangeUser, setShowChangeUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuOptions = ['ARQUIVO', 'PLANEJAMENTO', 'COORDENAÇÃO', 'CONTROLE', 'CADASTROS', 'RELATÓRIOS', 'SOBRE'];

  // Sub-menu definitions
  const planejamentoItems = ["Cenários de Escala", "Folhão", "Publicação", "Ferramentas"];
  const coordenacaoItems = ["Atualização de Vôos Diários", "Fechamento de Escala", "Geração de Vôos Diários (Escala)", "Jornada Interrompida", "Pilot Fly Simulador"];
  const controleItems = ["Conferência de Escala", "Diárias de Tripulantes", "Diário de Bordo", "Pagamento de Tripulantes"];

  const cadastrosItems = [
    "Aeroporto",
    "Atividades",
    "Atividades com Pagamento",
    "Bases de Tripulante",
    "Cargo por Frota",
    "Cargo por Voo",
    "Cargo Tripulante",
    "Carteiras de Tripulante",
    "Cidade",
    "Distância",
    "Empresa Aérea",
    "Feriado",
    "Frota",
    "Função de Tripulantes",
    "Grupo de Restrições",
    "Hotel",
    "Mensagens Tripulante",
    "Ocorrências da Escala de Tripulantes",
    "País",
    "Parâmetros da Empresa",
    "Parâmetros do Usuário",
    { label: "Regulamentação", hasSub: true },
    "Restrição de Linha de Voo",
    "Restrição de Pernoite",
    "Restrição Operacional",
    "Tempo de Apresentação",
    "Tempo de Pernoite",
    "Tipo de Atividade",
    "Tipo de Tripulação",
    "Tripulante",
    "Turma",
    { label: "Valor de Salário", hasSub: true },
    "Valor Diária",
    "Valor Pernoite"
  ];

  const relatoriosItems = [
    "Análise de Escala",
    "Apresentação de Tripulantes",
    "Auditoria de Documentos",
    "Avaliação de Tripulantes",
    "Conferência de Diárias",
    "Diária de Tripulantes",
    "Diferença de Escalas",
    { label: "Escala", hasSub: true },
    { label: "Folhão", hasSub: true },
    "Função a Bordo",
    { label: "Horas de Vôo de Tripulantes", hasSub: true },
    { label: "Jornadas", hasSub: true },
    "Malha Diária de Vôos",
    "Movimento de Aeronaves",
    { label: "Pagamento de Tripulantes", hasSub: true },
    "Pedido de Tripulantes",
    "Pernoite de Tripulantes",
    "Programação de Atividades",
    "Regulamentação",
    "Rodízio de Chaves",
    "Tempo de Vôo",
    "Tripulantes",
    "Tripulantes por Chave",
    "Turmas",
    { label: "Vencimentos", hasSub: true },
    "Vôos Planejados da Escala"
  ];

  const modules: { id: SystemModule; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { id: 'ESCALA', label: 'ESCALA', icon: <LayoutGrid size={14} /> },
    { id: 'COORDENAÇÃO', label: 'COORDENAÇÃO', icon: <Clock size={14} />, disabled: true },
    { id: 'PLANEJAMENTO', label: 'PLANEJAMENTO', icon: <Map size={14} />, disabled: true },
    { id: 'FADIGA', label: 'FADIGA (FRMS)', icon: <Activity size={14} /> },
  ];

  return (
    <div className="flex flex-col shrink-0 relative z-50 shadow-md bg-white dark:bg-slate-900">
      {/* 1. Menu Bar */}
      <div className="h-8 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center px-2 select-none" ref={menuRef}>
         {menuOptions.map((item) => (
            <div key={item} className="relative">
               <button
                  disabled={item === 'PLANEJAMENTO' || item === 'COORDENAÇÃO'}
                  onClick={() => {
                    if (item === 'PLANEJAMENTO' || item === 'COORDENAÇÃO') return;
                    if (item === 'SOBRE') {
                      setShowAbout(true);
                      setOpenMenu(null);
                    } else {
                      setOpenMenu(openMenu === item ? null : item);
                    }
                  }}
                  className={`text-[13px] font-bold px-3 py-1.5 mx-0.5 rounded-sm transition-colors ${
                      item === 'PLANEJAMENTO' || item === 'COORDENAÇÃO' 
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                      : openMenu === item || (item === 'SOBRE' && showAbout)
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
               >
                  {item}
               </button>

               {/* Dropdown for ARQUIVO */}
               {item === 'ARQUIVO' && openMenu === 'ARQUIVO' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-sm py-1 z-[60] flex flex-col animate-in fade-in zoom-in-95 duration-100">
                     <button onClick={() => { setShowPrinterSettings(true); setOpenMenu(null); }} className="text-left px-4 py-2 text-[14px] text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-colors">
                        <Printer size={14} /> Configurar impressora...
                     </button>
                     <button onClick={() => { setShowChangeUser(true); setOpenMenu(null); }} className="text-left px-4 py-2 text-[14px] text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-colors">
                        <UserCog size={14} /> Alterar Usuário...
                     </button>
                     <button onClick={() => { setShowChangePassword(true); setOpenMenu(null); }} className="text-left px-4 py-2 text-[14px] text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-colors">
                        <Key size={14} /> Alterar Senha...
                     </button>
                     <div className="h-px bg-slate-200 dark:bg-slate-800 my-1 mx-2"></div>
                     <button onClick={() => { setShowLogoutConfirm(true); setOpenMenu(null); }} className="text-left px-4 py-2 text-[14px] text-red-500 hover:bg-red-900/50 hover:text-red-200 flex items-center gap-3 transition-colors">
                        <LogOut size={14} /> Sair
                     </button>
                  </div>
               )}

               {/* Dropdown for PLANEJAMENTO */}
               {item === 'PLANEJAMENTO' && openMenu === 'PLANEJAMENTO' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-sm py-1 z-[60] flex flex-col animate-in fade-in zoom-in-95 duration-100">
                     {planejamentoItems.map((sub, idx) => (
                        <button key={idx} onClick={() => onModuleChange('PLANEJAMENTO')} className="text-left px-4 py-1.5 text-[14px] text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors group w-full">
                           {sub}
                        </button>
                     ))}
                  </div>
               )}

               {/* Dropdown for COORDENAÇÃO */}
               {item === 'COORDENAÇÃO' && openMenu === 'COORDENAÇÃO' && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-sm py-1 z-[60] flex flex-col animate-in fade-in zoom-in-95 duration-100">
                     {coordenacaoItems.map((sub, idx) => (
                        <button key={idx} onClick={() => onModuleChange('COORDENAÇÃO')} className="text-left px-4 py-1.5 text-[14px] text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors group w-full">
                           {sub}
                        </button>
                     ))}
                  </div>
               )}

               {/* Dropdown for CONTROLE */}
               {item === 'CONTROLE' && openMenu === 'CONTROLE' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-sm py-1 z-[60] flex flex-col animate-in fade-in zoom-in-95 duration-100">
                     {controleItems.map((sub, idx) => (
                        <button key={idx} className="text-left px-4 py-1.5 text-[14px] text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors group w-full">
                           {sub}
                        </button>
                     ))}
                  </div>
               )}

               {/* Dropdown for CADASTROS */}
               {item === 'CADASTROS' && openMenu === 'CADASTROS' && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-sm py-1 z-[60] flex flex-col animate-in fade-in zoom-in-95 duration-100 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
                     {cadastrosItems.map((subItem, idx) => {
                        const label = typeof subItem === 'string' ? subItem : subItem.label;
                        const hasSub = typeof subItem === 'object' && subItem.hasSub;
                        
                        return (
                           <button 
                              key={idx}
                              onClick={() => {
                                 if (label === 'Tripulante') {
                                    setShowCrewSearch(true);
                                    setOpenMenu(null);
                                 } else if (label === 'Atividades') {
                                    onOpenActivities();
                                    setOpenMenu(null);
                                 } else if (label === 'Bases de Tripulante') {
                                    onOpenBases();
                                    setOpenMenu(null);
                                 } else if (label === 'Carteiras de Tripulante') {
                                    if (onOpenQualifications) onOpenQualifications();
                                    setOpenMenu(null);
                                 } else if (label === 'Frota') {
                                    if (onOpenAircraft) onOpenAircraft();
                                    setOpenMenu(null);
                                 }
                              }}
                              className="text-left px-4 py-1.5 text-[14px] text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors group border-b border-slate-200 dark:border-slate-800/50 last:border-0 w-full"
                           >
                              <span>{label}</span>
                              {hasSub && <ChevronRight size={12} className="text-slate-400 dark:text-slate-500 group-hover:text-white" />}
                           </button>
                        );
                     })}
                  </div>
               )}

               {/* Dropdown for RELATÓRIOS */}
               {item === 'RELATÓRIOS' && openMenu === 'RELATÓRIOS' && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-sm py-1 z-[60] flex flex-col animate-in fade-in zoom-in-95 duration-100 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
                     {relatoriosItems.map((subItem, idx) => {
                        const label = typeof subItem === 'string' ? subItem : subItem.label;
                        const hasSub = typeof subItem === 'object' && subItem.hasSub;
                        
                        return (
                           <button 
                              key={idx}
                              className="text-left px-4 py-1.5 text-[14px] text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors group border-b border-slate-200 dark:border-slate-800/50 last:border-0 w-full"
                           >
                              <span>{label}</span>
                              {hasSub && <ChevronRight size={12} className="text-slate-400 dark:text-slate-500 group-hover:text-white" />}
                           </button>
                        );
                     })}
                  </div>
               )}
            </div>
         ))}
      </div>

      {/* 2. KPI / Toolbar */}
      <div className="h-16 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-4">
        
        {/* KPI Stats */}
        <div className="flex gap-2">
          <KpiCard label="Aeronaves" value={stats.activeAircraft} icon={<Plane size={18} />} colorClass="text-blue-600 dark:text-blue-400" />
          <KpiCard label="Comandantes" value={stats.totalCMTE} icon={<User size={18} />} colorClass="text-emerald-600 dark:text-emerald-400" onClick={onToggleCaptains} isActive={showCaptains} />
          <KpiCard label="Copilotos" value={stats.totalCOP} icon={<Users size={18} />} colorClass="text-cyan-600 dark:text-cyan-400" onClick={onToggleFirstOfficers} isActive={showFirstOfficers} />
          <KpiCard label="Carteiras" value={rawExpiringCurrentMonthCount} icon={<IdCard size={18} />} colorClass="text-orange-600 dark:text-orange-400" onClick={() => setShowExpiringModal(true)} />
        </div>

        <div className="w-px h-10 bg-slate-300 dark:bg-slate-800 mx-2"></div>

        {/* --- MODULE SWITCHER --- */}
        <div className="flex bg-slate-200 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-300 dark:border-slate-700">
           {modules.map((m) => (
              <button
                 key={m.id}
                 onClick={() => !m.disabled && onModuleChange(m.id)}
                 disabled={m.disabled}
                 className={`
                    px-4 py-2 rounded text-[10px] font-bold flex items-center gap-2 transition-all uppercase tracking-wide
                    ${activeModule === m.id 
                       ? 'bg-blue-600 text-white shadow-md' 
                       : m.disabled 
                         ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                         : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700/50'}
                 `}
              >
                 {m.icon}
                 {m.label}
              </button>
           ))}
        </div>

        <div className="w-px h-10 bg-slate-300 dark:bg-slate-800 mx-2"></div>

        {/* View Toggle */}
        <div className="flex flex-col gap-1">
           <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Visualização</label>
           <button 
              onClick={onToggleViewMode}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors uppercase shadow-sm"
           >
              {viewMode === 'CREW' ? 'Por Tripulação' : 'Por Aeronave'}
           </button>
        </div>
        
        {/* System Status */}
        <div className="flex flex-col items-end justify-center text-slate-500 text-[10px] font-mono ml-auto">
          <span>SYSTEM: ONLINE</span>
          <span className="text-emerald-600 dark:text-emerald-500">SYNC: 12ms</span>
        </div>
      </div>

      {showCrewSearch && (
        <CrewSearchModal 
            crew={crew} 
            bases={bases || []}
            qualifications={qualifications}
            onClose={() => setShowCrewSearch(false)} 
            onDeleteCrew={onDeleteCrew}
            onUpdateCrew={onUpdateCrew} 
            onAddCrew={onAddCrew} // Passed prop
            onSyncQualifications={onSyncQualifications}
        />
      )}

      {showAbout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-5 w-80 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAbout(false)} className="absolute top-3 right-3 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={18} /></button>
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-3 transition-transform hover:rotate-6 duration-500"><Plane className="text-white -rotate-45" size={48} /></div>
            <div className="text-center space-y-1"><h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">SkyPlan Pro</h2><p className="text-blue-600 dark:text-blue-400 font-mono text-[10px] tracking-[0.2em] font-bold uppercase">Sistema de Escala Técnica</p></div>
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700"><span className="text-slate-500 dark:text-slate-400 text-xs font-mono font-semibold">Versão v0090</span></div>
            <div className="text-[10px] text-slate-500 dark:text-slate-600 text-center max-w-[200px] leading-relaxed pt-2">© 2025 SkyPlan Ops Control.<br/>Todos os direitos reservados.</div>
          </div>
        </div>
      )}

      {showPrinterSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-2xl flex flex-col gap-4 w-96 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
               <Printer className="text-blue-600 dark:text-blue-400" size={24} />
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configurar Impressora</h3>
               <button onClick={() => setShowPrinterSettings(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={18} /></button>
            </div>
            
            <div className="space-y-4 py-2">
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">IMPRESSORA PADRÃO</label>
                   <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                      <option>Microsoft Print to PDF</option>
                      <option>Microsoft XPS Document Writer</option>
                      <option>Fax</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">PAPEL</label>
                   <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                      <option>A4 (210 x 297 mm)</option>
                      <option>Carta</option>
                      <option>Ofício</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ORIENTAÇÃO</label>
                   <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                         <input type="radio" name="orientation" value="landscape" defaultChecked className="text-blue-600 focus:ring-blue-500" />
                         <span className="text-sm text-slate-700 dark:text-slate-300">Paisagem</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                         <input type="radio" name="orientation" value="portrait" className="text-blue-600 focus:ring-blue-500" />
                         <span className="text-sm text-slate-700 dark:text-slate-300">Retrato</span>
                      </label>
                   </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
               <button onClick={() => setShowPrinterSettings(false)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">Cancelar</button>
               <button onClick={() => setShowPrinterSettings(false)} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors">Salvar Configurações</button>
            </div>
          </div>
        </div>
      )}

      {showChangeUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-2xl flex flex-col gap-4 w-80 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
               <UserCog className="text-blue-600 dark:text-blue-400" size={24} />
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alterar Usuário</h3>
               <button onClick={() => setShowChangeUser(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={18} /></button>
            </div>
            
            <div className="space-y-4 py-2">
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">NOVO USUÁRIO</label>
                   <input type="text" placeholder="Nome de usuário" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">SENHA ATUAL</label>
                   <input type="password" placeholder="Digite sua senha" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
               <button onClick={() => setShowChangeUser(false)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">Cancelar</button>
               <button onClick={() => setShowChangeUser(false)} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-2xl flex flex-col gap-4 w-80 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
               <Key className="text-blue-600 dark:text-blue-400" size={24} />
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alterar Senha</h3>
               <button onClick={() => setShowChangePassword(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={18} /></button>
            </div>
            
            <div className="space-y-4 py-2">
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">SENHA ATUAL</label>
                   <input type="password" placeholder="Senha atual" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">NOVA SENHA</label>
                   <input type="password" placeholder="Nova senha" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">CONFIRMAR NOVA SENHA</label>
                   <input type="password" placeholder="Confirme a nova senha" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
               <button onClick={() => setShowChangePassword(false)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">Cancelar</button>
               <button onClick={() => setShowChangePassword(false)} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors">Alterar</button>
            </div>
          </div>
        </div>
      )}

      {showExpiringModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl flex flex-col w-[500px] max-h-[80vh] relative animate-in zoom-in-95 duration-200">
            <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl gap-3">
               <div className="flex items-center justify-between">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <IdCard className="text-orange-500" size={20} />
                   VENCIMENTO DAS CARTEIRAS
                 </h3>
                 <button onClick={() => setShowExpiringModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"><X size={20} /></button>
               </div>
               
               <div className="flex gap-2">
                 <button 
                   onClick={() => setExpireFilter(30)}
                   className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${expireFilter === 30 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300 dark:border-orange-700' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                 >
                   30 DIAS
                 </button>
                 <button 
                   onClick={() => setExpireFilter(60)}
                   className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${expireFilter === 60 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300 dark:border-orange-700' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                 >
                   60 DIAS
                 </button>
                 <button 
                   onClick={() => setExpireFilter(90)}
                   className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${expireFilter === 90 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300 dark:border-orange-700' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                 >
                   90 DIAS
                 </button>
               </div>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
               {filteredExpiringQualifications.length === 0 ? (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm">Nenhuma carteira vencendo até {expireFilter} dias.</div>
               ) : (
                  <div className="grid gap-2">
                     {filteredExpiringQualifications.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
                           <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-800 dark:text-white text-sm">{item.crewName}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded w-fit">{item.qualCode}</span>
                           </div>
                           <div className="text-sm font-mono text-orange-700 dark:text-orange-300 font-bold bg-orange-100 dark:bg-orange-900/40 px-2.5 py-1.5 rounded-md border border-orange-200 dark:border-orange-800">
                              {item.expirationDate}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex gap-2 justify-end">
               <button onClick={() => setShowExpiringModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                 Fechar
               </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-2xl flex flex-col gap-4 w-96 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
               <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                 <LogOut className="text-red-600 dark:text-red-400" size={20} />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Encerrar Sessão</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tem certeza que deseja sair do sistema?</p>
               </div>
               <button onClick={() => setShowLogoutConfirm(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={18} /></button>
            </div>

            <div className="flex justify-end gap-2 mt-2">
               <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">Cancelar</button>
               <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors">Sair do Sistema</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;

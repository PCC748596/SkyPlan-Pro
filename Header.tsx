import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Plane, Users, User, Printer, UserCog, Key, LogOut, X, ChevronRight } from 'lucide-react';
import { ScheduleMap, CrewMember } from '../types';
import CrewSearchModal from './CrewSearchModal';

interface HeaderProps {
  schedule: ScheduleMap;
  crew: CrewMember[];
  onOpenActivities: () => void;
  currentUser?: string;
  onLogout?: () => void;
  [key: string]: any;
}

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, colorClass }) => (
  <div className={`flex flex-col p-2.5 rounded-lg border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm ${colorClass} shadow-lg transition-all hover:border-slate-600`}>
    <div className="flex justify-between items-start mb-1 gap-4">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="opacity-80 scale-90">{icon}</div>
    </div>
    <span className="text-xl font-bold font-mono tracking-tight">{value}</span>
  </div>
);

const Header: React.FC<HeaderProps> = ({ schedule, crew, onOpenActivities, currentUser, onLogout }) => {
  const stats = useMemo(() => {
    let totalCMTE = 0;
    let totalCOP = 0;
    
    // Count crew actively scheduled AND currently ON
    totalCMTE = crew.filter(c => c.role === 'CMTE' && c.isOn).length;
    totalCOP = crew.filter(c => c.role === 'COP' && c.isOn).length;

    // Fixed active aircraft count as per previous request
    const activeAircraft = 1; 

    return { totalCMTE, totalCOP, activeAircraft };
  }, [crew]);

  // Menu State
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showCrewSearch, setShowCrewSearch] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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

  const cadastrosItems = [
    "Aeroporto",
    "Atividades",
    "Atividades com Pagamento",
    "Banco",
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

  return (
    <div className="flex flex-col shrink-0 relative z-50 shadow-md">
      
      {/* 1. System Menu Bar */}
      <div className="h-8 bg-slate-950 border-b border-slate-800 flex items-center px-2 select-none" ref={menuRef}>
         {menuOptions.map((item) => (
            <div key={item} className="relative">
               <button
                  onClick={() => {
                    if (item === 'SOBRE') {
                      setShowAbout(true);
                      setOpenMenu(null);
                    } else {
                      setOpenMenu(openMenu === item ? null : item);
                    }
                  }}
                  className={`text-[10px] font-bold px-3 py-1.5 mx-0.5 rounded-sm transition-colors ${
                      openMenu === item || (item === 'SOBRE' && showAbout)
                      ? 'bg-blue-900 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
               >
                  {item}
               </button>

               {/* Dropdown for ARQUIVO */}
               {item === 'ARQUIVO' && openMenu === 'ARQUIVO' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900 border border-slate-700 shadow-2xl rounded-sm py-1 z-[60] flex flex-col animate-in fade-in zoom-in-95 duration-100">
                     <button className="text-left px-4 py-2 text-[11px] text-slate-300 hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-colors">
                        <Printer size={14} /> Configurar impressora...
                     </button>
                     <button className="text-left px-4 py-2 text-[11px] text-slate-300 hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-colors">
                        <UserCog size={14} /> Alterar Usuário...
                     </button>
                     <button className="text-left px-4 py-2 text-[11px] text-slate-300 hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-colors">
                        <Key size={14} /> Alterar Senha...
                     </button>
                     <div className="h-px bg-slate-800 my-1 mx-2"></div>
                     <button className="text-left px-4 py-2 text-[11px] text-red-400 hover:bg-red-900/50 hover:text-red-200 flex items-center gap-3 transition-colors">
                        <LogOut size={14} /> Sair
                     </button>
                  </div>
               )}

               {/* Dropdown for CADASTROS */}
               {item === 'CADASTROS' && openMenu === 'CADASTROS' && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-700 shadow-2xl rounded-sm py-1 z-[60] flex flex-col animate-in fade-in zoom-in-95 duration-100 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
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
                                 }
                              }}
                              className="text-left px-4 py-1.5 text-[11px] text-slate-300 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors group border-b border-slate-800/50 last:border-0 w-full"
                           >
                              <span>{label}</span>
                              {hasSub && <ChevronRight size={12} className="text-slate-500 group-hover:text-white" />}
                           </button>
                        );
                     })}
                  </div>
               )}

               {/* Dropdown for RELATÓRIOS */}
               {item === 'RELATÓRIOS' && openMenu === 'RELATÓRIOS' && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-700 shadow-2xl rounded-sm py-1 z-[60] flex flex-col animate-in fade-in zoom-in-95 duration-100 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
                     {relatoriosItems.map((subItem, idx) => {
                        const label = typeof subItem === 'string' ? subItem : subItem.label;
                        const hasSub = typeof subItem === 'object' && subItem.hasSub;
                        
                        return (
                           <button 
                              key={idx}
                              className="text-left px-4 py-1.5 text-[11px] text-slate-300 hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors group border-b border-slate-800/50 last:border-0 w-full"
                           >
                              <span>{label}</span>
                              {hasSub && <ChevronRight size={12} className="text-slate-500 group-hover:text-white" />}
                           </button>
                        );
                     })}
                  </div>
               )}
            </div>
         ))}
      </div>

      {/* 2. KPI / Status Bar */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-6 gap-4">
        <div className="flex gap-3 flex-1">
          <KpiCard 
            label="Aeronaves" 
            value={stats.activeAircraft} 
            icon={<Plane size={18} />} 
            colorClass="text-blue-400"
          />
          <KpiCard 
            label="Comandantes" 
            value={stats.totalCMTE} 
            icon={<User size={18} />} 
            colorClass="text-emerald-400"
          />
          <KpiCard 
            label="Copilotos" 
            value={stats.totalCOP} 
            icon={<Users size={18} />} 
            colorClass="text-cyan-400"
          />
        </div>
        
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg shadow-sm">
              <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
                <User size={13} />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-200 leading-tight">{currentUser}</span>
                  <span className="inline-flex items-center justify-center leading-none text-[11px] font-mono font-black px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded self-center">ADMIN</span>
                </div>
                <span className="text-[8px] font-mono text-emerald-400 leading-none">OPERACIONAL</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sair do sistema"
                  className="ml-1 p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors flex items-center gap-1 text-[10px] font-mono"
                >
                  <LogOut size={13} />
                  <span>Sair</span>
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col items-end justify-center text-slate-500 text-[10px] font-mono border-l border-slate-800 pl-4">
            <span>SYSTEM: ONLINE</span>
            <span className="text-emerald-500">SYNC: 12ms</span>
          </div>
        </div>
      </div>

      {/* Crew Search Modal (Modern Dark Theme) */}
      {showCrewSearch && (
        <CrewSearchModal crew={crew} onClose={() => setShowCrewSearch(false)} />
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-5 w-80 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAbout(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-3 transition-transform hover:rotate-6 duration-500">
              <Plane className="text-white -rotate-45" size={48} />
            </div>
            
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">SkyPlan Pro</h2>
              <p className="text-blue-400 font-mono text-[10px] tracking-[0.2em] font-bold uppercase">Sistema de Escala Técnica</p>
            </div>
            
            <div className="bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
              <span className="text-slate-400 text-xs font-mono font-semibold">Versão v0010</span>
            </div>
            
            <div className="text-[10px] text-slate-600 text-center max-w-[200px] leading-relaxed pt-2">
              © 2025 SkyPlan Ops Control.<br/>Todos os direitos reservados.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
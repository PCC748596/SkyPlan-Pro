import React from 'react';
import { Assignment, DayData, ActivityDefinition } from '../types';
import { ACTIVITY_COLORS } from '../constants';
import { STANDARD_TIMES } from '../regulation';
import { AlertTriangle, AlertOctagon } from 'lucide-react';

interface ScheduleCellProps {
  day: DayData;
  assignments?: Assignment[]; // CHANGED: Now accepts array
  completenessIssue?: string; // Legacy/Cell-level issue
  onDrop?: (date: Date, rawData: string) => void;
  onDelete?: (assignmentId?: string) => void;
  onMouseEnter?: (e: React.MouseEvent, assignment: Assignment) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  onCopy?: (assignments: Assignment[] | null) => void; // CHANGED to array
  onPaste?: () => void;
  onEdit?: (assignment: Assignment) => void;
  onDoubleClick?: () => void; // New Prop for creating on empty cell
  activities?: ActivityDefinition[]; // NEW PROP
  validationIssues?: Map<string, string>; // NEW: Map of assignment ID -> error message
  isAircraftView?: boolean;
}

const ScheduleCell: React.FC<ScheduleCellProps> = ({ 
  day, 
  assignments = [], 
  completenessIssue,
  onDrop,
  onDelete,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onCopy,
  onPaste,
  onEdit,
  onDoubleClick,
  activities,
  validationIssues,
  isAircraftView = false
}) => {
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allows drop
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('application/skyplan-data');
    if (rawData && onDrop) {
      onDrop(day.date, rawData);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    // Copy on hover removed as per user request
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (onMouseMove) {
       onMouseMove(e);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onPaste) {
      onPaste();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick();
    }
  };

  const handleAssignmentClick = (e: React.MouseEvent, assign: Assignment) => {
      e.stopPropagation(); // Prevent pasting logic
      if (e.ctrlKey) {
          if (onCopy && assignments.length > 0) {
              onCopy(assignments);
          }
      } else {
          if (onEdit) {
              onEdit(assign);
          }
      }
  };

  // Helper to determine text color based on background hex
  const getContrastColor = (hex?: string) => {
      if (!hex) return 'text-white';
      // Remove hash
      const c = hex.startsWith('#') ? hex.substring(1) : hex;
      // Handle shortened hex if necessary (e.g. #FFF) - assume full for now
      const rgb = parseInt(c, 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >>  8) & 0xff;
      const b = (rgb >>  0) & 0xff;
      
      // Calculate luminance (perceived brightness)
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; 
      
      // Threshold 128 is standard, but 140 works better for softer pastels
      return luma > 140 ? 'text-slate-900 font-extrabold' : 'text-white font-bold';
  };

  // Helper to get Style (Color)
  const getStyleProps = (assignment: Assignment) => {
      // 1. Check for Custom Color in Activities
      let customColor: string | undefined;
      
      if (activities) {
          // Priority 1: Match by Code (Details usually holds the Code for non-flights)
          const byCode = activities.find(a => a.code === assignment.details || a.code === assignment.type);
          if (byCode && byCode.color) {
              customColor = byCode.color;
          } else {
              // Priority 2: Match by Type
              const byType = activities.find(a => a.type === assignment.type);
              if (byType && byType.color) {
                  customColor = byType.color;
              }
          }
      }

      if (customColor) {
          const textColorClass = getContrastColor(customColor);
          return {
              className: `border ${textColorClass}`, 
              style: { backgroundColor: customColor, borderColor: customColor }
          };
      }

      let colorClass = 'bg-slate-800 text-slate-400';

      const specificKeyCode = assignment.code ? assignment.code.toUpperCase().trim() : '';
      const specificDetailsCode = assignment.details ? assignment.details.toUpperCase().trim() : '';
      
      let typeKey: string = assignment.type;
      
      if (assignment.functionCode === 'EXM' || assignment.details === 'EXM') {
          typeKey = 'EXM';
      } else if (assignment.functionCode === 'XQR' || assignment.functionCode?.startsWith('XQR')) {
          typeKey = 'XQR';
      }
      
      // Override specific legacy hardcoded classes directly to match image exactly
      if (assignment.details === 'DEMISS') {
          colorClass = 'bg-red-600 border-red-500 text-white font-bold';
      } else if (assignment.type === 'MNT') {
          if (assignment.details === 'NÃO PROGRAMADA') {
              colorClass = 'bg-red-500 border-red-600 text-white font-bold';
          } else {
              colorClass = 'bg-amber-400 border-amber-500 text-amber-950 font-bold';
          }
      }
      // EXT Function Code -> Purple (DLS)
      else if (assignment.functionCode === 'EXT' || (assignment.type === 'VOO' && assignment.code?.startsWith('LV91'))) {
          colorClass = ACTIVITY_COLORS['EXT'] || 'bg-violet-900 border-violet-700 text-violet-100';
      }
      else if (typeKey === 'XQR') {
          colorClass = ACTIVITY_COLORS['XQR'] || 'bg-pink-900 border-pink-700 text-pink-100 font-bold';
      }
      else {
          // Check for exact code/details match in ACTIVITY_COLORS FIRST
          if (specificKeyCode && ACTIVITY_COLORS[specificKeyCode]) {
              colorClass = ACTIVITY_COLORS[specificKeyCode];
          } else if (specificDetailsCode && ACTIVITY_COLORS[specificDetailsCode]) {
              colorClass = ACTIVITY_COLORS[specificDetailsCode];
          } else {
              // Fallback to typeKey
              colorClass = ACTIVITY_COLORS[typeKey] || 'bg-slate-800 text-slate-400';
          }
      }

      return { className: colorClass, style: {} };
  };

  // Helper to format Time
  const getTimeStr = (assignment: Assignment) => {
      if (assignment.type === 'MNT') {
          const cellDateKey = day.date.toISOString().split('T')[0];
          const isFirstDay = !assignment.maintenanceDates || assignment.maintenanceDates.startDate === cellDateKey;
          const isLastDay = !assignment.maintenanceDates || assignment.maintenanceDates.endDate === cellDateKey;
          
          const s = assignment.actualStart || assignment.start || '00:00';
          const e = assignment.actualEnd || assignment.end || '00:00';
          
          if (isFirstDay && isLastDay) {
              return `${s.replace(':', '')}-${e.replace(':', '')}`;
          } else if (isFirstDay) {
              return s.replace(':', '');
          } else if (isLastDay) {
              return e.replace(':', '');
          }
          return null;
      }
      // HIDE TIME IF 00:00 - 00:00 or 00:00 - 23:59 (Full Day)
      const s = assignment.actualStart || assignment.start || STANDARD_TIMES[assignment.type]?.start || '00:00';
      const e = assignment.actualEnd || assignment.end || STANDARD_TIMES[assignment.type]?.end || '00:00';
      const isFullDay = (s === '00:00' && e === '00:00') || (s === '00:00' && e === '23:59');
      
      if (!isFullDay) {
          return `${s.replace(':', '')}-${e.replace(':', '')}`;
      }
      return null;
  };

  // Helper to check for delay (Red Text)
  const isDelayed = (assignment: Assignment) => {
      if (!assignment.actualStart || !assignment.start) return false;
      const planned = parseInt(assignment.start.replace(':', ''));
      const actual = parseInt(assignment.actualStart.replace(':', ''));
      return actual > planned;
  };

  // Helper to format Label
  const getLabel = (assignment: Assignment) => {
      // EXM Labeling
      if (!isAircraftView && (assignment.functionCode === 'EXM' || assignment.details === 'EXM')) {
          const base = assignment.code || assignment.details || assignment.type;
          let label = `EXM-${base}`;
          if (assignment.airport && assignment.airport !== base) label += `-${assignment.airport}`;
          return label;
      }

      // SPECIAL XQR FORMATTING - When Type is XQR (CheckRide on VOO logic)
      if (assignment.type === 'XQR' && assignment.code) {
          return isAircraftView ? assignment.code : `XQR-${assignment.code}`;
      }

      // CUSTOM DLS FORMATTING: DSL>[DEST]
      // Also handles EXT (Extra Crew on Flight) to look like DLS if needed, but per screenshot EXT is EXT-XXXX
      // We will keep EXT as EXT-CODE based on screenshot.
      
      if ((assignment.type as string) === 'DLS') {
          let dest = '';
          
          // Try to get destination from Route (e.g., VCP-GRU)
          if (assignment.route) {
              const parts = assignment.route.split(/[-:>]/);
              if (parts.length > 1) dest = parts[1];
          } 
          
          // If no route, try extracting from details (e.g. DLS-GRU or DSL>GRU)
          if (!dest && assignment.details) {
              const d = assignment.details.toUpperCase();
              const clean = d.replace(/^(DLS|DSL)[->\s]*/, '');
              // If cleaned string is valid (e.g. "GRU"), use it.
              if (clean.length >= 3) dest = clean;
          }

          if (dest) {
              return `DSL>${dest}`;
          }
          
          // Fallback if no destination found
          return assignment.details || assignment.code || 'DSL';
      }

      // MNT Labeling
      if (assignment.type === 'MNT') {
          return assignment.details === 'NÃO PROGRAMADA' ? 'MNT-NPROG' : 'MNT-PROG';
      }

      let mainLabel: string = assignment.type;
      
      // Determine base label
      if (assignment.type === 'VOO') {
          mainLabel = assignment.code || 'VOO';
      } else {
          // Non-Flight logic
          mainLabel = assignment.code || assignment.details || assignment.type;
      }
      
      // Apply Function Code Prefix (e.g., ALU-LV9000, INS-LV9000)
      if (!isAircraftView && assignment.functionCode && !['EXM', 'EXT'].includes(assignment.functionCode)) {
          if (!mainLabel.startsWith(assignment.functionCode)) {
              mainLabel = `${assignment.functionCode}-${mainLabel}`;
          }
      }
      
      // Special case for EXT is handled via color but label might also need it if not DLS
      if (!isAircraftView && assignment.functionCode === 'EXT' && assignment.type === 'VOO') {
          mainLabel = `EXT-${mainLabel}`;
      }

      // *** APPEND AIRPORT IF AVAILABLE ***
      // Skip for VOO (implied by route) and DLS (handled above)
      if (assignment.airport && assignment.type !== 'VOO' && (assignment.type as string) !== 'DLS') {
          if (!mainLabel.includes(assignment.airport)) {
              mainLabel = `${mainLabel}-${assignment.airport}`;
          }
      }
      
      return mainLabel;
  };

  // Helper to detect Night Flight (Madrugada 00:00 - 06:00)
  const isNightFlight = (assignment: Assignment) => {
      if (assignment.type !== 'VOO') return false;
      const startToCheck = assignment.actualStart || assignment.start;
      const endToCheck = assignment.actualEnd || assignment.end;
      if (!startToCheck || !endToCheck) return false;
      
      const s = parseInt(startToCheck.replace(':', ''));
      const e = parseInt(endToCheck.replace(':', ''));
      
      // Starts in window (0000-0600) OR Ends in window OR spans midnight into window
      return (s >= 0 && s < 600) || (e > 0 && e <= 600) || (s > e);
  };

  // Is critical?
  const isCriticalError = completenessIssue && completenessIssue.includes('EXCESSO');
  const hasContent = assignments.length > 0;

  return (
    <div 
      className={`
         h-full w-full border-r border-b border-slate-800/50 relative cursor-pointer hover:z-10 transition-all hover:brightness-110 flex flex-col
         ${hasContent ? '' : day.isWeekend ? 'bg-slate-100 dark:bg-slate-900/30' : 'bg-transparent'}
      `}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Deleted the XCircle delete button block */}

      {hasContent ? (
         <div className="w-full h-full flex flex-col p-[1px] group">
             {assignments.map((assign, idx) => {
                 const { className, style } = getStyleProps(assign);
                 const label = getLabel(assign);
                 const timeStr = getTimeStr(assign);
                 // Hide route for DLS as requested, show for others if available
                 const route = (assign.type !== 'DLS' && assign.route) ? assign.route.replace('-', '>') : null;
                 const showNightBar = isNightFlight(assign);
                 const delayed = isDelayed(assign);
                 
                 // CHECK FOR VALIDATION ISSUES
                 const issue = validationIssues?.get(assign.id);
                 const hasIssue = !!issue;

                 return (
                     <div 
                        key={`${assign.id}-${idx}`}
                        className={`
                            flex-1 min-h-[42px] w-full flex flex-col items-center justify-center 
                            mb-[1px] last:mb-0 rounded-sm overflow-hidden select-none cursor-pointer relative 
                            p-[2px] gap-0.5
                            ${className}
                        `}
                        style={style}
                        onMouseEnter={(e) => { 
                            e.stopPropagation(); 
                            if(onMouseEnter) onMouseEnter(e, assign); 
                        }}
                        onClick={(e) => handleAssignmentClick(e, assign)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onDelete) onDelete(assign.id);
                        }}
                     >
                        {/* DELAY WARNING ICON */}
                        {delayed && (
                            <div className="absolute top-0.5 left-0.5 z-20" title="Atrasado">
                                <AlertTriangle size={16} className="text-yellow-400 fill-yellow-900" />
                            </div>
                        )}

                        {/* VALIDATION WARNING ICON (ATENÇÃO) */}
                        {hasIssue && !isAircraftView && (
                            <div className="absolute top-0.5 right-0.5 z-20 animate-pulse" title={issue}>
                                <AlertTriangle size={14} className="text-orange-400 fill-orange-900/50" />
                            </div>
                        )}

                        {/* Main Label - UPDATED TEXT SIZE TO 13px */}
                        <span className={`
                            font-bold font-mono leading-tight text-center z-10 break-words w-full 
                            text-[13px]
                        `}>
                            {label}
                        </span>
                        
                        {/* Optional Sub-Label - UPDATED TEXT SIZE TO 12px */}
                        {route && (
                            <span className="text-[12px] font-mono leading-none opacity-80 z-10 text-center w-full">{route}</span>
                        )}

                        {/* Time Row - UPDATED TEXT SIZE TO 12px */}
                        {timeStr && (
                            <span className={`text-[12px] font-mono leading-none opacity-90 z-10 text-center whitespace-nowrap`}>
                                {timeStr}
                            </span>
                        )}

                        {/* NIGHT FLIGHT BAR (MADRUGADA) */}
                        {showNightBar && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500/80"></div>
                        )}
                     </div>
                 );
             })}
         </div>
      ) : (
         <div className="w-full h-full flex items-center justify-center pointer-events-none">
             <span className="text-[15px] text-slate-800/30 font-mono select-none">.</span>
         </div>
      )}

      {/* Warning/Error Icon (Cell Level Fallback - Mostly replaced by per-assignment) */}
      {completenessIssue && !isAircraftView && !assignments.some(a => validationIssues?.has(a.id)) && (
         <div className={`absolute top-0.5 right-0.5 z-10 pointer-events-none ${isCriticalError ? 'text-red-500 animate-pulse' : 'text-orange-400'}`} title={completenessIssue}>
            {isCriticalError ? <AlertOctagon size={16} fill="currentColor" className="text-red-200" /> : <AlertTriangle size={14} fill="currentColor" />}
         </div>
      )}
      
      {/* M Indicator */}
      {hasContent && <span className="absolute bottom-0.5 left-1 text-[13px] font-mono font-bold opacity-40 select-none text-slate-900 mix-blend-overlay pointer-events-none">M</span>}
    </div>
  );
};

export default ScheduleCell;
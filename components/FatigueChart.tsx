
import React, { useMemo } from 'react';
import { Assignment, ActivityDefinition } from '../types';
import { calculateFatigueTimeline } from '../regulation';

interface FatigueChartProps {
  assignments: Assignment[];
  startDate: Date;
  hoursToShow: number;
  height?: number;
  hideLabels?: boolean;
  showBrush?: { startPercent: number; widthPercent: number };
  admissionDate?: Date;
  activities?: ActivityDefinition[];
}

const getDurationStr = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
};

const FatigueChart: React.FC<FatigueChartProps> = ({ 
    assignments, 
    startDate, 
    hoursToShow, 
    height = 250, 
    hideLabels = false, 
    showBrush,
    admissionDate,
    activities
}) => {
  
  // Dimensions & Layout Constants
  const INTERNAL_WIDTH = 2000; 
  const LEFT_AXIS_WIDTH = hideLabels ? 0 : 100; // Increased width for labels
  const GRAPH_WIDTH = INTERNAL_WIDTH - LEFT_AXIS_WIDTH;
  
  const HEADER_HEIGHT = hideLabels ? 2 : 40; 
  const FOOTER_HEIGHT = 20; 
  const FLIGHT_TRACK_HEIGHT = hideLabels ? 0 : 50;
  const GAP_HEIGHT = hideLabels ? 0 : 15;
  
  const DUTY_TRACK_Y = HEADER_HEIGHT + FLIGHT_TRACK_HEIGHT + GAP_HEIGHT;
  const DUTY_TRACK_HEIGHT = Math.max(0, height - DUTY_TRACK_Y - FOOTER_HEIGHT);
  
  const Y_MAX = 16; 

  const getX = (hourOffset: number) => {
      return LEFT_AXIS_WIDTH + (hourOffset / hoursToShow) * GRAPH_WIDTH;
  };

  const getY = (score: number) => {
      const clamped = Math.max(0, Math.min(Y_MAX, score));
      // Invert Y because SVG 0 is top
      return DUTY_TRACK_Y + DUTY_TRACK_HEIGHT - ((clamped / Y_MAX) * DUTY_TRACK_HEIGHT);
  };

  const chartData = useMemo(() => {
      // Delegate calculation to regulation.ts
      const result = calculateFatigueTimeline(assignments, startDate, hoursToShow, activities, admissionDate);
      
      const mappedPoints = result.points.map(p => ({
          x: getX(p.hourOffset),
          y: getY(p.score),
          score: p.score
      }));

      // Render formatting
      const finalBlocks = result.blocks.map(b => ({
          x: getX(b.start),
          w: Math.max(0, getX(b.end) - getX(b.start)),
          dutyX: getX(b.start),
          dutyW: Math.max(0, getX(b.end) - getX(b.start)),
          flightX: b.isFlight ? getX(b.start) : 0, // Using same start for simplicity in rendering mapping if needed
          flightW: b.isFlight ? Math.max(0, getX(b.end) - getX(b.start)) : 0,
          type: b.type,
          label: b.label,
          startStr: b.startStr,
          endStr: b.endStr, 
          dutyStartStr: b.dutyStartStr,
          dutyEndStr: b.dutyEndStr,
          code: b.code,
          route: b.route,
          durationHours: b.durationHours,
          isFlight: b.isFlight
      })).filter(b => b.w > 0 && b.x + b.w > LEFT_AXIS_WIDTH);

      return { points: mappedPoints, blocks: finalBlocks };
  }, [assignments, startDate, hoursToShow, INTERNAL_WIDTH, LEFT_AXIS_WIDTH, GRAPH_WIDTH, DUTY_TRACK_Y, DUTY_TRACK_HEIGHT, admissionDate, activities]);

  const pathD = chartData.points.length > 0 
    ? `M ${chartData.points[0].x} ${chartData.points[0].y} ` + 
      chartData.points.map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  // --- TICKS LOGIC ---
  let tickInterval = 6;
  if (hoursToShow <= 72) tickInterval = 3;
  else tickInterval = 6;

  const midnights: number[] = [];
  const startMs = startDate.getTime();
  let nextMidnightTime = new Date(startMs);
  nextMidnightTime.setHours(24, 0, 0, 0); 
  
  if (startDate.getHours() === 0 && startDate.getMinutes() === 0) midnights.push(0);
  let offsetToMidnight = (nextMidnightTime.getTime() - startMs) / 3600000;
  while (offsetToMidnight <= hoursToShow) {
      midnights.push(offsetToMidnight);
      offsetToMidnight += 24;
  }

  const xTicks: number[] = [];
  for (let i = 0; i <= hoursToShow; i += tickInterval) {
      if (!midnights.some(m => Math.abs(m - i) < 0.1)) xTicks.push(i);
  }

  // UPDATED Y-TICKS AS REQUESTED
  const yTicks = [0, 2, 4, 6, 8, 10, 12, 14, 16];
  const isRestType = (type: string) => ['REPO', 'GENERATED_SLEEP', 'FR', 'FS', 'VAC', 'INAT'].includes(type);

  const renderBlock = (b: any, index: number, isOverLine: boolean) => {
      // CORREÇÃO: Usar a propriedade calculada b.isFlight
      const isFlight = b.isFlight; 
      const isSleep = b.type === 'REPO' || b.type === 'GENERATED_SLEEP'; 
      const showLabels = !hideLabels && b.dutyW > 40;
      
      // JORNADA (Duty) = Blue (#0ea5e9) - Default
      let fillColor = '#0ea5e9'; 
      let strokeColor = '#0284c7'; 
      let opacity = 0.4;
      let textColor = 'white';
      let textShadow = '0px 1px 2px rgba(0,0,0,0.5)';

      if (isFlight) {
          // Bottom block is part of Jornada, so it should be Blue.
          fillColor = '#0ea5e9'; 
          strokeColor = '#0284c7';
          opacity = 0.7;
      } else if (isSleep) {
          fillColor = '#86efac';
          strokeColor = '#4ade80';
          opacity = 0.7; 
          textColor = '#064e3b'; 
          textShadow = 'none';
      } else if (['FR', 'FS', 'VAC', 'INAT'].includes(b.type)) {
          fillColor = 'transparent'; 
          strokeColor = '#cbd5e1'; 
          opacity = 0.8;
          textColor = '#cbd5e1'; 
          textShadow = 'none';
      } 

      return (
        <g key={`${isOverLine ? 'front' : 'back'}-${index}`} className="transition-all duration-500 ease-in-out">
            {!hideLabels && isFlight && (
                <g>
                    {/* FLIGHT BLOCK (TOP) - GRAY (#64748b - Slate-500) */}
                    <rect x={b.flightX} y={HEADER_HEIGHT + 2} width={Math.max(b.flightW, 2)} height={FLIGHT_TRACK_HEIGHT - 4} fill="#64748b" stroke="#475569" strokeWidth={1} rx={2} />
                    {showLabels && (
                        <>
                            <text x={b.flightX + b.flightW/2} y={HEADER_HEIGHT + 13} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="sans-serif">{b.startStr}</text>
                            <text x={b.flightX + b.flightW/2} y={HEADER_HEIGHT + 25} textAnchor="middle" fill="#bae6fd" fontSize="13" fontWeight="bold" fontFamily="sans-serif">{b.code}</text>
                            <text x={b.flightX + b.flightW/2} y={HEADER_HEIGHT + 37} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="sans-serif">{b.endStr}</text>
                        </>
                    )}
                </g>
            )}
            <g>
                {/* DUTY BLOCK (BOTTOM) - Uses fillColor (Blue for Duty) */}
                <rect 
                    x={b.dutyX} 
                    y={DUTY_TRACK_Y} 
                    width={Math.max(b.dutyW, 2)} 
                    height={DUTY_TRACK_HEIGHT} 
                    fill={fillColor} 
                    stroke={strokeColor}
                    strokeWidth={0.5}
                    opacity={opacity} 
                />
                {showLabels && (
                    <text 
                        x={b.dutyX + b.dutyW/2} 
                        y={DUTY_TRACK_Y + DUTY_TRACK_HEIGHT / 2} 
                        textAnchor="middle" 
                        fill={textColor} 
                        fontSize="14" 
                        fontWeight="bold" 
                        fontFamily="sans-serif"
                        style={{ textShadow }}
                    >
                        {isFlight ? (b.route?.split('-')[1] || 'JORNADA') : b.label}
                    </text>
                )}
                {isSleep && b.durationHours > 0 && (
                    <text 
                        x={b.dutyX + b.dutyW/2} 
                        y={DUTY_TRACK_Y + DUTY_TRACK_HEIGHT / 2 + 14} 
                        textAnchor="middle" 
                        fill="#064e3b" 
                        fontSize="14" 
                        fontFamily="sans-serif"
                        fontWeight="bold"
                    >
                        {getDurationStr(b.durationHours)}
                    </text>
                )}
                {showLabels && !isSleep && (
                    <>
                        <text x={b.dutyX + 2} y={DUTY_TRACK_Y + 12} textAnchor="start" fill={textColor} fontSize="12" fontWeight="bold" fontFamily="sans-serif" style={{ textShadow }}>{b.dutyStartStr}</text>
                        <text x={b.dutyX + b.dutyW - 2} y={DUTY_TRACK_Y + DUTY_TRACK_HEIGHT - 3} textAnchor="end" fill={textColor} fontSize="12" fontWeight="bold" fontFamily="sans-serif" style={{ textShadow }}>{b.dutyEndStr}</text>
                    </>
                )}
                {showLabels && isSleep && (
                    <>
                        <text x={b.dutyX + 2} y={DUTY_TRACK_Y + 12} textAnchor="start" fill={textColor} fontSize="12" fontWeight="bold" fontFamily="sans-serif">{b.dutyStartStr}</text>
                        <text x={b.dutyX + b.dutyW - 2} y={DUTY_TRACK_Y + DUTY_TRACK_HEIGHT - 3} textAnchor="end" fill={textColor} fontSize="12" fontWeight="bold" fontFamily="sans-serif">{b.dutyEndStr}</text>
                    </>
                )}
            </g>
        </g>
      );
  };

  return (
    <div className="w-full h-full relative select-none bg-[#0f172a]">
        <svg viewBox={`0 0 ${INTERNAL_WIDTH} ${height}`} preserveAspectRatio="none" className="w-full h-full block">
            <defs>
                <clipPath id="chart-clip">
                    <rect x={LEFT_AXIS_WIDTH} y={0} width={GRAPH_WIDTH} height={height} />
                </clipPath>
                <linearGradient id="fatigue-line-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" /> {/* Red */}
                    <stop offset="50%" stopColor="#f59e0b" /> {/* Orange */}
                    <stop offset="100%" stopColor="#10b981" /> {/* Green */}
                </linearGradient>
            </defs>

            {!hideLabels && <rect x={LEFT_AXIS_WIDTH} y={HEADER_HEIGHT} width={GRAPH_WIDTH} height={FLIGHT_TRACK_HEIGHT} fill="#1e293b" opacity={0.3} />}
            <rect x={LEFT_AXIS_WIDTH} y={DUTY_TRACK_Y} width={GRAPH_WIDTH} height={DUTY_TRACK_HEIGHT} fill="#0f172a" />
            
            {!hideLabels && (
                <>
                    <text x={LEFT_AXIS_WIDTH - 10} y={HEADER_HEIGHT + FLIGHT_TRACK_HEIGHT / 2 + 4} textAnchor="end" fill="#94a3b8" fontSize="15" fontWeight="bold" fontFamily="sans-serif">Flights</text>
                    <text x={LEFT_AXIS_WIDTH - 10} y={DUTY_TRACK_Y + 20} textAnchor="end" fill="#94a3b8" fontSize="15" fontWeight="bold" fontFamily="sans-serif">Duty/Sleep</text>
                    {yTicks.map(val => {
                        const yPos = getY(val);
                        return (
                            <g key={`y-${val}`}>
                                <line x1={LEFT_AXIS_WIDTH} y1={yPos} x2={INTERNAL_WIDTH} y2={yPos} stroke="#475569" strokeWidth={1} strokeDasharray="2 4" opacity={0.6} />
                                <text x={LEFT_AXIS_WIDTH - 10} y={yPos + 4} textAnchor="end" fill="#64748b" fontSize="14" fontFamily="monospace" fontWeight="bold">{val}</text>
                            </g>
                        );
                    })}
                </>
            )}

            {midnights.map(m => (
                <g key={`mid-${m}`}>
                    <line x1={getX(m)} y1={HEADER_HEIGHT} x2={getX(m)} y2={height} stroke="#64748b" strokeWidth={1} opacity={0.8} />
                    {!hideLabels && (
                        <>
                            <text x={getX(m) + 5} y={14} textAnchor="start" fill="#94a3b8" fontSize="14" fontWeight="bold">
                                {new Date(startDate.getTime() + m*3600000).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})}
                            </text>
                            <text x={getX(m)} y={32} textAnchor="middle" fill="#60a5fa" fontSize="14" fontFamily="monospace" fontWeight="bold">00</text>
                        </>
                    )}
                </g>
            ))}

            {xTicks.map(t => {
                const hour = (startDate.getHours() + t) % 24;
                return (
                    <g key={`xtick-${t}`}>
                        <line x1={getX(t)} y1={HEADER_HEIGHT} x2={getX(t)} y2={height} stroke="#475569" strokeWidth={0.5} opacity={0.7} strokeDasharray="2 2" />
                        {!hideLabels && (
                            <text x={getX(t)} y={32} textAnchor="middle" fill="#64748b" fontSize="14" fontWeight="bold" fontFamily="monospace">
                                {hour.toString().padStart(2, '0')}
                            </text>
                        )}
                    </g>
                );
            })}

            <g clipPath="url(#chart-clip)">
                {chartData.blocks.map((b, i) => ({ b, i })).filter(({ b }) => !isRestType(b.type)).map(({ b, i }) => renderBlock(b, i, false))}
                
                <path 
                    d={pathD} 
                    fill="none" 
                    stroke="url(#fatigue-line-gradient)" 
                    strokeWidth={hideLabels ? 2 : 4} 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="transition-all duration-500 ease-in-out"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                />

                {chartData.blocks.map((b, i) => ({ b, i })).filter(({ b }) => isRestType(b.type)).map(({ b, i }) => renderBlock(b, i, true))}
            </g>

            {showBrush && (
                <g>
                    <rect x="0" y="0" width={showBrush.startPercent * INTERNAL_WIDTH} height={height} fill="black" opacity={0.6} />
                    <rect x={(showBrush.startPercent + showBrush.widthPercent) * INTERNAL_WIDTH} y="0" width={Math.max(0, (1 - (showBrush.startPercent + showBrush.widthPercent)) * INTERNAL_WIDTH)} height={height} fill="black" opacity={0.6} />
                    <rect x={showBrush.startPercent * INTERNAL_WIDTH} y="1" width={showBrush.widthPercent * INTERNAL_WIDTH} height={height - 2} fill="transparent" stroke="#3b82f6" strokeWidth="2" />
                </g>
            )}
        </svg>
    </div>
  );
};

export default FatigueChart;

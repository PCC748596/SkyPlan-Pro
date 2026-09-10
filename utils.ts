
import { DayData, ScheduleMap, CrewMember, Assignment, AssignmentType, ActivityDefinition, QualificationDefinition } from './types';
import { calculateMaxFatigueScore } from './regulation';

// Helper to convert time string "HH:mm" to minutes
export const timeToMin = (time: string): number => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

// Helper to sort assignments chronologically
export const sortAssignments = (assignments: Assignment[]): Assignment[] => {
    return [...assignments].sort((a, b) => {
        const tA = timeToMin(a.actualStart || a.start || '00:00');
        const tB = timeToMin(b.actualStart || b.start || '00:00');
        return tA - tB;
    });
};

// Helper to convert minutes to time string "HH:mm"
export const minToTime = (min: number): string => {
    let m = min;
    while (m < 0) m += 1440;
    m = m % 1440;
    const hh = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
};

// Helper to calculate duration in minutes handling midnight wrap
export const calculateDurationInMinutes = (start: string = '00:00', end: string = '00:00'): number => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const sMin = sh * 60 + sm;
    let eMin = eh * 60 + em;
    
    if (eMin < sMin) {
        eMin += 1440;
    }
    
    return eMin - sMin;
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getDaysForGrid = (startDate: Date, count: number): DayData[] => {
  const days: DayData[] = [];
  const current = new Date(startDate);
  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  for (let i = 0; i < count; i++) {
    days.push({
      date: new Date(current),
      dayOfMonth: current.getDate(),
      dayOfWeek: weekDays[current.getDay()],
      isWeekend: current.getDay() === 0 || current.getDay() === 6
    });
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export const recalculateCrewStats = (
  crew: CrewMember[],
  schedule: ScheduleMap,
  year: number,
  month: number,
  activities?: ActivityDefinition[]
): CrewMember[] => {
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const yearKey = `${year}`;

  return crew.map(c => {
    let flightHoursMonth = 0;
    let flightHoursYear = 0;
    let dutyTimeMonth = 0;
    let dutyDays = 0;
    let frCount = 0;
    let fsCount = 0;
    let standbyCount = 0;
    
    // Auto-Status Logic Variables
    let hasVacationInMonth = false;
    let vacDaysCount = 0;
    let hasWorkInMonth = false; // Work = VOO, RE, SA, GS, SIM, DLS, XQR (Not Off/Vacation)

    const crewSchedule = schedule[c.id];
    let allMonthAssignments: Assignment[] = [];

    if (crewSchedule) {
        // Collect all assignments for the month to pass to fatigue calculator
        Object.keys(crewSchedule).forEach(key => {
            if (key.startsWith(monthKey)) {
                // IMPORTANT: Inject date into assignment for reliable parsing in fatigue calc
                const assignsWithDate = crewSchedule[key].map(a => ({ ...a, _date: key }));
                allMonthAssignments.push(...assignsWithDate);
                
                // --- VACATION & STATUS LOGIC ---
                // We check assignments in the current month view to determine status
                assignsWithDate.forEach(a => {
                    if (a.type === 'VAC') {
                        hasVacationInMonth = true;
                        vacDaysCount++;
                    } else if (['VOO', 'RE', 'SA', 'GS', 'SIM', 'DLS', 'XQR', 'EXM'].includes(a.type)) {
                        hasWorkInMonth = true;
                    }
                });
            }
        });

        Object.entries(crewSchedule).forEach(([dateStr, assignments]) => {
            // Check scope
            const isCurrentYear = dateStr.startsWith(yearKey);
            const isCurrentMonth = dateStr.startsWith(monthKey);

            if (!isCurrentYear) return; // Skip logic if outside current year context

            let workedDayInMonth = false;

            assignments.forEach(a => {
                const duration = calculateDurationInMinutes(a.actualStart || a.start, a.actualEnd || a.end);
                const hours = duration / 60;
                
                // 1. FLIGHT HOURS (HS & HST)
                if (a.type === 'VOO') {
                    // Check if it is Extra Crew (EXT) or Observer (OBS)
                    const isExtra = a.functionCode === 'EXT' || a.functionCode === 'OBS' || a.isExtraCrew;
                    
                    if (!isExtra) {
                        flightHoursYear += hours; // Always add to Annual
                        
                        if (isCurrentMonth) {
                            flightHoursMonth += hours; // Only add to Monthly if in current month
                        }
                    }
                    if (isCurrentMonth) workedDayInMonth = true;
                } 
                
                // 2. MONTHLY STATS (FR, FS, Duty, SA) - Only calculated for the active month view
                if (isCurrentMonth) {
                    if (['RE', 'SA', 'GS', 'SIM', 'DLS', 'XQR', 'EXM'].includes(a.type)) {
                        dutyTimeMonth += hours;
                        if (['RE', 'SA', 'SIM', 'DLS', 'XQR', 'EXM'].includes(a.type)) workedDayInMonth = true;
                        if (a.type === 'SA') standbyCount++;
                    } else if (a.type === 'FR') {
                        frCount++;
                    } else if (a.type === 'FS') {
                        fsCount++;
                    }
                }
            });

            if (workedDayInMonth) dutyDays++;
        });
    }

    // --- APPLY STATUS LOGIC (15 vs 30 Days Vacation) ---
    // Update status automatically based on Resignation and Vacation
    let finalIsOn = c.isOn;
    
    // Check if resignation date exists and is in the past relative to current month view
    // If resignationDate < monthKey (string comparison works for YYYY-MM-DD vs YYYY-MM), crew is resigned.
    const isResigned = !!c.resignationDate && c.resignationDate < monthKey; 

    if (isResigned) {
        finalIsOn = false;
    } else {
        if (hasWorkInMonth) {
            // Rule: If there is ANY work in the month, they must be ACTIVE (isOn = true)
            // This covers the case: "Sai do inativo" (Leaves inactive state)
            finalIsOn = true;
        } else if (hasVacationInMonth) {
            // Rule: "Férias são de 15 ou 30 dias"
            // If <= 20 days (approx 15 days), they likely have blank days (Available/Folga) -> ACTIVE
            // If > 20 days (approx 30 days), the month is fully blocked -> INACTIVE
            if (vacDaysCount <= 20) {
                finalIsOn = true; // Back to active (Available for remaining days)
            } else {
                finalIsOn = false; // Full month vacation (Inactive)
            }
        }
    }

    // CALCULATE FATIGUE SCORE FOR THE MONTH USING CENTRALIZED LOGIC
    let admissionDateObj: Date | undefined = undefined;
    if (c.admissionDate) {
        const [y, m, d] = c.admissionDate.split('-').map(Number);
        admissionDateObj = new Date(y, m - 1, d);
    }
    const maxFatigueScore = calculateMaxFatigueScore(allMonthAssignments, year, month, activities, admissionDateObj);

    // Calculate minimum folgas based on vacation
    let minFR = 8;
    let minFS = 2;
    if (vacDaysCount > 0) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const diasDisponiveis = daysInMonth - vacDaysCount;
        const minTotalFolgas = Math.floor(diasDisponiveis / 3);
        minFS = Math.min(2, minTotalFolgas);
        minFR = Math.max(0, minTotalFolgas - minFS);
    }

    return {
        ...c,
        isOn: finalIsOn, // Update status automatically
        maxFatigueScore, // Updated with actual calculation
        stats: {
            ...c.stats,
            flightHours: Math.round(flightHoursMonth * 10) / 10,
            annualFlightHours: Math.round(flightHoursYear * 10) / 10,
            dutyTimeMonth: Math.round(dutyTimeMonth * 10) / 10,
            frCount,
            fsCount,
            standbyCount,
            dutyDays,
            minFR,
            minFS
        }
    };
  });
};

const parseMonthYear = (dateStr: string): { month: number; year: number } | null => {
    if (!dateStr) return null;
    let m = NaN;
    let y = NaN;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            // YYYY-MM-DD
            m = parseInt(parts[1], 10);
            y = parseInt(parts[0], 10);
        } else if (parts.length === 2) {
            // YYYY-MM
            m = parseInt(parts[1], 10);
            y = parseInt(parts[0], 10);
        }
    } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            // DD/MM/YYYY
            m = parseInt(parts[1], 10);
            y = parseInt(parts[2], 10);
        } else if (parts.length === 2) {
            // MM/YYYY
            m = parseInt(parts[0], 10);
            y = parseInt(parts[1], 10);
        }
    }
    if (!isNaN(m) && !isNaN(y)) {
        if (y < 100) y += 2000;
        return { month: m, year: y };
    }
    return null;
};

export const calculateEligibilityDates = (courseDateStr: string, oldExpStr: string, validityMonths: number = 12, type?: string) => {
    if (!courseDateStr || courseDateStr.length !== 10) return null;
    const parts = courseDateStr.split('/');
    if (parts.length !== 3) return null;
    const cd = parseInt(parts[0], 10);
    const cm = parseInt(parts[1], 10);
    const cy = parseInt(parts[2], 10);
    if (isNaN(cd) || isNaN(cm) || isNaN(cy)) return null;

    // Apply specific validities
    if (type === 'PASSAPORTE') {
        validityMonths = 120; // 10 years
    } else if (type === 'VISTO') {
        validityMonths = 60;  // 5 years
    }

    let baseMonth = cm;
    let baseYear = cy;

    let prevRefMonth: number | null = null;
    let prevRefYear: number | null = null;

    if (oldExpStr) {
        const parsed = parseMonthYear(oldExpStr);
        if (parsed) {
            const isCmaOrPassportOrVisa = type === 'CMA' || type === 'PASSAPORTE' || type === 'VISTO';
            const isLengthOfFullDate = oldExpStr.includes('-') 
                ? oldExpStr.split('-').length === 3 
                : oldExpStr.split('/').length === 3;
                
            if (isLengthOfFullDate && !isCmaOrPassportOrVisa) {
                // It's a full expiration date, so reference month is 1 month before
                let m = parsed.month - 1;
                let y = parsed.year;
                if (m < 1) {
                    m += 12;
                    y -= 1;
                }
                prevRefMonth = m;
                prevRefYear = y;
            } else {
                // It's already the reference date (or same month/year for CMA/Pass/Visa)
                prevRefMonth = parsed.month;
                prevRefYear = parsed.year;
            }
        }
    }

    if (prevRefMonth !== null && prevRefYear !== null) {
        // Difference in months between previous reference date and course date
        const diffMonths = (prevRefYear - cy) * 12 + (prevRefMonth - cm);
        
        // Let's verify if course date is "a menos de 1 mês da DATA REF" (within 1 month preceding or in the same month)
        if (diffMonths === 0 || diffMonths === 1) {
            // Keep the same base cycle!
            baseMonth = prevRefMonth;
            baseYear = prevRefYear;
        } else {
            // Adjust to the course date month and year
            baseMonth = cm;
            baseYear = cy;
        }
    } else {
        // First time or no valid previous reference date: adjust according to completed course date
        baseMonth = cm;
        baseYear = cy;
    }

    // Ref Date is base + validityMonths (represented as MM/YYYY)
    let refMonth = baseMonth + validityMonths;
    let refYear = baseYear;
    while (refMonth > 12) {
        refMonth -= 12;
        refYear += 1;
    }
    const refDate = `${refMonth.toString().padStart(2, '0')}/${refYear}`;
    
    // Elegibilidade Max is normally one month after Ref Date
    let expMonth = refMonth + 1;
    let expYear = refYear;

    if (type === 'CMA' || type === 'PASSAPORTE' || type === 'VISTO') {
        // Elegibilidade Máxima == DATA REF (refDate)
        expMonth = refMonth;
        expYear = refYear;
    } else {
        while (expMonth > 12) {
            expMonth -= 12;
            expYear += 1;
        }
    }
    
    const expDate = `${expMonth.toString().padStart(2, '0')}/${expYear}`;

    return { refDate, expDate };
};

export const syncQualificationsFromSchedule = (
    crew: CrewMember[], 
    schedule: ScheduleMap, 
    qualificationsDef: QualificationDefinition[] 
): CrewMember[] => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Ignore these certificates for scheduling sync
    const ignoreQuals = ['CMA', 'PASSAPORTE', 'VISTO', 'VACINA'];
    const activeQualsDef = qualificationsDef.filter(q => !ignoreQuals.includes(q.code));

    return crew.map(member => {
        const assignmentsForCrew: { dateObj: Date, actCode: string, dateStr: string }[] = [];
        
        const memberSchedule = schedule[member.id] || {};
        Object.keys(memberSchedule).forEach(dateKey => {
            const [yearStr, monthStr, dayStr] = dateKey.split('-');
            if (yearStr && monthStr && dayStr) {
                const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
                const asss = memberSchedule[dateKey];
                asss.forEach(ass => {
                       if (!ass.isCustom) {
                           const codeToMatch = ass.code?.toUpperCase().trim() || '';
                           const detailsToMatch = ass.details?.toUpperCase().trim() || '';
                           
                           // Try direct match first, fallback to partial text match if code is within the text
                           const matchedQuals = activeQualsDef.filter(q => 
                               q.code === codeToMatch || 
                               q.code === detailsToMatch || 
                               codeToMatch.includes(q.code) ||
                               detailsToMatch.includes(q.code)
                           );

                           matchedQuals.forEach(matchedQual => {
                               assignmentsForCrew.push({ 
                                   dateObj, 
                                   actCode: matchedQual.code, 
                                   dateStr: `${dayStr.padStart(2, '0')}/${monthStr.padStart(2, '0')}/${yearStr}`
                               });
                           });

                           const isGSA320 = (ass.type === 'GS' || codeToMatch.includes('GS') || detailsToMatch.includes('GS')) && 
                               (codeToMatch.includes('320') || detailsToMatch.includes('320') || codeToMatch.includes('INICIAL') || detailsToMatch.includes('INICIAL') || codeToMatch.includes('GROUND'));

                           if (isGSA320) {
                               ['SIST.A320', 'AS.OPER', 'MET', 'REGUL', 'INT.SIST', 'CHT'].forEach(gc => {
                                  assignmentsForCrew.push({
                                      dateObj,
                                      actCode: gc,
                                      dateStr: `${dayStr.padStart(2, '0')}/${monthStr.padStart(2, '0')}/${yearStr}`
                                  });
                               });
                           }
                       }
                    });
            }
        });

        assignmentsForCrew.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

        const newQuals = { ...(member.qualifications || {}) };

        activeQualsDef.forEach(qdef => {
            const courses = assignmentsForCrew.filter(a => a.actCode === qdef.code);
            if (courses.length > 0) {
                // Initialize with existing values in case the schedule only has renewals but no initial course
                let currentExp = newQuals[qdef.code]?.expirationDate || '';
                let currentRef = newQuals[qdef.code]?.referenceDate || '';
                let lastCourse = newQuals[qdef.code]?.courseDate || '';
                
                // Parse lastCourse to a Date object for comparison
                let lastCourseDateObj = new Date(0); // very old by default
                if (lastCourse && lastCourse.length === 10) {
                    if (lastCourse.includes('-')) {
                        const parts = lastCourse.split('-');
                        if (parts.length === 3) {
                            lastCourseDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                        }
                    } else if (lastCourse.includes('/')) {
                        const parts = lastCourse.split('/');
                        if (parts.length === 3) {
                            const d = parseInt(parts[0], 10);
                            const m = parseInt(parts[1], 10);
                            const y = parseInt(parts[2], 10);
                            lastCourseDateObj = new Date(y, m - 1, d);
                        }
                    }
                }

                // Group courses into blocks (gap <= 7 days means same course)
                const blocks: { dateObj: Date, dateStr: string }[][] = [];
                let currentBlock: { dateObj: Date, dateStr: string }[] = [];
                
                courses.forEach(course => {
                    if (currentBlock.length === 0) {
                        currentBlock.push(course);
                    } else {
                        const lastInBlock = currentBlock[currentBlock.length - 1];
                        const gapDays = (course.dateObj.getTime() - lastInBlock.dateObj.getTime()) / (1000 * 60 * 60 * 24);
                        if (gapDays <= 14) { // 14 days max gap for a multi-day course (e.g. GS)
                            currentBlock.push(course);
                        } else {
                            blocks.push(currentBlock);
                            currentBlock = [course];
                        }
                    }
                });
                if (currentBlock.length > 0) blocks.push(currentBlock);

                blocks.forEach(block => {
                    const lastDayOfCourse = block[block.length - 1];
                    // We allow syncing courses even if they are in the future for planning purposes
                    // Only process courses that happen AFTER the previously recorded course
                    if (lastDayOfCourse.dateObj > lastCourseDateObj) {
                        lastCourse = lastDayOfCourse.dateStr;
                        lastCourseDateObj = lastDayOfCourse.dateObj;
                        const calc = calculateEligibilityDates(lastDayOfCourse.dateStr, currentRef || currentExp, qdef.validityMonths || 12, qdef.code);
                        if (calc) {
                            currentRef = calc.refDate;
                            currentExp = calc.expDate;
                        }
                    }
                });

                newQuals[qdef.code] = {
                    courseDate: lastCourse,
                    referenceDate: currentRef,
                    expirationDate: currentExp
                };
            }
        });

        return { ...member, qualifications: newQuals };
    });
};

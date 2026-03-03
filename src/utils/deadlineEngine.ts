// Deadline calculation engine for Finanskalenderen
// Supports multi-deadline generation (1+ year horizon) and custom fiscal year

import { Frequency, Obligation } from '@/data/obligations';

export type UrgencyLevel = 'overdue' | 'critical' | 'warning' | 'upcoming' | 'safe' | 'inactive';

export interface DeadlineInfo {
    nextDeadline: Date;
    daysRemaining: number;
    urgency: UrgencyLevel;
    sizeMultiplier: number;
    formattedDate: string;
    formattedCountdown: string;
}

export interface DeadlineInstance {
    obligationId: string;
    deadline: Date;
    daysRemaining: number;
    urgency: UrgencyLevel;
    formattedDate: string;
    formattedCountdown: string;
    isPast: boolean;
}

// Danish public holidays (approximate for given year)
const getDanishHolidays = (year: number): Date[] => {
    const holidays: Date[] = [
        new Date(year, 0, 1),   // Nytårsdag
        new Date(year, 5, 5),   // Grundlovsdag
        new Date(year, 11, 24), // Juleaftensdag
        new Date(year, 11, 25), // 1. juledag
        new Date(year, 11, 26), // 2. juledag
        new Date(year, 11, 31), // Nytårsaftensdag
    ];
    return holidays;
};

const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

// Move FORWARD to next business day (used by SKAT and most Danish authorities)
const adjustForWeekendAndHolidays = (date: Date): Date => {
    const result = new Date(date);
    const holidays = [
        ...getDanishHolidays(result.getFullYear()),
        ...getDanishHolidays(result.getFullYear() + 1),
    ];

    while (
        isWeekend(result) ||
        holidays.some(h => h.toDateString() === result.toDateString())
    ) {
        result.setDate(result.getDate() + 1);
    }
    return result;
};

// Move BACKWARD to previous business day (used by Feriekonto and some others)
const adjustForWeekendAndHolidaysBackward = (date: Date): Date => {
    const result = new Date(date);
    const holidays = [
        ...getDanishHolidays(result.getFullYear()),
        ...getDanishHolidays(result.getFullYear() - 1),
    ];

    while (
        isWeekend(result) ||
        holidays.some(h => h.toDateString() === result.toDateString())
    ) {
        result.setDate(result.getDate() - 1);
    }
    return result;
};

// ─── Calculate ALL deadlines for an obligation within a horizon ───────────────

export const calculateAllDeadlines = (
    obligation: Obligation,
    referenceDate: Date = new Date(),
    horizonMonths: number = 14,
    fiscalYearEnd: number = 12 // month (1-12), 12 = calendar year (Dec)
): Date[] => {
    const now = referenceDate;
    const horizon = new Date(now);
    horizon.setMonth(horizon.getMonth() + horizonMonths);

    const deadlines: Date[] = [];

    // For fiscal-year-dependent obligations, adjust deadlineMonth based on fiscal year
    let effectiveDeadlineMonth = obligation.deadlineMonth;
    if (obligation.fiscalYearDependent && effectiveDeadlineMonth) {
        // Default is based on calendar year (Dec=12). If fiscal year ends in e.g. June (6),
        // shift the deadline month accordingly.
        // E.g. selskabsskat deadline is month 7 (July) for calendar year = 7 months after Dec.
        // For fiscal year ending June, deadline becomes January (7 months after June).
        const calendarOffset = (effectiveDeadlineMonth - 12 + 12) % 12 || 12; // months after Dec
        effectiveDeadlineMonth = ((fiscalYearEnd + calendarOffset - 1) % 12) + 1;
    }

    // Pick the appropriate holiday adjuster based on the obligation's rule
    const adjust = obligation.adjustBackward
        ? adjustForWeekendAndHolidaysBackward
        : adjustForWeekendAndHolidays;

    // ── Custom deadlines: multiple fixed dates per year ──
    if (obligation.customDeadlines && obligation.customDeadlines.length > 0) {
        for (let yearOffset = -1; yearOffset <= 2; yearOffset++) {
            const year = now.getFullYear() + yearOffset;
            for (const cd of obligation.customDeadlines) {
                const d = new Date(year, cd.month - 1, cd.day);
                const adjusted = adjust(d);
                if (adjusted >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) && adjusted <= horizon) {
                    deadlines.push(adjusted);
                }
            }
        }
        // Sort and deduplicate, then return early
        deadlines.sort((a, b) => a.getTime() - b.getTime());
        return deadlines.filter((d, i, arr) =>
            i === 0 || d.getTime() !== arr[i - 1].getTime()
        );
    }

    switch (obligation.frequency) {
        case 'monthly': {
            const day = obligation.deadlineDay ?? 10;
            // Generate monthly deadlines from 1 month ago to horizon
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            for (let m = 0; m < horizonMonths + 2; m++) {
                // deadlineDay 0 = last day of the month (new Date(y, m+1, 0) trick)
                const d = day === 0
                    ? new Date(start.getFullYear(), start.getMonth() + m + 1, 0)
                    : new Date(start.getFullYear(), start.getMonth() + m, day);
                const adjusted = adjust(d);
                if (adjusted >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) && adjusted <= horizon) {
                    deadlines.push(adjusted);
                }
            }
            break;
        }

        case 'quarterly': {
            const day = obligation.deadlineDay ?? 1;
            const offset = obligation.monthOffset || 1;
            const quarterEnds = [2, 5, 8, 11]; // Mar, Jun, Sep, Dec (0-indexed)

            for (let yearOffset = -1; yearOffset <= 2; yearOffset++) {
                const year = now.getFullYear() + yearOffset;
                for (const qEnd of quarterEnds) {
                    let deadlineMonth = qEnd + offset;
                    let deadlineYear = year;
                    if (deadlineMonth > 11) {
                        deadlineMonth -= 12;
                        deadlineYear++;
                    }
                    // deadlineDay 0 = last day of the deadline month
                    const d = day === 0
                        ? new Date(deadlineYear, deadlineMonth + 1, 0)
                        : new Date(deadlineYear, deadlineMonth, day);
                    const adjusted = adjust(d);
                    if (adjusted >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) && adjusted <= horizon) {
                        deadlines.push(adjusted);
                    }
                }
            }
            break;
        }

        case 'semi-annual': {
            // Semi-annual: H1 (Jan–Jun) and H2 (Jul–Dec)
            // Period ends: June (5) and December (11), 0-indexed
            const day = obligation.deadlineDay || 15;
            const offset = obligation.monthOffset || 1;
            const periodEnds = [5, 11]; // June and December (0-indexed)

            for (let yearOffset = -1; yearOffset <= 2; yearOffset++) {
                const year = now.getFullYear() + yearOffset;
                for (const pEnd of periodEnds) {
                    let deadlineMonth = pEnd + offset;
                    let deadlineYear = year;
                    if (deadlineMonth > 11) {
                        deadlineMonth -= 12;
                        deadlineYear++;
                    }
                    const d = new Date(deadlineYear, deadlineMonth, day);
                    const adjusted = adjust(d);
                    if (adjusted >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) && adjusted <= horizon) {
                        deadlines.push(adjusted);
                    }
                }
            }
            break;
        }

        case 'annual': {
            const month = (effectiveDeadlineMonth || 7) - 1; // Convert to 0-indexed
            const day = obligation.deadlineDay || 1;

            for (let yearOffset = -1; yearOffset <= 2; yearOffset++) {
                const year = now.getFullYear() + yearOffset;
                const d = new Date(year, month, day);
                const adjusted = adjust(d);
                if (adjusted >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) && adjusted <= horizon) {
                    deadlines.push(adjusted);
                }
            }
            break;
        }

        case 'ongoing':
        case 'ad-hoc':
            // No fixed deadlines – return empty
            break;
    }

    // Sort chronologically and remove duplicates
    deadlines.sort((a, b) => a.getTime() - b.getTime());
    return deadlines.filter((d, i, arr) =>
        i === 0 || d.getTime() !== arr[i - 1].getTime()
    );
};

// ─── Calculate next deadline (convenience wrapper) ────────────────────────────

export const calculateNextDeadline = (
    obligation: Obligation,
    referenceDate: Date = new Date(),
    fiscalYearEnd: number = 12
): Date | null => {
    const all = calculateAllDeadlines(obligation, referenceDate, 14, fiscalYearEnd);
    const now = referenceDate;
    // Find first future deadline
    const future = all.find(d => d >= now);
    if (future) return future;
    // If none future, return the latest (may be slightly in the past for overdue)
    if (all.length > 0) return all[all.length - 1];
    return null;
};

// ─── Urgency / size helpers (unchanged) ───────────────────────────────────────

export const getUrgencyLevel = (daysRemaining: number | null, frequency: Frequency): UrgencyLevel => {
    if (daysRemaining === null) return 'safe';
    if (daysRemaining < 0) return 'overdue';

    switch (frequency) {
        case 'monthly':
            if (daysRemaining <= 3) return 'critical';
            if (daysRemaining <= 7) return 'warning';
            if (daysRemaining <= 14) return 'upcoming';
            return 'safe';
        case 'quarterly':
            if (daysRemaining <= 7) return 'critical';
            if (daysRemaining <= 30) return 'warning';
            if (daysRemaining <= 45) return 'upcoming';
            return 'safe';
        case 'annual':
        case 'semi-annual':
            if (daysRemaining <= 14) return 'critical';
            if (daysRemaining <= 60) return 'warning';
            if (daysRemaining <= 90) return 'upcoming';
            return 'safe';
        default:
            return 'safe';
    }
};

export const getSizeMultiplier = (urgency: UrgencyLevel): number => {
    switch (urgency) {
        case 'overdue': return 2.0;
        case 'critical': return 1.5;
        case 'warning': return 1.25;
        case 'upcoming': return 1.1;
        case 'safe': return 1.0;
        case 'inactive': return 0.8;
    }
};

// ─── Format helpers ───────────────────────────────────────────────────────────

const formatDate = (date: Date, lang: string): string => {
    const dateOptions: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    };
    return date.toLocaleDateString(lang === 'da' ? 'da-DK' : 'en-US', dateOptions);
};

const formatCountdown = (daysRemaining: number, lang: string): string => {
    if (daysRemaining < 0) {
        const overdueDays = Math.abs(daysRemaining);
        return lang === 'da'
            ? `${overdueDays} ${overdueDays === 1 ? 'dag' : 'dage'} overskredet`
            : `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`;
    } else if (daysRemaining === 0) {
        return lang === 'da' ? 'Forfalder i dag!' : 'Due today!';
    } else if (daysRemaining === 1) {
        return lang === 'da' ? '1 dag tilbage' : '1 day remaining';
    } else {
        return lang === 'da'
            ? `${daysRemaining} dage tilbage`
            : `${daysRemaining} days remaining`;
    }
};

// ─── Get deadline info for an obligation ──────────────────────────────────────

export const getDeadlineInfo = (
    obligation: Obligation,
    lang: string = 'da',
    referenceDate: Date = new Date(),
    fiscalYearEnd: number = 12
): DeadlineInfo => {
    const nextDeadline = calculateNextDeadline(obligation, referenceDate, fiscalYearEnd);

    if (!nextDeadline) {
        return {
            nextDeadline: new Date(9999, 11, 31),
            daysRemaining: 999,
            urgency: 'safe',
            sizeMultiplier: 1.0,
            formattedDate: lang === 'da' ? 'Løbende' : 'Ongoing',
            formattedCountdown: lang === 'da' ? 'Ingen fast frist' : 'No fixed deadline',
        };
    }

    const now = referenceDate;
    const diffTime = nextDeadline.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const urgency = getUrgencyLevel(daysRemaining, obligation.frequency);
    const sizeMultiplier = getSizeMultiplier(urgency);

    return {
        nextDeadline,
        daysRemaining,
        urgency,
        sizeMultiplier,
        formattedDate: formatDate(nextDeadline, lang),
        formattedCountdown: formatCountdown(daysRemaining, lang),
    };
};

// ─── Get all deadline instances for an obligation ─────────────────────────────

export const getAllDeadlineInstances = (
    obligation: Obligation,
    lang: string = 'da',
    referenceDate: Date = new Date(),
    fiscalYearEnd: number = 12
): DeadlineInstance[] => {
    const allDates = calculateAllDeadlines(obligation, referenceDate, 14, fiscalYearEnd);
    const now = referenceDate;

    return allDates.map(deadline => {
        const diffTime = deadline.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const urgency = getUrgencyLevel(daysRemaining, obligation.frequency);

        return {
            obligationId: obligation.id,
            deadline,
            daysRemaining,
            urgency,
            formattedDate: formatDate(deadline, lang),
            formattedCountdown: formatCountdown(daysRemaining, lang),
            isPast: daysRemaining < 0,
        };
    });
};

// Sort by deadline: shortest time remaining first (overdue → critical → ... → far future)
export const sortByPriority = (a: DeadlineInfo, b: DeadlineInfo): number => {
    return a.daysRemaining - b.daysRemaining;
};

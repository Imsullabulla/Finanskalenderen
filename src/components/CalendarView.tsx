'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';
import { Obligation, frequencyLabels } from '@/data/obligations';
import { DeadlineInfo, UrgencyLevel, calculateAllDeadlines, getUrgencyLevel } from '@/utils/deadlineEngine';
import { getCountdownColor } from '@/utils/countdownColor';
import { getCategoryColor } from '@/utils/categoryColors';
import type { ObligationState } from '@/context/AppContext';

type CalendarMode = 'day' | 'week' | 'month' | 'year';

type ObligationWithInfo = Obligation & { deadlineInfo: DeadlineInfo; state: ObligationState };

// Calendar event: an obligation at a specific deadline date
interface CalendarEvent {
    obligation: ObligationWithInfo;
    deadline: Date;
    daysRemaining: number;
    urgency: UrgencyLevel;
    periodLabel: string | null;
}

// ─── Helpers ──────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isSameMonth(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function getWeekDays(date: Date): Date[] {
    const d = new Date(date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const dd = new Date(monday);
        dd.setDate(monday.getDate() + i);
        days.push(dd);
    }
    return days;
}

function getMonthDays(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1);
    const startPad = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
}

const MONTH_NAMES_DA = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS_DA = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getStatusColor(urgency: UrgencyLevel, reported: boolean): string {
    if (reported) return 'var(--status-reported)';
    switch (urgency) {
        case 'overdue': return 'var(--status-overdue)';
        case 'critical': return 'var(--status-critical)';
        case 'warning': return 'var(--status-warning)';
        case 'upcoming': return 'var(--status-upcoming)';
        default: return 'var(--status-safe)';
    }
}

// Compute which period (quarter/half-year) a deadline covers
function getPeriodLabel(obligation: Obligation, deadline: Date, lang: string): string | null {
    const offset = obligation.monthOffset;
    if (!offset) return null;
    if (obligation.frequency !== 'quarterly' && obligation.frequency !== 'semi-annual') return null;

    // If deadlineDay === 0 (last day of month) and the holiday adjustment pushed it
    // into the next month (e.g. Feb 28 Sat → Mar 2), step back to the original month
    let workDate = new Date(deadline);
    if (obligation.deadlineDay === 0 && deadline.getDate() <= 3) {
        workDate = new Date(deadline.getFullYear(), deadline.getMonth() - 1, 15);
    }

    let periodEndMonth = workDate.getMonth() - offset;
    let periodYear = workDate.getFullYear();
    while (periodEndMonth < 0) {
        periodEndMonth += 12;
        periodYear--;
    }

    if (obligation.frequency === 'quarterly') {
        const quarterMap: Record<number, number> = { 2: 1, 5: 2, 8: 3, 11: 4 };
        const q = quarterMap[periodEndMonth];
        if (!q) return null;
        return lang === 'da' ? `K${q} ${periodYear}` : `Q${q} ${periodYear}`;
    }

    if (obligation.frequency === 'semi-annual') {
        const halfMap: Record<number, number> = { 5: 1, 11: 2 };
        const h = halfMap[periodEndMonth];
        if (!h) return null;
        return `H${h} ${periodYear}`;
    }

    return null;
}

function formatCountdownShort(days: number, lang: string): string {
    if (days < 0) return lang === 'da' ? `${Math.abs(days)}d overskredet` : `${Math.abs(days)}d overdue`;
    if (days === 0) return lang === 'da' ? 'I dag!' : 'Today!';
    return `${days} ${lang === 'da' ? 'dage tilbage' : 'days left'}`;
}

// ─── Main Component ──────────────────────────────────────────

export default function CalendarView() {
    const { lang } = useI18n();
    const { getActiveObligations, searchQuery, activeCategory, fiscalYearOverrides } = useApp();
    const [mode, setMode] = useState<CalendarMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const monthNames = lang === 'da' ? MONTH_NAMES_DA : MONTH_NAMES_EN;
    const weekdays = lang === 'da' ? WEEKDAYS_DA : WEEKDAYS_EN;

    const obligations = useMemo(() => getActiveObligations(), [getActiveObligations]);

    const filtered = useMemo(() => {
        return obligations.filter(o => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const name = (o.name[lang] || o.name.da).toLowerCase();
                if (!name.includes(query) && !o.category.includes(query)) return false;
            }
            if (activeCategory !== 'all' && o.category !== activeCategory) return false;
            return true;
        });
    }, [obligations, searchQuery, activeCategory, lang]);

    // Build map: dateString → CalendarEvent[] using ALL deadlines
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        const now = new Date();
        filtered.forEach(o => {
            const fiscalYear = fiscalYearOverrides.get(o.id) || 12;
            const allDates = calculateAllDeadlines(o, now, 14, fiscalYear);
            allDates.forEach(deadline => {
                const key = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')}`;
                const diffTime = deadline.getTime() - now.getTime();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const urgency = o.state.reported ? 'safe' as UrgencyLevel : getUrgencyLevel(daysRemaining, o.frequency);
                const periodLabel = getPeriodLabel(o, deadline, lang);
                const event: CalendarEvent = { obligation: o, deadline, daysRemaining, urgency, periodLabel };
                const arr = map.get(key) || [];
                arr.push(event);
                map.set(key, arr);
            });
        });
        return map;
    }, [filtered, fiscalYearOverrides]);

    const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return eventsByDate.get(key) || [];
    }, [eventsByDate]);

    // 7 nearest upcoming deadlines within 30 days
    const upcomingEvents = useMemo(() => {
        const now = new Date();
        const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const all: CalendarEvent[] = [];
        eventsByDate.forEach(events => {
            events.forEach(e => {
                const d = new Date(e.deadline.getFullYear(), e.deadline.getMonth(), e.deadline.getDate());
                if (d >= today && d <= cutoff) all.push(e);
            });
        });
        all.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
        // deduplicate same obligation+date
        const seen = new Set<string>();
        return all.filter(e => {
            const key = `${e.obligation.id}-${e.deadline.toDateString()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, 7);
    }, [eventsByDate]);

    // Navigation
    const navigate = (direction: number) => {
        const d = new Date(currentDate);
        if (mode === 'day') d.setDate(d.getDate() + direction);
        else if (mode === 'week') d.setDate(d.getDate() + direction * 7);
        else if (mode === 'month') d.setMonth(d.getMonth() + direction);
        else d.setFullYear(d.getFullYear() + direction);
        setCurrentDate(d);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    const headerLabel = useMemo(() => {
        if (mode === 'day') {
            return `${currentDate.getDate()}. ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
        if (mode === 'week') {
            const days = getWeekDays(currentDate);
            const start = days[0];
            const end = days[6];
            if (start.getMonth() === end.getMonth()) {
                return `${start.getDate()}–${end.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
            }
            return `${start.getDate()} ${monthNames[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${monthNames[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
        }
        if (mode === 'month') {
            return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
        return `${currentDate.getFullYear()}`;
    }, [currentDate, mode, monthNames]);

    return (
        <div className="cal">
            {upcomingEvents.length > 0 && (
                <div className="cal-upcoming-strip">
                    <span className="cal-upcoming-label">
                        {lang === 'da' ? 'Kommende frister' : 'Upcoming deadlines'}
                    </span>
                    <div className="cal-upcoming-list">
                        {upcomingEvents.map((e, i) => (
                            <div key={i} className="cal-upcoming-row">
                                <span
                                    className="cal-upcoming-dot"
                                    style={{ background: getCategoryColor(e.obligation.category) }}
                                />
                                <span className="cal-upcoming-name">
                                    {e.obligation.name[lang] || e.obligation.name.da}
                                </span>
                                <span className="cal-upcoming-date">
                                    {e.deadline.toLocaleDateString(lang === 'da' ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="cal-toolbar">
                <div className="cal-toolbar-left">
                    <button className="cal-nav-btn" onClick={() => navigate(-1)}>‹</button>
                    <button className="cal-nav-btn" onClick={() => navigate(1)}>›</button>
                    <h2 className="cal-header-label">{headerLabel}</h2>
                </div>
                <div className="cal-toolbar-right">
                    <button className="cal-today-btn" onClick={goToToday}>
                        {lang === 'da' ? 'I dag' : 'Today'}
                    </button>
                    <div className="cal-mode-switcher">
                        {(['day', 'week', 'month', 'year'] as CalendarMode[]).map(m => (
                            <button
                                key={m}
                                className={`cal-mode-btn ${mode === m ? 'active' : ''}`}
                                onClick={() => setMode(m)}
                            >
                                {lang === 'da'
                                    ? { day: 'Dag', week: 'Uge', month: 'Måned', year: 'År' }[m]
                                    : { day: 'Day', week: 'Week', month: 'Month', year: 'Year' }[m]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="cal-body">
                {mode === 'month' && (
                    <MonthView
                        year={currentDate.getFullYear()}
                        month={currentDate.getMonth()}
                        weekdays={weekdays}
                        getEventsForDate={getEventsForDate}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        lang={lang}
                    />
                )}
                {mode === 'week' && (
                    <WeekView
                        currentDate={currentDate}
                        weekdays={weekdays}
                        getEventsForDate={getEventsForDate}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        lang={lang}
                    />
                )}
                {mode === 'day' && (
                    <DayView
                        currentDate={currentDate}
                        getEventsForDate={getEventsForDate}
                        lang={lang}
                    />
                )}
                {mode === 'year' && (
                    <YearView
                        year={currentDate.getFullYear()}
                        monthNames={monthNames}
                        getEventsForDate={getEventsForDate}
                        onSelectMonth={(month) => {
                            setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
                            setMode('month');
                        }}
                        lang={lang}
                    />
                )}
            </div>

            {selectedDate && mode !== 'day' && (
                <DateDetailPanel
                    date={selectedDate}
                    events={getEventsForDate(selectedDate)}
                    onClose={() => setSelectedDate(null)}
                    lang={lang}
                />
            )}
        </div>
    );
}

// ─── Month View ──────────────────────────────────────────

function MonthView({
    year, month, weekdays, getEventsForDate, selectedDate, onSelectDate, lang
}: {
    year: number; month: number; weekdays: string[];
    getEventsForDate: (d: Date) => CalendarEvent[];
    selectedDate: Date | null; onSelectDate: (d: Date) => void; lang: string;
}) {
    const today = new Date();
    const cells = getMonthDays(year, month);

    return (
        <div className="cal-month" style={{ display: 'block' }}>
            <div className="cal-weekday-row">
                {weekdays.map(w => (
                    <div key={w} className="cal-weekday-cell">{w}</div>
                ))}
            </div>
            <div className="cal-month-grid">
                {cells.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} className="cal-day-cell cal-day-empty" />;

                    const events = getEventsForDate(date);
                    const isToday = isSameDay(date, today);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);

                    return (
                        <div
                            key={date.toISOString()}
                            className={`cal-day-cell ${isToday ? 'cal-day-today' : ''} ${isSelected ? 'cal-day-selected' : ''} ${events.length > 0 ? 'cal-day-has-events' : ''}`}
                            onClick={() => onSelectDate(date)}
                        >
                            <span className={`cal-day-number ${isToday ? 'cal-today-badge' : ''}`}>
                                {date.getDate()}
                            </span>
                            {events.length > 0 && (
                                <div className="cal-day-events">
                                    {events.slice(0, 3).map((ev, idx) => {
                                        const name = ev.obligation.name[lang] || ev.obligation.name.da;
                                        const desc = ev.obligation.description[lang] || ev.obligation.description.da;
                                        const freqLabel = frequencyLabels[ev.obligation.frequency]?.[lang] || ev.obligation.frequency;
                                        const deadlineStr = ev.deadline.toLocaleDateString(lang === 'da' ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                                        return (
                                            <div key={`${ev.obligation.id}-${idx}`} className="cal-chip-wrapper">
                                                <div
                                                    className="cal-event-chip"
                                                    style={{ background: getCategoryColor(ev.obligation.category), color: '#1a1a1a', display: 'flex', flexDirection: 'column', gap: '1px' }}
                                                >
                                                    <span>{name.slice(0, 14)}</span>
                                                    {ev.periodLabel && (
                                                        <span style={{ fontSize: '9px', opacity: 0.85, fontWeight: 400 }}>{ev.periodLabel}</span>
                                                    )}
                                                </div>
                                                <div className="cal-chip-tooltip">
                                                    <div className="cal-chip-tooltip-header">
                                                        <span className="cal-chip-tooltip-dot" style={{ background: getStatusColor(ev.urgency, ev.obligation.state.reported) }} />
                                                        <span className="cal-chip-tooltip-name">{name}</span>
                                                        <span className="cal-chip-tooltip-freq">{freqLabel}{ev.periodLabel ? ` · ${ev.periodLabel}` : ''}</span>
                                                    </div>
                                                    <div className="cal-chip-tooltip-deadline">
                                                        <span>{lang === 'da' ? 'Frist' : 'Deadline'}: {deadlineStr}</span>
                                                        <span className="cal-chip-tooltip-countdown" style={{ color: getCountdownColor(ev.daysRemaining) }}>
                                                            {formatCountdownShort(ev.daysRemaining, lang)}
                                                        </span>
                                                    </div>
                                                    <p className="cal-chip-tooltip-desc">{desc}</p>
                                                    {ev.obligation.authority && (
                                                        <div className="cal-chip-tooltip-authority">{ev.obligation.authority}</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {events.length > 3 && (
                                        <div className="cal-event-more">+{events.length - 3}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Week View ──────────────────────────────────────────

function WeekView({
    currentDate, weekdays, getEventsForDate, selectedDate, onSelectDate, lang
}: {
    currentDate: Date; weekdays: string[];
    getEventsForDate: (d: Date) => CalendarEvent[];
    selectedDate: Date | null; onSelectDate: (d: Date) => void; lang: string;
}) {
    const today = new Date();
    const days = getWeekDays(currentDate);

    return (
        <div className="cal-week">
            <div className="cal-week-grid">
                {days.map((date, i) => {
                    const events = getEventsForDate(date);
                    const isToday = isSameDay(date, today);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isWeekend = i >= 5;

                    return (
                        <div
                            key={date.toISOString()}
                            className={`cal-week-day ${isToday ? 'cal-day-today' : ''} ${isSelected ? 'cal-day-selected' : ''} ${isWeekend ? 'cal-weekend' : ''}`}
                            onClick={() => onSelectDate(date)}
                        >
                            <div className="cal-week-day-header">
                                <span className="cal-week-day-name">{weekdays[i]}</span>
                                <span className={`cal-week-day-number ${isToday ? 'cal-today-badge' : ''}`}>
                                    {date.getDate()}
                                </span>
                            </div>
                            <div className="cal-week-day-body">
                                {events.length === 0 && (
                                    <div className="cal-week-empty">
                                        {lang === 'da' ? 'Ingen pligter' : 'No obligations'}
                                    </div>
                                )}
                                {events.map((ev, idx) => {
                                    const name = ev.obligation.name[lang] || ev.obligation.name.da;
                                    const freqLabel = frequencyLabels[ev.obligation.frequency]?.[lang] || ev.obligation.frequency;
                                    return (
                                        <div
                                            key={`${ev.obligation.id}-${idx}`}
                                            className="cal-week-event"
                                            style={{ borderLeftColor: getCategoryColor(ev.obligation.category) }}
                                        >
                                            <div className="cal-week-event-name">{name}</div>
                                            <div className="cal-week-event-freq">{freqLabel}{ev.periodLabel ? ` · ${ev.periodLabel}` : ''}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Day View ──────────────────────────────────────────

function DayView({
    currentDate, getEventsForDate, lang
}: {
    currentDate: Date; getEventsForDate: (d: Date) => CalendarEvent[]; lang: string;
}) {
    const { markReported, unmarkReported } = useApp();
    const { t } = useI18n();
    const events = getEventsForDate(currentDate);
    const today = new Date();
    const isToday = isSameDay(currentDate, today);

    return (
        <div className="cal-day-view" style={{ display: 'block' }}>
            <div className="cal-day-view-header">
                {isToday && <span className="cal-day-today-label">{lang === 'da' ? 'I dag' : 'Today'}</span>}
                <span className="cal-day-view-count">
                    {events.length} {lang === 'da' ? 'pligter' : 'obligations'}
                </span>
            </div>

            {events.length === 0 ? (
                <div className="cal-day-empty-state">
                    <div className="cal-day-empty-icon">📅</div>
                    <div className="cal-day-empty-text">
                        {lang === 'da' ? 'Ingen pligter denne dag' : 'No obligations this day'}
                    </div>
                </div>
            ) : (
                <div className="cal-day-events-list">
                    {events.map((ev, idx) => {
                        const o = ev.obligation;
                        const name = o.name[lang] || o.name.da;
                        const desc = o.description[lang] || o.description.da;
                        const freqLabel = frequencyLabels[o.frequency]?.[lang] || o.frequency;
                        return (
                            <div
                                key={`${o.id}-${idx}`}
                                className="cal-day-event-card"
                                style={{ borderLeftColor: getCategoryColor(o.category) }}
                            >
                                <div className="cal-day-event-top">
                                    <span className="cal-day-event-dot" style={{ background: getCategoryColor(o.category) }} />
                                    <h4 className="cal-day-event-title">{name}</h4>
                                    <span className="cal-day-event-freq">{freqLabel}</span>
                                    {ev.periodLabel && (
                                        <span className="cal-day-event-freq" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{ev.periodLabel}</span>
                                    )}
                                </div>
                                <p className="cal-day-event-desc">{desc}</p>
                                <div className="cal-day-event-meta">
                                    <span>{t.floor.authority}: {o.authority}</span>
                                    <span className="cal-day-event-countdown" style={{ color: getCountdownColor(ev.daysRemaining) }}>
                                        {formatCountdownShort(ev.daysRemaining, lang)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Year View ──────────────────────────────────────────

function YearView({
    year, monthNames, getEventsForDate, onSelectMonth, lang
}: {
    year: number; monthNames: string[];
    getEventsForDate: (d: Date) => CalendarEvent[];
    onSelectMonth: (month: number) => void; lang: string;
}) {
    const today = new Date();

    return (
        <div className="cal-year">
            {Array.from({ length: 12 }, (_, month) => {
                const cells = getMonthDays(year, month);
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                let totalEvents = 0;
                for (let d = 1; d <= daysInMonth; d++) {
                    totalEvents += getEventsForDate(new Date(year, month, d)).length;
                }

                return (
                    <div
                        key={month}
                        className={`cal-year-month ${isSameMonth(new Date(year, month), today) ? 'cal-year-current' : ''}`}
                        onClick={() => onSelectMonth(month)}
                    >
                        <div className="cal-year-month-header">
                            <span className="cal-year-month-name">{monthNames[month]}</span>
                            {totalEvents > 0 && <span className="cal-year-month-count">{totalEvents}</span>}
                        </div>
                        <div className="cal-year-mini-grid">
                            {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((d, i) => (
                                <div key={`h-${i}`} className="cal-year-mini-weekday">{d}</div>
                            ))}
                            {cells.map((date, i) => {
                                if (!date) return <div key={`e-${i}`} className="cal-year-mini-day empty" />;
                                const events = getEventsForDate(date);
                                const isToday = isSameDay(date, today);
                                return (
                                    <div
                                        key={date.toISOString()}
                                        className={`cal-year-mini-day ${isToday ? 'today' : ''} ${events.length > 0 ? 'has-events' : ''}`}
                                        title={events.length > 0 ? `${events.length} ${lang === 'da' ? 'pligter' : 'obligations'}` : ''}
                                    >
                                        {date.getDate()}
                                        {events.length > 0 && (
                                            <span
                                                className="cal-year-mini-dot"
                                                style={{
                                                    background: getCategoryColor(events[0].obligation.category)
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Date Detail Panel ──────────────────────────────────────────

function DateDetailPanel({
    date, events, onClose, lang
}: {
    date: Date; events: CalendarEvent[]; onClose: () => void; lang: string;
}) {
    const { markReported, unmarkReported } = useApp();
    const { t } = useI18n();
    const monthNames = lang === 'da' ? MONTH_NAMES_DA : MONTH_NAMES_EN;

    return (
        <div className="cal-detail-panel">
            <div className="cal-detail-header">
                <div>
                    <h3 className="cal-detail-date">
                        {date.getDate()}. {monthNames[date.getMonth()]} {date.getFullYear()}
                    </h3>
                    <span className="cal-detail-count">
                        {events.length} {lang === 'da' ? 'pligter' : 'obligations'}
                    </span>
                </div>
                <button className="cal-detail-close" onClick={onClose}>×</button>
            </div>

            {events.length === 0 ? (
                <div className="cal-detail-empty">
                    {lang === 'da' ? 'Ingen frister denne dag' : 'No deadlines this day'}
                </div>
            ) : (
                <div className="cal-detail-list">
                    {events.map((ev, idx) => {
                        const o = ev.obligation;
                        const name = o.name[lang] || o.name.da;
                        const freqLabel = frequencyLabels[o.frequency]?.[lang] || o.frequency;
                        return (
                            <div
                                key={`${o.id}-${idx}`}
                                className="cal-detail-item"
                                style={{ borderLeftColor: getCategoryColor(o.category) }}
                            >
                                <div className="cal-detail-item-top">
                                    <span className="cal-detail-item-dot" style={{ background: getCategoryColor(o.category) }} />
                                    <span className="cal-detail-item-name">{name}</span>
                                    <span className="cal-detail-item-freq">{freqLabel}</span>
                                    {ev.periodLabel && (
                                        <span className="cal-detail-item-freq" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{ev.periodLabel}</span>
                                    )}
                                </div>
                                <div className="cal-detail-item-countdown" style={{ color: getCountdownColor(ev.daysRemaining) }}>
                                    {formatCountdownShort(ev.daysRemaining, lang)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

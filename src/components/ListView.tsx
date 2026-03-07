'use client';
import React, { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';
import { frequencyLabels } from '@/data/obligations';
import { calculateAllDeadlines } from '@/utils/deadlineEngine';
import { getCountdownColor } from '@/utils/countdownColor';
import { getCategoryColor } from '@/utils/categoryColors';

export default function ListView() {
    const { lang, t } = useI18n();
    const { getActiveObligations, fiscalYearOverrides } = useApp();
    const obligations = useMemo(() => getActiveObligations(), [getActiveObligations]);
    const [showOverdue, setShowOverdue] = useState(false);

    const overdueRows = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const rows: { id: string; obligation: typeof obligations[0]; deadline: Date; daysOverdue: number }[] = [];

        obligations.forEach(o => {
            if (o.frequency === 'ad-hoc' || o.frequency === 'ongoing') return;
            const fiscalYear = fiscalYearOverrides.get(o.id) || 12;
            const allDates = calculateAllDeadlines(o, yearStart, 12, fiscalYear);
            allDates.forEach(deadline => {
                if (deadline.getFullYear() === currentYear && deadline < now) {
                    const daysOverdue = Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
                    rows.push({ id: `${o.id}-${deadline.getTime()}`, obligation: o, deadline, daysOverdue });
                }
            });
        });

        rows.sort((a, b) => b.deadline.getTime() - a.deadline.getTime());
        return rows;
    }, [obligations, fiscalYearOverrides]);

    return (
        <div className="list-view">
            <div className="list-view-toolbar">
                <button
                    className={`list-tab-btn ${!showOverdue ? 'active' : ''}`}
                    onClick={() => setShowOverdue(false)}
                >
                    {lang === 'da' ? 'Kommende' : 'Upcoming'}
                </button>
                <button
                    className={`list-tab-btn ${showOverdue ? 'active' : ''}`}
                    onClick={() => setShowOverdue(true)}
                >
                    {lang === 'da' ? 'Overskredet' : 'Overdue'}
                    {overdueRows.length > 0 && (
                        <span className="list-tab-badge">{overdueRows.length}</span>
                    )}
                </button>
            </div>

            {!showOverdue ? (
                <>
                    <div className="list-view-header">
                        <span></span>
                        <span>{lang === 'da' ? 'Pligt' : 'Obligation'}</span>
                        <span>{lang === 'da' ? 'Frist' : 'Deadline'}</span>
                        <span>{lang === 'da' ? 'Nedtælling' : 'Countdown'}</span>
                        <span>{t.floor.frequency}</span>
                    </div>
                    {obligations.map(o => {
                        const name = o.name[lang] || o.name.da;
                        const freqLabel = frequencyLabels[o.frequency]?.[lang] || o.frequency;
                        return (
                            <div key={o.id} className="list-view-row">
                                <span className="list-dot" style={{ background: getCategoryColor(o.category) }} />
                                <span className="list-name">{name}</span>
                                <span className="list-date">{o.deadlineInfo.formattedDate}</span>
                                <span
                                    className={`list-countdown${o.deadlineInfo.daysRemaining === 0 ? ' countdown-today' : ''}`}
                                    style={o.deadlineInfo.daysRemaining !== 0 ? { color: getCountdownColor(o.deadlineInfo.daysRemaining) } : undefined}
                                >
                                    {o.deadlineInfo.formattedCountdown}
                                </span>
                                <span className="list-freq">{freqLabel}</span>
                            </div>
                        );
                    })}
                </>
            ) : (
                <>
                    <div className="list-view-header">
                        <span></span>
                        <span>{lang === 'da' ? 'Pligt' : 'Obligation'}</span>
                        <span>{lang === 'da' ? 'Frist' : 'Deadline'}</span>
                        <span>{lang === 'da' ? 'Overskredet med' : 'Overdue by'}</span>
                        <span>{t.floor.frequency}</span>
                    </div>
                    {overdueRows.length === 0 ? (
                        <div className="empty-state" style={{ padding: '64px 24px' }}>
                            <div className="empty-state-icon">✅</div>
                            <div className="empty-state-text">
                                {lang === 'da' ? 'Ingen overskredte frister i år' : 'No overdue obligations this year'}
                            </div>
                        </div>
                    ) : (
                        overdueRows.map(({ id, obligation: o, deadline, daysOverdue }) => {
                            const name = o.name[lang] || o.name.da;
                            const freqLabel = frequencyLabels[o.frequency]?.[lang] || o.frequency;
                            const formattedDate = deadline.toLocaleDateString(lang === 'da' ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                            return (
                                <div key={id} className="list-view-row">
                                    <span className="list-dot" style={{ background: getCategoryColor(o.category) }} />
                                    <span className="list-name">{name}</span>
                                    <span className="list-date">{formattedDate}</span>
                                    <span
                                        className="list-countdown"
                                        style={{ color: getCountdownColor(-daysOverdue), fontWeight: 700 }}
                                    >
                                        {daysOverdue} {lang === 'da' ? 'dage' : 'days'}
                                    </span>
                                    <span className="list-freq">{freqLabel}</span>
                                </div>
                            );
                        })
                    )}
                </>
            )}
        </div>
    );
}

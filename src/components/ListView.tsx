'use client';
import React, { useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';
import { frequencyLabels } from '@/data/obligations';
import type { UrgencyLevel } from '@/utils/deadlineEngine';
import { getCountdownColor } from '@/utils/countdownColor';
import { getCategoryColor } from '@/utils/categoryColors';

export default function ListView() {
    const { lang, t } = useI18n();
    const { getActiveObligations, markReported, unmarkReported } = useApp();
    const obligations = useMemo(() => getActiveObligations(), [getActiveObligations]);

    const getStatusColor = (urgency: UrgencyLevel, reported: boolean) => {
        if (reported) return 'var(--status-reported)';
        switch (urgency) {
            case 'overdue': return 'var(--status-overdue)';
            case 'critical': return 'var(--status-critical)';
            case 'warning': return 'var(--status-warning)';
            case 'upcoming': return 'var(--status-upcoming)';
            default: return 'var(--status-safe)';
        }
    };

    return (
        <div className="list-view">
            <div className="list-view-header">
                <span></span>
                <span>{lang === 'da' ? 'Pligt' : 'Obligation'}</span>
                <span>{t.floor.deadline}</span>
                <span>{lang === 'da' ? 'Nedtælling' : 'Countdown'}</span>
                <span>{t.floor.frequency}</span>
                <span>{lang === 'da' ? 'Status' : 'Status'}</span>
            </div>
            {obligations.map(o => {
                const name = o.name[lang] || o.name.da;
                const freqLabel = frequencyLabels[o.frequency]?.[lang] || o.frequency;
                const urgency = o.state.reported ? 'safe' : o.deadlineInfo.urgency;
                const statusColor = getStatusColor(urgency, o.state.reported);

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
        </div>
    );
}

'use client';
import React, { useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';
import { frequencyLabels } from '@/data/obligations';
import type { UrgencyLevel } from '@/utils/deadlineEngine';

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

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'skat':     return '#a2d2ff';
            case 'miljø':    return '#b5ead7';
            case 'eu':       return '#bde0fe';
            case 'afgifter': return '#ffafcc';
            case 'hr':       return '#ffc8dd';
            case 'regnskab': return '#cdb4db';
            default:         return '#e2e8f0';
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
                        <span className="list-countdown" style={{ color: statusColor }}>
                            {o.deadlineInfo.formattedCountdown}
                        </span>
                        <span className="list-freq">{freqLabel}</span>
                        <div className="list-actions">
                            {o.state.reported ? (
                                <button
                                    className="card-btn card-btn-reported"
                                    style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                                    onClick={() => unmarkReported(o.id)}
                                >
                                    ✓
                                </button>
                            ) : (
                                <button
                                    className="card-btn card-btn-primary"
                                    style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                                    onClick={() => markReported(o.id)}
                                >
                                    ✓
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

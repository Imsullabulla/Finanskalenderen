'use client';
import React, { useEffect, useRef } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';
import { Obligation, frequencyLabels, obligationGroups } from '@/data/obligations';
import { DeadlineInfo, UrgencyLevel } from '@/utils/deadlineEngine';
import { getCountdownColor } from '@/utils/countdownColor';
import { getCategoryColor } from '@/utils/categoryColors';
import type { ObligationState } from '@/context/AppContext';
import CalendarSyncButton from '@/components/CalendarSyncButton';
import { fireConfetti } from '@/utils/confetti';

interface ObligationCardProps {
    obligation: Obligation & { deadlineInfo: DeadlineInfo; state: ObligationState };
    index?: number;
    isExpanded?: boolean;
    onExpand?: (id: string) => void;
}

const MONTHS_DA = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ObligationCard({ obligation, index = 0, isExpanded = false, onExpand }: ObligationCardProps) {
    const { lang, t } = useI18n();
    const { scrollTargetId, clearScrollTarget, fiscalYearOverrides, setFiscalYearOverride } = useApp();
    const cardRef = useRef<HTMLDivElement>(null);
    const expanded = isExpanded;

    const { deadlineInfo } = obligation;
    const urgency: UrgencyLevel = deadlineInfo.urgency;
    const statusClass = urgency;

    const freqLabel = frequencyLabels[obligation.frequency]?.[lang] || obligation.frequency;
    const name = obligation.name[lang] || obligation.name.da;
    const description = obligation.description[lang] || obligation.description.da;

    // Find group label if applicable
    const group = obligation.groupId
        ? obligationGroups.find(g => g.id === obligation.groupId)
        : null;
    const groupLabel = group ? (group.name[lang] || group.name.da) : null;

    // Fiscal year override
    const currentFiscalYear = fiscalYearOverrides.get(obligation.id) || 12;
    const months = lang === 'da' ? MONTHS_DA : MONTHS_EN;

    // Scroll target: auto-expand and scroll when this card is targeted
    useEffect(() => {
        if (scrollTargetId === obligation.id && cardRef.current) {
            onExpand?.(obligation.id);
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight effect
            cardRef.current.classList.add('scroll-highlight');
            const timer = setTimeout(() => {
                cardRef.current?.classList.remove('scroll-highlight');
                clearScrollTarget();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [scrollTargetId, obligation.id, clearScrollTarget]);

    // Click on card body toggles expand (but not on buttons/links)
    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        // Don't toggle if clicking button, link, input, select
        if (target.closest('button') || target.closest('a') || target.closest('select') || target.closest('input')) {
            return;
        }
        onExpand?.(obligation.id);
    };

    return (
        <div
            ref={cardRef}
            className={`obligation-card status-${statusClass}`}
            style={{ animationDelay: `${index * 0.04}s`, cursor: 'pointer', '--cat-color': getCategoryColor(obligation.category) } as React.CSSProperties}
            onClick={handleCardClick}
            data-obligation-id={obligation.id}
        >
            {/* Header */}
            <div className="card-header">
                <div className="card-title-row">
                    <span className={`card-status-dot ${statusClass}`} style={{ background: getCategoryColor(obligation.category) }} />
                    <span className="card-title">{name}</span>
                </div>
                <span className="card-frequency-badge">{freqLabel}</span>
            </div>

            {/* Group badge */}
            {groupLabel && (
                <div style={{ marginBottom: '12px' }}>
                    <span className="card-group-badge">{groupLabel}</span>
                </div>
            )}

            {/* Deadline */}
            <div className="card-deadline">
                <div className="card-deadline-date">
                    {t.floor.deadline}: {deadlineInfo.formattedDate}
                </div>
                <div
                    className={`card-countdown${deadlineInfo.daysRemaining === 0 ? ' countdown-today' : ''}`}
                    style={deadlineInfo.daysRemaining !== 0 ? { color: getCountdownColor(deadlineInfo.daysRemaining) } : undefined}
                >
                    {deadlineInfo.formattedCountdown}
                </div>
            </div>

            {/* Actions */}
            <div className="card-actions">
                <button
                    className="card-btn"
                    onClick={(e) => { e.stopPropagation(); onExpand?.(obligation.id); }}
                >
                    {expanded ? t.floor.readLess : t.floor.readMore}
                </button>
            </div>

            {/* Expand */}
            <div className={`card-expand ${expanded ? 'open' : ''}`}>
                <div className="card-expand-description">{description}</div>
                <div className="card-expand-row">
                    <span className="card-expand-label">{t.floor.frequency}:</span>
                    <span className="card-expand-value">{freqLabel}</span>
                </div>
                <div className="card-expand-row">
                    <span className="card-expand-label">{t.floor.authority}:</span>
                    <span className="card-expand-value">{obligation.authority}</span>
                </div>

                {/* Fiscal year selector for applicable obligations */}
                {obligation.fiscalYearDependent && (
                    <div className="card-expand-row card-fiscal-year">
                        <span className="card-expand-label">
                            {lang === 'da' ? 'Regnskabsår slutter:' : 'Fiscal year ends:'}
                        </span>
                        <select
                            className="fiscal-year-select"
                            value={currentFiscalYear}
                            onChange={(e) => {
                                e.stopPropagation();
                                setFiscalYearOverride(obligation.id, parseInt(e.target.value));
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {months.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="card-expand-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <CalendarSyncButton
                        name={name}
                        description={description}
                        deadlineDate={deadlineInfo.nextDeadline.getFullYear() === 9999 ? null : deadlineInfo.nextDeadline}
                        url={obligation.url}
                    />
                    {obligation.url && (
                        <a
                            href={obligation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-btn"
                        >
                            {t.floor.visitAuthority} ↗
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

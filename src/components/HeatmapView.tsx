'use client';
import React, { useState, useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';
import { Obligation, frequencyLabels, obligationGroups, Category } from '@/data/obligations';
import { DeadlineInfo, UrgencyLevel } from '@/utils/deadlineEngine';
import type { ObligationState } from '@/context/AppContext';

// Category → background image mapping
const categoryImages: Record<Category, string> = {
    skat: '/images/bg-skat.png',
    miljø: '/images/bg-miljo.png',
    eu: '/images/bg-eu.png',
    afgifter: '/images/bg-afgifter.png',
    hr: '/images/bg-hr.png',
    regnskab: '/images/bg-regnskab.png',
};

// Determine BentoGrid span based on urgency
function getBentoSpan(urgency: UrgencyLevel, reported: boolean): string {
    if (reported) return 'bento-1x1';
    switch (urgency) {
        case 'overdue': return 'bento-2x2';
        case 'critical': return 'bento-2x1';
        case 'warning': return 'bento-2x1';
        case 'upcoming': return 'bento-1x1';
        default: return 'bento-1x1';
    }
}

function getStatusLabel(urgency: UrgencyLevel, reported: boolean, lang: string): string {
    if (reported) return lang === 'da' ? '✓ Indberettet' : '✓ Reported';
    switch (urgency) {
        case 'overdue': return lang === 'da' ? 'Overskredet' : 'Overdue';
        case 'critical': return lang === 'da' ? 'Kritisk' : 'Critical';
        case 'warning': return lang === 'da' ? 'Snart' : 'Soon';
        case 'upcoming': return lang === 'da' ? 'Kommende' : 'Upcoming';
        default: return lang === 'da' ? 'OK' : 'OK';
    }
}

interface BentoCardProps {
    obligation: Obligation & { deadlineInfo: DeadlineInfo; state: ObligationState };
    index: number;
}

function BentoCard({ obligation, index }: BentoCardProps) {
    const { lang, t } = useI18n();
    const { markReported, unmarkReported } = useApp();
    const [expanded, setExpanded] = useState(false);

    const { deadlineInfo, state } = obligation;
    const urgency: UrgencyLevel = state.reported ? 'safe' : deadlineInfo.urgency;
    const statusClass = state.reported ? 'reported' : urgency;
    const bentoSpan = getBentoSpan(urgency, state.reported);

    const name = obligation.name[lang] || obligation.name.da;
    const description = obligation.description[lang] || obligation.description.da;
    const freqLabel = frequencyLabels[obligation.frequency]?.[lang] || obligation.frequency;
    const statusLabel = getStatusLabel(urgency, state.reported, lang);
    const bgImage = categoryImages[obligation.category];

    const group = obligation.groupId
        ? obligationGroups.find(g => g.id === obligation.groupId)
        : null;
    const groupLabel = group ? (group.name[lang] || group.name.da) : null;

    return (
        <div
            className={`bento-card ${bentoSpan} bento-status-${statusClass}`}
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Background image */}
            <div
                className="bento-card-bg"
                style={{ backgroundImage: `url(${bgImage})` }}
            />

            {/* Gradient overlay */}
            <div className={`bento-card-overlay bento-overlay-${statusClass}`} />

            {/* Content */}
            <div className="bento-card-content">
                {/* Top row: status badge + frequency */}
                <div className="bento-card-top">
                    <span className={`bento-status-badge bento-badge-${statusClass}`}>
                        {statusLabel}
                    </span>
                    <span className="bento-freq-badge">{freqLabel}</span>
                </div>

                {/* Main content pushed to bottom */}
                <div className="bento-card-bottom">
                    {groupLabel && <span className="bento-group-label">{groupLabel}</span>}
                    <h3 className="bento-card-title">{name}</h3>
                    <div className="bento-card-deadline">
                        <span className="bento-deadline-date">{deadlineInfo.formattedDate}</span>
                        <span className={`bento-countdown bento-countdown-${statusClass}`}>
                            {deadlineInfo.formattedCountdown}
                        </span>
                    </div>

                    {/* Expand section */}
                    {expanded && (
                        <div className="bento-card-expand">
                            <p className="bento-card-desc">{description}</p>
                            <div className="bento-card-meta">
                                <span>{t.floor.authority}: {obligation.authority}</span>
                            </div>
                            <div className="bento-card-btns">
                                {state.reported ? (
                                    <button
                                        className="bento-btn bento-btn-reported"
                                        onClick={e => { e.stopPropagation(); unmarkReported(obligation.id); }}
                                    >
                                        ✓ {t.status.reported}
                                    </button>
                                ) : (
                                    <button
                                        className="bento-btn bento-btn-primary"
                                        onClick={e => { e.stopPropagation(); markReported(obligation.id); }}
                                    >
                                        {t.floor.markDone}
                                    </button>
                                )}
                                {obligation.url && (
                                    <a
                                        href={obligation.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bento-btn"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {t.floor.visitAuthority} ↗
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {!expanded && (
                        <button className="bento-cta" onClick={e => { e.stopPropagation(); setExpanded(true); }}>
                            {t.floor.readMore}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function HeatmapView() {
    const { lang, t } = useI18n();
    const { getActiveObligations, searchQuery, activeCategory } = useApp();

    const obligations = useMemo(() => getActiveObligations(), [getActiveObligations]);

    const filteredObligations = useMemo(() => {
        return obligations.filter(o => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const name = (o.name[lang] || o.name.da).toLowerCase();
                const desc = (o.description[lang] || o.description.da).toLowerCase();
                if (!name.includes(query) && !desc.includes(query) && !o.category.includes(query)) {
                    return false;
                }
            }
            if (activeCategory !== 'all' && o.category !== activeCategory) {
                return false;
            }
            return true;
        });
    }, [obligations, searchQuery, activeCategory, lang]);

    return (
        <div className="bento-grid">
            {filteredObligations.map((obligation, index) => (
                <BentoCard key={obligation.id} obligation={obligation} index={index} />
            ))}
        </div>
    );
}

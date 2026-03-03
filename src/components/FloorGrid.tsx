'use client';
import React, { useMemo, useState, useCallback } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';
import ObligationCard from './ObligationCard';
import ListView from './ListView';
import CalendarView from './CalendarView';

export default function FloorGrid() {
    const { lang, t } = useI18n();
    const { getActiveObligations, viewMode, searchQuery, activeCategory } = useApp();

    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

    const handleCardExpand = useCallback((id: string) => {
        setExpandedCardId(prev => prev === id ? null : id);
    }, []);

    const obligations = useMemo(() => getActiveObligations(), [getActiveObligations]);

    // Apply sidebar filters to floor view
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

    if (viewMode === 'list') {
        return (
            <main className="floor">
                <ListView />
            </main>
        );
    }

    if (viewMode === 'calendar') {
        return (
            <main className="floor">
                <CalendarView />
            </main>
        );
    }

    return (
        <main className="floor">
            <div className="floor-header">
                <h2 className="floor-title">{t.floor.title}</h2>
            </div>

            {filteredObligations.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-text">{t.floor.empty}</div>
                </div>
            ) : (
                <div className="floor-grid">
                    {filteredObligations.map((obligation, index) => (
                        <ObligationCard
                            key={obligation.id}
                            obligation={obligation}
                            index={index}
                            isExpanded={expandedCardId === obligation.id}
                            onExpand={handleCardExpand}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}


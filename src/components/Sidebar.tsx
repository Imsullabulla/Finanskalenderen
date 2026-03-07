'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';
import { obligations as allObligations, Category, categoryLabels, frequencyLabels } from '@/data/obligations';
import CalendarExportModal from './CalendarExportModal';

const categories: (Category | 'all')[] = ['all', 'skat', 'miljø', 'eu', 'afgifter', 'hr', 'regnskab'];

export default function Sidebar() {
    const { lang, t } = useI18n();
    const {
        obligationStates,
        toggleObligation,
        searchQuery,
        setSearchQuery,
        activeCategory,
        setActiveCategory,
        sidebarCollapsed,
        scrollToObligation,
        allObligationsActive,
        toggleAllObligations,
    } = useApp();

    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
    const [showExportModal, setShowExportModal] = useState(false);

    const toggleCategory = useCallback((cat: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    }, []);

    // Filter obligations
    const filteredObligations = useMemo(() => {
        return allObligations.filter(o => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const name = (o.name[lang] || o.name.da).toLowerCase();
                const desc = (o.description[lang] || o.description.da).toLowerCase();
                if (!name.includes(query) && !desc.includes(query) && !o.category.includes(query)) {
                    return false;
                }
            }
            // Category filter
            if (activeCategory !== 'all' && o.category !== activeCategory) {
                return false;
            }
            return true;
        });
    }, [searchQuery, activeCategory, lang]);

    // Group by category
    const grouped = useMemo(() => {
        const groups: Record<string, typeof filteredObligations> = {};
        filteredObligations.forEach(o => {
            if (!groups[o.category]) groups[o.category] = [];
            groups[o.category].push(o);
        });
        return groups;
    }, [filteredObligations]);

    const getCategoryLabel = (cat: string) => {
        return categoryLabels[cat as Category]?.[lang] || cat;
    };

    const handleObligationClick = useCallback((obligationId: string) => {
        scrollToObligation(obligationId);
    }, [scrollToObligation]);

    return (
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-header-top">
                    <div className="sidebar-title">{t.sidebar.title}</div>
                    <label
                        className="sidebar-toggle-all"
                        title={allObligationsActive
                            ? (lang === 'da' ? 'Deaktiver alle' : 'Disable all')
                            : (lang === 'da' ? 'Aktiver alle' : 'Enable all')}
                    >
                        <span className="sidebar-toggle-all-label">
                            {lang === 'da' ? 'Alle' : 'All'}
                        </span>
                        <span className="toggle">
                            <input
                                type="checkbox"
                                checked={allObligationsActive}
                                onChange={toggleAllObligations}
                            />
                            <span className="toggle-slider" />
                        </span>
                    </label>
                </div>
                <div className="search-container">
                    <span className="search-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder={t.sidebar.search}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => setSearchQuery('')}>
                            ×
                        </button>
                    )}
                </div>
            </div>

            <div className="filter-chips">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'all' ? t.sidebar.all : getCategoryLabel(cat)}
                    </button>
                ))}
            </div>

            <div className="sidebar-list">
                {Object.entries(grouped).map(([category, items]) => (
                    <div key={category} className="sidebar-category">
                        <div
                            className="sidebar-category-header"
                            onClick={() => toggleCategory(category)}
                        >
                            <span className="sidebar-category-name">{getCategoryLabel(category)}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="sidebar-category-count">{items.length}</span>
                                <span className={`sidebar-category-chevron ${!collapsedCategories.has(category) ? 'open' : ''}`}>
                                    ▾
                                </span>
                            </div>
                        </div>
                        {!collapsedCategories.has(category) && items.map(obligation => {
                            const state = obligationStates.get(obligation.id);
                            const isActive = state?.active ?? true;
                            const freqLabel = frequencyLabels[obligation.frequency]?.[lang] || obligation.frequency;

                            return (
                                <div
                                    key={obligation.id}
                                    className={`sidebar-item ${!isActive ? 'inactive' : ''}`}
                                    onClick={() => handleObligationClick(obligation.id)}
                                    style={{ cursor: 'pointer' }}
                                >

                                    <div className="sidebar-item-info">
                                        <div className="sidebar-item-name">
                                            {obligation.name[lang] || obligation.name.da}
                                        </div>
                                        <div className="sidebar-item-freq">{freqLabel}</div>
                                    </div>
                                    <label className="toggle" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={() => toggleObligation(obligation.id)}
                                        />
                                        <span className="toggle-slider" />
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {filteredObligations.length === 0 && (
                    <div className="empty-state" style={{ padding: '32px 24px' }}>
                        <div className="empty-state-icon">🔍</div>
                        <div className="empty-state-text">
                            {lang === 'da' ? 'Ingen pligter matcher din søgning' : 'No obligations match your search'}
                        </div>
                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                <button
                    className="sidebar-export-btn"
                    onClick={() => setShowExportModal(true)}
                    title={lang === 'da' ? 'Eksportér pligter til din kalender' : 'Export obligations to your calendar'}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {lang === 'da' ? 'Eksportér til kalender' : 'Export to Calendar'}
                </button>
            </div>

            {showExportModal && (
                <CalendarExportModal onClose={() => setShowExportModal(false)} />
            )}
        </aside>
    );
}

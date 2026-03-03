'use client';
import React from 'react';
import { useI18n, languageNames, Language } from '@/i18n/I18nContext';
import { useApp, ViewMode } from '@/context/AppContext';
import { fireConfetti } from '@/utils/confetti';

const viewModes: ViewMode[] = ['normal', 'calendar', 'list'];

export default function Header() {
    const { lang, t, setLang } = useI18n();
    const { viewMode, setViewMode, toggleSidebar } = useApp();

    return (
        <header className="header">
            <div className="header-left">
                <button className="sidebar-toggle" onClick={toggleSidebar} title="Toggle sidebar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <div className="header-logo">
                    <div className="header-logo-icon">F</div>
                    <span className="header-logo-text">{t.app.title}</span>
                </div>
            </div>

            <div className="header-right">
                <div className="view-switcher">
                    {viewModes.map(v => (
                        <button
                            key={v}
                            className={`view-btn ${viewMode === v ? 'active' : ''}`}
                            onClick={() => setViewMode(v)}
                        >
                            {t.views[v]}
                        </button>
                    ))}
                </div>

                <button
                    className="confetti-btn"
                    onClick={fireConfetti}
                    title={lang === 'da' ? 'Fejr det!' : 'Celebrate!'}
                >
                    🎉
                </button>

                <div className="lang-switcher">
                    {(['da', 'en'] as Language[]).map(l => (
                        <button
                            key={l}
                            className={`lang-btn ${lang === l ? 'active' : ''}`}
                            onClick={() => setLang(l)}
                        >
                            {l === 'da' ? 'DA' : 'EN'}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
}

'use client';
import React from 'react';
import { useI18n, Language } from '@/i18n/I18nContext';

interface LandingPageProps {
    onEnterDemo: () => void;
}

export default function LandingPage({ onEnterDemo }: LandingPageProps) {
    const { lang, t, setLang } = useI18n();

    return (
        <div className="landing">
            <header className="landing-header">
                <div className="header-logo">
                    <div className="header-logo-icon">F</div>
                    <span className="header-logo-text">{t.app.title}</span>
                </div>
                <div className="header-right">
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
                    <button className="btn-secondary" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>
                        {t.nav.login}
                    </button>
                </div>
            </header>

            <section className="landing-hero">
                <h1>{t.landing.hero}</h1>
                <p>{t.landing.subtitle}</p>
                <div className="landing-ctas">
                    <button className="btn-primary" onClick={onEnterDemo}>
                        {t.landing.cta} →
                    </button>
                    <button className="btn-secondary">
                        {t.landing.ctaLogin}
                    </button>
                </div>
            </section>

            <section className="landing-features">
                <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h3>{t.landing.features.visual}</h3>
                    <p>{t.landing.features.visualDesc}</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <h3>{t.landing.features.smart}</h3>
                    <p>{t.landing.features.smartDesc}</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🏢</div>
                    <h3>{t.landing.features.multi}</h3>
                    <p>{t.landing.features.multiDesc}</p>
                </div>
            </section>
        </div>
    );
}

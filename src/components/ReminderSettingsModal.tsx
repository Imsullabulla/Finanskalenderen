'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { obligations as allObligations, frequencyLabels } from '@/data/obligations';
import type { ReminderSettings } from '@/types/reminder';
import styles from './ReminderSettingsModal.module.css';

const CATEGORY_LABELS: Record<string, string> = {
    skat: 'Skat', miljø: 'Miljø', eu: 'EU',
    afgifter: 'Afgifter', hr: 'HR', regnskab: 'Regnskab',
};

const DAY_OPTIONS = [1, 3, 7, 14];

const REMINDABLE = allObligations.filter(
    o => o.frequency !== 'ad-hoc' && o.frequency !== 'ongoing'
);

interface Props { onClose: () => void; }

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function ReminderSettingsModal({ onClose }: Props) {
    const [loading, setLoading]       = useState(true);
    const [enabled, setEnabled]       = useState(true);
    const [email, setEmail]           = useState('');
    const [days, setDays]             = useState<Set<number>>(new Set([7, 3, 1]));
    const [allMode, setAllMode]       = useState(true);   // true = all obligations
    const [selected, setSelected]     = useState<Set<string>>(new Set(REMINDABLE.map(o => o.id)));
    const [saveState, setSaveState]   = useState<SaveState>('idle');

    // Load existing settings
    useEffect(() => {
        fetch('/api/reminder-settings')
            .then(r => r.json())
            .then((s: ReminderSettings | null) => {
                if (s) {
                    setEnabled(s.enabled);
                    setEmail(s.email);
                    setDays(new Set(s.days));
                    if (s.obligationIds) {
                        setAllMode(false);
                        setSelected(new Set(s.obligationIds));
                    } else {
                        setAllMode(true);
                        setSelected(new Set(REMINDABLE.map(o => o.id)));
                    }
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Close on Escape
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    const grouped = useMemo(() => {
        const g: Record<string, typeof REMINDABLE> = {};
        REMINDABLE.forEach(o => { (g[o.category] ??= []).push(o); });
        return g;
    }, []);

    const toggleDay = useCallback((d: number) => {
        setDays(prev => {
            const next = new Set(prev);
            if (next.has(d)) next.delete(d); else next.add(d);
            return next;
        });
    }, []);

    const toggleObligation = useCallback((id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const allSelected = selected.size === REMINDABLE.length;
    const toggleAll = useCallback(() => {
        setSelected(allSelected ? new Set() : new Set(REMINDABLE.map(o => o.id)));
    }, [allSelected]);

    const handleSave = useCallback(async () => {
        if (!email.includes('@') || days.size === 0) return;
        setSaveState('saving');
        const body: ReminderSettings = {
            email,
            days: Array.from(days),
            obligationIds: allMode ? null : Array.from(selected),
            enabled,
        };
        try {
            const res = await fetch('/api/reminder-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            setSaveState(res.ok ? 'saved' : 'error');
            if (res.ok) setTimeout(() => setSaveState('idle'), 2500);
        } catch {
            setSaveState('error');
        }
    }, [email, days, allMode, selected, enabled]);

    const canSave = email.includes('@') && days.size > 0 && (allMode || selected.size > 0);

    return (
        <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal} role="dialog" aria-modal="true">

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerIcon}>🔔</div>
                    <h2 className={styles.title}>E-mail påmindelser</h2>
                    <button className={styles.closeBtn} onClick={onClose} title="Luk">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loadingState}>Indlæser indstillinger…</div>
                ) : (
                    <>
                        <div className={styles.body}>

                            {/* Left: obligation selection */}
                            <div className={styles.obligationsPanel}>
                                <div className={styles.panelHeader}>
                                    <span className={styles.panelLabel}>Pligter</span>
                                    {!allMode && (
                                        <div className={styles.selectControls}>
                                            <button className={styles.selectLink} onClick={toggleAll}>
                                                {allSelected ? 'Fravælg alle' : 'Vælg alle'}
                                            </button>
                                            <span className={styles.selectedBadge}>
                                                {selected.size}/{REMINDABLE.length}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* All / Specific toggle */}
                                <div className={styles.modeToggle}>
                                    <label className={`${styles.modeOption} ${allMode ? styles.modeActive : ''}`}>
                                        <input type="radio" name="mode" checked={allMode} onChange={() => setAllMode(true)} className={styles.radio} />
                                        <span>Alle pligter</span>
                                    </label>
                                    <label className={`${styles.modeOption} ${!allMode ? styles.modeActive : ''}`}>
                                        <input type="radio" name="mode" checked={!allMode} onChange={() => setAllMode(false)} className={styles.radio} />
                                        <span>Bestemte pligter</span>
                                    </label>
                                </div>

                                {!allMode && (
                                    <div className={styles.obligationsList}>
                                        {Object.entries(grouped).map(([cat, items]) => (
                                            <div key={cat} className={styles.group}>
                                                <div className={styles.groupLabel}>{CATEGORY_LABELS[cat] ?? cat}</div>
                                                {items.map(o => (
                                                    <label key={o.id} className={styles.checkRow}>
                                                        <input
                                                            type="checkbox"
                                                            className={styles.checkbox}
                                                            checked={selected.has(o.id)}
                                                            onChange={() => toggleObligation(o.id)}
                                                        />
                                                        <span className={styles.obligationName}>{o.name.da}</span>
                                                        <span className={styles.freqPill}>{frequencyLabels[o.frequency]?.da ?? o.frequency}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right: settings */}
                            <div className={styles.settingsPanel}>

                                {/* Enable toggle */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Status</label>
                                    <label className={styles.toggleRow}>
                                        <div className={`${styles.toggle} ${enabled ? styles.toggleOn : ''}`} onClick={() => setEnabled(p => !p)}>
                                            <div className={styles.toggleThumb} />
                                        </div>
                                        <span className={styles.toggleLabel}>
                                            {enabled ? 'Påmindelser aktiveret' : 'Påmindelser deaktiveret'}
                                        </span>
                                    </label>
                                </div>

                                {/* Email */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel} htmlFor="reminder-email">Din e-mailadresse</label>
                                    <input
                                        id="reminder-email"
                                        type="email"
                                        className={styles.emailInput}
                                        placeholder="din@email.dk"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        disabled={!enabled}
                                    />
                                </div>

                                {/* Reminder days */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Påmind mig</label>
                                    <div className={styles.dayGrid}>
                                        {DAY_OPTIONS.map(d => (
                                            <label key={d} className={`${styles.dayChip} ${days.has(d) ? styles.dayChipActive : ''} ${!enabled ? styles.dayChipDisabled : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={days.has(d)}
                                                    onChange={() => toggleDay(d)}
                                                    disabled={!enabled}
                                                    className={styles.hiddenCheck}
                                                />
                                                {d === 1 ? '1 dag før' : `${d} dage før`}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.infoNote}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                                    </svg>
                                    Påmindelser sendes kl. 8 om morgenen. Kræver at Vercel KV er konfigureret.
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={styles.footer}>
                            <button className={styles.cancelBtn} onClick={onClose}>Annuller</button>
                            <button
                                className={`${styles.saveBtn} ${saveState === 'saved' ? styles.saveBtnSaved : ''} ${saveState === 'error' ? styles.saveBtnError : ''}`}
                                onClick={handleSave}
                                disabled={!canSave || saveState === 'saving'}
                            >
                                {saveState === 'saving' ? 'Gemmer…'
                                    : saveState === 'saved' ? '✓ Gemt'
                                    : saveState === 'error' ? 'Fejl – prøv igen'
                                    : 'Gem indstillinger'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

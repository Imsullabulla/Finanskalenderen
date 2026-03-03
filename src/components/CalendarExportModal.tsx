'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';
import { obligations as allObligations, frequencyLabels } from '@/data/obligations';
import { calculateAllDeadlines } from '@/utils/deadlineEngine';
import { generateBulkICS, downloadICS, ExportDuration, BulkExportObligation } from '@/utils/calendarExport';
import styles from './CalendarExportModal.module.css';

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  skat:     { da: 'Skat',     en: 'Tax' },
  miljø:    { da: 'Miljø',    en: 'Environment' },
  eu:       { da: 'EU',       en: 'EU' },
  afgifter: { da: 'Afgifter', en: 'Duties' },
  hr:       { da: 'HR',       en: 'HR' },
  regnskab: { da: 'Regnskab', en: 'Accounting' },
};

const DURATION_HORIZONS: Record<ExportDuration, number> = {
  '1year':   12,
  '2years':  24,
  '3years':  36,
  'ongoing': 4, // only need next occurrence for ongoing/RRULE
};

interface Props {
  onClose: () => void;
}

export default function CalendarExportModal({ onClose }: Props) {
  const { lang } = useI18n();
  const { obligationStates, fiscalYearOverrides } = useApp();

  const activeObligations = useMemo(
    () => allObligations.filter(o => obligationStates.get(o.id)?.active ?? true),
    [obligationStates],
  );

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(activeObligations.map(o => o.id)),
  );
  const [duration, setDuration] = useState<ExportDuration>('ongoing');

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const allSelected = selected.size === activeObligations.length;
  const noneSelected = selected.size === 0;

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(activeObligations.map(o => o.id)));
  }, [allSelected, activeObligations]);

  const toggleOne = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof activeObligations> = {};
    activeObligations.forEach(o => {
      if (!groups[o.category]) groups[o.category] = [];
      groups[o.category].push(o);
    });
    return groups;
  }, [activeObligations]);

  const handleExport = useCallback(() => {
    const now = new Date();
    const horizonMonths = DURATION_HORIZONS[duration];

    const exportData: BulkExportObligation[] = activeObligations
      .filter(o => selected.has(o.id))
      .map(o => {
        const fiscalYear = fiscalYearOverrides.get(o.id) || 12;
        const allDeadlines = calculateAllDeadlines(o, now, horizonMonths, fiscalYear);
        const nextDeadline = allDeadlines.find(d => d >= now) ?? allDeadlines[allDeadlines.length - 1] ?? null;
        return {
          id: o.id,
          name: o.name[lang] || o.name.da,
          description: o.description[lang] || o.description.da,
          frequency: o.frequency,
          nextDeadline,
          allDeadlines,
        };
      });

    const ics = generateBulkICS(exportData, duration);
    downloadICS(ics, 'finanskalenderen-compliance');
    onClose();
  }, [activeObligations, selected, duration, lang, fiscalYearOverrides, onClose]);

  const da = lang === 'da';

  const durations: { value: ExportDuration; label: string; hint?: string }[] = [
    { value: '1year',   label: da ? '1 år'  : '1 year' },
    { value: '2years',  label: da ? '2 år'  : '2 years' },
    { value: '3years',  label: da ? '3 år'  : '3 years' },
    {
      value: 'ongoing',
      label: da ? 'Løbende' : 'Ongoing',
      hint:  da ? 'Gentager automatisk via kalenderregel (RRULE)' : 'Repeats automatically via calendar rule (RRULE)',
    },
  ];

  return (
    <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>📅</div>
          <h2 className={styles.title}>
            {da ? 'Eksportér til kalender' : 'Export to Calendar'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} title={da ? 'Luk' : 'Close'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>

          {/* Left: Obligation list */}
          <div className={styles.obligationsPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>
                {da ? 'Pligter' : 'Obligations'}
              </span>
              <div className={styles.selectControls}>
                <button className={styles.selectLink} onClick={toggleAll}>
                  {allSelected
                    ? (da ? 'Fravælg alle' : 'Deselect all')
                    : (da ? 'Vælg alle' : 'Select all')}
                </button>
                <span className={styles.selectedBadge}>
                  {selected.size}/{activeObligations.length}
                </span>
              </div>
            </div>

            <div className={styles.obligationsList}>
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} className={styles.group}>
                  <div className={styles.groupLabel}>
                    {CATEGORY_LABELS[cat]?.[lang] || cat}
                  </div>
                  {items.map(o => {
                    const freqLabel = frequencyLabels[o.frequency]?.[lang] || o.frequency;
                    return (
                      <label key={o.id} className={styles.checkRow}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={selected.has(o.id)}
                          onChange={() => toggleOne(o.id)}
                        />
                        <span className={styles.obligationName}>
                          {o.name[lang] || o.name.da}
                        </span>
                        <span className={styles.freqPill}>{freqLabel}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Settings */}
          <div className={styles.settingsPanel}>
            <div className={styles.panelLabel}>
              {da ? 'Eksportperiode' : 'Export period'}
            </div>

            <div className={styles.durationList}>
              {durations.map(d => (
                <label
                  key={d.value}
                  className={`${styles.durationOption} ${duration === d.value ? styles.durationActive : ''}`}
                >
                  <input
                    type="radio"
                    name="duration"
                    className={styles.radio}
                    value={d.value}
                    checked={duration === d.value}
                    onChange={() => setDuration(d.value)}
                  />
                  <span className={styles.durationLabel}>{d.label}</span>
                  {d.value === 'ongoing' && (
                    <span className={styles.recurringTag}>
                      {da ? '↻ gentager' : '↻ recurring'}
                    </span>
                  )}
                  {d.hint && duration === d.value && (
                    <span className={styles.durationHint}>{d.hint}</span>
                  )}
                </label>
              ))}
            </div>

            <div className={styles.compatNote}>
              <span className={styles.compatIcon}>
                {/* Google */}
                <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Google Calendar">
                  <rect x="3" y="3" width="18" height="18" rx="2" fill="#4285F4"/>
                  <rect x="3" y="9" width="18" height="9" rx="0" fill="#fff"/>
                  <rect x="9" y="3" width="6" height="6" fill="#fff"/>
                  <text x="12" y="17" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#4285F4">G</text>
                </svg>
              </span>
              <span className={styles.compatIcon}>
                {/* Outlook */}
                <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Outlook">
                  <rect width="24" height="24" rx="2" fill="#0078D4"/>
                  <text x="12" y="17" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">O</text>
                </svg>
              </span>
              <span className={styles.compatIcon}>
                {/* Apple */}
                <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Apple Calendar">
                  <rect width="24" height="24" rx="2" fill="#FF3B30"/>
                  <text x="12" y="17" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">A</text>
                </svg>
              </span>
              <span className={styles.compatText}>
                {da
                  ? 'Download .ics – importér i Google Calendar, Outlook eller Apple Calendar'
                  : 'Download .ics – import into Google Calendar, Outlook, or Apple Calendar'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            {da ? 'Annuller' : 'Cancel'}
          </button>
          <button
            className={styles.exportBtn}
            onClick={handleExport}
            disabled={noneSelected}
          >
            📅 {da
              ? `Download kalender (${selected.size} ${selected.size === 1 ? 'pligt' : 'pligter'})`
              : `Download calendar (${selected.size} ${selected.size === 1 ? 'obligation' : 'obligations'})`}
          </button>
        </div>

      </div>
    </div>
  );
}

'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';
import { obligations as allObligations, frequencyLabels } from '@/data/obligations';
import { calculateAllDeadlines } from '@/utils/deadlineEngine';
import { generateBulkICS, downloadICS, ExportDuration, BulkExportObligation } from '@/utils/calendarExport';
import styles from './CalendarExportModal.module.css';

function formatExportDate(d: Date, lang: string): string {
  return d.toLocaleDateString(lang === 'da' ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  skat:     { da: 'Skat',     en: 'Tax' },
  miljø:    { da: 'Miljø',    en: 'Environment' },
  eu:       { da: 'EU',       en: 'EU' },
  afgifter: { da: 'Afgifter', en: 'Duties' },
  hr:       { da: 'HR',       en: 'HR' },
  regnskab: { da: 'Regnskab', en: 'Accounting' },
};

const DURATION_HORIZONS: Record<ExportDuration, number> = {
  '1year':  12,
  '2years': 24,
  '3years': 36,
  '5years': 60,
};

interface Props {
  onClose: () => void;
}

export default function CalendarExportModal({ onClose }: Props) {
  const { lang } = useI18n();
  const { obligationStates, fiscalYearOverrides } = useApp();

  const activeObligations = useMemo(
    () => allObligations.filter(o => (obligationStates.get(o.id)?.active ?? true) && o.frequency !== 'ad-hoc'),
    [obligationStates],
  );

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(activeObligations.map(o => o.id)),
  );
  const [duration, setDuration] = useState<ExportDuration>('2years');
  const [step, setStep] = useState<'select' | 'preview'>('select');
  const [previewData, setPreviewData] = useState<BulkExportObligation[]>([]);

  // Close on Escape; Escape in preview goes back to select
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step === 'preview') setStep('select');
        else onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, step]);

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

  const computeExportData = useCallback((): BulkExportObligation[] => {
    const now = new Date();
    const horizonMonths = DURATION_HORIZONS[duration];
    return activeObligations
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
  }, [activeObligations, selected, duration, lang, fiscalYearOverrides]);

  const handlePreview = useCallback(() => {
    setPreviewData(computeExportData());
    setStep('preview');
  }, [computeExportData]);

  const handleExport = useCallback(() => {
    const ics = generateBulkICS(previewData, duration);
    downloadICS(ics, 'finanskalenderen-compliance');
    onClose();
  }, [previewData, duration, onClose]);

  const da = lang === 'da';

  const durations: { value: ExportDuration; label: string }[] = [
    { value: '1year',  label: da ? '1 år' : '1 year' },
    { value: '2years', label: da ? '2 år' : '2 years' },
    { value: '3years', label: da ? '3 år' : '3 years' },
    { value: '5years', label: da ? '5 år' : '5 years' },
  ];

  const durationLabel = durations.find(d => d.value === duration)?.label ?? duration;

  const totalEvents = previewData.reduce((sum, o) => sum + o.allDeadlines.length, 0);

  return (
    <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>📅</div>
          <h2 className={styles.title}>
            {step === 'preview'
              ? (da ? 'Forhåndsvisning' : 'Preview')
              : (da ? 'Eksportér til kalender' : 'Export to Calendar')}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} title={da ? 'Luk' : 'Close'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {step === 'select' ? (
          <>
            {/* ── Select Body ── */}
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
                    </label>
                  ))}
                </div>

                <div className={styles.compatNote}>
                  <span className={styles.compatIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Google Calendar">
                      <rect x="3" y="3" width="18" height="18" rx="2" fill="#4285F4"/>
                      <rect x="3" y="9" width="18" height="9" rx="0" fill="#fff"/>
                      <rect x="9" y="3" width="6" height="6" fill="#fff"/>
                      <text x="12" y="17" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#4285F4">G</text>
                    </svg>
                  </span>
                  <span className={styles.compatIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Outlook">
                      <rect width="24" height="24" rx="2" fill="#0078D4"/>
                      <text x="12" y="17" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">O</text>
                    </svg>
                  </span>
                  <span className={styles.compatIcon}>
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

            {/* ── Select Footer ── */}
            <div className={styles.footer}>
              <button className={styles.cancelBtn} onClick={onClose}>
                {da ? 'Annuller' : 'Cancel'}
              </button>
              <button
                className={styles.exportBtn}
                onClick={handlePreview}
                disabled={noneSelected}
              >
                {da
                  ? `Forhåndsvis (${selected.size} ${selected.size === 1 ? 'pligt' : 'pligter'}) →`
                  : `Preview (${selected.size} ${selected.size === 1 ? 'obligation' : 'obligations'}) →`}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ── Preview Body ── */}
            <div className={styles.previewBody}>
              <div className={styles.previewSummary}>
                <span>{previewData.length} {da ? (previewData.length === 1 ? 'forpligtelse' : 'forpligtelser') : (previewData.length === 1 ? 'obligation' : 'obligations')}</span>
                <span className={styles.previewSumDot}>·</span>
                <span>{totalEvents} {da ? (totalEvents === 1 ? 'begivenhed' : 'begivenheder') : (totalEvents === 1 ? 'event' : 'events')}</span>
                <span className={styles.previewSumDot}>·</span>
                <span>{durationLabel}</span>
              </div>

              <div className={styles.previewList}>
                {previewData.map(o => (
                  <div key={o.id} className={styles.previewItem}>
                    <div className={styles.previewItemHeader}>
                      <span className={styles.previewItemName}>{o.name}</span>
                      <span className={styles.countPill}>{o.allDeadlines.length}</span>
                    </div>
                    <div className={styles.previewDates}>
                      {o.allDeadlines.map(d => (
                        <span key={d.getTime()} className={styles.dateChip}>{formatExportDate(d, lang)}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Preview Footer ── */}
            <div className={styles.footer}>
              <button className={styles.backBtn} onClick={() => setStep('select')}>
                ← {da ? 'Tilbage' : 'Back'}
              </button>
              <button className={styles.exportBtn} onClick={handleExport}>
                📅 {da ? 'Eksporter til kalender' : 'Export to calendar'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

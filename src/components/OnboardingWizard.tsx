'use client';
import React, { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp, CompanySetup } from '@/context/AppContext';
import styles from './OnboardingWizard.module.css';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const EMPLOYEE_OPTIONS = [
  { value: 1,    label: '1–9' },
  { value: 10,   label: '10–49' },
  { value: 50,   label: '50–249' },
  { value: 250,  label: '250+' },
];

const REVENUE_OPTIONS = [
  { value: 0,          label: '< 5 mio. DKK' },
  { value: 5_000_000,  label: '5–40 mio. DKK' },
  { value: 40_000_000, label: '40–250 mio. DKK' },
  { value: 250_000_000,label: '> 250 mio. DKK' },
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { lang, setLang, t } = useI18n();
  const { setCurrentSetup, setOnboardingCompleted } = useApp();

  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [employees, setEmployees] = useState<number>(1);
  const [revenue, setRevenue]     = useState<number>(0);
  const [hasImport, setHasImport]         = useState(false);
  const [hasExport, setHasExport]         = useState(false);
  const [hasProduction, setHasProduction] = useState(false);

  const steps = [
    lang === 'da' ? 'Virksomhedsinfo' : 'Company Info',
    lang === 'da' ? 'Størrelse'       : 'Size',
    lang === 'da' ? 'Aktiviteter'     : 'Activities',
  ];

  const canNext = step === 0 ? companyName.trim().length > 0 : true;

  function handleNext() {
    if (step < 2) {
      setStep(s => s + 1);
    } else {
      const setup: CompanySetup = {
        id: `setup-${Date.now()}`,
        name: companyName.trim(),
        employees,
        revenue,
        hasImport,
        hasExport,
        hasProduction,
      };
      setCurrentSetup(setup);
      setOnboardingCompleted(true);
      onComplete();
    }
  }

  function handleSkip() {
    setOnboardingCompleted(true);
    onComplete();
  }

  const isLast = step === 2;

  return (
    <div className={styles.overlay}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>F</div>
          <span className={styles.logoText}>Finanskalenderen</span>
        </div>
        <div className={styles.topBarRight}>
          <div className={styles.langSwitcher}>
            <button
              className={`${styles.langBtn} ${lang === 'da' ? styles.active : ''}`}
              onClick={() => setLang('da')}
            >DA</button>
            <button
              className={`${styles.langBtn} ${lang === 'en' ? styles.active : ''}`}
              onClick={() => setLang('en')}
            >EN</button>
          </div>
          <button className={styles.skipBtn} onClick={handleSkip}>
            {lang === 'da' ? 'Spring over' : 'Skip'}
          </button>
        </div>
      </div>

      {/* Wizard card */}
      <div className={styles.card} key={step}>
        {/* Progress */}
        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>
            {lang === 'da' ? `Trin ${step + 1} af ${steps.length}` : `Step ${step + 1} of ${steps.length}`}
          </div>
          <div className={styles.progressDots}>
            {steps.map((_, i) => (
              <div
                key={i}
                className={`${styles.dot} ${i < step ? styles.dotCompleted : ''} ${i === step ? styles.dotActive : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Step header */}
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>{step + 1}</div>
          <div className={styles.stepTitle}>{steps[step]}</div>
        </div>

        {/* Step 0: Company name + language */}
        {step === 0 && (
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>
                {lang === 'da' ? 'Virksomhedsnavn' : 'Company name'}
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder={lang === 'da' ? 'Eks. Andersen & Co ApS' : 'E.g. Andersen & Co ApS'}
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && canNext) handleNext(); }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Employees + Revenue */}
        {step === 1 && (
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>
                {lang === 'da' ? 'Antal ansatte' : 'Number of employees'}
              </label>
              <select
                className={styles.select}
                value={employees}
                onChange={e => setEmployees(Number(e.target.value))}
              >
                {EMPLOYEE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                {lang === 'da' ? 'Årlig omsætning (DKK)' : 'Annual revenue (DKK)'}
              </label>
              <select
                className={styles.select}
                value={revenue}
                onChange={e => setRevenue(Number(e.target.value))}
              >
                {REVENUE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Activities */}
        {step === 2 && (
          <>
            <div className={styles.checkboxGroup}>
              {[
                {
                  key: 'import',
                  checked: hasImport,
                  toggle: () => setHasImport(v => !v),
                  label: lang === 'da' ? 'Vi importerer varer fra udlandet' : 'We import goods from abroad',
                },
                {
                  key: 'export',
                  checked: hasExport,
                  toggle: () => setHasExport(v => !v),
                  label: lang === 'da' ? 'Vi eksporterer varer' : 'We export goods',
                },
                {
                  key: 'production',
                  checked: hasProduction,
                  toggle: () => setHasProduction(v => !v),
                  label: lang === 'da'
                    ? 'Vi producerer emballage, elektronik eller tobak'
                    : 'We produce packaging, electronics or tobacco',
                },
              ].map(item => (
                <button
                  key={item.key}
                  className={`${styles.checkboxItem} ${item.checked ? styles.checkboxChecked : ''}`}
                  onClick={item.toggle}
                  type="button"
                >
                  <span className={styles.checkboxBox}>
                    {item.checked && <span className={styles.checkboxCheck}>✓</span>}
                  </span>
                  <span className={styles.checkboxLabel}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Preview badge */}
            <div className={styles.preview}>
              <span className={styles.previewIcon}>📋</span>
              <span className={styles.previewText}>
                {lang === 'da'
                  ? `Dit overblik er klar – vi aktiverer pligter baseret på dine valg`
                  : `Your overview is ready – we'll activate obligations based on your choices`}
              </span>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className={styles.navRow}>
          {step > 0 && (
            <button className={styles.btnBack} onClick={() => setStep(s => s - 1)}>
              {lang === 'da' ? 'Tilbage' : 'Back'}
            </button>
          )}
          <button
            className={styles.btnNext}
            onClick={handleNext}
            disabled={!canNext}
          >
            {isLast
              ? (lang === 'da' ? 'Generér mit overblik →' : 'Generate my overview →')
              : (lang === 'da' ? 'Næste' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
}

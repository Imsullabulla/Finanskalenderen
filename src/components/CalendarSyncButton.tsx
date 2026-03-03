'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { generateICS, downloadICS, getGoogleCalendarUrl, getOutlookCalendarUrl } from '@/utils/calendarExport';
import styles from './CalendarSyncButton.module.css';

interface CalendarSyncButtonProps {
  name: string;
  description: string;
  deadlineDate: Date | null;
  url?: string;
}

export default function CalendarSyncButton({ name, description, deadlineDate, url }: CalendarSyncButtonProps) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  const disabled = !deadlineDate;
  const label = lang === 'da' ? 'Tilføj til kalender' : 'Add to calendar';

  function handleGoogle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!deadlineDate) return;
    window.open(getGoogleCalendarUrl({ name, description, deadlineDate }), '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  function handleOutlook(e: React.MouseEvent) {
    e.stopPropagation();
    if (!deadlineDate) return;
    window.open(getOutlookCalendarUrl({ name, description, deadlineDate }), '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  function handleApple(e: React.MouseEvent) {
    e.stopPropagation();
    if (!deadlineDate) return;
    const ics = generateICS({ name, description, deadlineDate, url });
    const filename = name.replace(/\s+/g, '-').toLowerCase();
    downloadICS(ics, filename);
    setOpen(false);
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={styles.trigger}
        disabled={disabled}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        title={disabled ? (lang === 'da' ? 'Ingen deadline' : 'No deadline') : label}
      >
        <span className={styles.icon}>📅</span>
        {label}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <button className={styles.dropdownItem} onClick={handleGoogle}>
            <span className={styles.icon}>🗓️</span>
            Google Calendar
          </button>
          <button className={styles.dropdownItem} onClick={handleOutlook}>
            <span className={styles.icon}>📆</span>
            Outlook
          </button>
          <button className={styles.dropdownItem} onClick={handleApple}>
            <span className={styles.icon}>🍎</span>
            {lang === 'da' ? 'Apple / iCal (download)' : 'Apple / iCal (download)'}
          </button>
        </div>
      )}
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { requestNotificationPermission, getPermissionStatus } from '@/utils/notificationService';

export default function NotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setPermission(getPermissionStatus());
  }, []);

  async function handleRequest() {
    const result = await requestNotificationPermission();
    setPermission(result);
  }

  if (permission === 'unsupported') return null;

  if (permission === 'granted') {
    return (
      <span style={{
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'var(--color-safe)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        🔔 Påmindelser aktive
      </span>
    );
  }

  if (permission === 'denied') {
    return (
      <span style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}>
        🔕 Notifikationer blokeret
      </span>
    );
  }

  return (
    <button
      onClick={handleRequest}
      style={{
        background: 'none',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-full)',
        padding: '5px 12px',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all var(--transition-fast)',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--forest-900)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
      }}
    >
      🔔 Aktiver påmindelser
    </button>
  );
}

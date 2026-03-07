'use client';
import React from 'react';
import { I18nProvider } from '@/i18n/I18nContext';
import { AppProvider, useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import FloorGrid from '@/components/FloorGrid';

function AppShell() {
  const { sidebarCollapsed, toggleSidebar } = useApp();

  return (
    <>
      <Header />
      <div className="app-layout">
        <Sidebar />
        <div className="sidebar-spacer" />
        {sidebarCollapsed && (
          <button className="sidebar-show-btn" onClick={toggleSidebar}>
            ☰ Vis sidemenu
          </button>
        )}
        <FloorGrid />
      </div>
    </>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </I18nProvider>
  );
}

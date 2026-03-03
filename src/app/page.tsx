'use client';
import React from 'react';
import { I18nProvider } from '@/i18n/I18nContext';
import { AppProvider, useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import FloorGrid from '@/components/FloorGrid';
import OnboardingWizard from '@/components/OnboardingWizard';

function AppShell() {
  const { onboardingCompleted, setOnboardingCompleted, sidebarCollapsed, toggleSidebar } = useApp();

  if (!onboardingCompleted) {
    return (
      <OnboardingWizard onComplete={() => setOnboardingCompleted(true)} />
    );
  }

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

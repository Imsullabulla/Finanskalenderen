'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { obligations as allObligations, Obligation, Category } from '@/data/obligations';
import { getDeadlineInfo, DeadlineInfo, sortByPriority, UrgencyLevel } from '@/utils/deadlineEngine';
import { useI18n } from '@/i18n/I18nContext';

export type ViewMode = 'normal' | 'calendar' | 'list';

export interface ObligationState {
    id: string;
    active: boolean;
    reported: boolean;
}

export interface CompanySetup {
    id: string;
    name: string;
    employees: number;
    revenue: number;
    hasImport: boolean;
    hasExport: boolean;
    hasProduction: boolean;
}

interface AppContextType {
    // Obligations
    obligationStates: Map<string, ObligationState>;
    toggleObligation: (id: string) => void;
    markReported: (id: string) => void;
    unmarkReported: (id: string) => void;
    getActiveObligations: () => (Obligation & { deadlineInfo: DeadlineInfo; state: ObligationState })[];
    allObligationsActive: boolean;
    toggleAllObligations: () => void;

    // Filters
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    activeCategory: Category | 'all';
    setActiveCategory: (c: Category | 'all') => void;
    viewMode: ViewMode;
    setViewMode: (v: ViewMode) => void;

    // Setup
    currentSetup: CompanySetup | null;
    setCurrentSetup: (s: CompanySetup) => void;

    // Onboarding
    onboardingCompleted: boolean;
    setOnboardingCompleted: (v: boolean) => void;

    // Fiscal year overrides (per obligation)
    fiscalYearOverrides: Map<string, number>;
    setFiscalYearOverride: (obligationId: string, month: number) => void;
    clearFiscalYearOverride: (obligationId: string) => void;

    // Compliance score
    complianceScore: {
        total: number;
        reported: number;
        pending: number;
        overdue: number;
        inactive: number;
        percentage: number;
    };

    // Sidebar collapsed
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;

    // Scroll to obligation on the floor
    scrollToObligation: (id: string) => void;
    scrollTargetId: string | null;
    clearScrollTarget: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function mapToObj<V>(map: Map<string, V>): Record<string, V> {
    const obj: Record<string, V> = {};
    map.forEach((v, k) => { obj[k] = v; });
    return obj;
}

function objToMap<V>(obj: Record<string, V>): Map<string, V> {
    return new Map(Object.entries(obj));
}

// Determine whether an obligation matches a given company setup's trigger rules
function matchesTriggerRules(ob: Obligation, setup: CompanySetup): boolean {
    const rules = ob.triggerRules;
    if (!rules) return true;
    if (rules.minEmployees !== undefined && setup.employees < rules.minEmployees) return false;
    if (rules.minRevenue    !== undefined && setup.revenue    < rules.minRevenue)  return false;
    if (rules.requiresImport     && !setup.hasImport)     return false;
    if (rules.requiresExport     && !setup.hasExport)     return false;
    if (rules.requiresProduction && !setup.hasProduction) return false;
    return true;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const { lang } = useI18n();

    // Load persisted obligation states or initialise all as active
    const [obligationStates, setObligationStates] = useState<Map<string, ObligationState>>(() => {
        const stored = loadFromStorage<Record<string, ObligationState>>('fk_obligationStates', {});
        const map = new Map<string, ObligationState>();
        allObligations.forEach(o => {
            map.set(o.id, stored[o.id] ?? { id: o.id, active: true, reported: false });
        });
        return map;
    });

    const [now, setNow] = useState(() => new Date());

    // Refresh at midnight so deadlines roll over automatically
    useEffect(() => {
        const scheduleNextRefresh = () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const msUntilMidnight = tomorrow.getTime() - Date.now();
            return setTimeout(() => {
                setNow(new Date());
                // Schedule the next day's refresh
                scheduleNextRefresh();
            }, msUntilMidnight);
        };
        const timer = scheduleNextRefresh();
        return () => clearTimeout(timer);
    }, []);

    const [searchQuery, setSearchQuery]     = useState('');
    const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
    const [viewMode, setViewMode]           = useState<ViewMode>('normal');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [scrollTargetId, setScrollTargetId]     = useState<string | null>(null);

    const [currentSetup, _setCurrentSetup] = useState<CompanySetup | null>(() =>
        loadFromStorage<CompanySetup | null>('fk_currentSetup', null)
    );

    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() =>
        loadFromStorage<boolean>('fk_onboardingCompleted', false)
    );

    const [fiscalYearOverrides, setFiscalYearOverrides] = useState<Map<string, number>>(() => {
        const stored = loadFromStorage<Record<string, number>>('fk_fiscalYearOverrides', {});
        return objToMap(stored);
    });

    // ── Persist to localStorage ─────────────────────────────────────────────

    useEffect(() => {
        localStorage.setItem('fk_obligationStates', JSON.stringify(mapToObj(obligationStates)));
    }, [obligationStates]);

    useEffect(() => {
        localStorage.setItem('fk_currentSetup', JSON.stringify(currentSetup));
    }, [currentSetup]);

    useEffect(() => {
        localStorage.setItem('fk_onboardingCompleted', JSON.stringify(onboardingCompleted));
    }, [onboardingCompleted]);

    useEffect(() => {
        localStorage.setItem('fk_fiscalYearOverrides', JSON.stringify(mapToObj(fiscalYearOverrides)));
    }, [fiscalYearOverrides]);

    // ── setCurrentSetup: apply trigger-rule filtering ───────────────────────

    const setCurrentSetup = useCallback((setup: CompanySetup) => {
        _setCurrentSetup(setup);
        setObligationStates(prev => {
            const next = new Map(prev);
            allObligations.forEach(o => {
                const current = next.get(o.id) ?? { id: o.id, active: true, reported: false };
                const shouldBeActive = matchesTriggerRules(o, setup);
                next.set(o.id, { ...current, active: shouldBeActive });
            });
            return next;
        });
    }, []);

    // ── Obligation mutations ────────────────────────────────────────────────

    const toggleObligation = useCallback((id: string) => {
        setObligationStates(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(id);
            if (current) newMap.set(id, { ...current, active: !current.active });
            return newMap;
        });
    }, []);

    const markReported = useCallback((id: string) => {
        setObligationStates(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(id);
            if (current) newMap.set(id, { ...current, reported: true });
            return newMap;
        });
    }, []);

    const unmarkReported = useCallback((id: string) => {
        setObligationStates(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(id);
            if (current) newMap.set(id, { ...current, reported: false });
            return newMap;
        });
    }, []);

    // True only when every obligation is active
    const allObligationsActive = useMemo(
        () => Array.from(obligationStates.values()).every(s => s.active),
        [obligationStates],
    );

    const toggleAllObligations = useCallback(() => {
        setObligationStates(prev => {
            const shouldActivate = !Array.from(prev.values()).every(s => s.active);
            const next = new Map(prev);
            next.forEach((state, id) => next.set(id, { ...state, active: shouldActivate }));
            return next;
        });
    }, []);

    // ── Fiscal year overrides ───────────────────────────────────────────────

    const setFiscalYearOverride = useCallback((obligationId: string, month: number) => {
        setFiscalYearOverrides(prev => {
            const next = new Map(prev);
            next.set(obligationId, month);
            return next;
        });
    }, []);

    const clearFiscalYearOverride = useCallback((obligationId: string) => {
        setFiscalYearOverrides(prev => {
            const next = new Map(prev);
            next.delete(obligationId);
            return next;
        });
    }, []);

    // ── Sidebar & scroll ────────────────────────────────────────────────────

    const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);

    const scrollToObligation = useCallback((id: string) => {
        setViewMode(prev => (prev === 'calendar' || prev === 'list') ? 'normal' : prev);
        setScrollTargetId(id);
    }, []);

    const clearScrollTarget = useCallback(() => setScrollTargetId(null), []);

    // ── Derived data ────────────────────────────────────────────────────────

    const getActiveObligations = useCallback(() => {
        return allObligations
            .map(o => {
                const state = obligationStates.get(o.id) || { id: o.id, active: true, reported: false };
                const fiscalYear = fiscalYearOverrides.get(o.id) || 12;
                const deadlineInfo = getDeadlineInfo(o, lang, now, fiscalYear);
                return { ...o, deadlineInfo, state };
            })
            .filter(o => o.state.active)
            .sort((a, b) => sortByPriority(a.deadlineInfo, b.deadlineInfo));
    }, [obligationStates, lang, fiscalYearOverrides, now]);

    const complianceScore = useMemo(() => {
        let total = 0, reported = 0, pending = 0, overdue = 0, inactive = 0;
        allObligations.forEach(o => {
            const state = obligationStates.get(o.id);
            if (!state || !state.active) { inactive++; return; }
            total++;
            if (state.reported) {
                reported++;
            } else {
                const fiscalYear = fiscalYearOverrides.get(o.id) || 12;
                const info = getDeadlineInfo(o, lang, now, fiscalYear);
                if (info.urgency === 'overdue') overdue++;
                else pending++;
            }
        });
        return {
            total, reported, pending, overdue, inactive,
            percentage: total > 0 ? Math.round(((total - overdue) / total) * 100) : 100,
        };
    }, [obligationStates, lang, fiscalYearOverrides, now]);

    return (
        <AppContext.Provider
            value={{
                obligationStates,
                toggleObligation,
                markReported,
                unmarkReported,
                getActiveObligations,
                allObligationsActive,
                toggleAllObligations,
                searchQuery,
                setSearchQuery,
                activeCategory,
                setActiveCategory,
                viewMode,
                setViewMode,
                currentSetup,
                setCurrentSetup,
                onboardingCompleted,
                setOnboardingCompleted,
                fiscalYearOverrides,
                setFiscalYearOverride,
                clearFiscalYearOverride,
                complianceScore,
                sidebarCollapsed,
                toggleSidebar,
                scrollToObligation,
                scrollTargetId,
                clearScrollTarget,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
};

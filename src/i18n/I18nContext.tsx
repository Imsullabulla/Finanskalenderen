'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import da from '@/i18n/da.json';
import en from '@/i18n/en.json';

type Translations = typeof da;
type Language = 'da' | 'en';

interface I18nContextType {
    lang: Language;
    t: Translations;
    setLang: (lang: Language) => void;
}

const translations: Record<Language, Translations> = { da, en };
const languageNames: Record<Language, string> = { da: 'Dansk', en: 'English' };

const I18nContext = createContext<I18nContextType>({
    lang: 'da',
    t: da,
    setLang: () => { },
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLangState] = useState<Language>('da');

    const setLang = useCallback((newLang: Language) => {
        setLangState(newLang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('fk-lang', newLang);
        }
    }, []);

    return (
        <I18nContext.Provider value={{ lang, t: translations[lang], setLang }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => useContext(I18nContext);
export { languageNames };
export type { Language };

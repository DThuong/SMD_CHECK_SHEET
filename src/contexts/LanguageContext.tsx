/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../lang/i18n/configs';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();

  // Dùng changeAppLanguage dùng chung: nạp đủ 14 namespace + lưu localStorage.
  const changeLanguage = async (lang: string) => {
    await changeAppLanguage(lang);
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        currentLanguage: i18n.language, 
        changeLanguage 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
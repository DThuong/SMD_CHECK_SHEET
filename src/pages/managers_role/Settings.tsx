import { useTheme } from '../../contexts/ThemeContext';
import { HiSun, HiMoon, HiGlobeAlt, HiCheckCircle } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' }
];

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation('settings');
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language || 'vi');

  // Lắng nghe thay đổi ngôn ngữ
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLang(lng);
      console.log('Language changed to:', lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const currentLanguage = languages.find(lang => lang.code === currentLang);

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === currentLang || isTranslating) return;
    
    setIsTranslating(true);
    console.log('Changing language to:', langCode);
    
    try {
      // Reload namespace trước khi đổi ngôn ngữ
      await i18n.reloadResources(langCode, ['settings', 'dashboard', 'logs']);
      
      // Đổi ngôn ngữ
      await i18n.changeLanguage(langCode);
      
      // Lưu vào localStorage
      localStorage.setItem('appLanguage', langCode);
      
      // Cập nhật state
      setCurrentLang(langCode);
      
      console.log('Language changed successfully to:', langCode);
      console.log('Current translation:', t('title'));
      
      setTimeout(() => {
        setIsTranslating(false);
      }, 500);
      
    } catch (error) {
      console.error('Error changing language:', error);
      setIsTranslating(false);
    }
  };

  return (
    <div className="max-w-7xl">
      {/* Loading Overlay */}
      {isTranslating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-800 dark:text-white font-medium">
              {t('languageSettings.translating')}
            </p>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        {t('title')}
      </h1>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              {t('themeSettings.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('themeSettings.description')}
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="relative inline-flex items-center h-12 w-24 rounded-full! bg-gray-300 dark:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <span
              className={`h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform flex items-center justify-center ${
                theme === 'dark' ? 'translate-x-12' : 'translate-x-1'
              }`}
            >
              {theme === 'light' ? (
                <HiSun className="w-6 h-6 text-yellow-500" />
              ) : (
                <HiMoon className="w-6 h-6 text-blue-500" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-4">
          {/* <HiGlobeAlt size={24} className="text-gray-800 dark:text-white" /> */}
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            {t('languageSettings.title')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {languages.map((lang) => {
            const isActive = currentLang === lang.code;
            
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isTranslating}
                className={`
                  relative p-5 rounded-xl border-2 transition-all duration-300
                  ${isActive
                    ? 'border-blue-500 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 shadow-lg'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
                  }
                  ${isTranslating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isActive && (
                  <div className="absolute -top-2 -right-2">
                    <HiCheckCircle className="w-8 h-8 text-blue-500 bg-white dark:bg-gray-800 rounded-full" />
                  </div>
                )}

                <div className="flex flex-col items-center gap-3">
                  <span className="text-5xl">{lang.flag}</span>
                  <div className="text-center">
                    <p className={`font-bold text-lg ${
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-800 dark:text-white'
                    }`}>
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {lang.name}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg">
          <div className="flex items-center gap-3">
            <HiGlobeAlt className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('languageSettings.currentLanguage')}
              </p>
              <p className="text-base font-bold text-gray-800 dark:text-white">
                {currentLanguage?.nativeName} {currentLanguage?.flag}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
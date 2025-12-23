import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { HiSun, HiMoon, HiGlobeAlt } from 'react-icons/hi';

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

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Cài đặt
      </h1>

      {/* Theme Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Chế độ sáng/tối
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Mô tả Theme
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

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Chế độ hiện tại: <span className="font-semibold capitalize">{theme}</span>
          </p>
        </div>
      </div>

      {/* Language Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center gap-1">
              <HiGlobeAlt size={30} />
              Ngôn ngữ
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Mô tả ngôn ngữ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`p-4 rounded-lg border-2 transition-all ${
                i18n.language === lang.code
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-800 dark:text-white">
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {lang.name}
                    </p>
                  </div>
                </div>
                {i18n.language === lang.code && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Ngôn ngữ hiện tại: <span className="font-semibold">{currentLanguage?.nativeName}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
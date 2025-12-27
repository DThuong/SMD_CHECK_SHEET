// src/pages/Settings/Settings.tsx
import { useTheme } from '../../contexts/ThemeContext';
import { HiSun, HiMoon, HiGlobeAlt, HiCheckCircle } from 'react-icons/hi';
import { useState} from 'react';

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
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('appLanguage') || 'vi';
  });
  const [isTranslating, setIsTranslating] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === currentLang);

  return (
    <div className="max-w-7xl">
      {/* Loading Overlay */}
      {isTranslating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-800 dark:text-white font-medium">
              Đang dịch nội dung...
            </p>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Cài đặt
      </h1>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Chế độ sáng/tối
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Chuyển đổi giữa chế độ sáng và tối
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="relative inline-flex items-center h-12 w-24 rounded-full bg-gray-300 dark:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
          <HiGlobeAlt size={24} className="text-gray-800 dark:text-white" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            Ngôn ngữ
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {languages.map((lang) => {
            const isActive = currentLang === lang.code;
            
            return (
              <button
                key={lang.code}
                onClick={() => {}}
                disabled={isTranslating}
                className={`
                  relative p-5 rounded-xl border-2 transition-all duration-300
                  ${isActive
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 shadow-lg'
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

        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg">
          <div className="flex items-center gap-3">
            <HiGlobeAlt className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ngôn ngữ hiện tại
              </p>
              <p className="text-base font-bold text-gray-800 dark:text-white">
                {currentLanguage?.nativeName} {currentLanguage?.flag}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 <strong>Lưu ý:</strong> Toàn bộ nội dung trang sẽ được dịch tự động. 
            Bạn không cần sửa bất kỳ component nào.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
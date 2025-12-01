import { useTheme } from '../../contexts/ThemeContext';
import { HiSun, HiMoon } from 'react-icons/hi';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Settings
      </h1>

      {/* Theme Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Theme Mode
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Switch between light and dark mode
            </p>
          </div>

          {/* Toggle Button */}
          <button
            onClick={toggleTheme}
            className="relative inline-flex items-center h-12 w-24 rounded-full! bg-gray-300 dark:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

        {/* Current Theme Display */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Current theme: <span className="font-semibold capitalize">{theme}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
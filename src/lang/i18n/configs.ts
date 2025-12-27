import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend) // Load translation files
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    fallbackLng: 'vi', // Ngôn ngữ mặc định
    defaultNS: 'translation', // Namespace mặc định
    
    // Khai báo tất cả namespaces
    ns: [
      'translation',
      'checkModel',
      'pqcCheck',
      'sheetHeader',
      'standardProduction',
      'standardVehicle',
      'timeChangeModel',
      'smdSheet',
      'login',
      'logs',
      'settings',
      'dashboard'
    ],
    
    interpolation: {
      escapeValue: false, // React đã tự động escape
    },

    // Cấu hình load file JSON
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Đường dẫn đến file JSON
    },

    // Cấu hình detect ngôn ngữ
    detection: {
      order: ['localStorage', 'navigator'], // Ưu tiên localStorage, sau đó là browser language
      caches: ['localStorage'], // Cache vào localStorage
      lookupLocalStorage: 'appLanguage', // Key trong localStorage
    },

    react: {
      useSuspense: true, // Sử dụng Suspense để load translations
    },
  });

export default i18n;
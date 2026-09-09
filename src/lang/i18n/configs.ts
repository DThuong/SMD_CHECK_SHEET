import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

/**
 * DANH SACH NAMESPACE DUY NHAT CUA APP.
 *
 * Truoc day moi man hinh tu liet ke tay mot phan danh sach nay khi doi ngon ngu
 * (RoleBasedLayout 5 ns, AdminLayout 5 ns, Settings 3 ns) nen nhung namespace
 * khong duoc liet ke se khong duoc nap lai -> giao dien hien key tho.
 * Tu gio moi noi deu dung chung hang so nay.
 */
export const ALL_NAMESPACES = [
  'common',
  'settings',
  'dashboard',
  'logs',
  'sheetDetail',
  'sheetHeader',
  'checkModel',
  'standardProduction',
  'timeChangeModel',
  'standardVehicle',
  'pqcCheck',
  'fileDetail',
  'patrol',
  'engCheckSheet',
] as const;

export const SUPPORTED_LANGUAGES = ['vi', 'en', 'ko'] as const;

const LANGUAGE_STORAGE_KEY = 'appLanguage';

/** localStorage co the throw (che do rieng tu / het dung luong) nen luon boc try. */
const readStoredLanguage = (): string | null => {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStoredLanguage = (lang: string) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    /* bo qua */
  }
};

const isDev = import.meta.env.DEV;

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'vi',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    lng: readStoredLanguage() || 'vi',

    ns: ALL_NAMESPACES as unknown as string[],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}/pages/{{ns}}.json',
      // Truoc day co queryStringParams: { v: Date.now() } -> moi lan mo trang la
      // mot URL moi nen trinh duyet khong bao gio cache duoc 15 file ngon ngu.
      // Bo di de nginx + trinh duyet cache binh thuong; UpdateChecker da lo viec
      // phat hien ban deploy moi roi.
      requestOptions: {
        cache: 'default' as RequestCache,
      },
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },

    react: {
      useSuspense: false,
    },

    // Truoc day bat debug: true o ca production -> i18next ghi log moi lan tra key
    // thieu, Chrome giu lai toan bo message trong bo dem console (ke ca khi khong
    // mo DevTools) va giu luon tham chieu toi object -> chan garbage collector.
    debug: isDev,
  });

/**
 * Kiem tra va nap bu nhung namespace bi thieu cua mot ngon ngu.
 *
 * i18next danh dau namespace nap that bai la "failed" va KHONG tu thu lai trong
 * ca phien -> giao dien ket o key tho cho toi khi F5. Ham nay tu do lai va nap bu
 * co gioi han so lan, nen mang nha may co nghen mot luc thi van tu phuc hoi duoc.
 */
export const ensureNamespacesLoaded = async (
  lang: string = i18n.language,
  maxRetry = 3,
): Promise<boolean> => {
  if (!lang) return false;
  const baseLang = lang.split('-')[0];

  for (let attempt = 0; attempt <= maxRetry; attempt++) {
    const missing = ALL_NAMESPACES.filter(
      (ns) => !i18n.hasResourceBundle(lang, ns) && !i18n.hasResourceBundle(baseLang, ns),
    );
    if (missing.length === 0) return true;

    try {
      // reloadResources chi voi dung nhung ns con thieu: khong xoa du lieu cua
      // nhung ns dang hien thi tot (day la cho ma reloadResources(all) lam sai).
      await i18n.reloadResources([lang], missing as unknown as string[]);
    } catch {
      /* thu lai o vong sau */
    }

    if (attempt < maxRetry) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }

  const stillMissing = ALL_NAMESPACES.filter(
    (ns) => !i18n.hasResourceBundle(lang, ns) && !i18n.hasResourceBundle(baseLang, ns),
  );
  if (stillMissing.length > 0) {
    console.warn('[i18n] Cac namespace chua nap duoc:', stillMissing.join(', '));
    return false;
  }
  return true;
};

/**
 * Doi ngon ngu cho toan app. Dung ham nay o MOI noi thay vi tu goi
 * i18n.reloadResources + i18n.changeLanguage.
 */
export const changeAppLanguage = async (lang: string): Promise<void> => {
  if (!lang || lang === i18n.language) return;

  // changeLanguage tu nap nhung ns chua co cho ngon ngu moi (khong xoa gi ca).
  await i18n.changeLanguage(lang);
  // Nap bu nhung ns nap that bai / bi bo sot.
  await ensureNamespacesLoaded(lang);

  writeStoredLanguage(lang);
};

// ---------------------------------------------------------------------------
// Tu phuc hoi khi mot namespace nap that bai (mang nha may nghen, backend restart)
// ---------------------------------------------------------------------------
let healTimer: ReturnType<typeof setTimeout> | null = null;
let healAttempts = 0;
const MAX_AUTO_HEAL = 5;

const scheduleHeal = (delay = 2000) => {
  if (healAttempts >= MAX_AUTO_HEAL) return;
  if (healTimer) clearTimeout(healTimer);
  healTimer = setTimeout(() => {
    healTimer = null;
    healAttempts += 1;
    ensureNamespacesLoaded()
      .then((ok) => {
        // Nap du roi thi tra lai ngan sach thu de lan sau con co the tu phuc hoi.
        if (ok) healAttempts = 0;
      })
      .catch(() => {
        /* bo qua */
      });
  }, delay);
};

i18n.on('failedLoading', (lng, ns) => {
  console.warn(`[i18n] Nap that bai: ${lng}/${ns} - se tu thu lai.`);
  scheduleHeal();
});

if (typeof window !== 'undefined') {
  // Co mang tro lai thi thu nap bu ngay.
  window.addEventListener('online', () => {
    healAttempts = 0;
    scheduleHeal(500);
  });

  // May tram trong nha may thuong de tab mo ca ngay. Moi lan nguoi dung quay lai
  // tab, kiem tra lai xem co namespace nao dang thieu khong.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const lang = i18n.language;
    if (!lang) return;
    const baseLang = lang.split('-')[0];
    const missing = ALL_NAMESPACES.some(
      (ns) => !i18n.hasResourceBundle(lang, ns) && !i18n.hasResourceBundle(baseLang, ns),
    );
    if (missing) {
      healAttempts = 0;
      scheduleHeal(300);
    }
  });
}

export default i18n;

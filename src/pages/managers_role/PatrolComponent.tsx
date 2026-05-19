import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../redux/hooks';
import { toast } from 'sonner';
import ImagePreviewModal from '../../components/files/ImagePreviewModal';
import { useTranslation } from 'react-i18next';

import PatrolList from '../patrol/PatrolList';
import ManagePatrol from '../patrol/ManagePatrol';
import ReportPatrol from '../patrol/ReportPatrol';
import PatrolDetail from '../patrol/PatrolDetail';
import type { PatrolStage, PatrolSheet, PatrolLine } from '../patrol/types';

// ==========================================
// CONSTANTS (giữ nguyên mock data cũ nếu cần)
// ==========================================
const MOCK_DAILY_TEMPLATE_KEY = 'mock_patrol_daily_template';
const MOCK_WEEKLY_TEMPLATE_KEY = 'mock_patrol_weekly_template';
const MOCK_SHEETS_KEY = 'mock_patrol_sheets';
const MOCK_LINES_KEY = 'mock_patrol_lines';

const DEFAULT_TEMPLATE: PatrolStage[] = [
  {
    id: 'stage_1',
    name: 'Metal Mask',
    categories: [
      {
        id: 'cat_1_1',
        name: 'Cleaning',
        items: [
          { id: 'item_1', question: '_Kiểm tra tình trạng bảo quản mask đã được dán nilong chưa, có để đúng số thứ tự không?', type: 'radio' },
          { id: 'item_2', question: '_Squeege có được vệ sinh không, lưỡi dao có móp méo hay không?', type: 'radio' }
        ]
      }
    ]
  }
];

const DEFAULT_LINES: PatrolLine[] = [
  { id: 'line_1', name: 'SA1' }, { id: 'line_2', name: 'SA2' },
  { id: 'line_3', name: 'SA3' }, { id: 'line_4', name: 'SA4' },
  { id: 'line_5', name: 'SA5' }, { id: 'line_6', name: 'SA6' },
  { id: 'line_7', name: 'SA7' }, { id: 'line_8', name: 'SA8' },
  { id: 'line_9', name: 'SA9' }, { id: 'line_10', name: 'SA10' },
];

// ==========================================
// MAIN COMPONENT
// ==========================================
const PatrolComponent = () => {
  const { user } = useAppSelector(state => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation('patrol');

  const pT = (key: string, options?: any) => {
    if (user?.role === 'PQC') return t(key, { ...options, lng: 'vi' }) as any;
    return t(key, options) as any;
  };

  const queryView = searchParams.get('view') as 'list' | 'manage' | 'detail' | 'report' | null;
  const activeView = queryView || 'list';

  // activeTab đọc từ URL — PatrolList dùng prop này
  const queryType = searchParams.get('type') as 'daily' | 'weekly' | null;
  const activeTab = queryType || 'daily';

  // Legacy mock states (giữ nếu ManagePatrol/ReportPatrol vẫn dùng)
  const [dailyTemplate, setDailyTemplate] = useState<PatrolStage[]>([]);
  const [weeklyTemplate, setWeeklyTemplate] = useState<PatrolStage[]>([]);
  const [sheets, setSheets] = useState<PatrolSheet[]>([]);
  const [lines, setLines] = useState<PatrolLine[]>([]);
  const [previewImage, setPreviewImage] = useState<{ isOpen: boolean, url: string, title: string }>({
    isOpen: false, url: '', title: ''
  });

  useEffect(() => {
    const mainEl = document.querySelector('main.overflow-y-auto') as HTMLElement | null;
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeView]);

  useEffect(() => {
    const savedDaily = localStorage.getItem(MOCK_DAILY_TEMPLATE_KEY);
    setDailyTemplate(savedDaily ? JSON.parse(savedDaily) : DEFAULT_TEMPLATE);
    if (!savedDaily) localStorage.setItem(MOCK_DAILY_TEMPLATE_KEY, JSON.stringify(DEFAULT_TEMPLATE));

    const savedWeekly = localStorage.getItem(MOCK_WEEKLY_TEMPLATE_KEY);
    setWeeklyTemplate(savedWeekly ? JSON.parse(savedWeekly) : DEFAULT_TEMPLATE);
    if (!savedWeekly) localStorage.setItem(MOCK_WEEKLY_TEMPLATE_KEY, JSON.stringify(DEFAULT_TEMPLATE));

    const savedSheets = localStorage.getItem(MOCK_SHEETS_KEY);
    if (savedSheets) setSheets(JSON.parse(savedSheets));

    const savedLines = localStorage.getItem(MOCK_LINES_KEY);
    setLines(savedLines ? JSON.parse(savedLines) : DEFAULT_LINES);
    if (!savedLines) localStorage.setItem(MOCK_LINES_KEY, JSON.stringify(DEFAULT_LINES));
  }, []);

  const saveDailyTemplate = (t: PatrolStage[]) => {
    setDailyTemplate(t);
    localStorage.setItem(MOCK_DAILY_TEMPLATE_KEY, JSON.stringify(t));
    toast.success(pT('msgSaveDailyTemplateSuccess'));
  };

  const saveWeeklyTemplate = (t: PatrolStage[]) => {
    setWeeklyTemplate(t);
    localStorage.setItem(MOCK_WEEKLY_TEMPLATE_KEY, JSON.stringify(t));
    toast.success(pT('msgSaveWeeklyTemplateSuccess'));
  };

  const saveSheets = (s: PatrolSheet[]) => {
    setSheets(s);
    localStorage.setItem(MOCK_SHEETS_KEY, JSON.stringify(s));
  };

  const saveLines = (l: PatrolLine[]) => {
    setLines(l);
    localStorage.setItem(MOCK_LINES_KEY, JSON.stringify(l));
  };

  // goToView nhận thêm `type` để back về đúng tab
  const goToView = (
    view: 'list' | 'manage' | 'detail' | 'report',
    id: string | null = null,
    type?: string
  ) => {
    if (view === 'manage' && user?.role !== 'PQCLeader') {
      toast.error(pT('msgConfigPermissionError'));
      return;
    }
    const params: Record<string, string> = { view };
    if (view === 'list') params.type = type || activeTab;
    if (id) params.id = id;
    setSearchParams(params);
  };

  const sharedProps = {
    user,
    sheets, saveSheets,
    lines, saveLines,
    dailyTemplate, weeklyTemplate,
    saveDailyTemplate, saveWeeklyTemplate,
    goToView,
    activeTab,
    setSearchParams,
    setPreviewImage,
  };

  // ==========================================
  // RENDER
  // ==========================================
  const renderContent = () => {
    switch (activeView) {
      case 'list':
        return <PatrolList {...sharedProps} type={activeTab} />;

       case 'manage':
        return <ManagePatrol {...sharedProps} />;

      case 'detail':
        return <PatrolDetail {...sharedProps} />;

      case 'report':
        return <ReportPatrol {...sharedProps} />;

      default:
        return <PatrolList {...sharedProps} type="daily" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 px-3 mb-[70px]!">
      {renderContent()}

      <ImagePreviewModal
        isOpen={previewImage.isOpen}
        imageUrl={previewImage.url}
        title={previewImage.title}
        onClose={() => setPreviewImage({ isOpen: false, url: '', title: '' })}
      />
    </div>
  );
};

export default PatrolComponent;
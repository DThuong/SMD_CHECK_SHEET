/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaChartBar,
  FaCalendarDay,
  FaCalendarWeek,
  FaMobileAlt,
} from 'react-icons/fa';
import { toast } from 'sonner';
import type { PatrolSharedProps } from './types';
import { useTranslation } from 'react-i18next';
import NGDefectAnalyticsChart from '../../components/general/NGDefectAnalyticsChart';

type PatrolReportType = 'daily' | 'weekly';

const ReportPatrol: React.FC<PatrolSharedProps> = (props) => {
  const {
    user,
    goToView,
    activeTab,
    type,
    setSearchParams,
  } = props;

  const { t } = useTranslation('patrol');
  const [isMobileReportBlocked, setIsMobileReportBlocked] = useState(false);

  const pT = (key: string, options?: any) => {
    if (user?.role === 'PQC') {
      return t(key, { ...options, lng: 'vi' }) as any;
    }

    return t(key, options) as any;
  };

  useEffect(() => {
    const checkDevice = () => {
      const isMobile =
        window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
          navigator.userAgent,
        );

      setIsMobileReportBlocked(isMobile);

      if (isMobile) {
        toast.error('Thiết bị của bạn không hỗ trợ để xem báo cáo.');
      }
    };

    checkDevice();

    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const currentType = useMemo<PatrolReportType>(() => {
    if (type === 'weekly' || activeTab === 'weekly') return 'weekly';
    return 'daily';
  }, [type, activeTab]);

  const handleChangeType = (nextType: PatrolReportType) => {
    if (setSearchParams) {
      setSearchParams({
        view: 'report',
        type: nextType,
      });
      return;
    }

    goToView('report', null, nextType);
  };

  if (isMobileReportBlocked) {
    return (
      <div className="animate-fade-in mt-6 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <FaMobileAlt size={24} />
          </div>

          <h2 className="mt-4 text-lg font-extrabold text-slate-900">
            Thiết bị của bạn không hỗ trợ để xem báo cáo
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Báo cáo Patrol có nhiều biểu đồ và bảng dữ liệu lớn, vui lòng sử dụng
            máy tính hoặc màn hình tablet/desktop để xem đầy đủ.
          </p>

          <button
            type="button"
            onClick={() => goToView("list", null, currentType)}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mt-6 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => goToView("list", null, currentType)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <FaArrowLeft />
            </button>

            <div>
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                <FaChartBar className="text-slate-700" />
                {pT('reportDashboard') || 'Patrol Report Dashboard'}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Theo dõi lỗi NG theo line, công đoạn, nội dung lỗi, người tạo và hình ảnh.
              </p>
            </div>
          </div>

          <div className="flex w-full rounded-xl bg-slate-100 p-1 md:w-auto">
            <button
              type="button"
              onClick={() => handleChangeType('daily')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition md:flex-none ${
                currentType === 'daily'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white hover:text-slate-900'
              }`}
            >
              <FaCalendarDay size={12} />
              Daily
            </button>

            <button
              type="button"
              onClick={() => handleChangeType('weekly')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition md:flex-none ${
                currentType === 'weekly'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white hover:text-slate-900'
              }`}
            >
              <FaCalendarWeek size={12} />
              Weekly
            </button>
          </div>
        </div>

        <div className="p-4">
          <NGDefectAnalyticsChart
            {...props}
            type={currentType}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ReportPatrol);
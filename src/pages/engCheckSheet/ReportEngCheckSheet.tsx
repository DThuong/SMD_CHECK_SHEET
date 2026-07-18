import React, { useEffect, useMemo, useState } from 'react';
import { FaArrowLeft, FaChartBar, FaCalendarDay, FaCalendarWeek, FaMobileAlt } from 'react-icons/fa';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { EngSharedProps, EngTab } from '../managers_role/EngCheckSheet';
import EngDefectAnalyticsChart from '../../components/general/EngDefectAnalyticsChart';

const ReportEngCheckSheet: React.FC<EngSharedProps> = (props) => {
    const { goToView, activeTab } = props;
    const { t } = useTranslation('engCheckSheet');
    const [searchParams, setSearchParams] = useSearchParams();
    const [isMobileReportBlocked, setIsMobileReportBlocked] = useState(false);

    // Report có nhiều biểu đồ/bảng lớn — không hỗ trợ mobile (giống ReportPatrol)
    useEffect(() => {
        const checkDevice = () => {
            const isMobile =
                window.innerWidth < 768 ||
                /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
                    navigator.userAgent,
                );

            setIsMobileReportBlocked(isMobile);

            if (isMobile) {
                toast.error(t('msgDeviceNotSupportedForReport'));
            }
        };

        checkDevice();

        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, [t]);

    // Xác định type hiện tại từ URL hoặc activeTab
    const typeFromUrl = searchParams.get('type') as EngTab | null;
    const currentType: EngTab = useMemo(() => {
        if (typeFromUrl === 'weekly' || activeTab === 'weekly') return 'weekly';
        return 'daily';
    }, [typeFromUrl, activeTab]);

    const handleChangeType = (nextType: EngTab) => {
        setSearchParams({
            view: 'report',
            type: nextType,
        });
    };

    if (isMobileReportBlocked) {
        return (
            <div className="animate-fade-in mt-6 px-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4! text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <FaMobileAlt size={24} />
                    </div>

                    <h2 className="mt-4 text-lg font-extrabold text-slate-900">
                        {t('msgDeviceNotSupportedForReport')}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {t('reportMobileBlockedDescription')}
                    </p>

                    <button
                        type="button"
                        onClick={() => goToView('list', null, currentType)}
                        className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                    >
                        {t('backToList')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => goToView('list', null, currentType)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                            <FaArrowLeft />
                        </button>

                        <div>
                            <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                                <FaChartBar className="text-slate-700" />
                                {t('report.title', 'Báo cáo lỗi kỹ thuật')}
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                {t('report.subtitle', 'Thống kê và phân tích các hạng mục NG')}
                            </p>
                        </div>
                    </div>

                    <div className="flex w-full overflow-hidden rounded-2xl bg-slate-100 p-2 md:w-auto">
                        <button
                            type="button"
                            onClick={() => handleChangeType('daily')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl! px-4 py-2 text-xs font-bold transition md:flex-none ${currentType === 'daily'
                                    ? 'bg-slate-950 text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-white hover:text-slate-900'
                                }`}
                        >
                            <FaCalendarDay size={12} />
                            {t('list.tabDaily', 'Hàng ngày')}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleChangeType('weekly')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl! px-4 py-2 text-xs font-bold transition md:flex-none ${currentType === 'weekly'
                                    ? 'bg-slate-950 text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-white hover:text-slate-900'
                                }`}
                        >
                            <FaCalendarWeek size={12} />
                            {t('list.tabWeekly', 'Hàng tuần')}
                        </button>
                    </div>
                </div>

                {/* Phần biểu đồ và bảng */}
                <div className="p-4">
                    <EngDefectAnalyticsChart {...props} type={currentType} />
                </div>
            </div>
        </div>
    );
};

export default React.memo(ReportEngCheckSheet);

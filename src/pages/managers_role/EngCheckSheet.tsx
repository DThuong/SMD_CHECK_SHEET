/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../redux/hooks';

import EngCheckSheetList from '../engCheckSheet/EngCheckSheetList';
import EngCheckSheetManage from '../engCheckSheet/EngCheckSheetManage';
import EngCheckListDetail from '../engCheckSheet/EngCheckListDetail';
import ReportEngCheckSheet from '../engCheckSheet/ReportEngCheckSheet';

export type EngView = 'list' | 'manage' | 'detail' | 'report';
export type EngTab = 'daily' | 'weekly' | 'monthly';

export interface EngSharedProps {
    user: any;
    activeTab: EngTab;
    goToView: (view: EngView, id?: string | null, type?: EngTab) => void;
}

// ==========================================
// MAIN COMPONENT - Engineer Check Sheet
// view=list|manage|detail & type=daily|weekly|monthly (sheetType: "1" ngày, "7" tuần, "30" tháng)
// ==========================================
const EngCheckSheet = () => {
    const { user } = useAppSelector(state => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();

    const queryView = searchParams.get('view') as EngView | null;
    const activeView: EngView = queryView || 'list';

    const queryType = searchParams.get('type') as EngTab | null;
    const activeTab: EngTab = queryType || 'daily';

    useEffect(() => {
        const mainEl = document.querySelector('main.overflow-y-auto') as HTMLElement | null;
        if (mainEl) {
            mainEl.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [activeView]);

    const goToView = (view: EngView, id: string | null = null, type?: EngTab) => {
        const params: Record<string, string> = { view };
        if (view === 'list' || view === 'detail') params.type = type || activeTab;
        if (id) params.id = id;
        setSearchParams(params);
    };

    const sharedProps: EngSharedProps = { user, activeTab, goToView };

    const renderContent = () => {
        switch (activeView) {
            case 'list':
                return <EngCheckSheetList {...sharedProps} />;
            case 'manage':
                return <EngCheckSheetManage {...sharedProps} />;
            case 'detail':
                return <EngCheckListDetail {...sharedProps} />;
            case 'report':
                return <ReportEngCheckSheet {...sharedProps} />;
            default:
                return <EngCheckSheetList {...sharedProps} />;
        }
    };

    return (
        <div className="min-h-screen bg-white px-3 pt-3 pb-40 md:m-0 md:mx-auto md:min-h-0 md:bg-transparent md:pt-0">
            {renderContent()}
        </div>
    );
};

export default EngCheckSheet;

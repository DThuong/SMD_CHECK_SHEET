/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactPaginate from 'react-paginate';
import { FaPlus, FaCog, FaTrash, FaEye, FaChartBar } from 'react-icons/fa';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
    fetchEngSessionsBySheetType,
    filterEngSessions,
    createEngSession,
    deleteEngSession,
    fetchEngLines,
} from '../../redux/slices/engSlice';

import Modal from '../../components/general/Modal';
import { ConfirmModal } from '../../components/general/ConfirmModal';
import LoadingSpinner from '../../components/general/LoadingSpinner';
import PatrolFilterBar, { PATROL_FILTER_DEFAULT } from '../../components/general/PatrolFilterBar';
import CustomSelect from '../../components/general/CustomSelect';
import type { PatrolFilter } from '../../components/general/PatrolFilterBar';
import type { EngSharedProps, EngTab } from '../managers_role/EngCheckSheet';

// Backend hiện chỉ có 2 status: Pending và Submitted
const STATUS_STYLES: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Submitted: 'bg-green-100 text-green-700',
};

const SHIFT_OPTIONS = ['Ca ngày', 'Ca đêm'];

const EngCheckSheetList: React.FC<EngSharedProps> = ({ user, activeTab, goToView }) => {
    const { t } = useTranslation('engCheckSheet');
    const dispatch = useAppDispatch();
    const { sessions, filteredSessionsResult, lines, loading } = useAppSelector(state => state.eng);

    const sheetType = activeTab === 'daily' ? '1' : activeTab === 'weekly' ? '7' : '30';

    // Chỉ role Engineer được tạo/xóa sheet, các role khác chỉ xem
    const isEngineer = user?.role?.toLowerCase() === 'eng';

    // ------- Filter state (realtime: debounce + fuzzy + cache) -------
    const [filter, setFilter] = useState<PatrolFilter>(PATROL_FILTER_DEFAULT);
    const [filterLoading, setFilterLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Cache: không gọi lại API nếu bộ lọc không đổi so với lần gọi gần nhất
    const lastFilterKeyRef = useRef<string>('');

    const hasActiveFilter =
        !!filter.fullName || !!filter.lineAreaName || !!filter.status || !!filter.fromDate || !!filter.toDate;

    // ------- Create modal -------
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newLineId, setNewLineId] = useState<number | ''>('');
    const [newShift, setNewShift] = useState(SHIFT_OPTIONS[0]);
    const [newNote, setNewNote] = useState('');

    // ------- Delete modal -------
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // ------- Pagination -------
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 20;

    // ------- Highlight session after back from detail -------
    const [highlightId, setHighlightId] = useState<number | null>(null);
    const [initialHighlightCheck, setInitialHighlightCheck] = useState(false);

    // Danh sách hiển thị: kết quả filter (đã lọc theo sheetType) hoặc list theo tab
    const baseList = useMemo(() => {
        return hasActiveFilter
            ? filteredSessionsResult.filter(s => s.sheetType === sheetType)
            : sessions.filter(s => s.sheetType === sheetType);
    }, [hasActiveFilter, filteredSessionsResult, sessions, sheetType]);

    const sortedList = useMemo(() => {
        return [...baseList].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [baseList]);

    useEffect(() => {
        if (initialHighlightCheck || sortedList.length === 0) return;
        try {
            const raw = localStorage.getItem('eng_highlight_session');
            if (raw) {
                const { id, ts } = JSON.parse(raw);
                localStorage.removeItem('eng_highlight_session');
                if (Date.now() - ts < 10000) {
                    const highlightIndex = sortedList.findIndex(s => s.id === Number(id));
                    if (highlightIndex !== -1) {
                        setCurrentPage(Math.floor(highlightIndex / itemsPerPage));
                    }
                    setHighlightId(Number(id));
                    setTimeout(() => {
                        const el = document.getElementById(`eng-session-${id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                    const timer = setTimeout(() => setHighlightId(null), 5000);
                    setInitialHighlightCheck(true);
                    return () => clearTimeout(timer);
                }
            }
        } catch (e) {
            console.error(e);
        }
        setInitialHighlightCheck(true);
    }, [sortedList, initialHighlightCheck]);

    // Reset pagination when filter/tab changes
    useEffect(() => {
        setCurrentPage(0);
    }, [sheetType, hasActiveFilter, filteredSessionsResult]);

    const pageCount = Math.ceil(sortedList.length / itemsPerPage);
    const displayList = useMemo(() => {
        const offset = currentPage * itemsPerPage;
        return sortedList.slice(offset, offset + itemsPerPage);
    }, [currentPage, sortedList]);

    const handlePageChange = ({ selected }: { selected: number }) => {
        setCurrentPage(selected);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [isFetchingSessions, setIsFetchingSessions] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setIsFetchingSessions(true);
        Promise.all([
            dispatch(fetchEngSessionsBySheetType(sheetType)).unwrap().catch(() => { }),
            dispatch(fetchEngLines()).unwrap().catch(() => { })
        ]).finally(() => {
            if (isMounted) setIsFetchingSessions(false);
        });
        setFilter(PATROL_FILTER_DEFAULT);
        lastFilterKeyRef.current = '';
        return () => {
            isMounted = false;
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [dispatch, sheetType]);

    const switchTab = (tab: EngTab) => {
        goToView('list', null, tab);
    };

    // ------- Filter realtime: debounce 400ms + cache theo key -------
    const dispatchFilter = async (f: PatrolFilter) => {
        const params = {
            fullName: f.fullName || undefined,
            lineAreaName: f.lineAreaName || undefined,
            status: f.status || undefined,
            fromDate: f.fromDate || undefined,
            toDate: f.toDate || undefined,
        };
        const key = JSON.stringify(params);
        if (key === lastFilterKeyRef.current) return; // cache hit → khỏi gọi API
        lastFilterKeyRef.current = key;

        setFilterLoading(true);
        try {
            await dispatch(filterEngSessions(params)).unwrap();
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : t('list.toast.filterFailed'));
        } finally {
            setFilterLoading(false);
        }
    };

    const handleFilterChange = (key: keyof PatrolFilter, value: string) => {
        const newFilter = { ...filter, [key]: value };
        setFilter(newFilter);

        // Chờ đủ cặp from/to rồi mới gọi API
        if (key === 'fromDate' || key === 'toDate') {
            const from = key === 'fromDate' ? value : newFilter.fromDate;
            const to = key === 'toDate' ? value : newFilter.toDate;
            if ((from && !to) || (!from && to)) return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => dispatchFilter(newFilter), 400);
    };

    const clearFilter = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setFilter(PATROL_FILTER_DEFAULT);
        lastFilterKeyRef.current = '';
        dispatch(fetchEngSessionsBySheetType(sheetType));
    };

    // ------- Create session -------
    const handleCreate = async () => {
        if (!newLineId) {
            toast.error(t('list.toast.selectLineFirst'));
            return;
        }
        try {
            const created = await dispatch(createEngSession({
                accountId: user?.accountId || user?.id,
                lineId: Number(newLineId),
                sheetType,
                sessionShift: newShift,
                note: newNote,
                status: 'Pending',
            })).unwrap();
            toast.success(t('list.toast.createSuccess'));
            setCreateModalOpen(false);
            setNewLineId('');
            setNewNote('');
            // Vào thẳng trang điền sheet
            if (created?.id) goToView('detail', String(created.id));
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : t('list.toast.createFailed'));
        }
    };

    // ------- Delete -------
    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await dispatch(deleteEngSession(deleteId)).unwrap();
            toast.success(t('list.toast.deleteSuccess'));
            // Re-fetch danh sách từ server để đảm bảo UI đồng bộ
            lastFilterKeyRef.current = '';
            if (hasActiveFilter) {
                dispatchFilter(filter);
            }
            dispatch(fetchEngSessionsBySheetType(sheetType));
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : t('list.toast.deleteFailed'));
        }
        setDeleteId(null);
    };

    // Candidates cho autocomplete/fuzzy search
    const fullNameCandidates = useMemo(
        () => [...new Set(sessions.map(s => s.fullName).filter(Boolean))],
        [sessions]
    );
    // Map Line của eng sang shape LineArea mà PatrolFilterBar cần
    const lineAreasForFilter = useMemo(
        () => lines.map(l => ({ id: l.id, lineAreaName: l.lineName, note: '', isActive: true })),
        [lines]
    );

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <div className="w-full animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h1 className="text-lg md:text-xl font-bold text-gray-800">
                    {activeTab === 'daily' ? t('list.titleDaily') : activeTab === 'weekly' ? t('list.titleWeekly') : t('list.titleMonthly')}
                </h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => goToView('report')}
                        className="flex-1 sm:flex-none justify-center px-3 py-2 rounded-lg bg-gray-600 text-white text-sm flex items-center gap-2 hover:opacity-70 transition-colors"
                    >
                        <FaChartBar /> {t('list.reportBtn', 'Báo cáo')}
                    </button>
                    <button
                        onClick={() => goToView('manage')}
                        className="flex-1 sm:flex-none justify-center px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        <FaCog /> {t('list.manage')}
                    </button>
                    {isEngineer && (
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="flex-1 sm:flex-none justify-center px-3 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-2 hover:bg-blue-700"
                        >
                            <FaPlus /> {t('list.createNew')}
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs ngày/tuần/tháng */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => switchTab('daily')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    {t('list.tabDaily')}
                </button>
                <button
                    onClick={() => switchTab('weekly')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    {t('list.tabWeekly')}
                </button>
                <button
                    onClick={() => switchTab('monthly')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    {t('list.tabMonthly')}
                </button>
            </div>

            {/* Filter bar - realtime (debounce + fuzzy + autocomplete + highlight) */}
            <div className="mb-4">
                <PatrolFilterBar
                    filter={filter}
                    onChange={handleFilterChange}
                    onReset={clearFilter}
                    lineAreas={lineAreasForFilter}
                    totalCount={displayList.length}
                    loading={filterLoading}
                    showFullName
                    fullNameCandidates={fullNameCandidates}
                    statusOptions={[
                        { value: 'Pending', label: t('statusPending') },
                        { value: 'Submitted', label: t('statusSubmitted') },
                    ]}
                    labels={{
                        fullName: t('list.inspector'),
                        lineArea: t('list.line'),
                        status: t('list.status'),
                        fromDate: t('list.fromDate'),
                        toDate: t('list.toDate'),
                        searching: t('list.searching'),
                        reset: t('list.clearFilter'),
                        results: t('list.results'),
                    }}
                />
            </div>

            {/* Danh sách */}
            {(loading || isFetchingSessions) && displayList.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="sm" message={t('list.loading', 'Đang tải dữ liệu...')} />
                </div>
            ) : displayList.length === 0 ? (
                <div className="text-center p-4 text-gray-500 text-sm bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="text-4xl mb-3 opacity-50">📋</div>
                    Chưa có phiên check sheet nào. Bấm "{t('list.createNew')}" để bắt đầu.
                </div>
            ) : (
                <>
                    {/* Card view - MOBILE */}
                    <div className="md:hidden space-y-3!">
                        {displayList.map(session => (
                            <div
                                key={session.id}
                                id={`eng-session-${session.id}`}
                                onClick={() => goToView('detail', String(session.id))}
                                className={`bg-white border rounded-xl p-4 active:bg-gray-50 transition-all duration-500 ${highlightId === session.id
                                        ? 'border-blue-400 ring-2 ring-blue-300 bg-blue-50/50 shadow-md'
                                        : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm truncate">
                                            {session.lineName || lines.find(l => l.id === session.lineId)?.lineName || `Line ${session.lineId}`}
                                            <span className="ml-2 text-xs font-normal text-gray-400">#{session.id}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {session.fullName}{session.sessionShift ? ` · ${session.sessionShift}` : ''}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[session.status] || 'bg-gray-100 text-gray-600'}`}>
                                        {session.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                        {session.createdAt ? new Date(session.createdAt).toLocaleString('vi-VN') : ''}
                                    </span>
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => goToView('detail', String(session.id))}
                                            className="px-2 py-2 text-blue-600 bg-blue-50 rounded-lg text-xs flex items-center gap-1"
                                        >
                                            <FaEye />
                                        </button>
                                        {isEngineer && (
                                            <button
                                                onClick={() => setDeleteId(session.id)}
                                                className="px-2 py-2 text-red-500 bg-red-50 rounded-lg text-xs"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table view - DESKTOP */}
                    <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-left">
                                    <th className="px-4 py-3 font-medium">{t('list.id')}</th>
                                    <th className="px-4 py-3 font-medium">{t('list.line')}</th>
                                    <th className="px-4 py-3 font-medium">{t('list.inspector')}</th>
                                    <th className="px-4 py-3 font-medium">{t('list.shift')}</th>
                                    <th className="px-4 py-3 font-medium">{t('list.status')}</th>
                                    <th className="px-4 py-3 font-medium">{t('list.createdAt')}</th>
                                    <th className="px-4 py-3 font-medium text-center">{t('list.action')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayList.map(session => (
                                    <tr key={session.id} id={`eng-session-${session.id}`} onClick={() => goToView('detail', String(session.id))} className={`cursor-pointer transition-all duration-500 ${highlightId === session.id
                                            ? 'bg-blue-50 ring-2 ring-blue-300'
                                            : 'hover:bg-gray-50'
                                        }`}>
                                        <td className="px-4 py-3 text-gray-500">#{session.id}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {session.lineName || lines.find(l => l.id === session.lineId)?.lineName || `Line ${session.lineId}`}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{session.fullName}</td>
                                        <td className="px-4 py-3 text-gray-700">{session.sessionShift}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[session.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {session.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {session.createdAt ? new Date(session.createdAt).toLocaleString('vi-VN') : ''}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); goToView('detail', String(session.id)); }}
                                                    className="px-2 py-2 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1"
                                                    title={t('list.viewFill')}
                                                >
                                                    <FaEye />
                                                </button>
                                                {isEngineer && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteId(session.id); }}
                                                        className="px-2 py-1 text-red-500 hover:bg-red-50 rounded"
                                                        title={t('list.delete')}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {pageCount > 1 && (
                <div className="flex justify-center mt-6 pb-6">
                    <ReactPaginate
                        previousLabel={t('pagination.previous', { defaultValue: 'Trước' })}
                        nextLabel={t('pagination.next', { defaultValue: 'Sau' })}
                        breakLabel="..."
                        pageCount={pageCount}
                        marginPagesDisplayed={1}
                        pageRangeDisplayed={3}
                        onPageChange={handlePageChange}
                        forcePage={currentPage}
                        containerClassName="pagination flex items-center justify-center gap-1 sm:gap-2 px-2"
                        pageClassName="page-item"
                        pageLinkClassName="page-link flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-blue-50 transition-colors text-sm sm:text-base font-medium"
                        previousClassName="page-item"
                        previousLinkClassName="page-link flex items-center justify-center px-3 h-8 sm:px-4 sm:h-10 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-blue-50 transition-colors text-sm sm:text-base font-medium"
                        nextClassName="page-item"
                        nextLinkClassName="page-link flex items-center justify-center px-3 h-8 sm:px-4 sm:h-10 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-blue-50 transition-colors text-sm sm:text-base font-medium"
                        breakClassName="page-item"
                        breakLinkClassName="page-link flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-gray-500"
                        activeClassName="active"
                        activeLinkClassName="!bg-blue-600 !text-white !border-blue-600 shadow-md font-bold"
                        disabledClassName="opacity-50 cursor-not-allowed pointer-events-none"
                    />
                </div>
            )}

            {/* Modal tạo session */}
            <Modal
                open={createModalOpen}
                title={activeTab === 'daily' ? t('list.createDaily') : activeTab === 'weekly' ? t('list.createWeekly') : t('list.createMonthly')}
                onClose={() => setCreateModalOpen(false)}
                onSave={handleCreate}
            >
                <div className="space-y-3">
                    <div className="z-20">
                        <label className="block text-sm text-gray-600 mb-1">{t('list.selectLineLabel')} <span className="text-red-500">*</span></label>
                        <CustomSelect
                            options={[
                                { value: '', label: t('list.selectLinePlaceholder') },
                                ...lines.map(line => ({
                                    value: String(line.id),
                                    label: `${line.lineName}${line.areaPart ? ` (${line.areaPart})` : ''}`
                                }))
                            ]}
                            value={String(newLineId)}
                            onChange={(val) => setNewLineId(val ? Number(val) : '')}
                            isSearchable={true}
                        />
                    </div>
                    <div className="z-10">
                        <label className="block text-sm text-gray-600 mb-1">{t('list.shiftLabel')}</label>
                        <CustomSelect
                            options={SHIFT_OPTIONS.map(s => ({ value: s, label: s }))}
                            value={newShift}
                            onChange={(val) => setNewShift(val)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">{t('list.noteLabel')}</label>
                        <textarea
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder={`${t('list.noteLabel')} (nếu có)...`}
                        />
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                open={deleteId !== null}
                type="danger"
                title={t('list.deleteTitle')}
                message={t('list.deleteMessage')}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
};

export default EngCheckSheetList;

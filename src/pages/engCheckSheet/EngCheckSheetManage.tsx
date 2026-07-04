/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaChevronDown, FaChevronRight, FaCogs, FaClipboardList } from 'react-icons/fa';
import { MdPrecisionManufacturing } from 'react-icons/md';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
    fetchEngMachineTypes, createEngMachineType, updateEngMachineType, deleteEngMachineType,
    fetchEngLines, createEngLine, updateEngLine, deleteEngLine,
    fetchEngMachines, createEngMachine, updateEngMachine, deleteEngMachine,
    fetchEngCategories, createEngCategory, updateEngCategory, deleteEngCategory,
    fetchEngCheckLists, createEngCheckList, updateEngCheckList, deleteEngCheckList,
} from '../../redux/slices/engSlice';
import { ConfirmModal } from '../../components/general/ConfirmModal';
import Modal from '../../components/general/Modal';
import CustomSelect from '../../components/general/CustomSelect';
import LoadingSpinner from '../../components/general/LoadingSpinner';
import type { EngSharedProps } from '../managers_role/EngCheckSheet';

type ManageSection = 'machineType' | 'lineMachine' | 'question';
type EntityType = 'machineType' | 'line' | 'machine' | 'category' | 'checkList';

const EngCheckSheetManage: React.FC<EngSharedProps> = ({ user, goToView }) => {
    const { t } = useTranslation('engCheckSheet');
    const dispatch = useAppDispatch();
    const { machineTypes, lines, machines, categories, checkLists, loading } = useAppSelector(state => state.eng);

    // Chỉ role Engineer được chỉnh sửa, các role khác chỉ xem
    const isEngineer = user?.role?.toLowerCase() === 'eng';

    const [section, setSection] = useState<ManageSection>('lineMachine');
    // sub-tab cho phần câu hỏi: sheetType "1" (ngày) | "7" (tuần)
    const [sheetTab, setSheetTab] = useState<'1' | '7'>('1');

    const [collapsedLines, setCollapsedLines] = useState<Record<number, boolean>>({});
    const [collapsedCategories, setCollapsedCategories] = useState<Record<number, boolean>>({});

    // ------- Modal state -------
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: EntityType; id?: number }>({ isOpen: false, type: 'line' });
    const [itemModal, setItemModal] = useState<{
        isOpen: boolean;
        type: EntityType;
        isEdit: boolean;
        id?: number;
        parentId?: number; // lineId cho machine, categoryId cho checkList
    }>({ isOpen: false, type: 'line', isEdit: false });

    // Input fields dùng chung cho các modal
    const [inputName, setInputName] = useState('');
    const [inputArea, setInputArea] = useState('');
    const [inputMachineTypeId, setInputMachineTypeId] = useState<number | ''>('');

    useEffect(() => {
        dispatch(fetchEngMachineTypes());
        dispatch(fetchEngLines());
        dispatch(fetchEngMachines());
        dispatch(fetchEngCategories());
        dispatch(fetchEngCheckLists());
    }, [dispatch]);

    // ------- Helpers -------
    const openCreateModal = (type: EntityType, parentId?: number) => {
        if (!isEngineer) return;
        setInputName('');
        // areaPart mặc định là SMD khi thêm line mới
        setInputArea(type === 'line' ? 'SMD' : '');
        setInputMachineTypeId('');
        setItemModal({ isOpen: true, type, isEdit: false, parentId });
    };

    const openEditModal = (type: EntityType, id: number) => {
        if (!isEngineer) return;
        if (type === 'machineType') {
            const item = machineTypes.find(x => x.id === id);
            setInputName(item?.name || '');
        } else if (type === 'line') {
            const item = lines.find(x => x.id === id);
            setInputName(item?.lineName || '');
            setInputArea(item?.areaPart || '');
        } else if (type === 'machine') {
            const item = machines.find(x => x.id === id);
            setInputName(item?.machineName || '');
            setInputMachineTypeId(item?.machineTypeId || '');
        } else if (type === 'category') {
            const item = categories.find(x => x.id === id);
            setInputName(item?.name || '');
        } else if (type === 'checkList') {
            const item = checkLists.find(x => x.id === id);
            setInputName(item?.questionCheck || '');
            setInputMachineTypeId(item?.machineTypeId || '');
        }
        setItemModal({ isOpen: true, type, isEdit: true, id });
    };

    const closeItemModal = () => setItemModal({ isOpen: false, type: 'line', isEdit: false });

    const handleSave = async () => {
        if (!isEngineer) {
            toast.error(t('manage.toast.editDenied'));
            return;
        }
        const { type, isEdit, id, parentId } = itemModal;
        if (!inputName.trim()) {
            toast.error(t('manage.toast.inputRequired'));
            return;
        }

        try {
            if (type === 'machineType') {
                const data = { name: inputName.trim() };
                if (isEdit && id) await dispatch(updateEngMachineType({ id, data })).unwrap();
                else await dispatch(createEngMachineType(data)).unwrap();
            }
            else if (type === 'line') {
                const data = { lineName: inputName.trim(), areaPart: inputArea.trim() };
                if (isEdit && id) await dispatch(updateEngLine({ id, data })).unwrap();
                else await dispatch(createEngLine(data)).unwrap();
            }
            else if (type === 'machine') {
                if (!inputMachineTypeId) { toast.error(t('manage.toast.machineTypeRequired')); return; }
                if (isEdit && id) {
                    const current = machines.find(x => x.id === id);
                    await dispatch(updateEngMachine({
                        id,
                        data: { machineName: inputName.trim(), machineTypeId: Number(inputMachineTypeId), lineId: current?.lineId }
                    })).unwrap();
                } else {
                    await dispatch(createEngMachine({
                        machineName: inputName.trim(), machineTypeId: Number(inputMachineTypeId), lineId: parentId
                    })).unwrap();
                }
            }
            else if (type === 'category') {
                const data = { name: inputName.trim(), sheetType: sheetTab, isActive: true };
                if (isEdit && id) await dispatch(updateEngCategory({ id, data })).unwrap();
                else await dispatch(createEngCategory(data)).unwrap();
            }
            else if (type === 'checkList') {
                if (!inputMachineTypeId) { toast.error(t('manage.toast.machineTypeApplyRequired')); return; }
                if (isEdit && id) {
                    const current = checkLists.find(x => x.id === id);
                    await dispatch(updateEngCheckList({
                        id,
                        data: { questionCheck: inputName.trim(), machineTypeId: Number(inputMachineTypeId), categoryId: current?.categoryId, isActive: true }
                    })).unwrap();
                } else {
                    await dispatch(createEngCheckList({
                        questionCheck: inputName.trim(), machineTypeId: Number(inputMachineTypeId), categoryId: parentId, isActive: true
                    })).unwrap();
                }
            }
            toast.success(isEdit ? t('manage.toast.updateSuccess') : t('manage.toast.addSuccess'));
            closeItemModal();
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : t('manage.toast.error'));
        }
    };

    const handleDelete = async () => {
        if (!isEngineer) {
            toast.error(t('manage.toast.deleteDenied'));
            return;
        }
        const { type, id } = deleteModal;
        if (!id) return;
        try {
            if (type === 'machineType') await dispatch(deleteEngMachineType(id)).unwrap();
            else if (type === 'line') await dispatch(deleteEngLine(id)).unwrap();
            else if (type === 'machine') await dispatch(deleteEngMachine(id)).unwrap();
            else if (type === 'category') await dispatch(deleteEngCategory(id)).unwrap();
            else if (type === 'checkList') await dispatch(deleteEngCheckList(id)).unwrap();
            toast.success(t('manage.toast.deleteSuccess'));
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : t('manage.toast.deleteFailed'));
        }
        setDeleteModal({ isOpen: false, type: 'line' });
    };

    const modalTitle = () => {
        const action = itemModal.isEdit ? 'Sửa' : 'Thêm';
        switch (itemModal.type) {
            case 'machineType': return `${action} loại máy`;
            case 'line': return `${action} line`;
            case 'machine': return `${action} máy`;
            case 'category': return `${action} nhóm câu hỏi`;
            case 'checkList': return `${action} câu hỏi kiểm tra`;
        }
    };

    if (loading && machineTypes.length === 0 && lines.length === 0) {
        return <LoadingSpinner size="sm" message="Đang tải dữ liệu..." />;
    }

    const currentCategories = categories.filter(c => c.sheetType === sheetTab);

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <div className="w-full animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <button
                    onClick={() => goToView('list')}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
                >
                    <FaArrowLeft />
                </button>
                <h1 className="text-xl font-bold text-gray-800">{t('manage.title')}</h1>
                {!isEngineer && (
                    <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-3 py-1 font-medium">
                        {t('manage.viewOnly')}
                    </span>
                )}
            </div>

            {/* Section tabs */}
            <div className="flex flex-col sm:flex-row gap-2 mb-5">
                <button
                    onClick={() => setSection('lineMachine')}
                    className={`flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 ${section === 'lineMachine' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    <MdPrecisionManufacturing className="text-base sm:text-lg" /> {t('manage.tabLineMachine')}
                </button>
                <button
                    onClick={() => setSection('machineType')}
                    className={`flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 ${section === 'machineType' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    <FaCogs /> {t('manage.tabMachineType')}
                </button>
                <button
                    onClick={() => setSection('question')}
                    className={`flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 ${section === 'question' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    <FaClipboardList /> {t('manage.tabQuestion')}
                </button>
            </div>

            {/* ============ SECTION: LOẠI MÁY ============ */}
            {section === 'machineType' && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                        <h2 className="font-semibold text-gray-700 text-sm sm:text-base truncate">{t('manage.listMachineType')}</h2>
                        {isEngineer && (
                            <button
                                onClick={() => openCreateModal('machineType')}
                                className="w-full sm:w-auto shrink-0 justify-center px-3 py-2 sm:py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-700"
                            >
                                <FaPlus /> {t('manage.addMachineType')}
                            </button>
                        )}
                    </div>
                    {machineTypes.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">{t('manage.noMachineType')}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {machineTypes.map(mt => (
                            <div key={mt.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 sm:py-2">
                                <span className="text-sm text-gray-800">{mt.name}</span>
                                {isEngineer && (
                                    <div className="flex gap-1.5 sm:gap-0.5 shrink-0">
                                        <button onClick={() => openEditModal('machineType', mt.id)} className="p-2.5 sm:p-1.5 rounded-lg sm:rounded-md text-blue-500 bg-blue-50 sm:bg-transparent hover:bg-blue-100 sm:hover:bg-blue-50"><FaEdit /></button>
                                        <button onClick={() => setDeleteModal({ isOpen: true, type: 'machineType', id: mt.id })} className="p-2.5 sm:p-1.5 rounded-lg sm:rounded-md text-red-500 bg-red-50 sm:bg-transparent hover:bg-red-100 sm:hover:bg-red-50"><FaTrash /></button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ============ SECTION: LINE & MÁY ============ */}
            {section === 'lineMachine' && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                        <h2 className="font-semibold text-gray-700 text-sm sm:text-base truncate">{t('manage.listLine')}</h2>
                        {isEngineer && (
                            <button
                                onClick={() => openCreateModal('line')}
                                className="w-full sm:w-auto shrink-0 justify-center px-3 py-2 sm:py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-700"
                            >
                                <FaPlus /> {t('manage.addLine')}
                            </button>
                        )}
                    </div>
                    {lines.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">{t('manage.noLine')}</p>}
                    <div className="space-y-2!">
                        {lines.map(line => {
                            const lineMachines = machines.filter(m => m.lineId === line.id);
                            const collapsed = collapsedLines[line.id];
                            return (
                                <div key={line.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                                        <button
                                            className="flex items-center gap-2 text-sm font-medium text-gray-800 min-w-0 flex-1 text-left flex-wrap"
                                            onClick={() => setCollapsedLines(prev => ({ ...prev, [line.id]: !prev[line.id] }))}
                                        >
                                            {collapsed ? <FaChevronRight className="text-gray-400 shrink-0" /> : <FaChevronDown className="text-gray-400 shrink-0" />}
                                            <span className="truncate">{line.lineName}</span>
                                            {line.areaPart && <span className="text-xs text-gray-400">({line.areaPart})</span>}
                                            <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-2 py-0.5 shrink-0">{t('manage.machineCount', { count: lineMachines.length })}</span>
                                        </button>
                                        {isEngineer && (
                                            <div className="flex gap-1.5 sm:gap-1 shrink-0">
                                                <button onClick={() => openCreateModal('machine', line.id)} className="p-2.5 sm:p-1.5 rounded-lg sm:rounded-md text-green-600 bg-green-50 sm:bg-transparent hover:bg-green-100 sm:hover:bg-green-50" title={t('manage.addMachine')}><FaPlus /></button>
                                                <button onClick={() => openEditModal('line', line.id)} className="p-2.5 sm:p-1.5 rounded-lg sm:rounded-md text-blue-500 bg-blue-50 sm:bg-transparent hover:bg-blue-100 sm:hover:bg-blue-50" title={t('manage.editLine')}><FaEdit /></button>
                                                <button onClick={() => setDeleteModal({ isOpen: true, type: 'line', id: line.id })} className="p-2.5 sm:p-1.5 rounded-lg sm:rounded-md text-red-500 bg-red-50 sm:bg-transparent hover:bg-red-100 sm:hover:bg-red-50" title={t('manage.deleteLine')}><FaTrash /></button>
                                            </div>
                                        )}
                                    </div>
                                    {!collapsed && (
                                        <>
                                            {lineMachines.length === 0 && <p className="text-xs text-gray-400 px-4 py-2">{t('manage.noMachine')}</p>}

                                            {/* Bảng máy - DESKTOP */}
                                            {lineMachines.length > 0 && (
                                                <table className="hidden md:table w-full text-sm">
                                                    <thead>
                                                        <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                                            <th className="px-4 py-2 text-left font-semibold">{t('manage.machineName')}</th>
                                                            <th className="px-4 py-2 text-left font-semibold w-56">{t('manage.tabMachineType')}</th>
                                                            {isEngineer && <th className="px-4 py-2 text-center font-semibold w-28">{t('manage.action')}</th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {lineMachines.map(m => (
                                                            <tr key={m.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-2 text-gray-800">{m.machineName}</td>
                                                                <td className="px-4 py-2">
                                                                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                                                                        {machineTypes.find(mt => mt.id === m.machineTypeId)?.name || m.machineType?.name || '—'}
                                                                    </span>
                                                                </td>
                                                                {isEngineer && (
                                                                    <td className="px-4 py-2">
                                                                        <div className="flex gap-1 justify-center">
                                                                            <button onClick={() => openEditModal('machine', m.id)} className="p-1.5 rounded-md text-blue-500 hover:bg-blue-50" title={t('manage.edit')}><FaEdit /></button>
                                                                            <button onClick={() => setDeleteModal({ isOpen: true, type: 'machine', id: m.id })} className="p-1.5 rounded-md text-red-500 hover:bg-red-50" title={t('manage.delete')}><FaTrash /></button>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}

                                            {/* Danh sách máy - MOBILE */}
                                            <div className="md:hidden divide-y divide-gray-100">
                                                {lineMachines.map(m => (
                                                    <div key={m.id} className="flex items-center justify-between px-3 py-2 gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm text-gray-800 truncate">{m.machineName}</p>
                                                            <p className="text-xs text-gray-400 truncate">
                                                                {machineTypes.find(mt => mt.id === m.machineTypeId)?.name || m.machineType?.name || ''}
                                                            </p>
                                                        </div>
                                                        {isEngineer && (
                                                            <div className="flex gap-1.5 shrink-0">
                                                                <button onClick={() => openEditModal('machine', m.id)} className="p-2.5 rounded-lg text-blue-500 bg-blue-50 hover:bg-blue-100"><FaEdit /></button>
                                                                <button onClick={() => setDeleteModal({ isOpen: true, type: 'machine', id: m.id })} className="p-2.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100"><FaTrash /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ============ SECTION: CÂU HỎI ============ */}
            {section === 'question' && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    {/* sub-tab sheetType */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                        <button
                            onClick={() => setSheetTab('1')}
                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${sheetTab === '1' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {t('manage.dailySheet')}
                        </button>
                        <button
                            onClick={() => setSheetTab('7')}
                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${sheetTab === '7' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {t('manage.weeklySheet')}
                        </button>
                        <div className="hidden sm:block flex-1" />
                        <button
                            onClick={() => openCreateModal('category')}
                            className={`w-full sm:w-auto justify-center px-3 py-2 sm:py-2 bg-blue-600 text-white rounded-lg text-sm items-center gap-1.5 hover:bg-blue-700 ${isEngineer ? 'flex' : 'hidden'}`}
                        >
                            <FaPlus /> {t('manage.addGroup')}
                        </button>
                    </div>

                    {currentCategories.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">{t('manage.noGroup')}</p>}
                    <div className="space-y-2!">
                        {currentCategories.map(cat => {
                            const catCheckLists = checkLists.filter(cl => cl.categoryId === cat.id);
                            const collapsed = collapsedCategories[cat.id];
                            return (
                                <div key={cat.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                                        <button
                                            className="flex items-center gap-2 text-sm font-medium text-gray-800 text-left min-w-0 flex-1 flex-wrap"
                                            onClick={() => setCollapsedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                                        >
                                            {collapsed ? <FaChevronRight className="text-gray-400 shrink-0" /> : <FaChevronDown className="text-gray-400 shrink-0" />}
                                            <span className="truncate">{cat.name}</span>
                                            <span className="text-xs bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5 shrink-0">{t('manage.questionCount', { count: catCheckLists.length })}</span>
                                        </button>
                                        {isEngineer && (
                                            <div className="flex gap-1.5 sm:gap-1 shrink-0">
                                                <button onClick={() => openCreateModal('checkList', cat.id)} className="p-2.5 sm:p-1.5 rounded-lg sm:rounded-md text-green-600 bg-green-50 sm:bg-transparent hover:bg-green-100 sm:hover:bg-green-50" title={t('manage.addQuestion')}><FaPlus /></button>
                                                <button onClick={() => openEditModal('category', cat.id)} className="p-2.5 sm:p-1.5 rounded-lg sm:rounded-md text-blue-500 bg-blue-50 sm:bg-transparent hover:bg-blue-100 sm:hover:bg-blue-50" title={t('manage.editGroup')}><FaEdit /></button>
                                                <button onClick={() => setDeleteModal({ isOpen: true, type: 'category', id: cat.id })} className="p-2.5 sm:p-1.5 rounded-lg sm:rounded-md text-red-500 bg-red-50 sm:bg-transparent hover:bg-red-100 sm:hover:bg-red-50" title={t('manage.deleteGroup')}><FaTrash /></button>
                                            </div>
                                        )}
                                    </div>
                                    {!collapsed && (
                                        <>
                                            {catCheckLists.length === 0 && <p className="text-xs text-gray-400 px-4 py-2">Chưa có câu hỏi</p>}

                                            {/* Bảng câu hỏi - DESKTOP */}
                                            {catCheckLists.length > 0 && (
                                                <table className="hidden md:table w-full text-sm">
                                                    <thead>
                                                        <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                                            <th className="px-4 py-2 text-left font-semibold">{t('manage.questionContent')}</th>
                                                            <th className="px-4 py-2 text-left font-semibold w-56">{t('manage.tabMachineType')}</th>
                                                            {isEngineer && <th className="px-4 py-2 text-center font-semibold w-28">{t('manage.action')}</th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {catCheckLists.map(cl => (
                                                            <tr key={cl.id} className="hover:bg-gray-50 align-top">
                                                                <td className="px-4 py-2 text-gray-800">{cl.questionCheck}</td>
                                                                <td className="px-4 py-2">
                                                                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 whitespace-nowrap">
                                                                        {machineTypes.find(mt => mt.id === cl.machineTypeId)?.name || cl.machineType?.name || t('manage.unassigned')}
                                                                    </span>
                                                                </td>
                                                                {isEngineer && (
                                                                    <td className="px-4 py-2">
                                                                        <div className="flex gap-1 justify-center">
                                                                            <button onClick={() => openEditModal('checkList', cl.id)} className="p-1.5 rounded-md text-blue-500 hover:bg-blue-50" title={t('manage.edit')}><FaEdit /></button>
                                                                            <button onClick={() => setDeleteModal({ isOpen: true, type: 'checkList', id: cl.id })} className="p-1.5 rounded-md text-red-500 hover:bg-red-50" title={t('manage.delete')}><FaTrash /></button>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}

                                            {/* Danh sách câu hỏi - MOBILE */}
                                            <div className="md:hidden divide-y divide-gray-100">
                                                {catCheckLists.map(cl => (
                                                    <div key={cl.id} className="flex items-start justify-between px-3 py-2 gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm text-gray-800">{cl.questionCheck}</p>
                                                            <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                                                                {machineTypes.find(mt => mt.id === cl.machineTypeId)?.name || cl.machineType?.name || t('manage.unassigned')}
                                                            </span>
                                                        </div>
                                                        {isEngineer && (
                                                            <div className="flex gap-1.5 shrink-0">
                                                                <button onClick={() => openEditModal('checkList', cl.id)} className="p-2.5 rounded-lg text-blue-500 bg-blue-50 hover:bg-blue-100"><FaEdit /></button>
                                                                <button onClick={() => setDeleteModal({ isOpen: true, type: 'checkList', id: cl.id })} className="p-2.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100"><FaTrash /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ============ MODALS ============ */}
            <Modal open={itemModal.isOpen} title={modalTitle()} onClose={closeItemModal} onSave={handleSave}>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            {itemModal.type === 'checkList' ? t('manage.questionContent') : t('manage.name')}
                        </label>
                        {itemModal.type === 'checkList' ? (
                            <textarea
                                value={inputName}
                                onChange={e => setInputName(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder={t('manage.questionPlaceholder')}
                            />
                        ) : (
                            <input
                                type="text"
                                value={inputName}
                                onChange={e => setInputName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder={t('manage.namePlaceholder')}
                            />
                        )}
                    </div>

                    {itemModal.type === 'line' && (
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">{t('manage.areaPart')}</label>
                            <input
                                type="text"
                                value={inputArea}
                                onChange={e => setInputArea(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder={t('manage.areaPlaceholder')}
                            />
                        </div>
                    )}

                    {(itemModal.type === 'machine' || itemModal.type === 'checkList') && (
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">{t('manage.tabMachineType')}</label>
                            <CustomSelect
                                options={[
                                    { value: '', label: t('manage.selectMachineType') },
                                    ...machineTypes.map(mt => ({ value: String(mt.id), label: mt.name }))
                                ]}
                                value={String(inputMachineTypeId)}
                                onChange={(val) => setInputMachineTypeId(val ? Number(val) : '')}
                                isSearchable={true}
                            />
                        </div>
                    )}
                </div>
            </Modal>

            <ConfirmModal
                open={deleteModal.isOpen}
                type="danger"
                title={t('manage.deleteConfirmTitle')}
                message={t('manage.deleteConfirmMessage')}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, type: 'line' })}
            />
        </div>
    );
};

export default EngCheckSheetManage;

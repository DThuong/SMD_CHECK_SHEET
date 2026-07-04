/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaSave, FaPaperPlane, FaHistory, FaCamera, FaTrash, FaSearchPlus, FaEye, FaChevronDown, FaChevronRight, FaPen, FaUndo } from 'react-icons/fa';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import CustomSelect from '../../components/general/CustomSelect';
import {
    fetchEngSessionById,
    fetchEngCheckListResultsBySession,
    fetchEngStatusHistoryBySession,
    fetchEngCategories,
    fetchEngCheckLists,
    fetchEngMachines,
    fetchEngMachineTypes,
    bulkUpdateEngCheckListResults,
    bulkResultEngByMachine,
    updateEngSessionStatus,
    clearCurrentEngSession,
    fetchEngImagesBySession,
    uploadEngImage,
    deleteEngImage,
} from '../../redux/slices/engSlice';
import type { CheckList, CheckListResult, EngImage } from '../../redux/slices/engSlice';
import { ConfirmModal } from '../../components/general/ConfirmModal';
import {
    ImagePreviewCarousel,
    type PreviewCarouselState,
    EMPTY_PREVIEW_CAROUSEL,
} from '../../components/general/ImagePreviewCarousel';
import LoadingSpinner from '../../components/general/LoadingSpinner';
import type { EngSharedProps } from '../managers_role/EngCheckSheet';

export type ImgType = 'Before' | 'After' | 'Evidence';

interface LocalAnswer {
    result: string;
    note: string;
    resultId?: number;
}

const answerKey = (machineId: number, checkListId: number) => `${machineId}_${checkListId}`;

const STATUS_STYLES: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Submitted: 'bg-green-100 text-green-700',
};

const EngCheckListDetail: React.FC<EngSharedProps> = ({ user, goToView, activeTab }) => {
    const { t } = useTranslation('engCheckSheet');
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const sessionId = Number(searchParams.get('id'));

    const {
        currentSession, checkListResults, statusHistories,
        categories, checkLists, machines, machineTypes, images, loading,
    } = useAppSelector(state => state.eng);

    const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});
    const [currentMachineIndex, setCurrentMachineIndex] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [submitConfirm, setSubmitConfirm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Check OK toàn bộ câu hỏi của máy hiện tại (API bulk-result)
    const [bulkOkConfirm, setBulkOkConfirm] = useState(false);
    const [bulkOkLoading, setBulkOkLoading] = useState(false);

    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    const toggleCategory = (catId: string) => setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [imgModal, setImgModal] = useState<{ open: boolean; machineId: number; checkListId: number; resultId?: number }>({ open: false, machineId: 0, checkListId: 0 });
    const [imagePreview, setImagePreview] = useState<PreviewCarouselState>(EMPTY_PREVIEW_CAROUSEL);

    // Xử lý upload ảnh + ghi chú-------
    const [imgNoteModal, setImgNoteModal] = useState<{
        open: boolean;
        typeImage: ImgType;
        file: File | null;
        note: string;
        uploading: boolean;
    }>({ open: false, typeImage: 'Evidence', file: null, note: '', uploading: false });

    // ------- Load data -------
    useEffect(() => {
        if (!sessionId) return;
        dispatch(fetchEngSessionById(sessionId));
        dispatch(fetchEngCheckListResultsBySession(sessionId));
        dispatch(fetchEngStatusHistoryBySession(sessionId));
        dispatch(fetchEngCategories());
        dispatch(fetchEngCheckLists());
        dispatch(fetchEngMachines());
        dispatch(fetchEngMachineTypes());
        dispatch(fetchEngImagesBySession(sessionId));
        return () => { dispatch(clearCurrentEngSession()); };
    }, [dispatch, sessionId]);

    const lineMachines = useMemo(
        () => machines.filter(m => m.lineId === currentSession?.lineId),
        [machines, currentSession?.lineId]
    );

    useEffect(() => {
        if (!checkListResults || checkListResults.length === 0) return;
        setAnswers(prev => {
            const next = { ...prev };
            checkListResults.forEach((r: CheckListResult) => {
                const key = answerKey(r.machineId, r.checkListId);
                next[key] = { result: r.result || '', note: r.note || '', resultId: r.id };
            });
            return next;
        });
    }, [checkListResults]);

    const sheetType = currentSession?.sheetType || (activeTab === 'daily' ? '1' : '7');
    const selectedMachine = lineMachines[currentMachineIndex] || null;

    const questionGroups = useMemo(() => {
        if (!selectedMachine) return [];
        return categories
            .filter(c => c.sheetType === sheetType)
            .map(cat => ({
                category: cat,
                items: checkLists.filter(
                    (cl: CheckList) => cl.categoryId === cat.id && cl.machineTypeId === selectedMachine.machineTypeId
                ),
            }))
            .filter(g => g.items.length > 0);
    }, [categories, checkLists, selectedMachine, sheetType]);

    const { totalQuestions, answeredQuestions } = useMemo(() => {
        let total = 0, answered = 0;
        lineMachines.forEach(m => {
            const qs = checkLists.filter(cl =>
                cl.machineTypeId === m.machineTypeId &&
                categories.some(c => c.id === cl.categoryId && c.sheetType === sheetType)
            );
            total += qs.length;
            qs.forEach(q => {
                if (answers[answerKey(m.id, q.id)]?.result) answered += 1;
            });
        });
        return { totalQuestions: total, answeredQuestions: answered };
    }, [lineMachines, checkLists, categories, sheetType, answers]);

    const isEngineer = user?.role?.toLowerCase() === 'eng';
    const isEditable = isEngineer && currentSession?.status === 'Pending';

    // ------- Handlers -------
    const setResult = (machineId: number, checkListId: number, result: string) => {
        if (!isEditable) return;
        const key = answerKey(machineId, checkListId);
        setAnswers(prev => ({
            ...prev,
            [key]: { ...prev[key], note: prev[key]?.note || '', result: prev[key]?.result === result ? '' : result }
        }));
    };

    const setNote = (machineId: number, checkListId: number, note: string) => {
        const key = answerKey(machineId, checkListId);
        setAnswers(prev => ({
            ...prev,
            [key]: { ...prev[key], result: prev[key]?.result || '', note }
        }));
    };

    const buildBulkPayload = (): Partial<CheckListResult>[] => {
        const payload: Partial<CheckListResult>[] = [];
        lineMachines.forEach(m => {
            const qs = checkLists.filter(cl =>
                cl.machineTypeId === m.machineTypeId &&
                categories.some(c => c.id === cl.categoryId && c.sheetType === sheetType)
            );
            qs.forEach(q => {
                const a = answers[answerKey(m.id, q.id)];
                if (a?.result) {
                    payload.push({
                        ...(a.resultId ? { id: a.resultId } : {}),
                        vehicleSheetSessionId: sessionId,
                        checkListId: q.id,
                        machineId: m.id,
                        result: a.result,
                        note: a.note || '',
                    });
                }
            });
        });
        return payload;
    };

    const handleSave = async (silent = false): Promise<boolean> => {
        const payload = buildBulkPayload();
        if (payload.length === 0) {
            if (!silent) toast.error(t('detail.toast.noResultToSave'));
            return false;
        }
        setSaving(true);
        try {
            await dispatch(bulkUpdateEngCheckListResults({ sessionId, data: payload })).unwrap();
            if (!silent) toast.success(t('detail.toast.saveSuccess'));
            return true;
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : t('detail.toast.saveFailed'));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitConfirm(false);
        if (answeredQuestions < totalQuestions) {
            toast.error(t('detail.toast.unanswered', { count: totalQuestions - answeredQuestions }));
            return;
        }
        const saved = await handleSave(true);
        if (!saved) return;
        try {
            await dispatch(updateEngSessionStatus({ id: sessionId, status: 'Submitted' })).unwrap();
            toast.success(t('detail.toast.submitSuccess'));
            dispatch(fetchEngStatusHistoryBySession(sessionId));
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : t('detail.toast.submitFailed'));
        }
    };

    // Check OK toàn bộ câu hỏi của máy đang chọn (PATCH /CheckListResult/session/{id}/machine/{id}/bulk-result)
    const handleBulkOkMachine = async () => {
        setBulkOkConfirm(false);
        if (!selectedMachine || !isEditable) return;
        setBulkOkLoading(true);
        try {
            await dispatch(bulkResultEngByMachine({
                sessionId,
                machineId: selectedMachine.id,
                result: 'OK',
            })).unwrap();

            // Đồng bộ local: set OK cho tất cả câu của máy này
            const machineQuestions = checkLists.filter(cl =>
                cl.machineTypeId === selectedMachine.machineTypeId &&
                categories.some(c => c.id === cl.categoryId && c.sheetType === sheetType)
            );
            setAnswers(prev => {
                const next = { ...prev };
                machineQuestions.forEach(q => {
                    const key = answerKey(selectedMachine.id, q.id);
                    next[key] = { ...next[key], result: 'OK', note: next[key]?.note || '' };
                });
                return next;
            });

            // Refetch để lấy id các CheckListResult backend vừa tạo/cập nhật
            dispatch(fetchEngCheckListResultsBySession(sessionId));
            toast.success(t('detail.toast.okAllSuccess', { name: selectedMachine.machineName }));
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : t('detail.toast.okAllFailed'));
        } finally {
            setBulkOkLoading(false);
        }
    };

    // {t('detail.backToList')} + lưu session id vào localStorage để highlight
    const handleBack = () => {
        if (sessionId) {
            localStorage.setItem('eng_highlight_session', JSON.stringify({ id: sessionId, ts: Date.now() }));
        }
        goToView('list');
    };

    // Mở Modal Quản lý ảnh (Nếu chưa lưu, tự động Save để sinh ID)
    const openImageModal = async (machineId: number, checkListId: number) => {
        const a = answers[answerKey(machineId, checkListId)];
        if (!a?.resultId) {
            if (!isEditable) return; // Nếu ko được sửa và chưa lưu -> ko có hình
            if (!a?.result) {
                toast.error(t('detail.toast.selectResultFirst'));
                return;
            }
            toast.loading(t('detail.toast.initSaving'), { id: 'auto-save' });
            const saved = await handleSave(true);
            if (!saved) {
                toast.dismiss('auto-save');
                return;
            }
            // Fetch lại để lấy ID mới
            try {
                const results = await dispatch(fetchEngCheckListResultsBySession(sessionId)).unwrap();
                const r = results.find((x: any) => x.machineId === machineId && x.checkListId === checkListId);
                if (r) {
                    toast.dismiss('auto-save');
                    setImgModal({ open: true, machineId, checkListId, resultId: r.id });
                    return;
                }
            } catch (e) {}
            toast.error(t('detail.toast.errorRetry'), { id: 'auto-save' });
            return;
        }
        setImgModal({ open: true, machineId, checkListId, resultId: a.resultId });
    };

    // Trigger input file cho một loại ảnh cụ thể (Evidence / Before / After)
    const triggerUpload = (typeImage: ImgType) => {
        setImgNoteModal(prev => ({ ...prev, open: false, typeImage, file: null, note: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    // Đóng dấu thời gian chụp lên ảnh: vẽ bubble bo tròn nền đen mờ + chữ trắng
    // ở góc phải dưới bằng canvas, xuất lại JPEG. Lỗi ở bước nào thì trả ảnh gốc.
    const stampTimestampOnImage = (file: File): Promise<File> =>
        new Promise((resolve) => {
            try {
                const url = URL.createObjectURL(file);
                const img = new Image();

                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            URL.revokeObjectURL(url);
                            resolve(file);
                            return;
                        }
                        ctx.drawImage(img, 0, 0);

                        const now = new Date();
                        const pad = (n: number) => String(n).padStart(2, '0');
                        const text = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

                        // Scale kích thước bubble theo ảnh để không quá to/nhỏ
                        const base = Math.max(canvas.width, canvas.height);
                        const fontSize = Math.max(14, Math.round(base * 0.022));
                        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
                        const paddingX = Math.round(fontSize * 0.7);
                        const paddingY = Math.round(fontSize * 0.45);
                        const textWidth = ctx.measureText(text).width;
                        const bubbleW = textWidth + paddingX * 2;
                        const bubbleH = fontSize + paddingY * 2;
                        const margin = Math.round(fontSize * 0.6);
                        const x = canvas.width - bubbleW - margin;
                        const y = canvas.height - bubbleH - margin;
                        const radius = Math.round(bubbleH / 2);

                        ctx.beginPath();
                        if (typeof (ctx as any).roundRect === 'function') {
                            (ctx as any).roundRect(x, y, bubbleW, bubbleH, radius);
                        } else {
                            // Fallback trình duyệt cũ: tự vẽ path bo tròn
                            ctx.moveTo(x + radius, y);
                            ctx.lineTo(x + bubbleW - radius, y);
                            ctx.arcTo(x + bubbleW, y, x + bubbleW, y + radius, radius);
                            ctx.lineTo(x + bubbleW, y + bubbleH - radius);
                            ctx.arcTo(x + bubbleW, y + bubbleH, x + bubbleW - radius, y + bubbleH, radius);
                            ctx.lineTo(x + radius, y + bubbleH);
                            ctx.arcTo(x, y + bubbleH, x, y + bubbleH - radius, radius);
                            ctx.lineTo(x, y + radius);
                            ctx.arcTo(x, y, x + radius, y, radius);
                            ctx.closePath();
                        }
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                        ctx.fill();

                        ctx.fillStyle = '#ffffff';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(text, x + paddingX, y + bubbleH / 2 + 1);

                        canvas.toBlob(
                            (blob) => {
                                URL.revokeObjectURL(url);
                                if (!blob) {
                                    resolve(file);
                                    return;
                                }
                                const stampedName = `${file.name.replace(/\.[^.]+$/, '') || 'photo'}_stamped.jpg`;
                                resolve(new File([blob], stampedName, { type: 'image/jpeg' }));
                            },
                            'image/jpeg',
                            0.92,
                        );
                    } catch {
                        URL.revokeObjectURL(url);
                        resolve(file);
                    }
                };

                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve(file);
                };

                img.src = url;
            } catch {
                resolve(file);
            }
        });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Đóng dấu timestamp trước khi preview/upload — preview trong modal note
        // sẽ hiển thị đúng ảnh đã có bubble giờ chụp.
        const stamped = await stampTimestampOnImage(file);

        setImgNoteModal(prev => ({
            ...prev,
            open: true,
            file: stamped,
            note: '',
            uploading: false,
        }));
    };

    const confirmUploadImage = async () => {
        const { file, note, typeImage } = imgNoteModal;
        const resultId = imgModal.resultId;
        if (!file || !resultId) return;

        if (!note.trim()) {
            toast.error(t('detail.toast.noteImageRequired'));
            return;
        }

        setImgNoteModal(prev => ({ ...prev, uploading: true }));

        const formData = new FormData();
        formData.append('image', file);
        formData.append('note', note); 
        formData.append('imageType', typeImage);

        try {
            toast.loading(t('detail.toast.uploadingImg'), { id: 'upload-toast' });
            await dispatch(uploadEngImage({ checkListResultId: resultId, formData })).unwrap();
            toast.success(t('detail.toast.uploadImgSuccess'), { id: 'upload-toast' });
            // Cập nhật mảng images
            dispatch(fetchEngImagesBySession(sessionId));
            setImgNoteModal(prev => ({ ...prev, open: false }));
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : t('detail.toast.uploadImgFailed'), { id: 'upload-toast' });
        } finally {
            setImgNoteModal(prev => ({ ...prev, uploading: false }));
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteImage = async (imageId: number) => {
        if (!isEditable) return;
        if (!window.confirm(t('detail.toast.confirmDeleteImg'))) return;
        try {
            toast.loading(t('detail.toast.deletingImg'), { id: 'delete-toast' });
            await dispatch(deleteEngImage(imageId)).unwrap();
            toast.success(t('detail.toast.deleteImgSuccess'), { id: 'delete-toast' });
            dispatch(fetchEngImagesBySession(sessionId));
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : t('detail.toast.deleteImgFailed'), { id: 'delete-toast' });
        }
    };

    // ==========================================
    // RENDER THÀNH PHẦN
    // ==========================================
    if (!sessionId) {
        return (
            <div className="text-center py-12 text-gray-400">
                {t('detail.notFound')}
                <button onClick={() => goToView('list')} className="block mx-auto mt-3 text-blue-600 underline">{t('detail.backToList')}</button>
            </div>
        );
    }

    if (loading && !currentSession) {
        return <LoadingSpinner size="sm" message={t('detail.loading')} />;
    }

    const renderPagination = () => (
        <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm gap-3 md:gap-4">
            <div className="w-full md:flex-1 md:order-2 z-20">
                <div className="relative w-full">
                    <CustomSelect
                        options={lineMachines.map((m, idx) => ({
                            value: String(idx),
                            label: `Máy ${idx + 1}/${lineMachines.length}: ${m.machineName}`
                        }))}
                        value={String(currentMachineIndex)}
                        onChange={(val) => setCurrentMachineIndex(Number(val))}
                        isSearchable={true}
                        className="w-full text-sm font-semibold shadow-sm"
                    />
                </div>
            </div>

            <div className="flex w-full md:w-auto md:contents gap-3">
                <button
                    onClick={() => setCurrentMachineIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentMachineIndex === 0}
                    className="flex-1 md:flex-none md:order-1 px-3 md:px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap text-center"
                >
                    &larr; {t('detail.prevMachine')}
                </button>
                <button
                    onClick={() => setCurrentMachineIndex(prev => Math.min(lineMachines.length - 1, prev + 1))}
                    disabled={currentMachineIndex === lineMachines.length - 1}
                    className="flex-1 md:flex-none md:order-3 px-3 md:px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap text-center"
                >
                    {t('detail.nextMachine')} &rarr;
                </button>
            </div>

            {/* Check OK toàn bộ câu hỏi của máy hiện tại */}
            {isEditable && (
                <button
                    onClick={() => setBulkOkConfirm(true)}
                    disabled={bulkOkLoading}
                    className="w-full md:w-auto md:order-4 px-4 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                    title="Đánh dấu OK cho toàn bộ câu hỏi của máy này"
                >
                    <FaCheck /> {bulkOkLoading ? t('detail.processing') : t('detail.okAll')}
                </button>
            )}
        </div>
    );

    const renderImgCol = (type: ImgType, label: string, colorClass: string) => {
        const modalImages = images.filter((img: EngImage) => img.checkListResultId === imgModal.resultId);
        const typeImages = modalImages.filter(i => i.imageType === type);
        
        return (
            <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden h-full shadow-sm">
                <div className="px-4 py-3 bg-white border-b border-gray-200 text-sm font-bold flex justify-between items-center">
                    <span className="flex items-center gap-2 text-slate-800">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorClass}`} />
                        {label}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold">{typeImages.length}</span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto max-h-[40vh] md:max-h-[50vh] bg-gray-50">
                    {typeImages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8 opacity-60">
                            <FaCamera className="text-3xl mb-2" />
                            <p className="text-xs italic">{t('detail.noImage')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                            {typeImages.map(img => (
                                <div key={img.id} 
                                     className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white cursor-pointer hover:shadow-md transition-all" 
                                     onClick={() => {
                                         setImagePreview({
                                             open: true,
                                             index: typeImages.findIndex(i => i.id === img.id),
                                             items: typeImages.map(i => ({
                                                 id: i.id,
                                                 url: i.imageUrl,
                                                 title: `${type} - ${label}`,
                                                 note: i.note || ''
                                             })),
                                             title: `${type} - ${label}`,
                                         });
                                     }}
                                >
                                    <img src={img.imageUrl} alt={type} className="w-full h-28 object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                        <FaSearchPlus className="text-white text-2xl drop-shadow-lg" />
                                    </div>
                                    {img.note && (
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1.5 px-2 text-white text-[11px] truncate pointer-events-none">
                                            {img.note}
                                        </div>
                                    )}
                                    {isEditable && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }} 
                                            className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-md transform hover:scale-110"
                                            title={t('detail.deleteImage')}
                                        >
                                            <FaTrash className="text-xs" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {isEditable && (
                    <div className="p-3 border-t border-gray-100 bg-white shadow-inner">
                        <button
                            onClick={() => triggerUpload(type)}
                            className="w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                        >
                            <FaCamera className={
                                type === 'Evidence' ? 'text-red-500' :
                                type === 'Before' ? 'text-amber-500' : 'text-emerald-500'
                            } /> {t('detail.uploadImage')}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full !max-w-full pb-28 animate-fade-in space-y-4! px-2 md:px-0">
            {/* Input file ẩn */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {/* Modal Quản lý hình ảnh */}
            {imgModal.open && (
                <div className="fixed inset-0 z-40 flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setImgModal({ open: false, machineId: 0, checkListId: 0, resultId: undefined })}>
                    <div className="bg-gray-100 rounded-none md:rounded-2xl shadow-2xl w-full max-w-6xl h-[100dvh] md:h-[90vh] flex flex-col overflow-hidden border-0 md:border md:border-white/20" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 md:p-5 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
                            <div>
                                <h3 className="text-lg md:text-xl font-extrabold text-gray-800 flex items-center gap-2">
                                    <FaCamera className="text-blue-500" /> {t('detail.manageImages')}
                                </h3>
                                <p className="text-xs md:text-sm text-gray-500 mt-1">{t('detail.machineType')}: {selectedMachine?.machineName}</p>
                            </div>
                            <button onClick={() => setImgModal({ open: false, machineId: 0, checkListId: 0, resultId: undefined })} className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                                <FaTimes className="text-lg" />
                            </button>
                        </div>
                        <div className="flex-1 p-3 md:p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                                {renderImgCol('Evidence', t('detail.evidence'), 'bg-red-500')}
                                {renderImgCol('Before', t('detail.before'), 'bg-amber-500')}
                                {renderImgCol('After', t('detail.after'), 'bg-emerald-500')}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Nhập Note Khi Upload */}
            {imgNoteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/20 transform transition-all scale-100">
                        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-sm ${
                                imgNoteModal.typeImage === 'Evidence' ? 'bg-red-500' :
                                imgNoteModal.typeImage === 'Before' ? 'bg-orange-500' : 'bg-emerald-500'
                            }`}>
                                {imgNoteModal.typeImage}
                            </span>
                            <h3 className="text-lg font-bold text-gray-800">{t('detail.imageNote')}</h3>
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto">
                            {imgNoteModal.file && (
                                <div className="mb-5 rounded-xl overflow-hidden border border-gray-200 bg-black flex items-center justify-center shadow-inner h-48">
                                    <img 
                                        src={URL.createObjectURL(imgNoteModal.file)} 
                                        alt="Preview" 
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('detail.noteRequired')}</label>
                            <textarea
                                value={imgNoteModal.note}
                                onChange={(e) => setImgNoteModal(prev => ({ ...prev, note: e.target.value }))}
                                placeholder={t('detail.noteImagePlaceholder')}
                                className="w-full p-3.5 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 outline-none resize-none min-h-[100px] text-gray-800 transition-colors"
                                disabled={imgNoteModal.uploading}
                                autoFocus
                            />
                        </div>
                        <div className="p-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
                            <button
                                onClick={() => setImgNoteModal({ open: false, typeImage: 'Evidence', file: null, note: '', uploading: false })}
                                disabled={imgNoteModal.uploading}
                                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmUploadImage}
                                disabled={imgNoteModal.uploading}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-200"
                            >
                                {imgNoteModal.uploading ? t('detail.uploading') : t('detail.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Carousel */}
            <ImagePreviewCarousel
                preview={imagePreview}
                onClose={() => setImagePreview(EMPTY_PREVIEW_CAROUSEL)}
            />

            {/* Header + Tiến độ */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm !w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                        <button
                            onClick={() => handleBack()}
                            className="shrink-0 self-start p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200"
                        >
                            <FaArrowLeft className="text-base" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-800 leading-tight">
                                Check Sheet #{currentSession?.id} · {currentSession?.lineName || `Line ${currentSession?.lineId}`}
                            </h1>
                            <p className="text-sm font-medium text-gray-500 mt-1">
                                {sheetType === '1' ? t('detail.checkDaily') : t('detail.checkWeekly')}
                                {currentSession?.sessionShift ? ` · ${currentSession.sessionShift}` : ''}
                                {currentSession?.fullName ? ` · ${currentSession.fullName}` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${STATUS_STYLES[currentSession?.status || ''] || 'bg-gray-100 text-gray-600'}`}>
                            {currentSession?.status}
                        </span>
                        <button
                            onClick={() => setShowHistory(v => !v)}
                            className={`p-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border shadow-sm ${showHistory ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                            title={t('detail.history')}
                        >
                            <FaHistory className="text-sm" />
                            <span className="hidden md:inline">{t('detail.history')}</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-5">
                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{t('detail.progress')}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                            className={`h-full transition-all duration-500 ${totalQuestions > 0 && answeredQuestions === totalQuestions ? 'bg-green-500' : 'bg-blue-600'}`}
                            style={{ width: totalQuestions ? `${(answeredQuestions / totalQuestions) * 100}%` : '0%' }}
                        />
                    </div>
                    <span className="text-sm font-black text-gray-700 whitespace-nowrap bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                        {answeredQuestions}/{totalQuestions}
                    </span>
                </div>
            </div>

            {/* Status history */}
            {showHistory && (
                <div className="bg-gray-900 rounded-2xl p-5 shadow-lg animate-fade-in !w-full text-white">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t('detail.statusHistory')}</h3>
                    {statusHistories.length === 0 ? (
                        <p className="text-sm text-gray-500">{t('detail.noHistory')}</p>
                    ) : (
                        <div className="space-y-3">
                            {statusHistories.map(h => (
                                <div key={h.id} className="text-sm flex flex-wrap items-center gap-3">
                                    <span className="text-gray-400 font-medium">{h.createdAt ? new Date(h.createdAt).toLocaleString('vi-VN') : ''}</span>
                                    <span className="font-bold text-gray-100">{h.fullName}</span>
                                    <span className="text-gray-500 bg-white/10 px-2 py-0.5 rounded text-xs">{h.role}</span>
                                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${h.status === 'Submitted' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                                        {h.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {lineMachines.length > 0 && renderPagination()}

            {/* Khu vực danh sách câu hỏi dạng Bảng (Table) */}
            <div className="space-y-6 !w-full">
                {selectedMachine && questionGroups.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 text-sm bg-white border border-gray-200 rounded-2xl shadow-sm">
                        {t('detail.noQuestions')}
                    </div>
                ) : (
                    <div className="space-y-4!">
                        {questionGroups.map(group => {
                            const categoryKey = group.category.id.toString();
                            const isCategoryCollapsed = !!collapsedCategories[categoryKey];

                            return (
                                <div key={group.category.id} className="border border-gray-200 overflow-hidden rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(categoryKey)}
                                        className="w-full bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between gap-3 text-left hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-gray-500 shrink-0">
                                                {isCategoryCollapsed ? <FaChevronRight size={13} /> : <FaChevronDown size={13} />}
                                            </span>
                                            <h4 className="font-semibold text-gray-700 mb-0 wrap-break-words">
                                                {group.category.name}
                                            </h4>
                                        </div>
                                        <span className="bg-white px-2 py-0.5 rounded text-xs font-semibold text-gray-500 border border-gray-200 shadow-sm shrink-0">
                                            {group.items.filter(q => answers[answerKey(selectedMachine!.id, q.id)]?.result).length} / {group.items.length}
                                        </span>
                                    </button>

                                    {!isCategoryCollapsed && (
                                        <>
                                            {/* Mobile View */}
                                            <div className="md:hidden divide-y divide-gray-100 bg-white">
                                                {group.items.map((q) => {
                                                    const key = answerKey(selectedMachine!.id, q.id);
                                                    const a = answers[key];
                                                    const questionImages = images.filter((img: EngImage) => img.checkListResultId === a?.resultId);

                                                    return (
                                                        <div key={q.id} className="p-4 flex flex-col gap-4 hover:bg-gray-50 transition-colors">
                                                            {/* 1. Câu hỏi */}
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800 leading-relaxed">
                                                                    {q.questionCheck}
                                                                </p>
                                                            </div>
                                                            {/* 2. Kết quả */}
                                                            <div className="flex flex-col gap-2">
                                                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('detail.result')}</span>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <button
                                                                        onClick={() => setResult(selectedMachine!.id, q.id, 'OK')}
                                                                        disabled={!isEditable}
                                                                        className={`py-3 text-sm font-bold border transition-all rounded-lg flex items-center justify-center ${
                                                                            a?.result === 'OK' ? 'bg-green-600 text-white border-green-600 shadow-md scale-[1.02]' : 'bg-white text-gray-500 border-gray-300 active:bg-gray-100'
                                                                        }`}
                                                                    >OK</button>
                                                                    <button
                                                                        onClick={() => setResult(selectedMachine!.id, q.id, 'NG')}
                                                                        disabled={!isEditable}
                                                                        className={`py-3 text-sm font-bold border transition-all rounded-lg flex items-center justify-center ${
                                                                            a?.result === 'NG' ? 'bg-red-600 text-white border-red-600 shadow-md scale-[1.02]' : 'bg-white text-gray-500 border-gray-300 active:bg-gray-100'
                                                                        }`}
                                                                    >NG</button>
                                                                </div>
                                                                {a?.result === 'NG' && (
                                                                    <div className="mt-2">
                                                                        <input
                                                                            type="text"
                                                                            value={a?.note || ''}
                                                                            onChange={e => setNote(selectedMachine!.id, q.id, e.target.value)}
                                                                            disabled={!isEditable}
                                                                            placeholder={t('detail.ngNotePlaceholder')}
                                                                            className="w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none p-3 bg-gray-50"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* 3. Hành động */}
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('detail.actions')}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openImageModal(selectedMachine!.id, q.id)}
                                                                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 active:bg-gray-100"
                                                                >
                                                                    {isEditable ? <FaCamera className="text-blue-600" /> : <FaEye className="text-blue-600" />}
                                                                    <span>{isEditable ? t('detail.manageImgBtn') : t('detail.viewImgBtn')}</span>
                                                                    {questionImages.length > 0 && (
                                                                        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">
                                                                            {questionImages.length}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Desktop Table View */}
                                            <div className="hidden md:block overflow-x-auto bg-white">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b border-gray-200">
                                                            <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[50%]">Hạng mục kiểm tra</th>
                                                            <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[30%]">{t('detail.result')}</th>
                                                            <th className="p-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-[20%]">{t('detail.actions')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {group.items.map((q) => {
                                                            const key = answerKey(selectedMachine!.id, q.id);
                                                            const a = answers[key];
                                                            const questionImages = images.filter((img: EngImage) => img.checkListResultId === a?.resultId);

                                                            return (
                                                                <React.Fragment key={q.id}>
                                                                    <tr className="hover:bg-gray-50 transition-colors">
                                                                        <td className="p-3 text-sm text-gray-800">{q.questionCheck}</td>
                                                                        <td className="p-3">
                                                                            <div className="flex flex-col gap-2">
                                                                                <div className="flex gap-1.5">
                                                                                    <button
                                                                                        onClick={() => setResult(selectedMachine!.id, q.id, 'OK')}
                                                                                        disabled={!isEditable}
                                                                                        className={`px-3 py-1 text-xs font-bold border transition-all rounded ${
                                                                                            a?.result === 'OK' ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                                                                                        }`}
                                                                                    >OK</button>
                                                                                    <button
                                                                                        onClick={() => setResult(selectedMachine!.id, q.id, 'NG')}
                                                                                        disabled={!isEditable}
                                                                                        className={`px-3 py-1 text-xs font-bold border transition-all rounded ${
                                                                                            a?.result === 'NG' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                                                                                        }`}
                                                                                    >NG</button>
                                                                                </div>
                                                                                {a?.result === 'NG' && (
                                                                                    <input
                                                                                        type="text"
                                                                                        value={a?.note || ''}
                                                                                        onChange={e => setNote(selectedMachine!.id, q.id, e.target.value)}
                                                                                        disabled={!isEditable}
                                                                                        placeholder={t('detail.ngNotePlaceholder')}
                                                                                        className="w-full text-xs border-b border-gray-300 focus:border-blue-500 outline-none py-1 bg-transparent"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3">
                                                                            <div className="flex items-center justify-center">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => openImageModal(selectedMachine!.id, q.id)}
                                                                                    className="relative inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                                                                >
                                                                                    {isEditable ? <FaCamera className="text-blue-600" /> : <FaEye className="text-blue-600" />}
                                                                                    <span className="hidden lg:inline">{isEditable ? t('detail.manageImgBtn') : t('detail.viewImgBtn')}</span>
                                                                                    {questionImages.length > 0 && (
                                                                                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                                                                                            {questionImages.length}
                                                                                        </span>
                                                                                    )}
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {lineMachines.length > 0 && questionGroups.length > 0 && renderPagination()}

            {/* Spacer trong luồng nội dung: giữ chỗ cho action bar fixed,
                đảm bảo cuộn hết luôn còn khoảng trống, không bị bar đè lên nội dung */}
            <div aria-hidden className="h-24 md:h-20" />

            {/* Action Bar - Fixed at bottom like Patrol */}
            <div
                className="eng-action-bar fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 px-4 pt-3"
                style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
            >
                <div className="flex flex-row gap-3 w-full">
                    {/* Back — luôn hiển thị */}
                    <button
                        onClick={() => handleBack()}
                        className="flex-1! px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <FaArrowLeft /> Quay lại
                    </button>

                    {isEditable && (
                        <button
                            onClick={() => setSubmitConfirm(true)}
                            disabled={saving}
                            className="flex-1! px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                            <FaPaperPlane /> Nộp Sheet
                        </button>
                    )}
                    
                    {!isEditable && (
                        <div className="flex-1! px-6 py-3 bg-gray-100 text-gray-500 font-semibold text-sm flex items-center justify-center gap-2 border border-gray-200">
                            🔒 {currentSession?.status === 'Submitted' ? 'Đã Nộp' : 'Không thể sửa'}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={bulkOkConfirm}
                type="info"
                title="Check OK toàn bộ"
                message={`Đánh dấu OK cho TẤT CẢ câu hỏi của máy "${selectedMachine?.machineName || ''}"? Các kết quả đã chọn trước đó của máy này sẽ bị ghi đè thành OK.`}
                onConfirm={handleBulkOkMachine}
                onCancel={() => setBulkOkConfirm(false)}
            />

            <ConfirmModal
                open={submitConfirm}
                type="info"
                title="Xác nhận nộp Check Sheet"
                message={`Bạn đang nộp check sheet với ${answeredQuestions}/${totalQuestions} câu đã kiểm tra. Hãy chắc chắn rằng bạn đã kiểm tra và điền đầy đủ các máy. Sau khi nộp sẽ không thể chỉnh sửa.`}
                onConfirm={handleSubmit}
                onCancel={() => setSubmitConfirm(false)}
            />
        </div>
    );
};

export default EngCheckListDetail;


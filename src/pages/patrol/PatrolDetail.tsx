import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FaArrowLeft, FaCheck, FaImage, FaPen, FaTrash, FaPlus, FaHistory, FaUndo } from 'react-icons/fa';
import MultiImageUpload from '../../components/files/MultiImageUpload';
import type { PatrolSharedProps } from './types';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  createPatrolSession,
  updatePatrolSessionStatus,
  rejectPatrolSessionStatus,
  fetchStages,
  fetchCategories,
  fetchCheckLists,
  fetchLineAreas,
  createCheckListResult,
  updateCheckListResult,
  uploadImage,
  deleteImage,
  fetchImagesBySession,
  fetchCheckListResultsBySession,
  fetchPatrolSessionById,
  fetchStatusHistoryBySession,
  type StatusHistory,
  type ImageModel,
} from '../../redux/slices/patrolSlice';
import Modal from '../../components/general/Modal';
import { clearPatrolNavState, readPatrolNavState, savePatrolDashboardState } from '../../utils/patrolNavState';
const PatrolDetail: React.FC<PatrolSharedProps> = ({
  user, goToView, setPreviewImage
}) => {
  const { t } = useTranslation('patrol');
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const sheetId = searchParams.get('id');
  const navigate = useNavigate();
  const isNew = sheetId === 'new';

  // Force Vietnamese for PQC role
  const pT = (key: string, options?: any) => {
    if (user?.role === 'PQC') return t(key, { ...options, lng: 'vi' }) as any;
    return t(key, options) as any;
  };

  const { sessions, stages, categories, checkLists, lineAreas, checkListResults, images, loading, statusHistories } = useAppSelector(state => state.patrol);
  const getImageUrl = (img: ImageModel) => img.imageUrl || '';


  const [formResults, setFormResults] = useState<Record<number, { id?: number, result: string, actualValue: string, note: string }>>({});
  const [formLineId, setFormLineId] = useState<number>(0);
  const [formPatrolType, setFormPatrolType] = useState<string>('1'); // "1": Daily, "7": Weekly
  const [isLineSelectOpen, setIsLineSelectOpen] = useState(false);
  const lineSelectRef = useRef<HTMLDivElement>(null);
  const [noteModal, setNoteModal] = useState<{ open: boolean; file: File | null }>({ open: false, file: null });
  const [pendingNote, setPendingNote] = useState('');
  const session = useMemo(() => isNew ? null : sessions.find(s => s.id === Number(sheetId)), [sessions, sheetId, isNew]);


  useEffect(() => {
    dispatch(fetchStages());
    dispatch(fetchCategories());
    dispatch(fetchCheckLists());
    dispatch(fetchLineAreas());
    if (isNew) {
      const saved = readPatrolNavState();
      if (saved?.type === 'weekly') {
        setFormPatrolType('7');
      }
      // Không clear vì back button vẫn cần
    }
    if (!isNew && sheetId) {
      dispatch(fetchPatrolSessionById(Number(sheetId)));
      dispatch(fetchCheckListResultsBySession(Number(sheetId)));
      dispatch(fetchImagesBySession(Number(sheetId)));
      dispatch(fetchStatusHistoryBySession(Number(sheetId)));
    }
  }, [dispatch, sheetId, isNew]);

  useEffect(() => {
    if (session) {
      setFormLineId(session.lineAreaId);
      setFormPatrolType(session.patrolType);
    }
  }, [session]);

  useEffect(() => {
    const resultsMap: Record<number, { id?: number, result: string, actualValue: string, note: string }> = {};
    checkListResults.forEach(r => {
      resultsMap[r.checkListId] = { id: r.id, result: r.result, actualValue: r.actualValue, note: r.note };
    });
    setFormResults(resultsMap);
  }, [checkListResults]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (lineSelectRef.current && !lineSelectRef.current.contains(e.target as Node)) {
        setIsLineSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  const canEditResults = isNew || (session?.status === 'Pending' && user?.role === 'PQC');
  const canApprove = session?.status === 'Submitted' && user?.role === 'PQCLeader';

  // Cập nhật UI cục bộ ngay lập tức
  const handleLocalChange = (checkListId: number, field: 'result' | 'actualValue' | 'note', value: string) => {
    setFormResults(prev => ({
      ...prev,
      [checkListId]: {
        ...prev[checkListId],
        [field]: value
      }
    }));
  };

  // Đồng bộ với Server
  const handleSyncResult = async (checkListId: number) => {
    if (!canEditResults || isNew) return;

    const data = formResults[checkListId];
    if (!data) return;

    if (data.id) {
      await dispatch(updateCheckListResult({
        id: data.id,
        data: {
          result: data.result,
          actualValue: data.actualValue,
          note: data.note || '',
          checkAt: new Date().toISOString()
        }
      })).unwrap();
    } else {
      await dispatch(createCheckListResult({
        patrolSessionId: Number(sheetId),
        checkListId,
        result: data.result,
        actualValue: data.actualValue,
        note: data.note || '',
        checkAt: new Date().toISOString()
      })).unwrap();
      // Sau khi tạo mới, cần lấy lại kết quả để có ID cho lần update sau
      dispatch(fetchCheckListResultsBySession(Number(sheetId)));
    }
  };

  // Xử lý khi nhấn OK/NG (Cập nhật UI + Sync luôn)
  const handleResultButtonClick = async (checkListId: number, value: string) => {
    if (!canEditResults) return;
    handleLocalChange(checkListId, 'result', value);
    if (!isNew) {
      // Đợi local state cập nhật xong hoặc truyền giá trị trực tiếp vào sync
      const current = formResults[checkListId];
      if (current?.id) {
        await dispatch(updateCheckListResult({
          id: current.id,
          data: {
            result: value,
            actualValue: current.actualValue,
            note: current.note || '',
            checkAt: new Date().toISOString()
          }
        })).unwrap();
      } else {
        await dispatch(createCheckListResult({
          patrolSessionId: Number(sheetId),
          checkListId,
          result: value,
          actualValue: current?.actualValue || '',
          note: current?.note || '',
          checkAt: new Date().toISOString()
        })).unwrap();
        dispatch(fetchCheckListResultsBySession(Number(sheetId)));
      }
    }
  };

  const handleImageUpload = async (_fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditResults || isNew || !sheetId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingNote('');
    setNoteModal({ open: true, file });
  };

  const handleConfirmUpload = async () => {
    const file = noteModal.file;
    if (!file || !sheetId) return;
    setNoteModal({ open: false, file: null });
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('note', pendingNote);
      await dispatch(uploadImage({ sessionId: Number(sheetId), formData })).unwrap();
      dispatch(fetchImagesBySession(Number(sheetId)));
      toast.success(pT('msgUploadSuccess'));
    } catch (err: any) {
      toast.error(err);
    }
  };

  const handleRemoveImage = async (imgId: number) => {
    if (!canEditResults || isNew) return;
    await dispatch(deleteImage(imgId)).unwrap();
    dispatch(fetchImagesBySession(Number(sheetId)));
  };

  const handleCreateSession = async (status: string) => {
    if (!formLineId) {
      toast.error(pT('selectLineError'));
      return;
    }
    try {
      const res = await dispatch(createPatrolSession({
        patrolType: formPatrolType,
        lineAreaId: formLineId,
        status: status,
        note: ''
      })).unwrap();
      toast.success(pT('createSuccess'));
      goToView('detail', res.id.toString());
    } catch (err: any) {
      toast.error(err);
    }
  };

  const extractErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    if (err?.detail) return err.detail;
    return 'Đã xảy ra lỗi, vui lòng thử lại.';
  };

  const handleUpdateStatus = async (status: string) => {
    if (!sheetId) return;
    try {
      await dispatch(updatePatrolSessionStatus({ id: Number(sheetId), status })).unwrap();
      toast.success(pT('statusUpdated'));
      // Reload current sheet
      dispatch(fetchPatrolSessionById(Number(sheetId)));
      dispatch(fetchStatusHistoryBySession(Number(sheetId)));
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 3000 });
    }
  };

  const handleRejectStatus = async () => {
    if (!sheetId) return;
    try {
      await dispatch(rejectPatrolSessionStatus({ id: Number(sheetId) })).unwrap();
      toast.success(pT('statusRejected'));
      // Reload current sheet
      dispatch(fetchPatrolSessionById(Number(sheetId)));
      dispatch(fetchStatusHistoryBySession(Number(sheetId)));
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 3000 });
    }
  };

  const activeStages = stages.filter(s => s.patrolType === formPatrolType && s.isActive);
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Submitted': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Approved': return pT('statusApproved');
      case 'Submitted': return pT('statusSubmitted');
      default: return pT('statusPending');
    }
  };
  return (
    <>
      <Modal
        open={noteModal.open}
        title={pT('imageNoteTitle')}
        onClose={() => setNoteModal({ open: false, file: null })}
        onSave={handleConfirmUpload}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            File: <span className="font-medium text-gray-700">{noteModal.file?.name}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {pT('imageNote')} <span className="text-gray-400 font-normal">{pT('optional')}</span>
            </label>
            <input
              type="text"
              value={pendingNote}
              onChange={(e) => setPendingNote(e.target.value)}
              placeholder={pT('placeholderImageNote')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              autoFocus
            />
          </div>
        </div>
      </Modal>
      <div className="animate-fade-in space-y-4! mt-6! pb-20!">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 bg-white py-3 px-3 shadow-sm border border-gray-200 gap-3 text-center sm:text-left">
          <div className="flex items-center justify-start gap-3">
            <button onClick={() => {
              const saved = readPatrolNavState();
              if (saved?.fromDashboard && saved.dashboardReturnPath) {
                savePatrolDashboardState({
                  date: saved.dashboardDate || '',
                  page: saved.page,
                  highlightId: saved.highlightId || 0,
                });
                clearPatrolNavState();
                navigate(saved.dashboardReturnPath, {
                  state: {
                    from: 'sheetDetail',
                    dashboardState: {
                      sheetId: saved.highlightId,
                      fullDate: saved.dashboardDate,
                      date: saved.dashboardDate,
                      detailTablePage: saved.page,
                    },
                  },
                });
              } else {
                goToView('list', null, saved?.type || 'daily');
              }
            }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FaArrowLeft />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {isNew ? pT('createBtn') : `${pT('detailTitle')} #${sheetId}`}
            </h2>
          </div>
          {!isNew && session && (
            <span className={`w-fit px-3 py-1 rounded-full text-xs sm:text-sm font-bold self-center sm:self-center ${getStatusStyle(session.status)}`}>
              {getStatusLabel(session.status)}
            </span>
          )}
        </div>

        {isNew ? (
          <div className="bg-white shadow-sm border border-gray-200 p-4 space-y-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">{pT('selectType')} <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormPatrolType('1')}
                  className={`flex-1 py-3 border font-bold transition-all ${formPatrolType === '1' ? 'bg-gray-600 text-white border-gray-600 shadow-sm' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  {pT('dailyTab')}
                </button>
                <button
                  onClick={() => setFormPatrolType('7')}
                  className={`flex-1 py-3 border font-bold transition-all ${formPatrolType === '7' ? 'bg-gray-600 text-white border-gray-600 shadow-sm' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  {pT('weeklyTab')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">{pT('colLine')} <span className="text-red-500">*</span></label>
              <div className="relative w-full" ref={lineSelectRef}>
                <button
                  type="button"
                  onClick={() => setIsLineSelectOpen(!isLineSelectOpen)}
                  className="w-full border border-gray-200 px-4 py-2 bg-gray-50 text-left flex justify-between items-center focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                >
                  <span className={formLineId ? "text-gray-800" : "text-gray-400"}>
                    {formLineId ? lineAreas.find(l => l.id === formLineId)?.lineAreaName : `-- ${pT('colLine')} --`}
                  </span>
                  <svg className={`fill-current h-4 w-4 text-gray-500 transition-transform ${isLineSelectOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </button>

                {isLineSelectOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-lg z-50 overflow-hidden">
                    {lineAreas.map(line => (
                      <div
                        key={line.id}
                        className={`px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors ${formLineId === line.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}
                        onClick={() => {
                          setFormLineId(line.id);
                          setIsLineSelectOpen(false);
                        }}
                      >
                        {line.lineAreaName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleCreateSession('Pending')}
              disabled={loading || !formLineId}
              className="my-4! cursor-pointer w-full bg-blue-700 text-white py-3 font-bold flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50"
            >
              <FaPlus /> {pT('createBtn')}
            </button>
          </div>
        ) : (
          <>
            {/* Status History */}
            {!isNew && statusHistories.length > 0 && (
              <div className="bg-white shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-base text-gray-800 mb-3 flex items-center gap-2">
                  <FaHistory className="text-gray-600 text-sm" /> {pT('signHistory')}
                </h3>
                <div className="space-y-2!">
                  {statusHistories.map((h: StatusHistory) => (
                    <div key={h.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 border border-gray-100 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${h.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            h.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                          }`}>
                          {getStatusLabel(h.status)}
                        </span>
                        <span className="text-gray-700 font-medium">{h.fullName}</span>
                        <span className="text-gray-400 text-xs">({h.role})</span>
                      </div>
                      <span className="text-gray-400 text-xs whitespace-nowrap">
                        {new Date(h.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-4">
              {activeStages.map(stage => (
                <div key={stage.id} className="bg-white shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                    <h3 className="font-bold text-lg text-white">{stage.name}</h3>
                  </div>
                  <div className="p-3 sm:p-4 space-y-4">
                    {categories.filter(c => c.stageId === stage.id).map(cat => (
                      <div key={cat.id} className="border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <h4 className="font-semibold text-gray-700">{cat.name}</h4>
                        </div>
                        <div className="md:hidden divide-y divide-gray-100">
                          {checkLists.filter(cl => cl.categoryId === cat.id).map(item => (
                            <div key={item.id} className="p-4 flex flex-col gap-4 hover:bg-gray-50 transition-colors">
                              {/* 1. Câu hỏi */}
                              <div>
                                <p className="text-sm font-bold text-gray-800 leading-relaxed">{item.questionCheck}</p>
                              </div>

                              {/* 2. Tiêu chuẩn */}
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{pT('colStandard')}:</span>
                                <div className={`text-xs px-2 py-1 rounded border font-medium italic w-fit ${item.spec ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-gray-400 bg-gray-50 border-gray-200'}`}>
                                  {item.spec || pT('noStandard')}
                                </div>
                              </div>

                              {/* 3. Kết quả */}
                              <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{pT('colResult')}</span>
                                {item.specType !== 'input' ? (
                                  <div className="grid grid-cols-2 gap-3">
                                    <button
                                      onClick={() => handleResultButtonClick(item.id, 'OK')}
                                      disabled={!canEditResults}
                                      className={`py-3 text-sm font-bold border transition-all rounded-lg flex items-center justify-center ${formResults[item.id]?.result === 'OK'
                                        ? 'bg-green-600 text-white border-green-600 shadow-md scale-[1.02]'
                                        : 'bg-white text-gray-500 border-gray-300 active:bg-gray-100'
                                        }`}
                                    >OK</button>
                                    <button
                                      onClick={() => handleResultButtonClick(item.id, 'NG')}
                                      disabled={!canEditResults}
                                      className={`py-3 text-sm font-bold border transition-all rounded-lg flex items-center justify-center ${formResults[item.id]?.result === 'NG'
                                        ? 'bg-red-600 text-white border-red-600 shadow-md scale-[1.02]'
                                        : 'bg-white text-gray-500 border-gray-300 active:bg-gray-100'
                                        }`}
                                    >NG</button>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={formResults[item.id]?.actualValue || ''}
                                    onChange={(e) => handleLocalChange(item.id, 'actualValue', e.target.value)}
                                    onBlur={() => handleSyncResult(item.id)}
                                    disabled={!canEditResults}
                                    placeholder={pT('typeInput')}
                                    className="w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none p-3 bg-gray-50"
                                  />
                                )}
                              </div>

                              {/* 4. Ghi chú */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{pT('colNote')}</span>
                                <input
                                  type="text"
                                  value={formResults[item.id]?.note || ''}
                                  onChange={(e) => handleLocalChange(item.id, 'note', e.target.value)}
                                  onBlur={() => handleSyncResult(item.id)}
                                  disabled={!canEditResults}
                                  placeholder={pT('placeholderNote')}
                                  className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-2 italic text-gray-600"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[40%]">{pT('colQuestion')}</th>
                                <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[15%]">{pT('colStandard')}</th>
                                <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[20%]">{pT('colResult')}</th>
                                <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[25%]">{pT('colNote')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {checkLists.filter(cl => cl.categoryId === cat.id).map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="p-3 text-sm text-gray-800">{item.questionCheck}</td>
                                  <td className="p-3 text-sm text-gray-600">
                                    <span className={`px-2 py-1 rounded text-xs border font-medium ${item.spec ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                      {item.spec || pT('noStandard')}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    {item.specType !== 'input' ? (
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => handleResultButtonClick(item.id, 'OK')}
                                          disabled={!canEditResults}
                                          className={`px-3 py-1 text-xs font-bold border transition-all rounded ${formResults[item.id]?.result === 'OK'
                                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                            : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >OK</button>
                                        <button
                                          onClick={() => handleResultButtonClick(item.id, 'NG')}
                                          disabled={!canEditResults}
                                          className={`px-3 py-1 text-xs font-bold border transition-all rounded ${formResults[item.id]?.result === 'NG'
                                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                            : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >NG</button>
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        value={formResults[item.id]?.actualValue || ''}
                                        onChange={(e) => handleLocalChange(item.id, 'actualValue', e.target.value)}
                                        onBlur={() => handleSyncResult(item.id)}
                                        disabled={!canEditResults}
                                        placeholder={pT('typeInput')}
                                        className="w-full text-xs border-b border-gray-300 focus:border-blue-500 outline-none py-1"
                                      />
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      value={formResults[item.id]?.note || ''}
                                      onChange={(e) => handleLocalChange(item.id, 'note', e.target.value)}
                                      onBlur={() => handleSyncResult(item.id)}
                                      disabled={!canEditResults}
                                      placeholder={pT('placeholderNote')}
                                      className="w-full text-xs border-b border-gray-300 focus:border-blue-500 outline-none py-1 italic"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                <FaImage className="text-blue-500" /> {pT('imageSection')}
              </h3>

              {canEditResults && (
                <MultiImageUpload
                  label={pT('uploadLabel')}
                  fieldName="patrolImages"
                  images={images.map(img => getImageUrl(img))}
                  notes={images.map(img => img.note || '')}
                  onUpload={handleImageUpload}
                  onRemove={(idx) => handleRemoveImage(images[idx].id)}
                  onViewAll={() => { }}
                  onViewSingle={(url) => setPreviewImage({ isOpen: true, url, title: pT('imageSection') as any })}
                  maxImages={5}
                />
              )}

              {images.length > 0 && (session?.status !== 'Pending' || user?.role !== 'PQC') && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  {images.map((img, index) => (
                    <div key={img.id} className="border border-gray-200 overflow-hidden flex flex-col relative group">
                      <img
                        src={getImageUrl(img)}
                        alt="Current state"
                        className="w-full h-48 object-cover cursor-pointer bg-gray-100"
                        onClick={() => setPreviewImage({ isOpen: true, url: getImageUrl(img), title: `${pT('imageSection')} ${index + 1}` })}
                      />
                      {img.note && (
                        <div className="text-xs text-gray-600 px-3 py-2 bg-gray-50 border-t border-gray-200 italic">
                          {img.note}
                        </div>
                      )}
                      {canEditResults && (
                        <button
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar */}

            {!isNew && (
              <div className="patrol-action-bar fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 px-4 py-3">
                <div className="flex flex-row gap-3 w-full">

                  {/* Back — luôn hiển thị */}
                  <button
                    onClick={() => {
                      const saved = readPatrolNavState();
                      if (saved?.fromDashboard && saved.dashboardReturnPath) {
                        savePatrolDashboardState({
                          date: saved.dashboardDate || '',
                          page: saved.page,
                          highlightId: saved.highlightId || 0,
                        });
                        clearPatrolNavState();
                        navigate(saved.dashboardReturnPath, {
                          state: {
                            from: 'sheetDetail',
                            dashboardState: {
                              sheetId: saved.highlightId,
                              date: saved.dashboardDate,
                              fullDate: saved.dashboardDate,
                              detailTablePage: saved.page,
                            },
                          },
                        });
                      } else {
                        goToView('list', null, saved?.type || 'daily');
                      }
                    }}
                    className="flex-1! px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <FaArrowLeft /> {pT('backBtn') || 'Quay lại'}
                  </button>

                  {/* Gửi phiếu */}
                  {canEditResults && session?.status === 'Pending' && user?.role === 'PQC' && (
                    <button
                      onClick={() => handleUpdateStatus('Submitted')}
                      disabled={loading}
                      className="flex-1! px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      <FaPen /> {pT('submitBtn')}
                    </button>
                  )}

                  {/* Duyệt */}
                  {canApprove && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus('Approved')}
                        disabled={loading}
                        className="flex-1! px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        <FaCheck /> {pT('approveBtn')}
                      </button>
                      <button
                        onClick={handleRejectStatus}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        <FaUndo /> {pT('rejectBtn')}
                      </button>
                    </>
                  )}

                  {/* Không thể thao tác */}
                  {!canEditResults && !canApprove && (
                    <div className="flex-1! px-6 py-3 bg-gray-100 text-gray-500 font-semibold text-sm flex items-center justify-center gap-2 border border-gray-200">
                      🔒 {session?.status === 'Approved' ? pT('statusApproved') : pT('statusSubmitted')}
                    </div>
                  )}

                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default PatrolDetail;

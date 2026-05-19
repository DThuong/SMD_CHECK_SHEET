import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import type { PatrolSharedProps, PatrolItemType } from './types';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { 
  fetchStagesByPatrolType, 
  fetchCategories, 
  fetchCheckLists, 
  fetchLineAreas,
  createStage, deleteStage, updateStage,
  createCategory, deleteCategory, updateCategory,
  createCheckList, deleteCheckList, updateCheckList,
  createLineArea, deleteLineArea, updateLineArea
} from '../../redux/slices/patrolSlice';
import { ConfirmModal } from '../../components/general/ConfirmModal';
import Modal from '../../components/general/Modal';
import LoadingSpinner from '../../components/general/LoadingSpinner';
import { FaEye } from 'react-icons/fa6';

const ManagePatrol: React.FC<PatrolSharedProps> = ({ 
  user,
  goToView 
}) => {
  const { t } = useTranslation('patrol');
  const dispatch = useAppDispatch();
  const [manageTab, setManageTab] = useState<'daily' | 'weekly'>('daily');

  const pT = (key: string, options?: any) => {
    if (user?.role === 'PQC') return t(key, { ...options, lng: 'vi' }) as any;
    return t(key, options) as any;
  };

  const { stages, categories, checkLists, lineAreas, loading } = useAppSelector(state => state.patrol);

  // Modals state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'line' | 'stage' | 'category' | 'item';
    id1?: string;
  }>({ isOpen: false, type: 'line' });

  const [itemModal, setItemModal] = useState<{
    isOpen: boolean;
    type: 'line' | 'stage' | 'category' | 'item';
    isEdit: boolean;
    id?: number;
    parentId?: number;
  }>({ isOpen: false, type: 'line', isEdit: false });

  const [inputValue, setInputValue] = useState('');
  const [inputSpec, setInputSpec] = useState('');
  const [inputSpecType, setInputSpecType] = useState<'radio' | 'input'>('radio');
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    dispatch(fetchStagesByPatrolType(manageTab === 'daily' ? "1" : "7"));
    dispatch(fetchCategories());
    dispatch(fetchCheckLists());
    dispatch(fetchLineAreas());
  }, [dispatch, manageTab]);

  const currentTmpl = stages
    .filter(stage => stage.patrolType === (manageTab === 'daily' ? "1" : "7"))
    .map(stage => ({
      id: stage.id.toString(),
      name: stage.name,
      categories: categories
        .filter(c => c.stageId === stage.id)
        .map(c => ({
          id: c.id.toString(),
          name: c.name,
          items: checkLists
            .filter(item => item.categoryId === c.id)
            .map(item => ({
              id: item.id.toString(),
              question: item.questionCheck,
              standard: item.spec,
              type: (item.specType === 'input' ? 'input' : 'radio') as PatrolItemType
            }))
        }))
    }));

  const handleConfirmDelete = async () => {
    const { type, id1 } = deleteModal;
    if (!id1) return;
    
    try {
      if (type === 'line') {
        await dispatch(deleteLineArea(Number(id1))).unwrap();
        toast.success(pT('msgDeleteLineSuccess'));
      }
      if (type === 'stage') {
        await dispatch(deleteStage(Number(id1))).unwrap();
        toast.success(pT('msgDeleteStageSuccess'));
      }
      if (type === 'category') {
        await dispatch(deleteCategory(Number(id1))).unwrap();
        toast.success(pT('msgDeleteCategorySuccess'));
      }
      if (type === 'item') {
        await dispatch(deleteCheckList(Number(id1))).unwrap();
        toast.success(pT('msgDeleteItemSuccess'));
      }
      
      // Refetch to ensure absolute sync
      if (type === 'line') dispatch(fetchLineAreas());
      if (type === 'stage') dispatch(fetchStagesByPatrolType(manageTab === 'daily' ? "1" : "7"));
      if (type === 'category') dispatch(fetchCategories());
      if (type === 'item') dispatch(fetchCheckLists());
      
      setDeleteModal({ isOpen: false, type: 'line' });
    } catch (err) {
      toast.error(pT('errorOccurred'));
      console.error("Delete failed:", err);
    }
  };

  const handleConfirmSave = async () => {
    // Normalize whitespace
    const val = inputValue.replace(/\s+/g, ' ').trim();
    const specVal = inputSpec.replace(/\s+/g, ' ').trim();
    
    if (!val || loading) return;
    const { type, isEdit, id, parentId } = itemModal;

    // Check Duplicate
    let isDuplicate = false;
    if (type === 'line') {
      isDuplicate = lineAreas.some(l => l.lineAreaName.replace(/\s+/g, ' ').trim().toLowerCase() === val.toLowerCase() && (!isEdit || l.id !== id));
    } else if (type === 'stage') {
      const typeStr = manageTab === 'daily' ? "1" : "7";
      isDuplicate = stages.some(s => s.name.replace(/\s+/g, ' ').trim().toLowerCase() === val.toLowerCase() && s.patrolType === typeStr && (!isEdit || s.id !== id));
    } else if (type === 'category') {
      const targetStageId = isEdit ? categories.find(c => c.id === id)?.stageId : parentId;
      isDuplicate = categories.some(c => c.name.replace(/\s+/g, ' ').trim().toLowerCase() === val.toLowerCase() && c.stageId === targetStageId && (!isEdit || c.id !== id));
    } else if (type === 'item') {
      const targetCatId = isEdit ? checkLists.find(i => i.id === id)?.categoryId : parentId;
      isDuplicate = checkLists.some(i => i.questionCheck.replace(/\s+/g, ' ').trim().toLowerCase() === val.toLowerCase() && i.categoryId === targetCatId && (!isEdit || i.id !== id));
    }

    if (isDuplicate) {
      toast.warning(pT('duplicateWarning'));
      return;
    }
    
    try {
      if (isEdit && id) {
        if (type === 'line') {
          await dispatch(updateLineArea({ id, data: { lineAreaName: val } })).unwrap();
          dispatch(fetchLineAreas());
          toast.success(pT('msgUpdateLineSuccess'));
        }
        if (type === 'stage') {
          await dispatch(updateStage({ 
            id, 
            data: { 
              name: val, 
              patrolType: manageTab === 'daily' ? "1" : "7",
              isActive: true
            } 
          })).unwrap();
          dispatch(fetchStagesByPatrolType(manageTab === 'daily' ? "1" : "7"));
          toast.success(pT('msgUpdateStageSuccess'));
        }
        if (type === 'category') {
          await dispatch(updateCategory({ id, data: { name: val } })).unwrap();
          dispatch(fetchCategories());
          toast.success(pT('msgUpdateCategorySuccess'));
        }
        if (type === 'item') {
          await dispatch(updateCheckList({ id, data: { questionCheck: val, spec: specVal, specType: inputSpecType } })).unwrap();
          dispatch(fetchCheckLists());
          toast.success(pT('msgUpdateItemSuccess'));
        }
      } else {
        if (type === 'line') {
          await dispatch(createLineArea({ lineAreaName: val, note: '', isActive: true })).unwrap();
          dispatch(fetchLineAreas());
          toast.success(pT('msgCreateLineSuccess'));
        }
        if (type === 'stage') {
          await dispatch(createStage({ name: val, patrolType: manageTab === 'daily' ? "1" : "7", isActive: true })).unwrap();
          dispatch(fetchStagesByPatrolType(manageTab === 'daily' ? "1" : "7"));
          toast.success(pT('msgCreateStageSuccess'));
        }
        if (type === 'category' && parentId) {
          await dispatch(createCategory({ name: val, stageId: parentId, isActive: true })).unwrap();
          dispatch(fetchCategories());
          toast.success(pT('msgCreateCategorySuccess'));
        }
        if (type === 'item' && parentId) {
          await dispatch(createCheckList({ questionCheck: val, spec: specVal, specType: inputSpecType, categoryId: parentId, isActive: true })).unwrap();
          dispatch(fetchCheckLists());
          toast.success(pT('msgCreateItemSuccess'));
        }
      }
      
      // Success: Close modal and clear state
      setItemModal({ ...itemModal, isOpen: false });
      setInputValue('');
      setInputSpec('');
      setInputSpecType('radio');
    } catch (err) {
      toast.error(pT('errorOccurred'));
      console.error("Save failed:", err);
    }
  };

  const handleSaveKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!inputValue.trim() || loading) return;
    handleConfirmSave();
  };

  const toggleStage = (stageId: string) => {
    setCollapsedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const capitalizeWordBeforeCursor = (
    value: string,
    cursor: number
  ) => {
    const beforeCursor = value.slice(0, cursor);
    const afterCursor = value.slice(cursor);
    const wordMatch = beforeCursor.match(/(\S+)$/u);

    if (!wordMatch?.[0]) {
      return { value: `${beforeCursor} ${afterCursor}`, cursor: cursor + 1 };
    }

    const word = wordMatch[0];
    const wordStart = cursor - word.length;
    const firstLetterIndex = [...word].findIndex(char => /\p{L}/u.test(char));

    if (firstLetterIndex === -1) {
      return { value: `${beforeCursor} ${afterCursor}`, cursor: cursor + 1 };
    }

    const chars = [...word];
    chars[firstLetterIndex] = chars[firstLetterIndex].toLocaleUpperCase();
    const nextBeforeCursor = `${beforeCursor.slice(0, wordStart)}${chars.join('')}`;

    return {
      value: `${nextBeforeCursor} ${afterCursor}`,
      cursor: cursor + 1,
    };
  };

  const handleNameKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleSaveKeyDown(event);
    if (
      event.defaultPrevented ||
      event.key !== ' ' ||
      event.nativeEvent.isComposing ||
      (itemModal.type !== 'stage' && itemModal.type !== 'category')
    ) {
      return;
    }

    const target = event.currentTarget;
    if (target.selectionStart !== target.selectionEnd) return;

    event.preventDefault();
    const next = capitalizeWordBeforeCursor(target.value, target.selectionStart);
    setInputValue(next.value);
    requestAnimationFrame(() => {
      target.setSelectionRange(next.cursor, next.cursor);
    });
  };

  if (loading && lineAreas.length === 0) {
    return <LoadingSpinner message={pT('loading') || 'Loading...'} />;
  }

  // Open Add handlers
  const openAddLine = () => { setInputValue(''); setInputSpec(''); setItemModal({ isOpen: true, type: 'line', isEdit: false }); };
  const openAddStage = () => { setInputValue(''); setInputSpec(''); setItemModal({ isOpen: true, type: 'stage', isEdit: false }); };
  const openAddCategory = (stageId: number) => { setInputValue(''); setInputSpec(''); setItemModal({ isOpen: true, type: 'category', isEdit: false, parentId: stageId }); };
  const openAddItem = (catId: number) => { setInputValue(''); setInputSpec(''); setInputSpecType('radio'); setItemModal({ isOpen: true, type: 'item', isEdit: false, parentId: catId }); };

  // Open Edit handlers
  const openEditLine = (id: number, val: string) => { setInputValue(val); setItemModal({ isOpen: true, type: 'line', isEdit: true, id }); };
  const openEditStage = (id: number, val: string) => { setInputValue(val); setItemModal({ isOpen: true, type: 'stage', isEdit: true, id }); };
  const openEditCategory = (id: number, val: string) => { setInputValue(val); setItemModal({ isOpen: true, type: 'category', isEdit: true, id }); };
  const openEditItem = (id: number, question: string, spec: string, specType?: string) => { 
    setInputValue(question); 
    setInputSpec(spec || '');
    setInputSpecType(specType === 'input' ? 'input' : 'radio');
    setItemModal({ isOpen: true, type: 'item', isEdit: true, id }); 
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Existing Header... */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => goToView('list')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <FaArrowLeft />
        </button>
        <h2 className="text-xl font-bold text-gray-800">{pT('title')}</h2>
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setManageTab('daily')}
          className={`px-4 py-2 font-bold transition-all ${manageTab === 'daily' ? 'border-b-2 border-gray-700 text-gray-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {pT('dailyTab')}
        </button>
        <button
          onClick={() => setManageTab('weekly')}
          className={`px-4 py-2 font-bold transition-all ${manageTab === 'weekly' ? 'border-b-2 border-gray-700 text-gray-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {pT('weeklyTab')}
        </button>
      </div>

      {/* Cấu Hình Line */}
      <div className="bg-white shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h3 className="font-bold text-lg text-gray-800">{pT('manageLines')}</h3>
          {user?.role === 'PQCLeader' && (
            <button onClick={openAddLine} disabled={loading} className="w-fit text-gray-700 hover:text-gray-900 flex items-center gap-2 font-bold text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 transition-colors disabled:opacity-50">
              <FaPlus /> {pT('addLine')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {lineAreas.map(line => (
            <div key={line.id} className="bg-gray-100 border border-gray-200 px-3 py-2 flex items-center gap-2 group relative">
              <span className="font-medium text-gray-700">{line.lineAreaName}</span>
              {user?.role === 'PQCLeader' && (
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditLine(line.id, line.lineAreaName)} className="text-blue-500 hover:text-blue-700 transition-colors">
                    <FaEdit size={16} />
                  </button>
                  <button onClick={() => setDeleteModal({ isOpen: true, type: 'line', id1: line.id.toString() })} disabled={loading} className="text-red-500 hover:text-red-700 disabled:opacity-50">
                    <FaTrash size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 text-sm mt-3 mb-3">
        <span dangerouslySetInnerHTML={{ __html: pT('warningText', { type: manageTab === 'daily' ? pT('dailyTab') : pT('weeklyTab') }) }} />
      </div>

      {user?.role === 'PQCLeader' && (
        <button onClick={openAddStage} disabled={loading} className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium border-dashed flex items-center justify-center gap-2 disabled:opacity-50">
          <FaPlus /> {pT('addStage', { type: manageTab === 'daily' ? pT('dailyTab') : pT('weeklyTab') })}
        </button>
      )}

      <div className="space-y-4! mt-4">
        {currentTmpl.map((stage) => {
          const isStageCollapsed = !!collapsedStages[stage.id];
          return (
          <div key={stage.id} className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-lg">
            <button
              type="button"
              onClick={() => toggleStage(stage.id)}
              className="w-full bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-gray-500 shrink-0">
                  {isStageCollapsed ? <FaChevronRight size={14} /> : <FaChevronDown size={14} />}
                </span>
                <h3 className="font-bold text-lg text-gray-800 mb-0 break-words">
                  {pT('stagePrefix')}{stage.name}
                </h3>
              </div>
              {user?.role === 'PQCLeader' && (
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => openEditStage(Number(stage.id), stage.name)} className="text-blue-500 hover:text-blue-700 transition-colors p-1.5 hover:bg-white rounded-full">
                    <FaEdit size={16} />
                  </button>
                  <button type="button" onClick={() => setDeleteModal({ isOpen: true, type: 'stage', id1: stage.id })} disabled={loading} className="text-red-500 hover:text-red-700 p-1.5 disabled:opacity-50 transition-colors hover:bg-white rounded-full">
                    <FaTrash size={16} />
                  </button>
                </div>
              )}
            </button>

            {!isStageCollapsed && (
            <div className="p-4 space-y-4">
              {stage.categories.map(cat => (
                <div key={cat.id} className="border border-blue-100 bg-blue-50/30 mb-3 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-blue-500 shrink-0">
                        {collapsedCategories[cat.id] ? <FaChevronRight size={13} /> : <FaChevronDown size={13} />}
                      </span>
                      <h4 className="font-semibold text-blue-800 text-base mb-0 break-words">{pT('categoryPrefix')}{cat.name}</h4>
                    </div>
                    {user?.role === 'PQCLeader' && (
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => openEditCategory(Number(cat.id), cat.name)} className="text-blue-600 hover:text-blue-800 transition-colors p-1.5 hover:bg-blue-100/50 rounded-full">
                          <FaEdit size={16} />
                        </button>
                        <button type="button" onClick={() => setDeleteModal({ isOpen: true, type: 'category', id1: cat.id })} disabled={loading} className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors p-1.5 hover:bg-blue-100/50 rounded-full">
                          <FaTrash size={16} />
                        </button>
                      </div>
                    )}
                  </button>

                  {!collapsedCategories[cat.id] && (
                  <div className="px-4 pb-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[45%]">{pT('colQuestion')}</th>
                          <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[20%]">{pT('colStandard')}</th>
                          <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[20%]">{pT('promptAddType')}</th>
                          <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[15%] text-center">{pT('colActions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cat.items.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-sm text-gray-800 font-medium">{item.question}</td>
                            <td className="p-3 text-sm text-gray-600">
                              <span className={`text-[11px] px-2 py-1 rounded border font-medium ${item.standard ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                {item.standard || pT('noStandard')}
                              </span>
                            </td>
                            <td className="p-3 text-sm">
                              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 uppercase font-semibold">
                                {item.type === 'input' ? pT('typeInput') : pT('typeRadio')}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {user?.role === 'PQCLeader' && (
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => openEditItem(Number(item.id), item.question, item.standard, item.type)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                                    <FaEdit size={16} />
                                  </button>
                                  <button onClick={() => setDeleteModal({ isOpen: true, type: 'item', id1: item.id })} disabled={loading} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                    <FaTrash size={16} />
                                  </button>
                                </div>
                              )}
                              {user?.role !=='PQCLeader' && (
                                <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 cursor-not-allowed!">
                                  <FaEye size={16} className='text-gray-600' />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {cat.items.map(item => (
                      <div key={item.id} className="flex flex-col bg-white p-3 rounded-lg border border-gray-200 text-sm gap-3 hover:shadow-sm transition-shadow">
                        <div className="flex flex-col gap-2">
                          <p className="text-gray-800 font-medium mb-0">{item.question}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 uppercase font-bold">
                              {item.type === 'input' ? pT('typeInput') : pT('typeRadio')}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium italic ${item.standard ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                              {item.standard || pT('noStandard')}
                            </span>
                          </div>
                        </div>
                        {user?.role === 'PQCLeader' && (
                          <div className="flex items-center gap-2 self-end border-t pt-2 w-full justify-end">
                            <button onClick={() => openEditItem(Number(item.id), item.question, item.standard, item.type)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                              <FaEdit size={16} />
                            </button>
                            <button onClick={() => setDeleteModal({ isOpen: true, type: 'item', id1: item.id })} disabled={loading} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                              <FaTrash size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {user?.role === 'PQCLeader' && (
                    <button onClick={() => openAddItem(Number(cat.id))} disabled={loading} className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium disabled:opacity-50">
                      <FaPlus /> {pT('addQuestion')}
                    </button>
                  )}
                  </div>
                  )}
                </div>
              ))}

              {user?.role === 'PQCLeader' && (
                <button onClick={() => openAddCategory(Number(stage.id))} disabled={loading} className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-300 font-medium border-dashed flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-50">
                  <FaPlus /> {pT('addCategory')}
                </button>
              )}
            </div>
            )}
          </div>
          );
        })}
      </div>

      <ConfirmModal
        open={deleteModal.isOpen}
        title={pT('confirm')}
        message={
          deleteModal.type === 'line' ? pT('confirmDeleteLine') :
          deleteModal.type === 'stage' ? pT('confirmDeleteStage') :
          deleteModal.type === 'category' ? pT('confirmDeleteCategory') :
          pT('confirmDeleteQuestion')
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, type: 'line' })}
      />

      <Modal
        open={itemModal.isOpen}
        title={
          itemModal.isEdit ? pT('edit') :
          itemModal.type === 'line' ? pT('addLine') :
          itemModal.type === 'stage' ? pT('addStage', { type: manageTab === 'daily' ? pT('dailyTab') : pT('weeklyTab') }) :
          itemModal.type === 'category' ? pT('addCategory') :
          pT('addQuestion')
        }
        onClose={() => setItemModal({ ...itemModal, isOpen: false })}
        onSave={handleConfirmSave}
        disabledSave={!inputValue.trim() || loading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {itemModal.type === 'line' ? pT('promptAddLine') :
               itemModal.type === 'stage' ? pT('promptAddStage') :
               itemModal.type === 'category' ? pT('promptAddCategory') :
               pT('promptAddQuestion')}
            </label>
            <textarea
              autoFocus
              rows={itemModal.type === 'item' ? 2 : 1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleNameKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="..."
            />
          </div>
          {itemModal.type === 'item' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{pT('colStandard')}</label>
                <textarea
                  rows={2}
                  value={inputSpec}
                  onChange={(e) => setInputSpec(e.target.value)}
                  onKeyDown={handleSaveKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder={pT('colStandard')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{pT('promptAddType')}</label>
                <select
                  value={inputSpecType}
                  onChange={(e) => setInputSpecType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                >
                  <option value="radio">{pT('typeRadio')}</option>
                  <option value="input">{pT('typeInput')}</option>
                </select>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManagePatrol;

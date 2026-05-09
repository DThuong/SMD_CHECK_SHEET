import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../redux/hooks';
import { toast } from 'sonner';
import { FaPlus, FaTrash, FaCheck, FaArrowLeft, FaChartBar, FaCog, FaImage, FaPen, FaTimes, FaEye } from 'react-icons/fa';
import {
  Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart, Cell
} from 'recharts';
import MultiImageUpload from '../../components/files/MultiImageUpload';
import ImagePreviewModal from '../../components/files/ImagePreviewModal';
import { FaPencil } from 'react-icons/fa6';

// ==========================================
// TYPES
// ==========================================
export type PatrolItemType = 'radio' | 'input';

export interface PatrolItem {
  id: string;
  question: string;
  type: PatrolItemType;
}

export interface PatrolCategory {
  id: string;
  name: string;
  items: PatrolItem[];
}

export interface PatrolStage {
  id: string;
  name: string;
  categories: PatrolCategory[];
}

export interface PatrolImage {
  id: string;
  url: string; // Blob URL or Base64 (using blob for temp mock)
  note: string;
}

export interface PatrolLine {
  id: string;
  name: string;
}

export interface PatrolSheet {
  id: string;
  patrolType: 'daily' | 'weekly';
  lineId: string;
  lineName: string;
  createdAt: string;
  createdBy: string;
  creatorName: string;
  status: 'Pending' | 'PQCDone' | 'LeaderDone';
  results: Record<string, string>; // itemId -> value ('OK'/'NG' or text)
  images: PatrolImage[];
  pqcSign?: string;
  leaderSign?: string;
}

// ==========================================
// CONSTANTS
// ==========================================
const MOCK_DAILY_TEMPLATE_KEY = 'mock_patrol_daily_template';
const MOCK_WEEKLY_TEMPLATE_KEY = 'mock_patrol_weekly_template';
const MOCK_SHEETS_KEY = 'mock_patrol_sheets';
const MOCK_LINES_KEY = 'mock_patrol_lines';

// Default template if none exists
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
  { id: 'line_1', name: 'SA1' },
  { id: 'line_2', name: 'SA2' },
  { id: 'line_3', name: 'SA3' },
  { id: 'line_4', name: 'SA4' },
  { id: 'line_5', name: 'SA5' },
  { id: 'line_6', name: 'SA6' },
  { id: 'line_7', name: 'SA7' },
  { id: 'line_8', name: 'SA8' },
  { id: 'line_9', name: 'SA9' },
  { id: 'line_10', name: 'SA10' },
];

const PatrolComponent = () => {
  const { user } = useAppSelector(state => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryView = searchParams.get('view') as 'list' | 'manage' | 'detail' | 'report' | null;
  const activeView = queryView || 'list';
  const queryType = searchParams.get('type') as 'daily' | 'weekly' | null;

  // DATA STATES
  const [dailyTemplate, setDailyTemplate] = useState<PatrolStage[]>([]);
  const [weeklyTemplate, setWeeklyTemplate] = useState<PatrolStage[]>([]);
  const [sheets, setSheets] = useState<PatrolSheet[]>([]);
  const [lines, setLines] = useState<PatrolLine[]>([]);
  const [previewImage, setPreviewImage] = useState<{ isOpen: boolean, url: string, title: string }>({ isOpen: false, url: '', title: '' });

  // Manage template active tab
  const [manageTab, setManageTab] = useState<'daily' | 'weekly'>('daily');
  // List active tab from URL
  const activeTab = queryType || 'daily';

  // DETAIL FORM STATES
  const [formResults, setFormResults] = useState<Record<string, string>>({});
  const [formImages, setFormImages] = useState<PatrolImage[]>([]);
  const [formLineId, setFormLineId] = useState<string>('');
  const [formPatrolType, setFormPatrolType] = useState<'daily' | 'weekly'>('daily');

  // Sync internal states when URL ID changes
  useEffect(() => {
    const id = searchParams.get('id');
    if (activeView === 'detail' && id) {
      const existingSheet = id !== 'new' ? sheets.find(s => s.id === id) : null;
      setFormResults(existingSheet?.results || {});
      setFormImages(existingSheet?.images || []);
      setFormLineId(existingSheet?.lineId || '');
      setFormPatrolType(existingSheet?.patrolType || 'daily');
    }
  }, [activeView, searchParams, sheets]);

  const [isLineSelectOpen, setIsLineSelectOpen] = useState(false);
  const lineSelectRef = useRef<HTMLDivElement>(null);

  // Close line select when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (lineSelectRef.current && !lineSelectRef.current.contains(e.target as Node)) {
        setIsLineSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize data
  useEffect(() => {
    const savedDaily = localStorage.getItem(MOCK_DAILY_TEMPLATE_KEY);
    if (savedDaily) setDailyTemplate(JSON.parse(savedDaily));
    else {
      setDailyTemplate(DEFAULT_TEMPLATE);
      localStorage.setItem(MOCK_DAILY_TEMPLATE_KEY, JSON.stringify(DEFAULT_TEMPLATE));
    }

    const savedWeekly = localStorage.getItem(MOCK_WEEKLY_TEMPLATE_KEY);
    if (savedWeekly) setWeeklyTemplate(JSON.parse(savedWeekly));
    else {
      setWeeklyTemplate(DEFAULT_TEMPLATE);
      localStorage.setItem(MOCK_WEEKLY_TEMPLATE_KEY, JSON.stringify(DEFAULT_TEMPLATE));
    }

    const savedSheets = localStorage.getItem(MOCK_SHEETS_KEY);
    if (savedSheets) setSheets(JSON.parse(savedSheets));

    const savedLines = localStorage.getItem(MOCK_LINES_KEY);
    if (savedLines) setLines(JSON.parse(savedLines));
    else {
      setLines(DEFAULT_LINES);
      localStorage.setItem(MOCK_LINES_KEY, JSON.stringify(DEFAULT_LINES));
    }
  }, []);

  const saveDailyTemplate = (newTemplate: PatrolStage[]) => {
    setDailyTemplate(newTemplate);
    localStorage.setItem(MOCK_DAILY_TEMPLATE_KEY, JSON.stringify(newTemplate));
    toast.success('Đã lưu mẫu Patrol Ngày');
  };

  const saveWeeklyTemplate = (newTemplate: PatrolStage[]) => {
    setWeeklyTemplate(newTemplate);
    localStorage.setItem(MOCK_WEEKLY_TEMPLATE_KEY, JSON.stringify(newTemplate));
    toast.success('Đã lưu mẫu Patrol Tuần');
  };

  const saveSheets = (newSheets: PatrolSheet[]) => {
    setSheets(newSheets);
    localStorage.setItem(MOCK_SHEETS_KEY, JSON.stringify(newSheets));
  };

  const saveLines = (newLines: PatrolLine[]) => {
    setLines(newLines);
    localStorage.setItem(MOCK_LINES_KEY, JSON.stringify(newLines));
  };

  const handleAddLine = () => {
    const name = prompt('Nhập tên Line mới:');
    if (name) {
      const newLines = [...lines, { id: `line_${Date.now()}`, name }];
      saveLines(newLines);
      toast.success('Đã thêm Line mới');
    }
  };

  const handleRemoveLine = (lineId: string) => {
    if (!window.confirm('Xóa Line này?')) return;
    saveLines(lines.filter(l => l.id !== lineId));
    toast.success('Đã xóa Line');
  };

  // Switch View Helper
  const goToView = (view: 'list' | 'manage' | 'detail' | 'report', id: string | null = null) => {
    if (view === 'manage' && user?.role !== 'PQCLeader') {
      toast.error('Chỉ PQC Leader mới có quyền cấu hình mẫu Patrol!');
      return;
    }
    const params: any = { view };
    if (view === 'list') params.type = activeTab;
    if (id) params.id = id;
    setSearchParams(params);
  };

  // ==========================================
  // VIEW: LIST
  // ==========================================
  const renderList = () => {
    const filteredSheets = sheets.filter(s => s.patrolType === activeTab);
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4  shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaPencil className="text-gray-600" /> Patrol Check List
            </h1>
            <p className="text-gray-500 text-sm m-0">Quản lý và giám sát chất lượng sản xuất</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToView('report')}
              className="flex-1 sm:flex-none bg-gray-600 hover:bg-indigo-700 text-white px-4 py-2  font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <FaChartBar className='' /> Báo cáo
            </button>
            {user?.role === 'PQCLeader' && (
              <button
                onClick={() => goToView('manage')}
                className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white px-4 py-2  font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <FaCog /> Cấu hình
              </button>
            )}
            {user?.role === 'PQC' && (
              <button
                onClick={() => goToView('detail', 'new')}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 hover:opacity-90 text-white px-4 py-2 font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <FaPlus /> Tạo mới
              </button>
            )}
          </div>
        </div>

        {/* List Tab Selector */}
        <div className="flex gap-3 border-b border-gray-200 mb-2">
          <button
            onClick={() => {
              setSearchParams({ view: 'list', type: 'daily' });
            }}
            className={`pb-2 pt-3 font-bold transition-all ${activeTab === 'daily' ? 'border-b-2 border-gray-600 text-gray-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Patrol Ngày
          </button>
          <button
            onClick={() => {
              setSearchParams({ view: 'list', type: 'weekly' });
            }}
            className={`pb-2 pt-3 font-bold transition-all ${activeTab === 'weekly' ? 'border-b-2 border-gray-600 text-gray-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Patrol Tuần
          </button>
        </div>

        {filteredSheets.length === 0 ? (
          <div className="text-center py-4 bg-white border border-dashed border-gray-300 mt-3">
            <p className="text-gray-500 font-medium m-0">!!! Chưa có phiếu Patrol {activeTab === 'daily' ? 'Ngày' : 'Tuần'} nào được tạo.</p>
          </div>
        ) : (
          <>
            {/* Table View for Desktop */}
            <div className="hidden md:block overflow-x-auto bg-white border border-gray-200 mt-4 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sheet ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Người tạo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Line</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hình ảnh</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSheets.map(sheet => (
                    <tr
                      key={sheet.id}
                      onClick={() => goToView('detail', sheet.id)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{sheet.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {sheet.creatorName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          {sheet.lineName}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sheet.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaImage className="text-gray-400" /> {sheet.images.length}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${sheet.status === 'LeaderDone' ? 'bg-green-100 text-green-700' :
                            sheet.status === 'PQCDone' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                          }`}>
                          {sheet.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <div className="flex justify-start gap-2">
                          <button
                            onClick={() => goToView('detail', sheet.id)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2  transition-colors"
                            title="Xem chi tiết"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          {((user?.role === 'PQC' && sheet.createdBy === String(user?.id) && sheet.status === 'Pending') || user?.role === 'PQCLeader') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Xóa sheet này?')) {
                                  saveSheets(sheets.filter(s => s.id !== sheet.id));
                                  toast.success('Đã xóa sheet');
                                }
                              }}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2  transition-colors"
                              title="Xóa"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grid View for Mobile */}
            <div className="grid gap-4 md:hidden">
              {filteredSheets.map(sheet => (
                <div
                  key={sheet.id}
                  onClick={() => goToView('detail', sheet.id)}
                  className="mt-4 bg-white p-4 shadow-sm border border-gray-200 hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="mb-0 text-sm text-gray-500 font-medium">#{sheet.id.slice(0, 8)}...</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold ${sheet.patrolType === 'daily' ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50'}`}>
                          {sheet.patrolType === 'daily' ? 'Ngày' : 'Tuần'}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 mb-0">{sheet.creatorName}</p>
                      <p className="text-sm font-bold text-indigo-600 mb-0">Line: {sheet.lineName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${sheet.status === 'LeaderDone' ? 'bg-green-100 text-green-700' :
                        sheet.status === 'PQCDone' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                      }`}>
                      {sheet.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className='mb-0'>Thời gian: {new Date(sheet.createdAt).toLocaleString('vi-VN')}</p>
                    <p className='mb-0'>Hình ảnh: {sheet.images.length}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => goToView('detail', sheet.id)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2  text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FaEye /> Xem chi tiết
                    </button>
                    {((user?.role === 'PQC' && sheet.createdBy === String(user?.id) && sheet.status === 'Pending') || user?.role === 'PQCLeader') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Xóa sheet này?')) {
                            saveSheets(sheets.filter(s => s.id !== sheet.id));
                            toast.success('Đã xóa sheet');
                          }
                        }}
                        className="bg-red-50 text-red-600 px-3 py-2  text-sm transition-colors"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // ==========================================
  // VIEW: MANAGE TEMPLATE
  // ==========================================
  const renderManage = () => {
    const currentTmpl = manageTab === 'daily' ? dailyTemplate : weeklyTemplate;
    const saveTmpl = manageTab === 'daily' ? saveDailyTemplate : saveWeeklyTemplate;

    const handleAddStage = () => {
      const name = prompt('Nhập tên Công đoạn mới:');
      if (name) {
        saveTmpl([...currentTmpl, { id: `stage_${Date.now()}`, name, categories: [] }]);
      }
    };

    const handleAddCategory = (stageId: string) => {
      const name = prompt('Nhập tên Hạng mục mới:');
      if (name) {
        const newTemplate = currentTmpl.map(stage => {
          if (stage.id === stageId) {
            return { ...stage, categories: [...stage.categories, { id: `cat_${Date.now()}`, name, items: [] }] };
          }
          return stage;
        });
        saveTmpl(newTemplate);
      }
    };

    const handleAddItem = (stageId: string, catId: string) => {
      const question = prompt('Nhập nội dung câu hỏi kiểm tra:');
      if (!question) return;
      const typeStr = prompt('Dạng kết quả (1: Chọn OK/NG, 2: Nhập Text) - Nhập 1 hoặc 2:');
      const type: PatrolItemType = typeStr === '2' ? 'input' : 'radio';

      const newTemplate = currentTmpl.map(stage => {
        if (stage.id === stageId) {
          return {
            ...stage,
            categories: stage.categories.map(cat => {
              if (cat.id === catId) {
                return { ...cat, items: [...cat.items, { id: `item_${Date.now()}`, question, type }] };
              }
              return cat;
            })
          };
        }
        return stage;
      });
      saveTmpl(newTemplate);
    };

    const handleRemoveStage = (stageId: string) => {
      if (!window.confirm('Xóa công đoạn này và toàn bộ nội dung bên trong?')) return;
      saveTmpl(currentTmpl.filter(s => s.id !== stageId));
    };

    const handleRemoveCategory = (stageId: string, catId: string) => {
      if (!window.confirm('Xóa hạng mục này?')) return;
      saveTmpl(currentTmpl.map(s => s.id === stageId ? { ...s, categories: s.categories.filter(c => c.id !== catId) } : s));
    };

    const handleRemoveItem = (stageId: string, catId: string, itemId: string) => {
      if (!window.confirm('Xóa câu hỏi này?')) return;
      saveTmpl(currentTmpl.map(s => s.id === stageId ? {
        ...s,
        categories: s.categories.map(c => c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c)
      } : s));
    };

    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => goToView('list')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <FaArrowLeft />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Cấu Hình Mẫu Patrol</h2>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setManageTab('daily')}
            className={`px-4 py-2 font-bold transition-all ${manageTab === 'daily' ? 'border-b-2 border-gray-700 text-gray-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Patrol Ngày
          </button>
          <button
            onClick={() => setManageTab('weekly')}
            className={`px-4 py-2 font-bold transition-all ${manageTab === 'weekly' ? 'border-b-2 border-gray-700 text-gray-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Patrol Tuần
          </button>
        </div>

        {/* Cấu Hình Line */}
        <div className="bg-white  shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h3 className="font-bold text-lg text-gray-800">Quản Lý Line Sản Xuất</h3>
            <button onClick={handleAddLine} className="w-fit text-gray-700 hover:text-gray-900 flex items-center gap-2 font-bold text-sm bg-gray-50 px-3 py-2 rounded-lg! border border-gray-200 transition-colors">
              <FaPlus /> Thêm Line
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lines.map(line => (
              <div key={line.id} className="bg-gray-100 border border-gray-200  px-3 py-2 flex items-center gap-3">
                <span className="font-medium text-gray-700">{line.name}</span>
                <button onClick={() => handleRemoveLine(line.id)} className="text-red-400 hover:text-red-600">
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3  text-sm mt-3! mb-3!">
          Thay đổi cấu trúc <b>{manageTab === 'daily' ? 'Patrol Ngày' : 'Patrol Tuần'}</b> ở đây sẽ áp dụng cho các Patrol Sheet tạo mới sau này.
        </div>

        <button onClick={handleAddStage} className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700  border border-blue-200 font-medium border-dashed flex items-center justify-center gap-2">
          <FaPlus /> Thêm Công Đoạn {manageTab === 'daily' ? 'Ngày' : 'Tuần'}
        </button>

        <div className="space-y-4 mt-4">
          {currentTmpl.map((stage) => (
            <div key={stage.id} className="bg-white  shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">CÔNG ĐOẠN: {stage.name}</h3>
                <button onClick={() => handleRemoveStage(stage.id)} className="text-red-500 hover:text-red-700 p-2"><FaTrash /></button>
              </div>

              <div className="p-4 space-y-4">
                {stage.categories.map(cat => (
                  <div key={cat.id} className="border border-blue-100  p-3 bg-blue-50/30 mb-3!">
                    <div className="flex justify-between items-center mb-3!">
                      <h4 className="font-semibold text-blue-800">Hạng mục: {cat.name}</h4>
                      <button onClick={() => handleRemoveCategory(stage.id, cat.id)} className="text-red-400 hover:text-red-600"><FaTrash size={14} /></button>
                    </div>

                    <div className="space-y-3!">
                      {cat.items.map(item => (
                        <div key={item.id} className="flex justify-between items-start bg-white p-2 rounded border border-gray-200 text-sm">
                          <div className="flex-1">
                            <p className="text-gray-800">{item.question}</p>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 mt-1 inline-block">
                              Loại: {item.type === 'radio' ? 'Chọn OK/NG' : 'Nhập Text'}
                            </span>
                          </div>
                          <button onClick={() => handleRemoveItem(stage.id, cat.id, item.id)} className="text-red-400 hover:text-red-600 ml-2"><FaTimes /></button>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => handleAddItem(stage.id, cat.id)} className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                      <FaPlus /> Thêm câu hỏi
                    </button>
                  </div>
                ))}

                <button onClick={() => handleAddCategory(stage.id)} className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600  border border-gray-300 font-medium border-dashed flex items-center justify-center gap-2 text-sm mt-2">
                  <FaPlus /> Thêm Hạng mục
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==========================================
  // VIEW: DETAIL / CREATE
  // ==========================================
  const renderDetail = () => {
    const sheetId = searchParams.get('id');
    const isNew = sheetId === 'new';

    // Tìm sheet hiện tại nếu đang ở chế độ xem/sửa
    const existingSheet = !isNew ? sheets.find(s => s.id === sheetId) : null;

    // Quyền thao tác
    const canEditResults = isNew || (existingSheet?.status === 'Pending' && user?.role === 'PQC' && existingSheet.createdBy === String(user?.id));
    const canLeaderEditNote = existingSheet?.status === 'PQCDone' && user?.role === 'PQCLeader';
    const canLeaderSign = existingSheet?.status === 'PQCDone' && user?.role === 'PQCLeader';

    const handleResultChange = (itemId: string, value: string) => {
      if (!canEditResults) return;
      setFormResults(prev => ({ ...prev, [itemId]: value }));
    };

    const handleImageUpload = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canEditResults) return;
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setFormImages(prev => [...prev, { id: `img_${Date.now()}`, url, note: '' }]);
      }
    };

    const handleRemoveImage = (index: number) => {
      if (!canEditResults) return;
      setFormImages(prev => prev.filter((_, i) => i !== index));
    };

    const canEditImageNote = canEditResults || canLeaderEditNote;

    const handleNoteChange = (imgId: string, note: string) => {
      if (!canEditImageNote) return;
      setFormImages(prev => prev.map(img => img.id === imgId ? { ...img, note } : img));
    };

    const handleSaveSheet = (statusToSet: 'Pending' | 'PQCDone' | 'LeaderDone') => {
      if (isNew && !formLineId) {
        toast.error('Vui lòng chọn Line trước khi lưu!');
        return;
      }

      if (isNew) {
        const lineName = lines.find(l => l.id === formLineId)?.name || 'Unknown Line';
        const newSheet: PatrolSheet = {
          id: `sheet_${Date.now()}`,
          patrolType: formPatrolType,
          lineId: formLineId,
          lineName: lineName,
          createdAt: new Date().toISOString(),
          createdBy: user?.id?.toString() || 'unknown',
          creatorName: user?.fullName || user?.username || 'Unknown',
          status: statusToSet,
          results: formResults,
          images: formImages,
          pqcSign: statusToSet === 'PQCDone' ? user?.fullName : undefined
        };
        saveSheets([newSheet, ...sheets]);
        toast.success(statusToSet === 'Pending' ? 'Đã lưu nháp' : 'Đã ký và hoàn thành (PQC)');
        goToView('list');
      } else if (existingSheet) {
        const updatedSheet: PatrolSheet = {
          ...existingSheet,
          results: formResults,
          images: formImages,
          status: statusToSet,
          pqcSign: statusToSet === 'PQCDone' ? user?.fullName : existingSheet.pqcSign,
          leaderSign: statusToSet === 'LeaderDone' ? user?.fullName : existingSheet.leaderSign
        };
        saveSheets(sheets.map(s => s.id === updatedSheet.id ? updatedSheet : s));
        toast.success(statusToSet === 'LeaderDone' ? 'PQC Leader đã ký duyệt' : 'Đã cập nhật sheet');
        goToView('list');
      }
    };

    const isLineSelected = !isNew || formLineId !== '';
    const activeTemplate = formPatrolType === 'daily' ? dailyTemplate : weeklyTemplate;

    return (
      <div className="animate-fade-in space-y-4 mb-[4rem]!">
        {/* Action Buttons Fixed Bottom - Priority + Visibility check */}
        {((canEditResults && isLineSelected) || canLeaderSign) && (
          <div className="fixed bottom-0 left-0 right-0 p-4! bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
            <div className="md:pl-64 lg:pl-96">
              <div className="flex justify-center gap-3">
                {canEditResults && (
                  <>
                    <button
                      onClick={() => handleSaveSheet('Pending')}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2  font-medium transition-colors"
                    >
                      Lưu nháp
                    </button>
                    <button
                      onClick={() => handleSaveSheet('PQCDone')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2  font-medium flex items-center gap-2 transition-colors shadow-md"
                    >
                      Ký xác nhận
                    </button>
                  </>
                )}

                {canLeaderSign && (
                  <button
                    onClick={() => handleSaveSheet('LeaderDone')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2  font-medium flex items-center gap-2 transition-colors shadow-md"
                  >
                    <FaCheck /> Duyệt & Ký (Leader)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 bg-white p-3  shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <button onClick={() => goToView('list')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FaArrowLeft />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {isNew ? 'Tạo mới Patrol Sheet' : `Chi tiết Sheet #${existingSheet?.id.slice(0, 6)} - ${existingSheet?.lineName}`}
            </h2>
          </div>
          {!isNew && (
            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${existingSheet?.status === 'LeaderDone' ? 'bg-green-100 text-green-700' :
                existingSheet?.status === 'PQCDone' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
              }`}>
              {existingSheet?.status}
            </span>
          )}
        </div>

        {/* Step 1: Patrol Type & Line Selection */}
        {isNew && (
          <div className="bg-white shadow-sm border border-gray-200 p-4 space-y-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Chọn Loại Patrol <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormPatrolType('daily')}
                  className={`flex-1 py-3 border font-bold transition-all ${formPatrolType === 'daily' ? 'bg-gray-50 border-gray-600 text-gray-600 shadow-sm' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  Patrol Ngày
                </button>
                <button
                  onClick={() => setFormPatrolType('weekly')}
                  className={`flex-1 py-3 border font-bold transition-all ${formPatrolType === 'weekly' ? 'bg-gray-50 border-gray-600 text-gray-600 shadow-sm' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  Patrol Tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Chọn Line kiểm tra <span className="text-red-500">*</span></label>
              <div className="relative w-full" ref={lineSelectRef}>
                <button
                  type="button"
                  onClick={() => setIsLineSelectOpen(!isLineSelectOpen)}
                  className="w-full border border-gray-200 px-4 py-2 bg-gray-50 text-left flex justify-between items-center focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                >
                  <span className={formLineId ? "text-gray-800" : "text-gray-400"}>
                    {formLineId ? lines.find(l => l.id === formLineId)?.name : '-- Chọn Line --'}
                  </span>
                  <svg className={`fill-current h-4 w-4 text-gray-500 transition-transform ${isLineSelectOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </button>

                {isLineSelectOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-lg z-50 overflow-hidden">
                    <div
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-400 border-b border-gray-50"
                      onClick={() => {
                        setFormLineId('');
                        setIsLineSelectOpen(false);
                      }}
                    >
                      -- Chọn Line --
                    </div>
                    {lines.map(line => (
                      <div
                        key={line.id}
                        className={`px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors ${formLineId === line.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}
                        onClick={() => {
                          setFormLineId(line.id);
                          setIsLineSelectOpen(false);
                        }}
                      >
                        {line.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isLineSelected && (
          <>
            {/* Nội dung Form kiểm tra (Hiển thị dạng Card theo từng công đoạn) */}
            <div className="space-y-4">
              {activeTemplate.map(stage => (
                <div key={stage.id} className="bg-white  shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100">
                    <h3 className="font-bold text-lg text-indigo-900">{stage.name}</h3>
                  </div>
                  <div className="p-3 sm:p-4 space-y-4">
                    {stage.categories.map(cat => (
                      <div key={cat.id} className="border border-gray-200  overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <h4 className="font-semibold text-gray-700">{cat.name}</h4>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {cat.items.map(item => (
                            <div key={item.id} className="p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                              <p className="text-sm sm:text-base text-gray-800 flex-1">{item.question}</p>
                              <div className="min-w-[140px] shrink-0">
                                {item.type === 'radio' ? (
                                  <div className="flex gap-2 bg-gray-100 p-1 ">
                                    <button
                                      onClick={() => handleResultChange(item.id, 'OK')}
                                      disabled={!canEditResults}
                                      className={`flex-1 py-2 px-4  text-sm font-bold transition-all ${formResults[item.id] === 'OK'
                                          ? 'bg-green-500 text-white shadow-sm'
                                          : 'text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent'
                                        }`}
                                    >OK</button>
                                    <button
                                      onClick={() => handleResultChange(item.id, 'NG')}
                                      disabled={!canEditResults}
                                      className={`flex-1 py-2 px-4  text-sm font-bold transition-all ${formResults[item.id] === 'NG'
                                          ? 'bg-red-500 text-white shadow-sm'
                                          : 'text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent'
                                        }`}
                                    >NG</button>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={formResults[item.id] || ''}
                                    onChange={(e) => handleResultChange(item.id, e.target.value)}
                                    disabled={!canEditResults}
                                    placeholder="Nhập kết quả..."
                                    className="w-full border border-gray-300  px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Phần Hình Ảnh & Ghi Chú */}
            <div className="bg-white  shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                <FaImage className="text-blue-500" /> Hình ảnh & Hiện trạng
              </h3>

              {canEditResults && (
                <MultiImageUpload
                  label="Tải lên / Chụp ảnh hiện trạng"
                  fieldName="patrolImages"
                  images={formImages.map(img => img.url)}
                  onUpload={handleImageUpload}
                  onRemove={handleRemoveImage}
                  onViewAll={() => { }}
                  onViewSingle={(url) => setPreviewImage({ isOpen: true, url, title: 'Hình ảnh Patrol' })}
                  maxImages={5}
                />
              )}

              {/* Render list image + Leader Note */}
              {formImages.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  {formImages.map((img, index) => (
                    <div key={img.id} className="border border-gray-200  overflow-hidden flex flex-col">
                      <div className="h-48 bg-gray-100 relative group">
                        <img
                          src={img.url}
                          alt="Hiện trạng"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setPreviewImage({ isOpen: true, url: img.url, title: `Hình ảnh ${index + 1}` })}
                        />
                        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-bold">
                          Ảnh {index + 1}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 flex-1 flex flex-col">
                        <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                          <FaPen /> Ghi chú hình ảnh:
                        </label>
                        <textarea
                          value={img.note}
                          onChange={(e) => handleNoteChange(img.id, e.target.value)}
                          disabled={!canEditImageNote}
                          placeholder={canEditImageNote ? "Nhập ghi chú hiện trạng hoặc ý kiến..." : (img.note ? "" : "Không có ghi chú")}
                          className="w-full text-sm p-2 border border-gray-300  resize-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 flex-1 min-h-[80px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phần Chữ Ký */}
            <div className="bg-white mt-4 shadow-sm border border-gray-200 p-4 grid grid-cols-2 gap-4">
              <div className="border-r border-gray-200 pr-4 flex flex-col items-center justify-center min-h-[120px]">
                <p className="font-semibold text-gray-600 mb-2 text-center">Người kiểm tra (PQC)</p>
                {existingSheet?.pqcSign ? (
                  <div className="text-blue-600 font-bold text-xl italic border-b-2 border-blue-200 inline-block px-4">
                    {existingSheet.pqcSign}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">(Chưa ký)</p>
                )}
              </div>
              <div className="pl-4 flex flex-col items-center justify-center min-h-[120px]">
                <p className="font-semibold text-gray-600 mb-2 text-center">Xác nhận (PQC Leader)</p>
                {existingSheet?.leaderSign ? (
                  <div className="text-green-600 font-bold text-xl italic border-b-2 border-green-200 inline-block px-4">
                    {existingSheet.leaderSign}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">(Chưa duyệt)</p>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    );
  };

  // ==========================================
  // VIEW: REPORT DASHBOARD
  // ==========================================
  const renderReport = () => {
    // Xử lý dữ liệu báo cáo từ danh sách sheets
    const recentDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

    // Mock data dựa trên sheets thực tế (nếu ít quá thì tạo mock cho biểu đồ đẹp)
    const composedData = recentDays.map((day) => ({
      name: day,
      totalChecked: Math.floor(120 + Math.random() * 50),
      totalNG: Math.floor(5 + Math.random() * 15),
    }));

    const stageData = dailyTemplate.map(stage => ({
      name: stage.name,
      OK: Math.floor(80 + Math.random() * 20),
      NG: Math.floor(2 + Math.random() * 10)
    }));

    const topNGItems = [
      { name: 'Nhiệt độ Solder', ngCount: 24 },
      { name: 'Vệ sinh Mask', ngCount: 18 },
      { name: 'Máy nạp IC', ngCount: 12 },
      { name: 'Tủ chống ẩm', ngCount: 8 },
    ];

    const pqcPerformance = [
      { name: 'Nguyễn Văn A', sheets: 15, foundNG: 8 },
      { name: 'Trần Thị B', sheets: 12, foundNG: 4 },
      { name: 'Lê Văn C', sheets: 20, foundNG: 15 },
    ];

    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => goToView('list')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <FaArrowLeft />
          </button>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaChartBar className="hidden sm:block md:block text-gray-700" /> Dashboard Báo Cáo Patrol
          </h2>
        </div>

        <div className="space-y-4!">
          {/* Chart 1 */}
          <div className="bg-white p-4 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              {/* <div className="w-1 h-4 bg-slate-800"></div> */}
              Xu Hướng Kiểm Tra & Lỗi (Tuần)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={composedData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#1e293b" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#b91c1c" axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Bar yAxisId="left" dataKey="totalChecked" name="Tổng Số Check" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="totalNG" name="Số Lỗi (NG)" stroke="#b91c1c" strokeWidth={3} dot={{ r: 5, fill: '#b91c1c', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2 */}
          <div className="bg-white p-4 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              Phân Bổ Chất Lượng & Tỉ Lệ Lỗi (Công Đoạn)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#1e293b" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#b91c1c" axisLine={false} tickLine={false} unit="%" />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Bar yAxisId="left" dataKey="OK" name="Số Lượng OK" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="NG" name="Tỉ Lệ Lỗi (%)" stroke="#b91c1c" strokeWidth={3} dot={{ r: 5, fill: '#b91c1c', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3 */}
          <div className="bg-white p-4 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              Tỉ Lệ Lỗi Theo Hạng Mục (Pareto)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topNGItems}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#334155" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#475569" axisLine={false} tickLine={false} unit="%" />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="ngCount" name="Số Lần Lỗi" fill="#334155" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="ngCount" name="Tỉ Lệ Tích Lũy" stroke="#64748b" strokeWidth={2} dot={{ r: 4, fill: '#64748b' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4 */}
          <div className="bg-white p-4 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              Hiệu Suất Kiểm Tra PQC (Sheets vs Lỗi)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={pqcPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#1e293b" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#b91c1c" axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Bar yAxisId="left" dataKey="sheets" name="Số Sheet Check" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="right" type="step" dataKey="foundNG" name="Lỗi Phát Hiện" stroke="#b91c1c" strokeWidth={3} dot={{ r: 5, fill: '#b91c1c', strokeWidth: 2, stroke: '#fff' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================
  const renderContent = () => {
    switch (activeView) {
      case 'list': return renderList();
      case 'manage': return renderManage();
      case 'detail': return renderDetail();
      case 'report': return renderReport();
      default: return renderList();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 pb-24">
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

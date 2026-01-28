/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector, useNotification } from '../../redux/hooks';
import { downloadLCRExcelFile } from '../../redux/slices/FileSlice';
import type { LcrFileData } from '../../redux/slices/FileSlice';

interface LCRFullTableProps {
  lcrData: LcrFileData;
}

/**
 * Full table with ALL 27 columns (horizontal scroll)
 * Suitable for desktop with wide screens
 */
const LCRFullTable = ({ lcrData }: LCRFullTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDecide, setFilterDecide] = useState<'ALL' | 'OK' | 'NG' | 'SKIP' | 'NOT_MEASURED'>('ALL');
  const itemsPerPage = 20;

  const { currentSheet } = useAppSelector((state) => state.changeModel);
  const dispatch = useAppDispatch();
  const { showNotification } = useNotification();

  // Filter & Search
  const filteredData = useMemo(() => {
    let filtered = lcrData.data;

    filtered = filtered.filter(item => {
      const range = item.range?.trim() || '';
      const lcrSkip = item.lcrSkip?.trim().toLowerCase() || '';
      return range !== '' && range !== '0.0~0.0' && lcrSkip !== 'skip';
    });

    if (filterDecide === 'NOT_MEASURED') {
      filtered = filtered.filter(item => {
        const measure = item.measure?.trim() || '';
        return measure === '';
      });
    } else if (filterDecide !== 'ALL') {
      filtered = filtered.filter(item => item.decide === filterDecide);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.loc.toLowerCase().includes(term) ||
        item.partCode.toLowerCase().includes(term) ||
        item.model.toLowerCase().includes(term) ||
        item.measure.toLowerCase().includes(term) ||
        item.decide.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [lcrData.data, filterDecide, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
    const validData = useMemo(() => {
    return lcrData.data.filter(item => {
      const range = item.range?.trim() || '';
      const lcrSkip = item.lcrSkip?.trim().toLowerCase() || '';
      return range !== '' && range !== '0.0~0.0' && lcrSkip !== 'skip';
    });
  }, [lcrData.data]);

  const okCount = validData.filter(item => item.decide === 'OK').length;
  const ngCount = validData.filter(item => item.decide === 'NG').length;
  const skipCount = validData.filter(item => item.decide === 'SKIP').length;
  const notMeasuredCount = validData.filter(item => {
    const measure = item.measure?.trim() || '';
    return measure === '';
  }).length;
  const validCount = validData.length;

  // Download handler
  const handleDownload = async () => {
    if (!currentSheet?.id) {
      showNotification('error', 'Lỗi', 'Không tìm thấy Sheet ID');
      return;
    }

    try {
      await dispatch(downloadLCRExcelFile(currentSheet.id)).unwrap();
      showNotification('success', 'Thành công', 'Đã tải xuống file LCR Excel');
    } catch (error: any) {
      showNotification('error', 'Lỗi', error || 'Không thể tải xuống file');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header với Statistics */}
      <div className="p-4 border-b border-gray-200 bg-linear-to-r from-green-50 to-white">
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">LCR File Data - Full View</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: <span className="font-semibold">{validCount}</span> items 
              <span className="text-xs text-gray-400 ml-1">
                ({lcrData.count - validCount} items hidden)
              </span> | 
              <span className="text-xs text-gray-500 ml-2">Kéo sang ngang để xem toàn bộ 27 cột →</span>
            </p>
          </div>
          
          {/* Statistics */}
          <div className="flex gap-4">
            {/**total */}
            <div className="px-4 py-2 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-lg font-bold text-gray-600">{validCount}</p>
            </div>
            <div className="px-4 py-2 bg-green-100 rounded-lg">
              <p className="text-xs text-gray-600">OK</p>
              <p className="text-lg font-bold text-green-600">{okCount}</p>
            </div>
            <div className="px-4 py-2 bg-orange-100 rounded-lg">
              <p className="text-xs text-gray-600">SKIP</p>
              <p className="text-lg font-bold text-orange-600">{skipCount}</p>
            </div>
            <div className="px-4 py-2 bg-red-100 rounded-lg">
              <p className="text-xs text-gray-600">NG</p>
              <p className="text-lg font-bold text-red-600">{ngCount}</p>
            </div>
            
            <div className="px-4 py-2 bg-blue-100 rounded-lg">
              <p className="text-xs text-gray-600">Pass Rate</p>
              <p className="text-lg font-bold text-blue-600">
                {validCount > 0 ? ((okCount / validCount) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
            <div className="px-4 py-2 bg-orange-100 rounded-lg">
              <p className="text-xs text-gray-600">Skip Rate</p>
              <p className="text-lg font-bold text-orange-600">
                {validCount > 0 ? ((skipCount / validCount) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
            {/** NG Rate */}
            <div className="px-4 py-2 bg-red-100 rounded-lg">
              <p className="text-xs text-gray-600">NG Rate</p>
              <p className="text-lg font-bold text-red-600">
                {validCount > 0 ? ((ngCount / validCount) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
            {/** Chưa đo */}
            <div className="px-4 py-2 bg-purple-100 rounded-lg">
              <p className="text-xs text-gray-600">Not Measured</p>
              <p className="text-lg font-bold text-purple-600">{notMeasuredCount}</p>
          </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by Location, Part Code, Model..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            {(['ALL', 'OK', 'SKIP', 'NG', 'NOT_MEASURED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterDecide(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterDecide === status
                    ? status === 'OK'
                      ? 'bg-green-600 text-white'
                      : status === 'NG'
                      ? 'bg-red-600 text-white'
                      : status === 'SKIP'
                      ? 'bg-orange-600 text-white'
                      : status === 'NOT_MEASURED'
                      ? 'bg-purple-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status === 'NOT_MEASURED' ? 'Not Measured' : status}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition inline-flex items-center gap-2 font-medium whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Full Table with Horizontal Scroll */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r border-gray-300 bg-gray-200 sticky left-0 z-20">No</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r border-gray-300 bg-gray-200 sticky left-12 z-20">Location</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">NDX</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Reel</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r min-w-[200px]">Model</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Line MC</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r min-w-[120px]">Part Code</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Part Name</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Type</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Measure</th>
              <th className="px-2 py-3 text-center font-semibold text-gray-700 border-r bg-green-50">Decide</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Define</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r min-w-[120px]">Range</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Error Comment</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Tolerance</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Freq</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Volt</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">LCR Skip</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r min-w-[150px]">Spec</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">X</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Y</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Angle</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">MC</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Skip</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Vender</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Feeder</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Operator</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700 border-r">Check Time</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700">Calc Sec</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item, index) => (
              <tr 
                key={`${item.no}-${item.loc}-${index}`}
                className="border-b border-gray-200 hover:bg-blue-50 transition"
              >
                <td className="px-2 py-2 text-gray-700 border-r font-medium sticky left-0 bg-white z-10">{item.no}</td>
                <td className="px-2 py-2 text-gray-900 border-r font-bold sticky left-12 bg-white z-10">{item.loc}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.ndx}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.reel}</td>
                <td className="px-2 py-2 text-gray-700 border-r font-mono text-[10px]">{item.model}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.lineMC}</td>
                <td className="px-2 py-2 text-gray-700 border-r font-mono text-[10px]">{item.partCode}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.partName || '-'}</td>
                <td className="px-2 py-2 border-r">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    item.type === 'R' ? 'bg-blue-100 text-blue-700' :
                    item.type === 'C' ? 'bg-purple-100 text-purple-700' :
                    item.type === 'L' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-2 py-2 text-gray-700 border-r font-mono font-semibold">{item.measure}</td>
                <td className="px-2 py-2 text-center border-r bg-green-50">
                  <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold ${
                    item.decide === 'OK' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {item.decide}
                  </span>
                </td>
                <td className="px-2 py-2 text-gray-700 border-r font-mono">{item.define}</td>
                <td className="px-2 py-2 text-gray-600 border-r font-mono text-[10px]">{item.range}</td>
                <td className="px-2 py-2 text-red-600 border-r">{item.errorComment || '-'}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.tolerance}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.freq}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.volt}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.lcrSkip || '-'}</td>
                <td className="px-2 py-2 text-gray-700 border-r font-mono text-[10px]">{item.spec}</td>
                <td className="px-2 py-2 text-gray-600 border-r font-mono text-[10px]">{item.x}</td>
                <td className="px-2 py-2 text-gray-600 border-r font-mono text-[10px]">{item.y}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.ang}°</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.mc}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.skip}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.vender || '-'}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.feeder || '-'}</td>
                <td className="px-2 py-2 text-gray-600 border-r">{item.operator || '-'}</td>
                <td className="px-2 py-2 text-gray-600 border-r font-mono text-[10px]">{item.checkTime}</td>
                <td className="px-2 py-2 text-gray-600">{item.calcSec}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg font-medium ${
                      currentPage === pageNum
                        ? 'bg-green-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LCRFullTable;
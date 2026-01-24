/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector, useNotification } from '../../redux/hooks';
import { downloadLCRExcelFile } from '../../redux/slices/FileSlice';
import type { LcrFileData } from '../../redux/slices/FileSlice';

interface LCRDataTableProps {
  lcrData: LcrFileData;
}

const LCRDataTable = ({ lcrData }: LCRDataTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDecide, setFilterDecide] = useState<'ALL' | 'OK' | 'NG'>('ALL');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const itemsPerPage = 20;

  const { currentSheet } = useAppSelector((state) => state.changeModel);
  const dispatch = useAppDispatch();
  const { showNotification } = useNotification();

  // Toggle row expansion
  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  // Filter & Search
  const filteredData = useMemo(() => {
    let filtered = lcrData.data;

    // Filter by decide
    if (filterDecide !== 'ALL') {
      filtered = filtered.filter(item => item.decide === filterDecide);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.loc.toLowerCase().includes(term) ||
        item.partCode.toLowerCase().includes(term) ||
        item.model.toLowerCase().includes(term) ||
        item.measure.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [lcrData.data, filterDecide, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const okCount = lcrData.data.filter(item => item.decide === 'OK').length;
  const ngCount = lcrData.data.filter(item => item.decide === 'NG').length;

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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">LCR File Data</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: <span className="font-semibold">{lcrData.count}</span> items
            </p>
          </div>
          
          {/* Statistics */}
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-green-100 rounded-lg">
              <p className="text-xs text-gray-600">OK</p>
              <p className="text-lg font-bold text-green-600">{okCount}</p>
            </div>
            <div className="px-4 py-2 bg-red-100 rounded-lg">
              <p className="text-xs text-gray-600">NG</p>
              <p className="text-lg font-bold text-red-600">{ngCount}</p>
            </div>
            <div className="px-4 py-2 bg-blue-100 rounded-lg">
              <p className="text-xs text-gray-600">Pass Rate</p>
              <p className="text-lg font-bold text-blue-600">
                {((okCount / lcrData.count) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
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

          {/* Filter by Decide */}
          <div className="flex gap-2">
            {(['ALL', 'OK', 'NG'] as const).map((status) => (
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
                      : 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition inline-flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 w-10"></th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">No</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Location</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Part Code</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Type</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Measure</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Define</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Range</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700">Decide</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Operator</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Check Time</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item, index) => {
              const rowId = `${item.no}-${item.loc}-${index}`;
              const isExpanded = expandedRows.has(rowId);
              
              return (
                <>
                  {/* Main Row */}
                  <tr 
                    key={rowId}
                    className="border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => toggleRow(rowId)}
                  >
                    <td className="px-3 py-3 text-gray-500">
                      <svg 
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                    <td className="px-3 py-3 text-gray-700 font-medium">{item.no}</td>
                    <td className="px-3 py-3 font-semibold text-gray-900">{item.loc}</td>
                    <td className="px-3 py-3 text-gray-700 font-mono text-xs">{item.partCode}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.type === 'R' ? 'bg-blue-100 text-blue-700' :
                        item.type === 'C' ? 'bg-purple-100 text-purple-700' :
                        item.type === 'L' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 font-mono text-xs font-semibold">{item.measure}</td>
                    <td className="px-3 py-3 text-gray-700 font-mono text-xs">{item.define}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{item.range}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        item.decide === 'OK' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.decide}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{item.operator || '-'}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs font-mono">{item.checkTime}</td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {isExpanded && (
                    <tr className="bg-blue-50 border-b border-blue-200">
                      <td colSpan={11} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Column 1: Basic Info */}
                          <div className="space-y-2">
                            <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Basic Information
                            </h4>
                            <DetailRow label="No" value={item.no} />
                            <DetailRow label="NDX" value={item.ndx} />
                            <DetailRow label="Location" value={item.loc} highlight />
                            <DetailRow label="Reel" value={item.reel} />
                            <DetailRow label="Model" value={item.model} />
                            <DetailRow label="Line MC" value={item.lineMC} />
                            <DetailRow label="MC" value={item.mc} />
                          </div>

                          {/* Column 2: Part Info */}
                          <div className="space-y-2">
                            <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                              </svg>
                              Part Details
                            </h4>
                            <DetailRow label="Part Code" value={item.partCode} mono />
                            <DetailRow label="Part Name" value={item.partName || '-'} />
                            <DetailRow label="Type" value={item.type} badge={item.type} />
                            <DetailRow label="Specification" value={item.spec} mono />
                            <DetailRow label="Vender" value={item.vender || '-'} />
                            <DetailRow label="Feeder" value={item.feeder || '-'} />
                          </div>

                          {/* Column 3: Measurement */}
                          <div className="space-y-2">
                            <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              Measurement Data
                            </h4>
                            <DetailRow label="Measure" value={item.measure} mono highlight />
                            <DetailRow label="Define" value={item.define} mono />
                            <DetailRow label="Range" value={item.range} mono />
                            <DetailRow label="Decide" value={item.decide} badge={item.decide} />
                            <DetailRow label="Tolerance" value={item.tolerance} />
                            <DetailRow label="Frequency" value={item.freq} />
                            <DetailRow label="Voltage" value={item.volt} />
                            <DetailRow label="Error Comment" value={item.errorComment || '-'} error={!!item.errorComment} />
                          </div>

                          {/* Column 4: Position */}
                          <div className="space-y-2">
                            <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Position
                            </h4>
                            <DetailRow label="X" value={item.x} mono />
                            <DetailRow label="Y" value={item.y} mono />
                            <DetailRow label="Angle" value={`${item.ang}°`} />
                          </div>

                          {/* Column 5: Status & Flags */}
                          <div className="space-y-2">
                            <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                              </svg>
                              Status
                            </h4>
                            <DetailRow label="Skip" value={item.skip === 'T' ? 'Yes' : 'No'} badge={item.skip} />
                            <DetailRow label="LCR Skip" value={item.lcrSkip || 'No'} />
                          </div>

                          {/* Column 6: Timing */}
                          <div className="space-y-2">
                            <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Timing
                            </h4>
                            <DetailRow label="Check Time" value={item.checkTime} mono />
                            <DetailRow label="Calc Sec" value={`${item.calcSec}s`} />
                            <DetailRow label="Operator" value={item.operator || '-'} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
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

// Helper Component: Detail Row
interface DetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
  badge?: string;
  error?: boolean;
}

const DetailRow = ({ label, value, mono, highlight, badge, error }: DetailRowProps) => {
  return (
    <div className="flex justify-between items-center py-1 text-xs">
      <span className="text-gray-600 font-medium">{label}:</span>
      {badge ? (
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          badge === 'OK' ? 'bg-green-100 text-green-700' :
          badge === 'NG' ? 'bg-red-100 text-red-700' :
          badge === 'R' ? 'bg-blue-100 text-blue-700' :
          badge === 'C' ? 'bg-purple-100 text-purple-700' :
          badge === 'L' ? 'bg-orange-100 text-orange-700' :
          badge === 'T' ? 'bg-yellow-100 text-yellow-700' :
          badge === 'F' ? 'bg-gray-100 text-gray-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {value}
        </span>
      ) : (
        <span className={`${mono ? 'font-mono' : ''} ${
          highlight ? 'font-bold text-gray-900' : 
          error ? 'text-red-600 font-semibold' :
          'text-gray-800'
        }`}>
          {value}
        </span>
      )}
    </div>
  );
};

export default LCRDataTable;
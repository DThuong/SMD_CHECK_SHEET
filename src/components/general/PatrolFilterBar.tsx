import React from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import FuzzySearchInput from '../general/FuzzySearchInput';
import type { LineArea } from '../../redux/slices/patrolSlice';

export interface PatrolFilter {
  fullName: string;
  lineAreaName: string;
  status: string;
  fromDate: string;
  toDate: string;
}

export const PATROL_FILTER_DEFAULT: PatrolFilter = {
  fullName: '',
  lineAreaName: '',
  status: '',
  fromDate: '',
  toDate: '',
};

interface PatrolFilterBarProps {
  filter: PatrolFilter;
  onChange: (key: keyof PatrolFilter, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  lineAreas: LineArea[];
  totalCount: number;
  loading?: boolean;
  showFullName?: boolean;
  statusOptions: { value: string; label: string }[];
  fullNameCandidates?: string[];
  labels: {
    fullName?: string;
    lineArea: string;
    status: string;
    fromDate: string;
    toDate: string;
    search: string;
    searching?: string;
    reset: string;
    results: string;
  };
}

const PatrolFilterBar: React.FC<PatrolFilterBarProps> = ({
  filter, onChange, onSearch, onReset,
  lineAreas, totalCount, loading = false,
  showFullName = false, statusOptions, labels,
  fullNameCandidates = [],
}) => {
  const lineAreaNames = lineAreas.map(l => l.lineAreaName);
  const hasActiveFilter = !!filter.fullName || !!filter.lineAreaName ||
    !!filter.status || !!filter.fromDate || !!filter.toDate;

  return (
    <div
      className="bg-white border border-gray-200 shadow-sm p-3 space-y-3!"
      onKeyDown={e => e.key === 'Enter' && onSearch()}
    >
      <div className={`grid gap-2 ${showFullName
        ? 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-5'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}
      >
        {showFullName && (
        <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {labels.fullName || 'Người tạo'}
            </label>
            <FuzzySearchInput
            value={filter.fullName}
            onChange={val => onChange('fullName', val)}
            candidates={fullNameCandidates}
            placeholder={`${labels.fullName || 'Người tạo'}...`}
            className="w-full"
            />
        </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{labels.lineArea}</label>
          <FuzzySearchInput
            value={filter.lineAreaName}
            onChange={val => onChange('lineAreaName', val)}
            candidates={lineAreaNames}
            placeholder={`${labels.lineArea}...`}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{labels.status}</label>
          <select
            value={filter.status}
            onChange={e => onChange('status', e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-lg! outline-none bg-white"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{labels.fromDate}</label>
          <input type="date" value={filter.fromDate} onChange={e => onChange('fromDate', e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-lg! outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{labels.toDate}</label>
          <input type="date" value={filter.toDate} onChange={e => onChange('toDate', e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-lg! outline-none" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {labels.results}: <span className="font-bold text-gray-700">{totalCount}</span>
        </span>
        <div className="flex gap-2">
          {hasActiveFilter && (
            <button type="button" onClick={onReset}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
              <FaTimes className="w-3 h-3" /> {labels.reset}
            </button>
          )}
          <button type="button" onClick={onSearch} disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <FaSearch className="w-3 h-3" />
            {loading ? (labels.searching || 'Đang tìm...') : labels.search}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatrolFilterBar;
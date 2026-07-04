/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import FuzzySearchInput from '../general/FuzzySearchInput';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
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
  /** @deprecated Lọc realtime qua onChange (debounce) — không còn nút Lọc */
  onSearch?: () => void;
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
    search?: string;
    searching?: string;
    reset: string;
    results: string;
  };
}

const PatrolFilterBar: React.FC<PatrolFilterBarProps> = ({
  filter, onChange, onReset,
  lineAreas, totalCount, loading = false,
  showFullName = false, statusOptions, labels,
  fullNameCandidates = [],
}) => {
  const lineAreaNames = lineAreas.map(l => l.lineAreaName);
  const inputCls = "h-10 w-full px-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white appearance-none";
  const hasActiveFilter = !!filter.fullName || !!filter.lineAreaName ||
    !!filter.status || !!filter.fromDate || !!filter.toDate;

  return (
    <div className="bg-white border border-gray-200 shadow-sm p-3 space-y-3!">
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
            inputClassName="h-10"
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
            inputClassName="h-[40px]"
          />
        </div>

        <div className="flex flex-col gap-1 z-10">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{labels.status}</label>
          <CustomSelect
            options={[
                { value: '', label: 'Tất cả' },
                ...statusOptions
            ]}
            value={filter.status}
            onChange={val => onChange('status', val)}
            placeholder={labels.status}
          />
        </div>

        <div className="flex flex-col gap-1 z-10">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{labels.fromDate}</label>
          <CustomDatePicker
            value={filter.fromDate}
            onChange={val => onChange('fromDate', val)}
            placeholder={labels.fromDate}
          />
        </div>

        <div className="flex flex-col gap-1 z-10">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{labels.toDate}</label>
          <CustomDatePicker
            value={filter.toDate}
            onChange={val => onChange('toDate', val)}
            placeholder={labels.toDate}
          />
        </div>
      </div>

      {/* Lọc realtime (debounce) — không cần nút Lọc */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {labels.results}: <span className="font-bold text-gray-700">{totalCount}</span>
          {loading && <span className="ml-2 text-blue-500 animate-pulse">{labels.searching || 'Đang lọc...'}</span>}
        </span>
        {hasActiveFilter && (
          <button type="button" onClick={onReset}
            className="shrink-0 px-3 py-1.5 text-xs sm:text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 rounded flex items-center justify-center gap-1.5">
            <FaTimes className="w-3 h-3" /> {labels.reset}
          </button>
        )}
      </div>
    </div>
  );
};

export default PatrolFilterBar;

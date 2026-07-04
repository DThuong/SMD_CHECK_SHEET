/* eslint-disable @typescript-eslint/no-explicit-any */
import { AiOutlineSearch, AiOutlineClose } from "react-icons/ai";
import FuzzySearchInput from "./FuzzySearchInput";
import CustomSelect from "./CustomSelect";
import CustomDatePicker from "./CustomDatePicker";

interface SearchField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'datetime-local';
  options?: { value: string; label: string }[];
  placeholder?: string;
  candidates?: string[];
}

interface SmartSearchBarProps {
  fields: SearchField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset: () => void;
  loading?: boolean;
  resultCount?: {
    current: number;
    total: number;
    page: number;
    pageCount: number;
  };
}

export const SmartSearchBar = ({
  fields,
  values,
  onChange,
  onReset,
  loading = false,
  resultCount,
}: SmartSearchBarProps) => {

  const getInputValue = (field: SearchField) => {
    const val = values[field.key];
    if (field.type === 'number' || typeof val === 'number') {
        return (!val || val === 0) ? '' : String(val);
    }
    return val != null ? String(val) : '';
};

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <AiOutlineSearch className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-700">Tìm kiếm</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {fields.map(field => (
          <div key={field.key}>
            <div className="text-xs font-medium text-gray-700 mb-1">{field.label}</div>

            {field.type === 'select' ? (
              <div className="z-10 relative">
                <CustomSelect
                  value={values[field.key] ?? ''}
                  onChange={val => onChange(field.key, val)}
                  options={field.options || []}
                  placeholder={field.placeholder || "Chọn..."}
                  isClearable={true}
                />
              </div>

            ) : field.type === 'datetime-local' ? (
              <div className="relative z-10">
                <CustomDatePicker
                  value={getInputValue(field)}
                  onChange={val => onChange(field.key, val)}
                  placeholder={field.placeholder || "Chọn thời gian"}
                  isClearable={true}
                />
              </div>

            ) : field.candidates ? (
              <FuzzySearchInput
                value={getInputValue(field)}
                onChange={val => onChange(field.key, val)}
                candidates={field.candidates}
                placeholder={field.placeholder}
              />

            ) : (
              <div className="relative">
                <input
                  type="text"
                  inputMode={field.type === 'number' ? 'numeric' : undefined}
                  value={getInputValue(field)}
                  onChange={e => {
                    if (field.type === 'number') {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      onChange(field.key, raw === '' ? 0 : parseInt(raw, 10));
                    } else {
                      onChange(field.key, e.target.value);
                    }
                  }}
                  className="w-full h-[40px] px-3 border border-gray-300 rounded-lg text-sm pr-8 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  placeholder={field.placeholder}
                />
                {getInputValue(field) && (
                  <button
                    type="button"
                    onClick={() => onChange(field.key, field.type === 'number' ? 0 : '')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <AiOutlineClose className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={onReset}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <AiOutlineClose className="w-4 h-4" />
          Xóa bộ lọc
        </button>

        {loading && <span className="text-sm text-gray-500">Đang tìm...</span>}

        {resultCount !== undefined && (
          <span className="text-sm text-gray-600">
            Hiển thị{' '}
            <span className="font-semibold text-blue-600">{resultCount.current}</span>
            {' / '}
            <span className="font-semibold">{resultCount.total}</span> sheets
            {resultCount.pageCount > 1 && (
              <span className="ml-1">(Trang {resultCount.page + 1}/{resultCount.pageCount})</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
};
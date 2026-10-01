import {
  REFLOW_STANDARDS,
  type ReflowCellError,
  type ReflowValidationResult,
} from '../../utils/reflowValidation';

interface Props {
  validation: ReflowValidationResult;
  className?: string;
}

const FIELDS = [
  { key: 'maxC', label: "Max'C" },
  { key: 'ov220', label: 'ov-220' },
  { key: 't2', label: 'T2-s' },
  { key: 't4', label: 'T4-s' },
] as const;

/** Bảng S1 → S6 so với chuẩn: ô ngoài chuẩn tô đỏ, kênh không đo tô xám */
const ReflowResultTable = ({ validation, className = '' }: Props) => {
  const { appliedSide, rows, cellErrors, skippedChannels = [] } = validation;
  const std = appliedSide ? REFLOW_STANDARDS[appliedSide] : null;
  if (!std || rows.length === 0) return null;

  const isError = (ch: string, field: ReflowCellError['field']) =>
    cellErrors.some((e) => e.ch === ch && e.field === field);

  return (
    <table className={`text-xs bg-white border border-gray-300 ${className}`}>
      <thead>
        <tr className="bg-gray-50">
          <th className="px-3 py-1 border border-gray-300"></th>
          {FIELDS.map((f) => (
            <th key={f.key} className="px-3 py-1 border border-gray-300 whitespace-nowrap">
              {f.label} ({std[f.key][0]}–{std[f.key][1]})
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const skipped = skippedChannels.includes(r.ch);
          return (
            <tr key={r.ch} className={skipped ? 'bg-gray-100' : ''}>
              <td className="px-3 py-1 border border-gray-300 font-semibold whitespace-nowrap text-left">
                {r.ch}
                {skipped && <span className="ml-2 text-[10px] font-medium text-gray-500">(không đo)</span>}
              </td>
              {FIELDS.map((f) => (
                <td
                  key={f.key}
                  className={`px-3 py-1 border border-gray-300 text-center ${
                    isError(r.ch, f.key)
                      ? 'bg-red-100 text-red-700 font-bold'
                      : skipped
                        ? 'text-gray-400'
                        : 'text-gray-800'
                  }`}
                >
                  {r[f.key].toFixed(1)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ReflowResultTable;

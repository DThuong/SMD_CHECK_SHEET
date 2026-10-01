import {
  REFLOW_STANDARDS,
  type ReflowCellError,
  type ReflowValidationResult,
} from '../../utils/reflowValidation';

interface Props {
  validation: ReflowValidationResult;
}

/** Kết quả kiểm tra tiêu chuẩn file Reflow — hiển thị phía trên PDF viewer */
const ReflowValidationPanel = ({ validation }: Props) => {
  const { isValid, side, appliedSide, passedSides, fileName, rows, cellErrors, errors, warnings } =
    validation;
  const std = appliedSide ? REFLOW_STANDARDS[appliedSide] : null;
  const hasWarning = warnings.length > 0;
  const isError = (ch: string, field: ReflowCellError['field']) =>
    cellErrors.some((e) => e.ch === ch && e.field === field);

  const tone = !isValid
    ? 'bg-red-50 border-red-400'
    : hasWarning
      ? 'bg-yellow-50 border-yellow-400'
      : 'bg-green-50 border-green-300';

  return (
    <div className={`mt-4 p-4 rounded-lg border-2 ${tone}`}>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <span
          className={`text-sm font-bold ${
            !isValid ? 'text-red-700' : hasWarning ? 'text-yellow-800' : 'text-green-700'
          }`}
        >
          {!isValid
            ? '❌ File Reflow KHÔNG đạt tiêu chuẩn'
            : hasWarning
              ? '⚠️ Số liệu Reflow trong tiêu chuẩn — có cảnh báo'
              : '✓ File Reflow đạt tiêu chuẩn'}
        </span>
        {side ? (
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              side === 'TOP' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {side} – {REFLOW_STANDARDS[side].label}
          </span>
        ) : (
          rows.length > 0 && (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800">
              Không rõ mặt TOP/BOT
              {passedSides.length > 0
                ? ` · đạt chuẩn ${passedSides.map((sd) => REFLOW_STANDARDS[sd].label).join(' & ')}`
                : appliedSide
                  ? ` · so theo chuẩn gần nhất ${REFLOW_STANDARDS[appliedSide].label}`
                  : ''}
            </span>
          )
        )}
        {fileName && <span className="text-xs text-gray-600">File Name: {fileName}</span>}
      </div>

      {rows.length > 0 && std && (
        <table className="text-xs bg-white border border-gray-300 mb-2">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-1 border border-gray-300"></th>
              <th className="px-3 py-1 border border-gray-300">Max'C ({std.maxC[0]}–{std.maxC[1]})</th>
              <th className="px-3 py-1 border border-gray-300">ov-220 ({std.ov220[0]}–{std.ov220[1]})</th>
              <th className="px-3 py-1 border border-gray-300">T2-s ({std.t2[0]}–{std.t2[1]})</th>
              <th className="px-3 py-1 border border-gray-300">T4-s ({std.t4[0]}–{std.t4[1]})</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ch}>
                <td className="px-3 py-1 border border-gray-300 font-semibold">{r.ch}</td>
                {(['maxC', 'ov220', 't2', 't4'] as const).map((f) => (
                  <td
                    key={f}
                    className={`px-3 py-1 border border-gray-300 text-center ${
                      isError(r.ch, f) ? 'bg-red-100 text-red-700 font-bold' : 'text-gray-800'
                    }`}
                  >
                    {r[f].toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {hasWarning && (
        <ul className="mb-1 pl-5 text-xs text-yellow-800 list-disc">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}

      {!isValid && (
        <ul className="mb-0 pl-5 text-xs text-red-700 list-disc">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReflowValidationPanel;

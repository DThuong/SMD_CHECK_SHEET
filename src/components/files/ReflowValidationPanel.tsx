import { REFLOW_STANDARDS, type ReflowValidationResult } from '../../utils/reflowValidation';
import ReflowResultTable from './ReflowResultTable';

interface Props {
  validation: ReflowValidationResult;
}

/** Kết quả kiểm tra tiêu chuẩn file Reflow — hiển thị phía trên PDF viewer */
const ReflowValidationPanel = ({ validation }: Props) => {
  const {
    isValid, side, appliedSide, passedSides,
    fileName, rows, errors, generalErrors = errors, warnings,
  } = validation;
  const hasWarning = warnings.length > 0;
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

      <ReflowResultTable validation={validation} className="mb-2" />

      {hasWarning && (
        <ul className="mb-1 pl-5 text-xs text-yellow-800 list-disc">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}

      {!isValid && generalErrors.length > 0 && (
        <ul className="mb-0 pl-5 text-xs text-red-700 list-disc">
          {generalErrors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReflowValidationPanel;

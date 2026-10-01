/* eslint-disable @typescript-eslint/no-explicit-any */
// src/utils/reflowValidation.ts
//
// Đọc file Reflow PDF (Temperature Profile) và đối chiếu bảng
// "Temperature Analysis & Temperature Zone" (S1 → S6) với tiêu chuẩn.
//
//  - Mặt TOP  -> chuẩn PIP       (Max'C 240-250, ov-220 & T4-s 50-70s)
//  - Mặt BOT  -> chuẩn None PIP  (Max'C 235-245, ov-220 & T4-s 40-60s)
//  - T2-s (Time) dùng chung      (70-110s)
//
// TOP/BOT lấy từ "File Name(Graph): ..." trong PDF: tìm chuỗi "top"/"bot"
// (không phân biệt hoa thường, ở bất kỳ vị trí nào).
//  - Không có TOP lẫn BOT  -> lỗi, không kiểm tra tiếp
//  - Có cả TOP lẫn BOT     -> lỗi, không kiểm tra tiếp

export type ReflowSide = 'TOP' | 'BOT';
export type Range = [number, number];

export interface ReflowStandard {
  label: string;
  maxC: Range;
  ov220: Range;
  t4: Range;
  t2: Range;
}

export const REFLOW_T2_TIME: Range = [70, 110];

export const REFLOW_STANDARDS: Record<ReflowSide, ReflowStandard> = {
  TOP: { label: 'PIP', maxC: [240, 250], ov220: [50, 70], t4: [50, 70], t2: REFLOW_T2_TIME },
  BOT: { label: 'None PIP', maxC: [235, 245], ov220: [40, 60], t4: [40, 60], t2: REFLOW_T2_TIME },
};

export const REFLOW_CHANNELS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] as const;

export interface ReflowRow {
  ch: string;
  maxC: number;
  ov220: number;
  t2: number;
  t4: number;
}

export interface ReflowCellError {
  ch: string;
  field: 'maxC' | 'ov220' | 't4' | 't2';
  value: number;
  range: Range;
}

export interface ReflowValidationResult {
  isValid: boolean;
  /** Sheet (Change Model) mà kết quả này thuộc về — tránh dùng nhầm kết quả của sheet khác */
  sheetId?: number;
  fileName: string | null;
  side: ReflowSide | null;
  rows: ReflowRow[];
  cellErrors: ReflowCellError[];
  /** Danh sách lỗi (mỗi dòng 1 lỗi) */
  errors: string[];
  errorMessage?: string;
}

export interface ParsedReflowPdf {
  fileName: string | null;
  rows: ReflowRow[];
}

const FIELD_LABEL: Record<ReflowCellError['field'], string> = {
  maxC: "Max'C",
  ov220: 'ov-220',
  t4: 'T4-s',
  t2: 'T2-s',
};
const FIELD_UNIT: Record<ReflowCellError['field'], string> = {
  maxC: '°C',
  ov220: 's',
  t4: 's',
  t2: 's',
};

// ─────────────────────────────────────────────────────────────
// 1. Đọc text từ PDF (pdfjs-dist, lazy-load để không phình bundle chính)
// ─────────────────────────────────────────────────────────────

interface TextPiece {
  x: number;
  y: number;
  w: number;
  s: string;
}

/** Gom các mảnh chữ cùng toạ độ y thành dòng, sắp xếp trái → phải. */
export const groupPiecesIntoLines = (pieces: TextPiece[]): string[] => {
  const Y_TOLERANCE = 2;
  const lines: { y: number; parts: TextPiece[] }[] = [];

  for (const p of pieces) {
    if (!p.s.trim()) continue;
    const line = lines.find((l) => Math.abs(l.y - p.y) <= Y_TOLERANCE);
    if (line) line.parts.push(p);
    else lines.push({ y: p.y, parts: [p] });
  }

  // PDF: y lớn = phía trên trang
  lines.sort((a, b) => b.y - a.y);

  return lines.map(({ parts }) => {
    parts.sort((a, b) => a.x - b.x);
    let text = '';
    let prevEnd: number | null = null;
    for (const p of parts) {
      // Có khoảng trống giữa 2 mảnh -> chèn dấu cách; dính sát -> nối liền
      if (prevEnd !== null && p.x - prevEnd > 0.5) text += ' ';
      text += p.s;
      prevEnd = p.x + p.w;
    }
    return text.replace(/\s+/g, ' ').trim();
  });
};

export const extractPdfLines = async (data: ArrayBuffer): Promise<string[]> => {
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerPort) {
    // Dùng "?worker" để Vite đóng gói worker thành file .js thường.
    // KHÔNG dùng "?url" (ra file .mjs): nginx mặc định trả .mjs với MIME
    // application/octet-stream -> trình duyệt chặn module -> "Setting up fake worker failed".
    const { default: PdfWorker } = await import('pdfjs-dist/build/pdf.worker.min.mjs?worker');
    pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();
  }

  // pdfjs "chiếm" (transfer) buffer truyền vào -> truyền bản copy
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) }).promise;
  try {
    const all: string[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const pieces: TextPiece[] = [];
      for (const item of content.items) {
        if (!('str' in item)) continue;
        pieces.push({ s: item.str, x: item.transform[4], y: item.transform[5], w: item.width });
      }
      all.push(...groupPiecesIntoLines(pieces));
    }
    return all;
  } finally {
    await pdf.destroy();
  }
};

// ─────────────────────────────────────────────────────────────
// 2. Phân tích các dòng text
// ─────────────────────────────────────────────────────────────

// Mọi số trong bảng Analysis đều có đúng 1 chữ số thập phân.
// Nhờ vậy tách được cả trường hợp 2 số dính nhau, vd "105.034.5" -> 105.0 | 34.5
const NUMBER_RE = /[+-]?\d+\.\d/g;

export const parseReflowLines = (lines: string[]): ParsedReflowPdf => {
  let fileName: string | null = null;
  const rows: ReflowRow[] = [];

  for (const line of lines) {
    if (fileName === null) {
      const fm = line.match(/File\s*Name\s*\(\s*Graph\s*\)\s*:\s*(.+?\.rfx)\b/i)
        ?? line.match(/File\s*Name\s*\(\s*Graph\s*\)\s*:\s*(\S+)/i);
      if (fm) fileName = fm[1].trim();
    }

    // Dòng dữ liệu: "S1 246.1 239.5 62.5 66.5 93.5 38.5 62.5 21.5 +1.8 ..."
    // (dòng "S1: TC1 S2: TC2 ..." không có số thập phân nên tự bị loại)
    const m = line.match(/^S\s?([1-6])(?![\d:])\s*(.*)$/);
    if (!m) continue;
    const nums = (m[2].match(NUMBER_RE) ?? []).map(Number);
    // Max'C, at-sec, ov-220, T1..T5 = tối thiểu 8 số
    if (nums.length < 8) continue;

    const ch = `S${m[1]}`;
    if (rows.some((r) => r.ch === ch)) continue; // chỉ lấy lần xuất hiện đầu
    // Thứ tự cột: Max'C(0) at-sec(1) ov-220(2) T1-s(3) T2-s(4) T3-s(5) T4-s(6) T5-s(7) ...
    rows.push({ ch, maxC: nums[0], ov220: nums[2], t2: nums[4], t4: nums[6] });
  }

  rows.sort((a, b) => a.ch.localeCompare(b.ch));
  return { fileName, rows };
};

/** Xác định mặt TOP/BOT từ File Name. Trả về null nếu không có hoặc có cả hai. */
export const detectReflowSide = (
  fileName: string | null,
): { side: ReflowSide | null; error?: string } => {
  if (!fileName) {
    return { side: null, error: 'Không đọc được "File Name(Graph)" trong file Reflow.' };
  }
  const hasTop = /top/i.test(fileName);
  const hasBot = /bot/i.test(fileName);
  if (hasTop && hasBot) {
    return { side: null, error: `File Name "${fileName}" chứa cả TOP và BOT — không xác định được mặt để áp tiêu chuẩn.` };
  }
  if (!hasTop && !hasBot) {
    return { side: null, error: `Không xác định được mặt TOP/BOT từ File Name "${fileName}".` };
  }
  return { side: hasTop ? 'TOP' : 'BOT' };
};

// ─────────────────────────────────────────────────────────────
// 3. Đối chiếu tiêu chuẩn
// ─────────────────────────────────────────────────────────────

const inRange = (v: number, [lo, hi]: Range) => v >= lo && v <= hi;

const buildResult = (
  partial: Omit<ReflowValidationResult, 'isValid' | 'errorMessage'>,
): ReflowValidationResult => {
  const isValid = partial.errors.length === 0;
  const sideText = partial.side ? ` (${partial.side} – ${REFLOW_STANDARDS[partial.side].label})` : '';
  return {
    ...partial,
    isValid,
    errorMessage: isValid
      ? undefined
      : `File Reflow không đạt tiêu chuẩn${sideText}:\n- ${partial.errors.join('\n- ')}`,
  };
};

export const validateReflowData = (parsed: ParsedReflowPdf): ReflowValidationResult => {
  const { fileName, rows } = parsed;
  const base = { fileName, rows, cellErrors: [] as ReflowCellError[] };

  if (rows.length === 0) {
    return buildResult({
      ...base,
      side: null,
      errors: ['Không đọc được bảng "Temperature Analysis" (S1–S6) trong file Reflow. File có thể là ảnh scan hoặc sai định dạng.'],
    });
  }

  const { side, error } = detectReflowSide(fileName);
  if (!side) {
    return buildResult({ ...base, side: null, errors: [error!] });
  }

  const std = REFLOW_STANDARDS[side];
  const errors: string[] = [];
  const cellErrors: ReflowCellError[] = [];

  const missing = REFLOW_CHANNELS.filter((c) => !rows.some((r) => r.ch === c));
  if (missing.length) errors.push(`Không đọc được dữ liệu kênh: ${missing.join(', ')}`);

  for (const r of rows) {
    const checks: [ReflowCellError['field'], number, Range][] = [
      ['maxC', r.maxC, std.maxC],
      ['ov220', r.ov220, std.ov220],
      ['t4', r.t4, std.t4],
      ['t2', r.t2, std.t2],
    ];
    for (const [field, value, range] of checks) {
      if (Number.isFinite(value) && inRange(value, range)) continue;
      cellErrors.push({ ch: r.ch, field, value, range });
      errors.push(
        `${r.ch} – ${FIELD_LABEL[field]} = ${value.toFixed(1)}${FIELD_UNIT[field]} ngoài chuẩn ${side} ${range[0]}–${range[1]}${FIELD_UNIT[field]}`,
      );
    }
  }

  return buildResult({ ...base, side, cellErrors, errors });
};

/** Đọc + kiểm tra file Reflow PDF (File người dùng chọn, hoặc Blob tải từ server). */
export const validateReflowPdf = async (
  src: Blob | ArrayBuffer,
  sheetId?: number,
): Promise<ReflowValidationResult> => {
  try {
    const buffer = src instanceof Blob ? await src.arrayBuffer() : src;
    const lines = await extractPdfLines(buffer);
    return { ...validateReflowData(parseReflowLines(lines)), sheetId };
  } catch (err: any) {
    console.error('[Reflow Validation] Không đọc được PDF:', err);
    return {
      ...buildResult({
        fileName: null,
        side: null,
        rows: [],
        cellErrors: [],
        errors: [`Không đọc được file Reflow PDF: ${err?.message || 'lỗi không xác định'}`],
      }),
      sheetId,
    };
  }
};

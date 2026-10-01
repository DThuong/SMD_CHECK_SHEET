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
  /** Mặt đọc được từ File Name (null nếu không xác định được) */
  side: ReflowSide | null;
  /** Chuẩn thực tế dùng để so sánh / tô đỏ ô. Khi không xác định được mặt = chuẩn khớp nhất */
  appliedSide: ReflowSide | null;
  /** Khi không xác định được mặt: các chuẩn mà số liệu đạt trọn vẹn */
  passedSides: ReflowSide[];
  /** Kênh S2–S6 có cả 4 cột = 0.0 (không đo) và được chấp nhận (tối đa 1 kênh) */
  skippedChannels: string[];
  rows: ReflowRow[];
  cellErrors: ReflowCellError[];
  /** Danh sách lỗi (mỗi dòng 1 lỗi) — có lỗi => isValid = false */
  errors: string[];
  /** Lỗi KHÔNG gắn với 1 ô cụ thể (thiếu kênh, S1 rỗng, quá nhiều kênh không đo, không đọc được file...).
   *  Lỗi ngoài chuẩn từng ô đã thể hiện bằng bảng (tô đỏ) nên không nằm ở đây. */
  generalErrors: string[];
  /** Cảnh báo (vàng) — không làm file bị NG */
  warnings: string[];
  errorMessage?: string;
  warningMessage?: string;
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

type ResultInput = Omit<
  ReflowValidationResult,
  'isValid' | 'errorMessage' | 'warningMessage' | 'appliedSide' | 'passedSides' | 'warnings' | 'skippedChannels' | 'generalErrors'
> &
  Partial<Pick<ReflowValidationResult, 'appliedSide' | 'passedSides' | 'warnings' | 'skippedChannels' | 'generalErrors'>>;

const buildResult = (partial: ResultInput): ReflowValidationResult => {
  const warnings = partial.warnings ?? [];
  const appliedSide = partial.appliedSide ?? partial.side;
  const isValid = partial.errors.length === 0;
  const sideText = appliedSide
    ? ` (${partial.side ? '' : 'so theo chuẩn gần nhất: '}${appliedSide} – ${REFLOW_STANDARDS[appliedSide].label})`
    : '';
  return {
    ...partial,
    appliedSide,
    passedSides: partial.passedSides ?? [],
    skippedChannels: partial.skippedChannels ?? [],
    generalErrors: partial.generalErrors ?? partial.errors,
    warnings,
    isValid,
    errorMessage: isValid
      ? undefined
      : `File Reflow không đạt tiêu chuẩn${sideText}:\n- ${partial.errors.join('\n- ')}`,
    warningMessage: warnings.length ? `Cảnh báo file Reflow:\n- ${warnings.join('\n- ')}` : undefined,
  };
};

const CHECK_FIELDS = ['maxC', 'ov220', 't2', 't4'] as const;
/** Tối đa số kênh (S2–S6) được phép không đo (cả 4 cột = 0.0) */
const MAX_SKIPPED_CHANNELS = 1;

/**
 * Kiểm tra cấu trúc dữ liệu 0.0 (không phụ thuộc chuẩn TOP/BOT):
 *  - S1 bắt buộc có giá trị ở cả 4 cột
 *  - S2–S6: cả 4 cột = 0.0 => kênh không đo (chấp nhận tối đa 1 kênh)
 *  - S2–S6: chỗ 0.0 chỗ có giá trị => NG
 */
const checkZeroRows = (rows: ReflowRow[]) => {
  const errors: string[] = [];
  const cellErrors: ReflowCellError[] = [];
  const emptyRows: ReflowRow[] = [];
  /** Hàng còn lại cần so với chuẩn */
  const measuredRows: ReflowRow[] = [];

  for (const r of rows) {
    const zeroFields = CHECK_FIELDS.filter((f) => r[f] === 0);

    if (r.ch === 'S1') {
      if (zeroFields.length > 0) {
        errors.push(`S1 bắt buộc có giá trị — đang = 0.0 ở cột: ${zeroFields.map((f) => FIELD_LABEL[f]).join(', ')}`);
        zeroFields.forEach((f) => cellErrors.push({ ch: r.ch, field: f, value: 0, range: [0, 0] }));
      }
      measuredRows.push(r);
      continue;
    }

    if (zeroFields.length === CHECK_FIELDS.length) {
      emptyRows.push(r);
      continue;
    }

    if (zeroFields.length > 0) {
      errors.push(`${r.ch} thiếu giá trị (0.0) ở cột: ${zeroFields.map((f) => FIELD_LABEL[f]).join(', ')} — các cột khác có số liệu`);
      zeroFields.forEach((f) => cellErrors.push({ ch: r.ch, field: f, value: 0, range: [0, 0] }));
    }
    measuredRows.push(r);
  }

  let skippedChannels: string[] = [];
  if (emptyRows.length > MAX_SKIPPED_CHANNELS) {
    const chs = emptyRows.map((r) => r.ch);
    errors.push(`${chs.length} kênh không có số liệu (${chs.join(', ')}) — chỉ cho phép tối đa ${MAX_SKIPPED_CHANNELS} kênh không đo`);
    emptyRows.forEach((r) =>
      CHECK_FIELDS.forEach((f) => cellErrors.push({ ch: r.ch, field: f, value: 0, range: [0, 0] })),
    );
  } else {
    skippedChannels = emptyRows.map((r) => r.ch);
  }

  return { errors, cellErrors, measuredRows, skippedChannels };
};

/** So toàn bộ S1 → S6 với 1 chuẩn */
const compareWithStandard = (allRows: ReflowRow[], side: ReflowSide) => {
  const std = REFLOW_STANDARDS[side];
  const zero = checkZeroRows(allRows);
  const cellErrors: ReflowCellError[] = [...zero.cellErrors];
  const errors: string[] = [...zero.errors];
  for (const r of zero.measuredRows) {
    const checks: [ReflowCellError['field'], number, Range][] = [
      ['maxC', r.maxC, std.maxC],
      ['ov220', r.ov220, std.ov220],
      ['t4', r.t4, std.t4],
      ['t2', r.t2, std.t2],
    ];
    for (const [field, value, range] of checks) {
      if (value === 0) continue; // ô 0.0 đã được xử lý ở checkZeroRows
      if (Number.isFinite(value) && inRange(value, range)) continue;
      cellErrors.push({ ch: r.ch, field, value, range });
      const stdText = field === 't2' ? 'chung' : side;
      errors.push(
        `${r.ch} – ${FIELD_LABEL[field]} = ${value.toFixed(1)}${FIELD_UNIT[field]} ngoài chuẩn ${stdText} ${range[0]}–${range[1]}${FIELD_UNIT[field]}`,
      );
    }
  }
  return { cellErrors, errors, generalErrors: zero.errors, skippedChannels: zero.skippedChannels };
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

  const missing = REFLOW_CHANNELS.filter((c) => !rows.some((r) => r.ch === c));
  const missingErrors = missing.length ? [`Không đọc được dữ liệu kênh: ${missing.join(', ')}`] : [];

  const { side, error: sideError } = detectReflowSide(fileName);

  // 1. Xác định được mặt -> so đúng chuẩn của mặt đó
  if (side) {
    const { cellErrors, errors, generalErrors, skippedChannels } = compareWithStandard(rows, side);
    return buildResult({
      ...base,
      side,
      cellErrors,
      skippedChannels,
      errors: [...missingErrors, ...errors],
      generalErrors: [...missingErrors, ...generalErrors],
    });
  }

  // 2. Không xác định được mặt -> CẢNH BÁO (vàng), vẫn so số liệu với cả 2 chuẩn:
  //    - Đạt trọn vẹn ít nhất 1 chuẩn  -> không lỗi, chỉ cảnh báo
  //    - Không đạt chuẩn nào           -> lỗi theo chuẩn khớp nhất (ít ô sai nhất)
  const top = compareWithStandard(rows, 'TOP');
  const bot = compareWithStandard(rows, 'BOT');
  const passedSides = (['TOP', 'BOT'] as const).filter((sd) =>
    (sd === 'TOP' ? top : bot).errors.length === 0,
  );
  const bestSide: ReflowSide =
    passedSides[0] ?? (top.cellErrors.length <= bot.cellErrors.length ? 'TOP' : 'BOT');
  const best = bestSide === 'TOP' ? top : bot;

  const warnings = [sideError!];
  if (passedSides.length > 0) {
    warnings.push(
      `Số liệu S1–S6 đạt chuẩn ${passedSides
        .map((sd) => `${REFLOW_STANDARDS[sd].label} (${sd})`)
        .join(' và ')} — vui lòng kiểm tra lại mặt TOP/BOT của file.`,
    );
  }

  return buildResult({
    ...base,
    side: null,
    appliedSide: bestSide,
    passedSides: [...passedSides],
    cellErrors: best.cellErrors,
    skippedChannels: best.skippedChannels,
    errors: [...missingErrors, ...best.errors],
    generalErrors: [...missingErrors, ...best.generalErrors],
    warnings,
  });
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

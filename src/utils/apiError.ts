// src/utils/apiError.ts
/**
 * CHẨN ĐOÁN LỖI API — biến mọi thất bại của axios thành một thông báo NÓI RÕ
 * NGUYÊN NHÂN, thay vì "Không thể tải danh sách sheets".
 *
 * VÌ SAO CẦN: trước đây mọi thunk đều bắt lỗi kiểu
 *     rejectWithValue(error.response?.data?.message || 'Không thể tải ...')
 * Khi request timeout hoặc không kết nối được thì `error.response` KHÔNG TỒN TẠI,
 * nên toast luôn hiện đúng một câu chung chung. Người dùng báo "nó quay mãi" mà
 * không ai biết là server chậm, server sập, hay trình duyệt chưa cấp nổi kết nối
 * — ba nguyên nhân hoàn toàn khác nhau và sửa ở ba chỗ khác nhau.
 *
 * File này gom phần suy đoán đó về MỘT chỗ. Ba api service (smd/patrol/eng) gọi
 * nó trong response interceptor, nên toàn bộ thunk hiện có tự động nhận được
 * thông báo chi tiết mà không phải sửa một dòng nào trong slice.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Timeout mặc định cho request JSON thường (danh sách, chi tiết, ký, sửa).
 *
 * Cố tình để NGẮN. Một API danh sách khỏe mạnh trả về trong vài trăm ms; chạm
 * tới 15 giây nghĩa là hệ thống đang có vấn đề thật và người dùng cần biết NGAY
 * để báo lại, thay vì ngồi nhìn spinner rồi tự bỏ cuộc.
 */
export const SHORT_TIMEOUT_MS = 15_000;

/**
 * Timeout cho request vốn dĩ chậm: upload ảnh/file, tải file về, và parse Excel
 * LCR ở backend. Những cái này chậm là BÌNH THƯỜNG nên không được dùng mốc ngắn.
 */
export const LONG_TIMEOUT_MS = 180_000;

/** Đường dẫn của các endpoint chậm có chủ đích — khớp theo chuỗi con, không phân biệt hoa thường. */
const SLOW_ENDPOINTS = [
  'readexcelfile',   // backend parse Excel LCR
  'excel-view',
  '/excel',
  '/pdf',
  'upload',
];

/**
 * Chọn timeout cho một request dựa trên chính nó, thay vì bắt mỗi chỗ gọi tự
 * khai báo. Caller vẫn ghi đè được bằng cách truyền `timeout` trong config.
 */
export const pickTimeout = (config: any): number => {
  // Caller đã tự đặt (ví dụ upload kế hoạch đặt 180s) -> tôn trọng.
  if (typeof config?.timeout === 'number' && config.timeout > 0) return config.timeout;

  // Upload: body là FormData.
  if (typeof FormData !== 'undefined' && config?.data instanceof FormData) return LONG_TIMEOUT_MS;

  // Tải file về: nhận blob/arraybuffer.
  if (config?.responseType === 'blob' || config?.responseType === 'arraybuffer') return LONG_TIMEOUT_MS;

  const url = String(config?.url || '').toLowerCase();
  if (SLOW_ENDPOINTS.some((p) => url.includes(p))) return LONG_TIMEOUT_MS;

  return SHORT_TIMEOUT_MS;
};

/** Đồng hồ bấm giờ + mã truy vết cho từng request. WeakMap để không nhét field lạ vào config axios. */
const traceOf = new WeakMap<object, { start: number; rid: string }>();

/**
 * Mã ngắn 8 ký tự, đủ để tra log mà người dùng vẫn đọc/chụp màn hình lại được.
 * (UUID đầy đủ quá dài để đọc qua điện thoại khi công nhân báo lỗi.)
 */
const newRequestId = (): string =>
  Math.random().toString(36).slice(2, 6) + Date.now().toString(36).slice(-4);

/**
 * Gắn mã truy vết vào QUERY STRING, không phải header.
 *
 * Header tùy biến (kiểu X-Request-Id) bắt buộc phải nằm trong
 * Access-Control-Allow-Headers của backend; nếu backend đang liệt kê header
 * tường minh thay vì AllowAnyHeader thì THÊM HEADER LÀ HỎNG SẠCH MỌI REQUEST
 * ngay khi deploy, vì preflight bị từ chối. Query param không đụng tới CORS,
 * lại tự động xuất hiện trong access log của Kestrel/nginx/IIS mà không cần
 * cấu hình gì thêm.
 *
 * Nhờ vậy khi người dùng chụp màn hình toast lỗi, bạn cầm đúng mã đó grep vào
 * log backend là ra chính request ấy — biết được server có NHẬN được nó không,
 * và nếu có thì nó ngốn bao lâu ở phía server.
 */
export const markRequestStart = (config: any): void => {
  if (!config || typeof config !== 'object') return;
  const rid = newRequestId();
  traceOf.set(config, { start: Date.now(), rid });
  config.params = { ...(config.params || {}), _rid: rid };
};

/** Số giây đã trôi qua kể từ lúc gửi request, dạng "12.4s"; "?" nếu không đo được. */
const elapsedOf = (config: any): string => {
  const t = config && typeof config === 'object' ? traceOf.get(config) : undefined;
  if (!t) return '?';
  return `${((Date.now() - t.start) / 1000).toFixed(1)}s`;
};

/** Mã truy vết của request, để đối chiếu với log backend. */
const ridOf = (config: any): string => {
  const t = config && typeof config === 'object' ? traceOf.get(config) : undefined;
  return t?.rid || String(config?.params?._rid || '');
};

/** Đường dẫn đầy đủ kèm query, để biết CHÍNH XÁC request nào hỏng. */
const fullPath = (config: any): string => {
  const base = String(config?.baseURL || '').replace(/\/+$/, '');
  const url = String(config?.url || '');
  const path = url.startsWith('http') ? url : `${base}/${url.replace(/^\/+/, '')}`;

  const params = config?.params;
  if (!params || typeof params !== 'object') return path;

  const query = Object.entries(params)
    // _rid đã được nêu riêng ở dòng "Mã truy vết", bỏ khỏi URL cho dễ đọc.
    .filter(([k, v]) => k !== '_rid' && v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

  return query ? `${path}?${query}` : path;
};

/** Thông báo server tự trả về, nếu có. */
const serverMessage = (error: any): string => {
  const data = error?.response?.data;
  if (!data) return '';
  if (typeof data === 'string') return data.slice(0, 300);
  const msg = data.message || data.Message || data.title || data.error;
  return typeof msg === 'string' ? msg.slice(0, 300) : '';
};

/** Trên mốc này thì một API danh sách coi như đã chậm bất thường, dù vẫn trả về được. */
const SLOW_WARN_MS = 3_000;

/**
 * Ghi log những request THÀNH CÔNG nhưng chậm.
 *
 * Toast chỉ bắn khi đã timeout — tức là chỉ thấy phần ngọn. Một request mất 9
 * giây rồi trả về vẫn là dấu hiệu hệ thống sắp hỏng mà không ai hay biết. Log
 * lại để mở Console là dựng được bức tranh "chậm dần" trước khi nó thành lỗi.
 */
export const logSlowResponse = (response: any): void => {
  const config = response?.config;
  const t = config && typeof config === 'object' ? traceOf.get(config) : undefined;
  if (!t) return;
  const ms = Date.now() - t.start;
  if (ms < SLOW_WARN_MS) return;
  console.warn(
    `[API chậm] ${(ms / 1000).toFixed(1)}s · ${String(config?.method || 'get').toUpperCase()} ` +
      `${config?.url} · mã ${t.rid}`,
  );
};

export interface ApiErrorInfo {
  /** Một dòng ngắn: chuyện gì đã xảy ra. Dùng làm tiêu đề toast. */
  title: string;
  /** Nhiều dòng: vì sao, và nhìn vào đâu để xác nhận. Dùng làm nội dung toast. */
  detail: string;
  /** true khi request bị hủy chủ động — KHÔNG phải lỗi, đừng hiện toast. */
  canceled: boolean;
}

/**
 * Giải thích một lỗi axios thành ngôn ngữ chỉ đúng chỗ cần sửa.
 *
 * Nguyên tắc viết nội dung: mỗi thông báo phải trả lời được "lỗi nằm ở tầng
 * nào" (máy người dùng / đường mạng / backend) và "mở cái gì ra để xác nhận".
 */
export const describeApiError = (error: any): ApiErrorInfo => {
  const config = error?.config ?? {};
  const method = String(config?.method || 'GET').toUpperCase();
  const path = fullPath(config);
  const took = elapsedOf(config);
  const status: number | undefined = error?.response?.status;
  const fromServer = serverMessage(error);

  /** Dòng kỹ thuật đứng cuối mọi thông báo — đủ để copy vào báo lỗi. */
  const rid = ridOf(config);
  const trace =
    `${method} ${path}${status ? ` · HTTP ${status}` : ''} · ${took}` +
    (rid ? `\nMã truy vết: ${rid} — gửi mã này kèm ảnh chụp màn hình để tra log backend.` : '');

  if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
    return { title: 'Request đã hủy', detail: trace, canceled: true };
  }

  // 1. TIMEOUT — không có phản hồi trong thời gian cho phép.
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    const limit = ((config?.timeout ?? SHORT_TIMEOUT_MS) / 1000).toFixed(0);
    return {
      canceled: false,
      title: `Quá ${limit}s server chưa trả lời`,
      detail: [
        'Request bị hủy vì hết thời gian chờ. Có hai nguyên nhân, phân biệt bằng DevTools ▸ Network ▸ bấm vào request ▸ tab Timing:',
        '• "Waiting (TTFB)" lớn → SERVER xử lý quá lâu. Lỗi ở backend/DB (query quét toàn bảng, phân trang làm trong bộ nhớ, thiếu index).',
        '• "Stalled" lớn → request CHƯA RỜI KHỎI MÁY. Trình duyệt hết 6 khe kết nối cho mỗi origin, đang bị request ảnh chiếm. Lỗi ở kiến trúc origin, không phải backend.',
        trace,
      ].join('\n'),
    };
  }

  // 2. KHÔNG NHẬN ĐƯỢC PHẢN HỒI NÀO — server sập, sai địa chỉ, hoặc CORS chặn.
  if (!error?.response) {
    const origin = (() => {
      try { return new URL(path).origin; } catch { return String(config?.baseURL || 'API'); }
    })();
    return {
      canceled: false,
      title: 'Không kết nối được tới server',
      detail: [
        `Trình duyệt không nhận được bất kỳ phản hồi nào từ ${origin}. Kiểm tra theo thứ tự:`,
        `• Service API còn chạy không — thử mở thẳng ${origin} trên trình duyệt.`,
        '• Máy này có vào được mạng nhà máy không (VPN/LAN).',
        '• CORS bị chặn — mở tab Console, lỗi CORS luôn hiện ở đó chứ không hiện ở Network.',
        trace,
      ].join('\n'),
    };
  }

  // 3. CÓ PHẢN HỒI — phân loại theo mã HTTP.
  const byStatus: Record<number, { title: string; why: string }> = {
    400: {
      title: 'Dữ liệu gửi lên không hợp lệ (400)',
      why: 'Backend từ chối vì tham số sai kiểu hoặc thiếu. Lỗi ở phía frontend gửi sai, hoặc backend vừa đổi hợp đồng API.',
    },
    401: {
      title: 'Phiên đăng nhập đã hết hạn (401)',
      why: 'Token không còn hợp lệ. Hệ thống sẽ đưa về trang đăng nhập.',
    },
    403: {
      title: 'Tài khoản không có quyền (403)',
      why: 'Token hợp lệ nhưng role hiện tại không được phép gọi endpoint này. Kiểm tra phân quyền của user.',
    },
    404: {
      title: 'Không tìm thấy (404)',
      why: 'Sai đường dẫn endpoint, hoặc bản ghi đã bị xóa. Nếu vừa deploy backend thì kiểm tra route có đổi tên không, và VITE_API_URL có trỏ đúng không.',
    },
    409: {
      title: 'Dữ liệu bị xung đột (409)',
      why: 'Bản ghi đã bị người khác sửa/ký trước đó. Tải lại trang để lấy trạng thái mới nhất.',
    },
    413: {
      title: 'File gửi lên quá lớn (413)',
      why: 'Giới hạn kích thước request đang chặn. Nới client_max_body_size của nginx và MaxRequestBodySize của Kestrel.',
    },
    415: {
      title: 'Sai định dạng gửi lên (415)',
      why: 'Content-Type không khớp với thứ endpoint nhận. Với upload phải để axios tự đặt multipart, không gán tay application/json.',
    },
    429: {
      title: 'Gửi request quá nhanh (429)',
      why: 'Backend đang chặn vì quá nhiều request trong thời gian ngắn. Nhiều khi là dấu hiệu frontend gọi lặp trong useEffect.',
    },
    500: {
      title: 'Server lỗi khi xử lý (500)',
      why: 'Backend ném exception. LỖI Ở BACKEND, không phải frontend — xem log của service API để lấy stack trace.',
    },
    502: {
      title: 'Không tới được backend (502)',
      why: 'Reverse proxy không nói chuyện được với service API. Thường là API vừa crash hoặc đang restart.',
    },
    503: {
      title: 'Server chưa sẵn sàng (503)',
      why: 'Service API đang khởi động lại hoặc đã quá tải và từ chối nhận thêm request.',
    },
    504: {
      title: 'Backend xử lý quá lâu (504)',
      why: 'Reverse proxy hết kiên nhẫn chờ service API. Cùng bản chất với timeout, nhưng lần này chính server xác nhận là chậm.',
    },
  };

  const known = status !== undefined ? byStatus[status] : undefined;
  if (known) {
    return {
      canceled: false,
      title: known.title,
      detail: [known.why, fromServer ? `Server báo: ${fromServer}` : '', trace]
        .filter(Boolean)
        .join('\n'),
    };
  }

  const kind = status && status >= 500 ? 'Lỗi từ server' : 'Request bị từ chối';
  return {
    canceled: false,
    title: `${kind} (HTTP ${status ?? '?'})`,
    detail: [fromServer ? `Server báo: ${fromServer}` : 'Server không kèm thông báo nào.', trace]
      .filter(Boolean)
      .join('\n'),
  };
};

/** Gộp thành một chuỗi để nhét vào toast: dòng đầu là nguyên nhân, phần sau là chi tiết. */
export const formatApiError = (error: any): string => {
  const { title, detail } = describeApiError(error);
  return `${title}\n${detail}`;
};

/**
 * Gắn chẩn đoán vào chính object lỗi, để MỌI thunk sẵn có tự nhận được.
 *
 * Gần như toàn bộ thunk trong dự án đang viết
 *     rejectWithValue(error.response?.data?.message || '<câu chung chung>')
 * nên chỉ cần bảo đảm `error.response.data.message` luôn có nội dung chẩn đoán
 * là toast ở mọi màn hình đổi theo, không phải sửa từng slice.
 */
export const attachDiagnostics = (error: any): any => {
  const info = describeApiError(error);
  if (info.canceled) return error;

  const text = `${info.title}\n${info.detail}`;
  error.message = text;
  error.diagnostics = info;

  // Tổng hợp response rỗng cho trường hợp timeout/mất mạng (không có response),
  // và bổ sung ngữ cảnh vào thông báo server trả về cho các trường hợp còn lại.
  const data = error.response?.data;

  // Với request responseType blob/arraybuffer (tải file), khi server trả lỗi thì
  // data là Blob/ArrayBuffer chứ không phải JSON — không gán thêm field vào đó,
  // thay hẳn bằng object phẳng và giữ bản gốc ở `raw`.
  const isBinary =
    (typeof Blob !== 'undefined' && data instanceof Blob) ||
    (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) ||
    ArrayBuffer.isView(data);

  if (!error.response) {
    error.response = { data: { message: text } };
  } else if (!data || typeof data === 'string' || isBinary) {
    error.response.data = { message: text, raw: data };
  } else if (typeof data === 'object') {
    data.message = text;
  }

  // Log gọn một dòng để mở Console là thấy ngay, không cần bung object axios.
  console.error(`[API] ${info.title}\n${info.detail}`);

  return error;
};

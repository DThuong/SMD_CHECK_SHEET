/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import smdApi from '../services/smdApi';
import type { CheckModelData, StandardProductionData, TimeChangeModelData, StandardVehicleData, PQCCheckData } from './subTableSlice';

// ==================== TYPES ====================
export interface StatusHistoryItem{
  id: number;
  changeModel: ChangeModelResponse;
  status: string;
  changedAt: string;
  account: AccountInfo;
}
export interface AccountInfo {
  id?: number;
  fullName?: string;
  userName?: string;
  phoneNumber?: string;
  role?: string;
}

export interface ChangeModelResponse {
  id: number;
  status?: string;
  checkModelId?: number;
  programCheckId?: number;
  standardProductionId?: number;
  timeChangeModelId?: number;
  standardVehicleId?: number;
  pqcCheckId?: number;
  account?: AccountInfo;
  accountId?: number;
  excelFileUrl?: string;
  pdfFileUrl?: string;
  createAt?: string;
  noteFile?: string;
  workerFile?: string;

  // object 
  checkModel?: CheckModelData;
  standardProduction?: StandardProductionData;
  timeChangeModel?: TimeChangeModelData;
  standardVehicle?: StandardVehicleData;
  pqcCheck?: PQCCheckData;
}

interface ChangeModelState {
  loading?: boolean;
  error?: string | null;
  currentSheet?: ChangeModelResponse | null;
  sheets?: ChangeModelResponse[];
  filteredSheets?: ChangeModelResponse[];
  loadingList?: boolean;
  uploadLoading?: boolean;
  status?: string;
  success?: boolean
  statusHistory?: StatusHistoryItem[];
  loadingHistory?: boolean;
}

const initialState: ChangeModelState = {
  loading: false,
  error: null,
  currentSheet: null,
  success: false,
  sheets: [],
  filteredSheets: [],
  loadingList: false,
  statusHistory: [],
  loadingHistory: false,
};

/**
 * CHUỖI TRẠNG THÁI KÝ của một sheet, đúng thứ tự backend chuyển tiếp.
 * PQC ký ở bước Pending, PQCLeader ký ở PQCDone, ENG ký ở PQCLeaderDone, v.v.
 */
const STATUS_CHAIN = [
  'Pending',
  'PQCDone',
  'PQCLeaderDone',
  'ENGDone',
  'SupervisiorDone',
  'ManagerDone',
  'KoreaManagerDone',
] as const;

/** So sánh status bỏ qua hoa thường, gộp luôn typo lịch sử "PQCLeaderLDone". */
const normalizeStatus = (s?: string) =>
  (s || '').toLowerCase().replace('pqcleaderldone', 'pqcleaderdone');

/** Trạng thái kế tiếp trong chuỗi ký; null nếu đã ở bước cuối hoặc không nhận ra. */
const nextStatusOf = (current?: string): string | null => {
  const i = STATUS_CHAIN.findIndex(
    (s) => normalizeStatus(s) === normalizeStatus(current),
  );
  if (i === -1 || i === STATUS_CHAIN.length - 1) return null;
  return STATUS_CHAIN[i + 1];
};

/**
 * Ghi status mới của MỘT sheet vào mọi nơi đang cache nó: `sheets`,
 * `filteredSheets` và `currentSheet`.
 *
 * `newStatus` lấy từ response khi backend trả về nguyên object sheet. Nếu backend
 * chỉ trả 204/message/DTO rút gọn (không có trường status) thì tự suy ra bước kế
 * tiếp theo STATUS_CHAIN — giống cách returnSheetToPending đang làm.
 *
 * ĐÂY LÀ CHỖ QUYẾT ĐỊNH việc sheet vừa ký có biến mất khỏi danh sách ngay hay
 * phải F5: màn hình Logs lọc client-side theo status, nên nếu status trong store
 * không đổi thì sheet vẫn nằm nguyên đó.
 */
const applySheetStatus = (
  state: ChangeModelState,
  sheetId: number,
  newStatus?: string,
) => {
  const cached =
    state.filteredSheets?.find((s) => s.id === sheetId) ??
    state.sheets?.find((s) => s.id === sheetId) ??
    (state.currentSheet?.id === sheetId ? state.currentSheet : undefined);

  const resolved = newStatus || nextStatusOf(cached?.status);
  if (!resolved) return;

  const merge = (sheet: ChangeModelResponse) =>
    sheet.id === sheetId ? { ...sheet, status: resolved } : sheet;

  if (state.filteredSheets) state.filteredSheets = state.filteredSheets.map(merge);
  if (state.sheets) state.sheets = state.sheets.map(merge);
  if (state.currentSheet?.id === sheetId) {
    state.currentSheet = { ...state.currentSheet, status: resolved };
  }
};

// ==================== ASYNC THUNKS ====================

/** upload 1 file */
export const uploadFile = createAsyncThunk(
  'changeModel/uploadFile',
  async ({ changeModelId, file, fileType }: { 
    changeModelId: number; 
    file: File;
    fileType: 'excel' | 'pdf';
  }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await smdApi.put(
        `/ChangeModel/upload-files?changeModelId=${changeModelId}`,
        formData
      );

      return { data: response.data, fileType };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Upload failed');
    }
  }
);

// upload 2 file
export const uploadBothFiles = createAsyncThunk(
  'changeModel/uploadBothFiles',
  async ({ 
    changeModelId, 
    excelFile, 
    pdfFile 
  }: { 
    changeModelId: number; 
    excelFile?: File;
    pdfFile?: File;
  }, { dispatch, rejectWithValue }) => {
    try {
      const results = {
        excel: null as any,
        pdf: null as any,
      };

      // Upload Excel file nếu có
      if (excelFile) {
        const excelResult = await dispatch(
          uploadFile({ changeModelId, file: excelFile, fileType: 'excel' })
        ).unwrap();
        results.excel = excelResult;
      }

      // Upload PDF file nếu có
      if (pdfFile) {
        const pdfResult = await dispatch(
          uploadFile({ changeModelId, file: pdfFile, fileType: 'pdf' })
        ).unwrap();
        results.pdf = pdfResult;
      }

      return results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Upload failed');
    }
  }
);

// update note file
export const updateNoteFile = createAsyncThunk(
  'changeModel/updateNoteFile',
  async ({ changeModelId, noteFile, workerFile }: { changeModelId: number; noteFile: string; workerFile: string }, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`ChangeModel/update-note-file/${changeModelId}`, { noteFile, workerFile });
      return response.data as ChangeModelResponse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Update note file failed');
    }
  }
);

/**
 * CREATE SHEET
 * POST /api/ChangeModel
 * Không cần data - backend tự động tạo tất cả
 */
export const createChangeModel = createAsyncThunk(
  'changeModel/create',
  async (_, { rejectWithValue }) => {
    try {
      const response = await smdApi.post('ChangeModel', {}); 
      return response.data as ChangeModelResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể tạo sheet mới'
      );
    }
  }
);

/** GET CHANGE MODEL OBJECT ID */
export const getSheetWithFullObject = createAsyncThunk(
  'changeModel/getFullObject',
  async (sheetId: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`ChangeModel/object/${sheetId}`);
      return response.data as ChangeModelResponse;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Không tìm thấy sheet với ID này.');
      }
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể tải thông tin sheet đầy đủ'
      );
    }
  }
);

/** GET CHANGE MODEL STATUS HISTORY */
export const getAllStatusHistory = createAsyncThunk(
  'changeModel/getAllStatusHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await smdApi.get('ChangeModelStatusHistory');
      return response.data as StatusHistoryItem[];
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể tải lịch sử status'
      );
    }
  }
);

/** GET SHEET STATUS HISTORY BY SHEET ID */
export const getSheetStatusHistory = createAsyncThunk(
  'changeModel/getSheetStatusHistory',
  async (sheetId: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`ChangeModelStatusHistory/changemodel/${sheetId}`);
      return response.data as StatusHistoryItem[];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Không tìm thấy sheet với ID này.');
      }
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể tải lịch sử status'
      );
    }
  }
);

/**
 * UPDATE STATUS TO PQCDONE - Dùng cho PQC
 * PUT /api/ChangeModel/status/{id}
 * Backend tự xác định status kế tiếp theo role nên chỉ cần truyền id.
 */
export const updateSheetStatusToPQCDone = createAsyncThunk(
  'changeModel/updateStatusToPQCDone',
  async (sheetId: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`ChangeModel/status/${sheetId}`);
      return response.data as ChangeModelResponse;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Không tìm thấy sheet với ID này.');
      }
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể cập nhật status'
      );
    }
  }
);

/**
 * UPDATE STATUS - FLEXIBLE (Dùng cho ENG, SUPERVISOR, MANAGER, MANAGER_KOREA)
 * PUT /api/ChangeModel/status/{id}
 * Backend tự kiểm tra role của user hiện tại và tự xác định status kế tiếp,
 * nên client chỉ cần truyền vào id của sheet.
 */
export const updateSheetStatus = createAsyncThunk(
  'changeModel/updateStatusByRole',
  async (sheetId: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`ChangeModel/status/${sheetId}`);
      return response.data as ChangeModelResponse;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      if (error.response?.status === 404) {
        return rejectWithValue('Không tìm thấy sheet với ID này.');
      }
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        'Không thể cập nhật status'
      );
    }
  }
);
/**
 * RETURN STATUS TO PENDING
 * PUT /api/ChangeModel/status/{id}
 */
export const returnSheetToPending = createAsyncThunk(
  'changeModel/returnToPending',
  async ({ sheetId }: { sheetId: number }, { rejectWithValue }) => {
    try {
      await smdApi.put(`ChangeModel/status-reject/${sheetId}`);
      return { sheetId };
    } catch (error: any) {
      if (error.response?.status === 401)
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      if (error.response?.status === 404)
        return rejectWithValue('Không tìm thấy sheet với ID này.');
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Không thể trả sheet về Pending'
      );
    }
  }
);

/** 
 * FILTER
 * GET /api/ChangeModel
 * không cần parameter - backend trả về data
 *  */
export const fetchChangeModel = createAsyncThunk(
  'changeModel/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await smdApi.get('ChangeModel');
      return response.data as ChangeModelResponse[];
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      return rejectWithValue(error.response?.data?.message || 'Không thể tải danh sách sheets');
    }
  }
)

/**
 * GET SHEETS BY STATUS
 * GET /api/ChangeModel/status/{status}
 */
export const getSheetsByStatus = createAsyncThunk(
  'changeModel/getByStatus',
  async (status: string, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`ChangeModel/status/${status}`);
      return response.data as ChangeModelResponse[];
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể tải sheets theo status'
      );
    }
  }
);

/** 
 * GET SHEET BY DATE
 * GET /api/ChangeModel/filter/{fromDate}/{toDate}
 * parameter: fromDate, toDate
 */
export const getSheetByDate = createAsyncThunk(
  'changeModel/getByDate',
  async ({ fromDate, toDate }: { fromDate: string; toDate: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const response = await smdApi.get(`ChangeModel/filter/${fromDate}/${toDate}`);

      return response.data as ChangeModelResponse[];
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể tải sheets theo ngày'
      );
    }
  },
)

/** GET SHEET BY workorder
 * GET /api/ChangeModel/workorder/{workorder}
 * parameter: workorder
 */
export const getSheetbyWorkorder = createAsyncThunk(
  'changeModel/getByWorkorder',
  async (workorder: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const response = await smdApi.get(`ChangeModel/workorder/${workorder}`);

      return response.data as ChangeModelResponse[];
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể tải sheets theo workorder'
      );
    }
  },
)

/** GET THEO STATUS, WORKORDER, DATE
 * GET /api/ChangeModel/filterAll?...
 * parameter: status, workorder, fromDate, toDate
 */
export const getSheetByFilter = createAsyncThunk(
  'changeModel/getByFilter',
  async (params: { status?: string; workOrder?: string; fromDate?: string; toDate?: string; fcode?: string; id?: number, createrName?: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

        const queryParams: Record<string, string> = {};
      
        if (params.fromDate) {
          queryParams.FromDate = params.fromDate;
        }
        if (params.toDate) {
          queryParams.ToDate = params.toDate;
        }
        if (params.status && params.status !== 'all') {
          queryParams.Status = params.status;
        }
        if (params.workOrder && params.workOrder.trim() !== '') {
          queryParams.WorkOrder = params.workOrder.trim();
        }
        if(params.fcode && params.fcode.trim() !== '') {
          queryParams.FCode = params.fcode.trim();
        }
        if(params.id) {
          queryParams.Id = params.id.toString();
        }
        if(params.createrName && params.createrName.trim() !== '') {
          queryParams.CreaterName = params.createrName.trim();
        }
      const response = await smdApi.get('ChangeModel/filterAll', { params: queryParams });

      return response.data as ChangeModelResponse[];
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể tải sheets theo status, workorder, ngày'
      );
    }
  },
)

// api xóa sheet id
export const deleteSheetById = createAsyncThunk(
  'changeModel/delete',
  async (sheetId: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.delete(`ChangeModel/${sheetId}`);
      return response.data as ChangeModelResponse;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Không tìm thấy sheet với ID này.');
      }
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể xóa sheet'
      );
    }
  }
)

// api get all by user id
export const getAllSheetByUserId = createAsyncThunk(
  'changeModel/getAllByUserId',
  async (_, { rejectWithValue }) => { 
    try {
      const response = await smdApi.get('ChangeModel/GetAllByUserId');
      return response.data as ChangeModelResponse[];
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể tải sheets của bạn'
      );
    }
  }
);

// api filter sheet by user id
export const filterSheetByUserId = createAsyncThunk(
  'changeModel/filterByUserId',
  async (params: { fromDate?: string; toDate?: string; status?: string; workOrder?: string; fcode?: string; id?: number }, { rejectWithValue }) => {
    try {
      const queryParams: Record<string, string> = {};
      
      if (params.fromDate) {
        queryParams.FromDate = params.fromDate;
      }
      if (params.toDate) {
        queryParams.ToDate = params.toDate;
      }
      if (params.status && params.status !== 'all') {
        queryParams.Status = params.status;
      }
      if (params.workOrder && params.workOrder.trim() !== '') {
        queryParams.WorkOrder = params.workOrder.trim();
      }
      if(params.fcode && params.fcode.trim() !== '') {
        queryParams.FCode = params.fcode.trim();
      }
      if(params.id) {
        queryParams.Id = params.id.toString();
      }
      const response = await smdApi.get('ChangeModel/filterAllForUser', { params: queryParams });
      return response.data as ChangeModelResponse[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể tải sheets của baise'
      );
    }
      }
)

// api lấy file excel dưới dạng json
// ==================== SLICE ====================

const changeModelSlice = createSlice({
  name: 'changeModel',
  initialState,
  reducers: {
    // set current sheet
    setCurrentSheet: (state, action) => {
      state.currentSheet = action.payload;
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Clear current sheet
    clearSheet: (state) => {
      state.currentSheet = null;
    },

    // clear sheet list
    clearSheetList: (state) => {
      state.sheets = [];
      state.filteredSheets = [];
    },
    
    // Reset all state
    reset: (state) => {
      state.loading = false;
      state.error = null;
      state.currentSheet = null;
    },

    clearStatusHistory: (state) => {
      state.statusHistory = [];
      state.loadingHistory = false;
    },

    /**
     * Vá một phần dữ liệu của 1 sheet trong danh sách đang cache.
     *
     * Dùng khi sửa bảng con ở trang chi tiết: bảng Logs render
     * sheet.checkModel?.workOrder, mà lưu Check Model chỉ cập nhật subTableSlice
     * nên hàng trong Logs giữ giá trị cũ tới khi F5. Gọi action này sau khi lưu
     * thành công thì hàng đó cập nhật ngay, không tốn thêm request nào.
     */
    patchSheetInList: (
      state,
      action: { payload: { sheetId: number; patch: Partial<ChangeModelResponse> }; type: string },
    ) => {
      const { sheetId, patch } = action.payload;
      const merge = (sheet: ChangeModelResponse) =>
        sheet.id === sheetId ? { ...sheet, ...patch } : sheet;
      if (state.filteredSheets) state.filteredSheets = state.filteredSheets.map(merge);
      if (state.sheets) state.sheets = state.sheets.map(merge);
      if (state.currentSheet?.id === sheetId) {
        state.currentSheet = { ...state.currentSheet, ...patch };
      }
    },

    // Gỡ 1 sheet khỏi danh sách đang cache sau khi xóa thành công.
    // Nhờ vậy trang Logs không phải gọi lại API lấy toàn bộ danh sách.
    removeSheetFromList: (state, action: { payload: number; type: string }) => {
      const sheetId = action.payload;
      if (state.filteredSheets)
        state.filteredSheets = state.filteredSheets.filter((s) => s.id !== sheetId);
      if (state.sheets) state.sheets = state.sheets.filter((s) => s.id !== sheetId);
      if (state.currentSheet?.id === sheetId) state.currentSheet = null;
    },
    
  },
  extraReducers: (builder) => {
    // Upload single file
    builder
      .addCase(uploadFile.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        console.log('Upload response:', action.payload);
        state.uploadLoading = false;
        // Cập nhật URL tương ứng
        if (state.currentSheet) {
          if (action.payload.fileType === 'excel') {
            state.currentSheet.excelFileUrl = action.payload.data.url;
          } else {
            state.currentSheet.pdfFileUrl = action.payload.data.url;
          }
        }
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload as string;
      });

    // Upload both files
    builder
      .addCase(uploadBothFiles.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadBothFiles.fulfilled, (state, action) => {
        state.uploadLoading = false;
        // Cập nhật cả 2 URLs nếu có
        if (state.currentSheet) {
          if (action.payload.excel?.data?.excelFileUrl) {
            state.currentSheet.excelFileUrl = action.payload.excel.data.url;
          }
          if (action.payload.pdf?.data?.pdfFileUrl) {
            state.currentSheet.pdfFileUrl = action.payload.pdf.data.url;
          }
        }
      })
      .addCase(uploadBothFiles.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload as string;
      });
    // ==================== CREATE SHEET ====================
    builder
      .addCase(createChangeModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChangeModel.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSheet = action.payload;
        state.error = null;
      })
      .addCase(createChangeModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ==================== UPDATE STATUS ====================
    builder
      .addCase(updateSheetStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSheetStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        // sheetId lấy từ đối số đã truyền vào thunk — LUÔN có, không phụ thuộc
        // backend trả về gì. Trước đây chỉ dựa vào action.payload.id: nếu endpoint
        // PUT /ChangeModel/status/{id} trả 204 hoặc một DTO không có id/status thì
        // toàn bộ khối merge bị bỏ qua trong im lặng -> danh sách không đổi, người
        // dùng phải F5 mới thấy sheet vừa ký biến mất.
        const sheetId = action.meta.arg;
        const payload = action.payload as ChangeModelResponse | undefined;

        // Chỉ nhận payload làm currentSheet khi backend thật sự trả object sheet,
        // tránh ghi đè currentSheet bằng một message object.
        if (payload && typeof payload === 'object' && payload.id) {
          state.currentSheet = payload;
        }

        applySheetStatus(state, sheetId, payload?.status);
      })
      .addCase(updateSheetStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      // update status for pqc done
      builder
      .addCase(updateSheetStatusToPQCDone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSheetStatusToPQCDone.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        // Cùng lý do như updateSheetStatus ở trên: bám vào meta.arg thay vì payload.
        const sheetId = action.meta.arg;
        const payload = action.payload as ChangeModelResponse | undefined;

        if (payload && typeof payload === 'object' && payload.id) {
          state.currentSheet = payload;
        }

        applySheetStatus(state, sheetId, payload?.status);
      })
      .addCase(updateSheetStatusToPQCDone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ==================== GET ALL SHEETS ====================
    builder
      .addCase(fetchChangeModel.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(fetchChangeModel.fulfilled, (state, action) => {
        state.loadingList = false;
        state.sheets = action.payload;
        state.filteredSheets = action.payload;
        state.error = null;
      })
      .addCase(fetchChangeModel.rejected, (state, action) => {
        state.loadingList = false;
        state.error = action.payload as string;
      });
      // lấy toàn bộ object với thông tin account user gửi lên
       builder
      .addCase(getSheetWithFullObject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSheetWithFullObject.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSheet = action.payload;
        state.error = null;

        // Đồng bộ bản mới nhất của sheet vào danh sách cache mỗi khi load đầy đủ
        // 1 sheet (sau khi ký hoặc sửa ở trang chi tiết). Nhờ vậy khi quay lại
        // danh sách (không gọi lại API) thì hàng đó luôn đúng với thực tế.
        //
        // TRƯỚC ĐÂY chỉ merge mỗi `status`, nên sửa Work Order ở trang chi tiết
        // xong quay lại Logs vẫn thấy Work Order cũ cho tới khi F5 — bảng Logs có
        // render sheet.checkModel?.workOrder. Giờ merge cả object: trải bản cũ
        // trước rồi bản mới đè lên, nên trường nào detail không trả về vẫn giữ.
        const updated = action.payload;
        if (updated?.id) {
          const mergeSheet = (sheet: ChangeModelResponse) =>
            sheet.id === updated.id ? { ...sheet, ...updated } : sheet;
          if (state.filteredSheets)
            state.filteredSheets = state.filteredSheets.map(mergeSheet);
          if (state.sheets) state.sheets = state.sheets.map(mergeSheet);
        }
      })
      .addCase(getSheetWithFullObject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

      // ==================== GET ALL STATUS HISTORY ====================
    builder
      .addCase(getAllStatusHistory.pending, (state) => {
        state.loadingHistory = true;
        state.error = null;
      })
      .addCase(getAllStatusHistory.fulfilled, (state, action) => {
        state.loadingHistory = false;
        state.statusHistory = action.payload;
        state.error = null;
      })
      .addCase(getAllStatusHistory.rejected, (state, action) => {
        state.loadingHistory = false;
        state.error = action.payload as string;
      });

    // ==================== GET SHEET STATUS HISTORY ====================
    builder
      .addCase(getSheetStatusHistory.pending, (state) => {
        state.loadingHistory = true;
        state.error = null;
      })
      .addCase(getSheetStatusHistory.fulfilled, (state, action) => {
        state.loadingHistory = false;
        state.statusHistory = action.payload;
        state.error = null;
      })
      .addCase(getSheetStatusHistory.rejected, (state, action) => {
        state.loadingHistory = false;
        state.error = action.payload as string;
      });

    // ==================== GET BY STATUS ====================
    builder
      .addCase(getSheetsByStatus.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(getSheetsByStatus.fulfilled, (state, action) => {
        state.loadingList = false;
        state.sheets = action.payload;
        state.filteredSheets = action.payload;
        state.error = null;
      })
      .addCase(getSheetsByStatus.rejected, (state, action) => {
        state.loadingList = false;
        state.error = action.payload as string;
      });

    // ==================== GET BY DATE ====================
    builder
      .addCase(getSheetByDate.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(getSheetByDate.fulfilled, (state, action) => {
        state.loadingList = false;
        state.sheets = action.payload;
        state.filteredSheets = action.payload;
        state.error = null;
      })
      .addCase(getSheetByDate.rejected, (state, action) => {
        state.loadingList = false;
        state.error = action.payload as string;
      });

    // ==================== GET BY WORK ORDER ====================
    builder
      .addCase(getSheetbyWorkorder.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(getSheetbyWorkorder.fulfilled, (state, action) => {
        state.loadingList = false;
        state.sheets = action.payload;
        state.filteredSheets = action.payload;
        state.error = null;
      })
      .addCase(getSheetbyWorkorder.rejected, (state, action) => {
        state.loadingList = false;
        state.error = action.payload as string;
      });
    // filter all
    builder
      .addCase(getSheetByFilter.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(getSheetByFilter.fulfilled, (state, action) => {
        state.loadingList = false;
        state.sheets = action.payload;
        state.filteredSheets = action.payload;
        state.error = null;
      })
      .addCase(getSheetByFilter.rejected, (state, action) => {
        state.loadingList = false;
        state.error = action.payload as string;
      });
    // Xóa sheet theo id
    builder
      .addCase(deleteSheetById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSheetById.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteSheetById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      // ==================== GET ALL SHEETS BY USER ID ====================
      builder
      .addCase(getAllSheetByUserId.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(getAllSheetByUserId.fulfilled, (state, action) => {
        state.loadingList = false;
        state.sheets = action.payload;
        state.filteredSheets = action.payload;
        state.error = null;
      })
      .addCase(getAllSheetByUserId.rejected, (state, action) => {
        state.loadingList = false;
        state.error = action.payload as string;
      });
      // filterSheetByUserId
      builder
      .addCase(filterSheetByUserId.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(filterSheetByUserId.fulfilled, (state, action) => {
        state.loadingList = false;
        state.sheets = action.payload;
        state.filteredSheets = action.payload;
        state.error = null;
      })
      .addCase(filterSheetByUserId.rejected, (state, action) => {
        state.loadingList = false;
        state.error = action.payload as string;
      });

      // Update note file
      builder
      .addCase(updateNoteFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNoteFile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSheet = action.payload;
        state.error = null;
      })
      .addCase(updateNoteFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

      // ==================== RETURN TO PENDING ====================
      builder
        .addCase(returnSheetToPending.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(returnSheetToPending.fulfilled, (state, action) => {
          state.loading = false;
          state.error = null;
          const { sheetId } = action.payload;

          // Update status trong cả 2 list
          const updateStatus = (sheet: ChangeModelResponse) =>
            sheet.id === sheetId ? { ...sheet, status: 'Pending' } : sheet;

          if (state.filteredSheets) state.filteredSheets = state.filteredSheets.map(updateStatus);
          if (state.sheets) state.sheets = state.sheets.map(updateStatus);

          // Nếu đang xem sheet này thì cũng update currentSheet
          if (state.currentSheet?.id === sheetId) {
            state.currentSheet = { ...state.currentSheet, status: 'Pending' };
          }
        })
        .addCase(returnSheetToPending.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        });
  },
});

export const { clearError, clearSheet, clearSheetList , reset, setCurrentSheet, clearStatusHistory, removeSheetFromList, patchSheetInList } = changeModelSlice.actions;
export default changeModelSlice.reducer;
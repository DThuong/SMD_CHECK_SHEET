import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'https://smd-server-agepb7h5fgdzc7fw.eastasia-01.azurewebsites.net/api';

// ==================== TYPES ====================

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
}

interface ChangeModelState {
  loading?: boolean;
  error?: string | null;
  currentSheet?: ChangeModelResponse | null;
  sheets?: ChangeModelResponse[];
  filteredSheets?: ChangeModelResponse[];
  loadingList?: boolean;
  uploadLoading?: boolean;
  success?: boolean
}

const initialState: ChangeModelState = {
  loading: false,
  error: null,
  currentSheet: null,
  success: false,
  sheets: [],
  filteredSheets: [],
  loadingList: false,
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }
      const response = await fetch(
        `${API_BASE_URL}/ChangeModel/upload-files?changeModelId=${changeModelId}`,
        {
          method: 'PUT',
          body: formData,
          // Thêm headers
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, fileType };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      return rejectWithValue(error.message || 'Upload failed');
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

/**
 * CREATE SHEET
 * POST /api/ChangeModel
 * Không cần data - backend tự động tạo tất cả
 */
export const createChangeModel = createAsyncThunk(
  'changeModel/create',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const response = await axios.post(
        `${API_BASE_URL}/ChangeModel`,
        {}, // Empty body - backend không yêu cầu data
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data as ChangeModelResponse;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Không thể tạo sheet mới'
      );
    }
  }
);

/**
 * UPDATE STATUS
 * PUT /api/ChangeModel/status/{id}
 * Tự động cập nhật status thành "PQCDone"
 */
export const updateSheetStatus = createAsyncThunk(
  'changeModel/updateStatus',
  async (sheetId: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const response = await axios.put(
        `${API_BASE_URL}/ChangeModel/status/${sheetId}`,
        { status: 'PQCDone' }, // Auto set to PQCDone
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

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
 * FILTER
 * GET /api/ChangeModel
 * không cần parameter - backend trả về data
 *  */
export const fetchChangeModel = createAsyncThunk(
  'changeModel/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/ChangeModel`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const response = await axios.get(
        `${API_BASE_URL}/ChangeModel/status/${status}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

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

      const response = await axios.get(
        `${API_BASE_URL}/ChangeModel/filter/${fromDate}/${toDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

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

      const response = await axios.get(
        `${API_BASE_URL}/ChangeModel/workorder/${workorder}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

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
  async (params: { status?: string; workOrder?: string; fromDate?: string; toDate?: string }, { rejectWithValue }) => {
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


      const response = await axios.get(
        `${API_BASE_URL}/ChangeModel/filterAll`,
        {
          params: queryParams,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

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
    
  },
  extraReducers: (builder) => {
    // Upload single file
    builder
      .addCase(uploadFile.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploadLoading = false;
        // Cập nhật URL tương ứng
        if (state.currentSheet) {
          if (action.payload.fileType === 'excel') {
            state.currentSheet.excelFileUrl = action.payload.data.excelFileUrl;
          } else {
            state.currentSheet.pdfFileUrl = action.payload.data.pdfFileUrl;
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
            state.currentSheet.excelFileUrl = action.payload.excel.data.excelFileUrl;
          }
          if (action.payload.pdf?.data?.pdfFileUrl) {
            state.currentSheet.pdfFileUrl = action.payload.pdf.data.pdfFileUrl;
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
        state.currentSheet = action.payload;
        state.error = null;
      })
      .addCase(updateSheetStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      // filter 
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
  },
});

export const { clearError, clearSheet, clearSheetList , reset, setCurrentSheet } = changeModelSlice.actions;
export default changeModelSlice.reducer;
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { validateLcrFile, type LcrValidationResult } from "../../utils/lcrValidation";
import smdApi from "../services/smdApi";

// Interface cho LCR data item
interface LcrDataItem {
  no: string;
  ndx: string;
  loc: string;
  reel: string;
  model: string;
  lineMC: string;
  partCode: string;
  measure: string;
  decide: string;
  define: string;
  range: string;
  errorComment: string;
  tolerance: string;
  type: string;
  freq: string;
  volt: string;
  lcrSkip: string;
  partName: string;
  spec: string;
  x: string;
  y: string;
  ang: string;
  mc: string;
  skip: string;
  vender: string;
  feeder: string;
  operator: string;
  checkTime: string;
  calcSec: string;
}

// Interface cho LCR response
export interface LcrFileData {
  id: number;
  count: number;
  data: LcrDataItem[];
}

interface FileState {
  lcrFileUrl: string | null; 
  lcrFileBlob: string | null;
  lcrFileData: LcrFileData | null; // Thêm field mới để lưu JSON data    
  lcrValidation: LcrValidationResult | null;
  reflowFileUrl: string | null;   
  reflowFileBlob: string | null;
  lcrLoading: boolean;
  lcrError: string | null;
  reflowLoading: boolean;
  reflowError: string | null;
  loading: boolean; // giữ cho downloadLCRExcelFile
  error: string | null;
}

const initialState: FileState = {
  lcrFileUrl: null,
  lcrFileBlob: null,
  lcrFileData: null,
  lcrValidation: null,
  reflowFileUrl: null,
  reflowFileBlob: null,
  lcrLoading: false,
  lcrError: null,
  reflowLoading: false,
  reflowError: null,
  loading: false,
  error: null,
};

// API MỚI: get LCR file data (JSON)
export const getLcrFileData = createAsyncThunk(
  'file/getLcrFileData',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get<LcrFileData>(`/ChangeModel/file/${id}/ReadExcelFile`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching LCR data:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch LCR data');
    }
  }
);

// get LCR file (Blob - để download)
export const getLcrFile = createAsyncThunk(
  'file/getLcrFile',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`/ChangeModel/files/${id}/excel-view`, {
        responseType: 'blob', 
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'inline'
        }
      });
      console.log('LCR Blob API response:', response.data);
      
      // Create Object URL from Blob
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      
      return url;
    } catch (error: any) {
      console.error('Error fetching LCR file:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch LCR file');
    }
  }
);

// API get Reflow file
export const getReflowFile = createAsyncThunk(
  'file/getReflowFile',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`/ChangeModel/files/${id}/pdf`, {
        responseType: 'blob', 
      });
      
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      
      return url;
      
    } catch (error: any) {
      console.error('Error fetching Reflow file:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch Reflow file');
    }
  }
);

// API download excel file
export const downloadLCRExcelFile = createAsyncThunk(
  'file/downloadLCRExcelFile',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`/ChangeModel/files/${id}/excel`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
      });
      
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `LCR_File_${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Downloaded successfully' };
      
    } catch (error: any) {
      console.error('Error downloading LCR Excel file:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to download LCR Excel file');
    }
  }
);

const FileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    clearLcrFile: (state) => {
      if (state.lcrFileUrl) {
        URL.revokeObjectURL(state.lcrFileUrl);
      }
      state.lcrFileUrl = null;
      state.lcrFileData = null;
      state.lcrValidation = null; 
    },
    clearReflowFile: (state) => {
      if (state.reflowFileUrl) {
        URL.revokeObjectURL(state.reflowFileUrl);
      }
      state.reflowFileUrl = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // LCR File Data (JSON)
      .addCase(getLcrFileData.pending, (state) => {
        state.lcrLoading = true;
        state.lcrError = null;
      })
      .addCase(getLcrFileData.fulfilled, (state, action) => {
        state.lcrLoading = false;
        state.lcrFileData = action.payload;
        state.lcrValidation = validateLcrFile(action.payload);
      })
      .addCase(getLcrFileData.rejected, (state, action) => {
        state.lcrLoading = false;
        state.lcrError = action.payload as string;
        state.lcrValidation = null;
      })
      
      // LCR File (Blob)
      .addCase(getLcrFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLcrFile.fulfilled, (state, action) => {
        state.loading = false;
        state.lcrFileUrl = action.payload;
      })
      .addCase(getLcrFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reflow File
      .addCase(getReflowFile.pending, (state) => {
        state.reflowLoading = true;
        state.reflowError = null;
      })
      .addCase(getReflowFile.fulfilled, (state, action) => {
        state.reflowLoading = false;
        state.reflowFileUrl = action.payload;
      })
      .addCase(getReflowFile.rejected, (state, action) => {
        state.reflowLoading = false;
        state.reflowError = action.payload as string;
      })

      // download excel file
      .addCase(downloadLCRExcelFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadLCRExcelFile.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(downloadLCRExcelFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLcrFile, clearReflowFile } = FileSlice.actions;
export default FileSlice.reducer;
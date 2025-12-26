import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import smdApi from "../services/smdApi";

interface FileState {
  lcrFileUrl: string | null; 
  lcrFileBlob: string | null;    
  reflowFileUrl: string | null;   
  reflowFileBlob: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: FileState = {
  lcrFileUrl: null,
  lcrFileBlob: null,
  reflowFileUrl: null,
  reflowFileBlob: null,
  loading: false,
  error: null,
};

// ✅ API get LCR file
export const getLcrFile = createAsyncThunk(
  'file/getLcrFile',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`/ChangeModel/files/${id}/excel-view`, {responseType: 'blob', 
        headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'inline'
      }}, 
        
      );
      console.log('LCR API response:', response.data);
      
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
      // CRITICAL: Phải set responseType = 'blob'
      const response = await smdApi.get(`/ChangeModel/files/${id}/pdf`, {
        responseType: 'blob', 
      });
      
      // Create Object URL from Blob
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      
      return url;
      
    } catch (error: any) {
      console.error('Error fetching Reflow file:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch Reflow file');
    }
  }
);

// APi download excel file
export const downloadLCRExcelFile = createAsyncThunk(
  'file/downloadLCRExcelFile',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`/ChangeModel/files/${id}/excel`, {
        responseType: 'blob', // ✅ CRITICAL: Phải có để download file
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
      });
      
      // ✅ Tạo Blob URL để download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      
      // ✅ Tạo link tạm để trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `LCR_File_${id}.xlsx`; // Tên file download
      document.body.appendChild(link);
      link.click();
      
      // ✅ Cleanup
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
    // Cleanup URLs khi không dùng nữa
    clearLcrFile: (state) => {
      if (state.lcrFileUrl) {
        URL.revokeObjectURL(state.lcrFileUrl);
      }
      state.lcrFileUrl = null;
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
      // LCR File
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
        state.loading = true;
        state.error = null;
      })
      .addCase(getReflowFile.fulfilled, (state, action) => {
        state.loading = false;
        state.reflowFileUrl = action.payload;
      })
      .addCase(getReflowFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;     
      })

      // download excel file
      .addCase(downloadLCRExcelFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadLCRExcelFile.fulfilled, (state) => {
        state.loading = false;
        // Không cần lưu gì vì đã auto download
      })
      .addCase(downloadLCRExcelFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLcrFile, clearReflowFile } = FileSlice.actions;
export default FileSlice.reducer;
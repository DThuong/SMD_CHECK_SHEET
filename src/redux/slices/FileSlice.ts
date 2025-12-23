import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import smdApi from "../services/smdApi";

interface FileState {
  lcrFile: File | null;
  workflowFile: File | null;
  loading: boolean;
  error: string | null;
}

const initialState: FileState = {
  lcrFile: null,
  workflowFile: null,
  loading: false,
  error: null,
};

// api get file: lcr
export const getLcrFile = createAsyncThunk(
  'file/getLcrFile',
  async (id: number, {rejectWithValue}) => {
    try {
      const response = await smdApi.get(`/ChangeModel/files/${id}/excel`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// api get file: reflow
export const getReflowFile = createAsyncThunk(
  'file/getReflowFile',
  async (id: number, {rejectWithValue}) => {
    try {
      const response = await smdApi.get(`/ChangeModel/files/${id}/pdf`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);


const FileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getLcrFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLcrFile.fulfilled, (state, action) => {
        state.loading = false;
        state.lcrFile = action.payload;
        })
    .addCase(getLcrFile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
      .addCase(getReflowFile.pending, (state) => {
        state.loading = true;
        state.error = null;
        })
      .addCase(getReflowFile.fulfilled, (state, action) => {
        state.loading = false;
        state.workflowFile = action.payload;
        })
      .addCase(getReflowFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;     
      })
  },
});

export default FileSlice.reducer;
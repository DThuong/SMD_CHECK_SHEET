import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import smdApi from '../services/smdApi';

export interface Note {
  id: number;
  changeModelId: number;
  noteContent: string;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  account?: {
    username: string;
    fullName: string;
    role: string;
  };
}

interface NoteState {
  notes: Note[];
  loading: boolean;
  error: string | null;
}

const initialState: NoteState = {
  notes: [],
  loading: false,
  error: null,
};

export const getNotesBySheet = createAsyncThunk(
  'note/getNotesBySheet',
  async (sheetId: number, { rejectWithValue }) => {
    try {
      const res = await smdApi.get(`/api/notes/${sheetId}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Lấy ghi chú thất bại');
    }
  }
);

export const createNote = createAsyncThunk(
  'note/createNote',
  async (payload: { changeModelId: number; noteContent: string }, { rejectWithValue }) => {
    try {
      const res = await smdApi.post('/api/notes', payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Tạo ghi chú thất bại');
    }
  }
);

export const updateNote = createAsyncThunk(
  'note/updateNote',
  async (payload: { id: number; noteContent: string }, { rejectWithValue }) => {
    try {
      const res = await smdApi.put(`/api/notes/${payload.id}`, { noteContent: payload.noteContent });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Cập nhật ghi chú thất bại');
    }
  }
);

export const deleteNote = createAsyncThunk(
  'note/deleteNote',
  async (id: number, { rejectWithValue }) => {
    try {
      await smdApi.delete(`/api/notes/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Xóa ghi chú thất bại');
    }
  }
);

const noteSlice = createSlice({
  name: 'note',
  initialState,
  reducers: {
    clearNotes: (state) => {
      state.notes = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getNotesBySheet.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getNotesBySheet.fulfilled, (state, action) => { state.loading = false; state.notes = action.payload; })
      .addCase(getNotesBySheet.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(createNote.pending, (state) => { state.loading = true; })
      .addCase(createNote.fulfilled, (state) => { state.loading = false; })
      .addCase(createNote.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(updateNote.pending, (state) => { state.loading = true; })
      .addCase(updateNote.fulfilled, (state) => { state.loading = false; })
      .addCase(updateNote.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(deleteNote.pending, (state) => { state.loading = true; })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter(n => n.id !== action.payload);
      })
      .addCase(deleteNote.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { clearNotes } = noteSlice.actions;
export default noteSlice.reducer;

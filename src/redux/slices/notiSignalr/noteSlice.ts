/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import smdApi from '../../services/smdApi';

// ✅ Interface phải match với API response
export interface Note {
  id: number;
  accountId: number;
  changeModelId: number;
  noteContent: string;  // ← API trả về "noteContent" không phải "content"
  status: string;
  createdAt: string;
  
  // Account info từ nested object
  account?: {
    id: number;
    username: string;
    role: string;
    fullName: string;
    phoneNumber: string;
  };
  
  // ChangeModel info
  changeModel?: {
    id: number;
    status: string;
    createAt: string;
  };
  
  // Mapped fields để dễ sử dụng trong UI
  sheetId?: number;
  createdBy?: string;
  createdByRole?: string;
  updatedAt?: string;
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

const mapNoteData = (rawNote: any): Note => {
  return {
    id: rawNote.id,
    accountId: rawNote.accountId,
    changeModelId: rawNote.changeModelId,
    noteContent: rawNote.noteContent,
    status: rawNote.status,
    createdAt: rawNote.createdAt,
    account: rawNote.account,
    changeModel: rawNote.changeModel,
    
    // Mapped fields
    sheetId: rawNote.changeModelId,
    createdBy: rawNote.account?.username || rawNote.account?.fullName || 'Unknown',
    createdByRole: rawNote.account?.role || 'Unknown',
    updatedAt: rawNote.updatedAt
  };
};

// get all Notes
export const getAllNotes = createAsyncThunk('note/getAllNotes', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const response = await smdApi.get('/Note', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const mapNote = response.data.map((note: any) => mapNoteData(note));
    return mapNote;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch notes');
  }
});

// Get notes by sheetId
export const getNotesBySheet = createAsyncThunk(
  'note/getNotesBySheet',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await smdApi.get(`/Note/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mapNote = response.data.map((note: any) => mapNoteData(note));
      return mapNote;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notes');
    }
  }
);

// Create note
export const createNote = createAsyncThunk(
  'note/createNote',
  async ({ changeModelId, noteContent }: { changeModelId: number; noteContent: string }, { rejectWithValue }) => {
    try {  
      const token = localStorage.getItem('token');
      const response = await smdApi.post(
        `/Note`,
        { changeModelId, noteContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return mapNoteData(response.data);
    } catch (error: any) {
      console.error('❌ Create note error:', error.response?.data);
      console.groupEnd();
      return rejectWithValue(error.response?.data?.message || 'Failed to create note');
    }
  }
);

// Update note
export const updateNote = createAsyncThunk(
  'note/updateNote',
  async ({ id, noteContent }: { id: number; noteContent: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await smdApi.put(
        `/Note/${id}`,
        { noteContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return mapNoteData(response.data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update note');
    }
  }
);

// Delete note
export const deleteNote = createAsyncThunk(
  'note/deleteNote',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await smdApi.delete(`/Note/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete note');
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
    }
  },
  extraReducers: (builder) => {
    // get all notes
    builder.addCase(getAllNotes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAllNotes.fulfilled, (state, action) => {
      state.loading = false;
      state.notes = action.payload;
    });
    builder.addCase(getAllNotes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    // Get notes
    builder.addCase(getNotesBySheet.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getNotesBySheet.fulfilled, (state, action) => {
      state.loading = false;
      state.notes = action.payload;
    });
    builder.addCase(getNotesBySheet.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create note
    builder.addCase(createNote.fulfilled, (state, action) => {
      state.notes.push(action.payload);
    });

    // Update note
    builder.addCase(updateNote.fulfilled, (state, action) => {
      const index = state.notes.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.notes[index] = action.payload;
      }
    });

    // Delete note
    builder.addCase(deleteNote.fulfilled, (state, action) => {
      state.notes = state.notes.filter(n => n.id !== action.payload);
    });
  }
});

export const { clearNotes } = noteSlice.actions;
export default noteSlice.reducer;
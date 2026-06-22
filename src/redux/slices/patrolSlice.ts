/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import patrolApi from "../services/patrolApi";

export interface PatrolSession {
    id: number;
    accountId: number;
    fullName: string;
    status: string;
    patrolType: string; // "1": ngày (daily), "7": tuần (weekly)
    lineAreaId: number;
    note: string;
    createdAt: string;
    checkListResults: CheckListResult[];
}

export interface CheckListResult {
    id: number
    patrolSessionId: number
    checkListId: number
    result: string
    actualValue: string
    note: string
    checkAt: string
    images: ImageModel[]
}

export interface CheckList {
    id: number
    categoryId: number
    questionCheck: string
    spec: string
    specType?: string
    isActive: boolean
}

export interface LineArea {
    id: number
    note: string
    lineAreaName: string
    isActive: boolean
}

export interface Category{
    id: number
    stageId: number
    name: string
    isActive: boolean
}

export interface Stage {
    id: number;
    name: string;
    patrolType: string; // "1" for daily, "7" for weekly
    isActive: boolean;
}

// Loại ảnh gắn theo từng câu hỏi (checkListResult)
export type ImageType = "Before" | "After" | "Evidence";

export interface ImageModel {
    id: number;
    // API mới: ảnh gắn theo checkListResultId + typeImage
    checkListResultId: number;
    typeImage: ImageType | string;
    fileName: string;
    imageUrl: string;
    note: string;
    // legacy/optional (giữ tương thích dữ liệu cũ)
    patrolSessionId?: number;
    filename?: string;
    isActive?: boolean;
    patrolSession?: any | null;
}

export interface StatusHistory {
    id: number;
    patrolSessionId: number;
    accountId: number;
    fullName: string;
    role: string;
    status: string;
    createdAt: string;
}

export interface PatrolSessionFilter {
    fullName?: string;
    fromDate?: string;
    toDate?: string;
    status?: string;
    lineAreaName?: string;
}

export interface PatrolState {
    loading: boolean;
    error: string | null;

    loadedImageSessionIds: number[];

    // Detail hiện tại
    currentSession: PatrolSession | null;
    
    // Arrays for data
    sessions: PatrolSession[];
    categories: Category[];
    checkLists: CheckList[];
    checkListResults: CheckListResult[];
    lineAreas: LineArea[];
    stages: Stage[];
    images: ImageModel[];
    statusHistories: StatusHistory[];
    filteredSessionsResult: PatrolSession[];

    filteredSessions: PatrolSession[];
    loadingList: boolean;
    uploadLoading: boolean;
    statusHistory: string[];
    status: string;
    success: boolean;
    loadingHistory: boolean;
}

const initialState: PatrolState = {
    loadedImageSessionIds: [],
    loading: false,
    error: null,
    currentSession: null,
    sessions: [],
    categories: [],
    checkLists: [],
    checkListResults: [],
    lineAreas: [],
    stages: [],
    images: [],
    filteredSessions: [],
    statusHistories: [],
    filteredSessionsResult: [],
    loadingList: false,
    loadingHistory: false,
    statusHistory: [],
    uploadLoading: false,
    status: '',
    success: false,
};

// ======================== ASYNC THUNKS ========================

// --- Category ---
export const fetchCategories = createAsyncThunk('patrol/fetchCategories', async (_, { rejectWithValue }) => {
    try { const response = await patrolApi.get('/Category'); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const fetchCategoryById = createAsyncThunk('patrol/fetchCategoryById', async (id: number, { rejectWithValue }) => {
    try { const response = await patrolApi.get(`/Category/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const createCategory = createAsyncThunk('patrol/createCategory', async (data: Partial<Category>, { rejectWithValue }) => {
    try { const response = await patrolApi.post('/Category', data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const deleteCategory = createAsyncThunk('patrol/deleteCategory', async (id: number, { rejectWithValue }) => {
    try { await patrolApi.delete(`/Category/${id}`); return id; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const updateCategory = createAsyncThunk('patrol/updateCategory', async ({ id, data }: { id: number, data: Partial<Category> }, { rejectWithValue }) => {
    try { const response = await patrolApi.put(`/Category/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const checkAuthCategory = createAsyncThunk('patrol/checkAuthCategory', async (_, { rejectWithValue }) => {
    try { const response = await patrolApi.get('/Category/check-auth'); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});

// --- CheckList ---
export const fetchCheckLists = createAsyncThunk('patrol/fetchCheckLists', async (_, { rejectWithValue }) => {
    try { const response = await patrolApi.get('/CheckList'); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const fetchCheckListById = createAsyncThunk('patrol/fetchCheckListById', async (id: number, { rejectWithValue }) => {
    try { const response = await patrolApi.get(`/CheckList/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const createCheckList = createAsyncThunk('patrol/createCheckList', async (data: Partial<CheckList>, { rejectWithValue }) => {
    try { const response = await patrolApi.post('/CheckList', data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const deleteCheckList = createAsyncThunk('patrol/deleteCheckList', async (id: number, { rejectWithValue }) => {
    try { await patrolApi.delete(`/CheckList/${id}`); return id; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const updateCheckList = createAsyncThunk('patrol/updateCheckList', async ({ id, data }: { id: number, data: Partial<CheckList> }, { rejectWithValue }) => {
    try { const response = await patrolApi.put(`/CheckList/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});

// --- CheckListResult ---
export const fetchCheckListResults = createAsyncThunk('patrol/fetchCheckListResults', async (_, { rejectWithValue }) => {
    try { const response = await patrolApi.get('/CheckListResult'); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const fetchCheckListResultById = createAsyncThunk('patrol/fetchCheckListResultById', async (id: number, { rejectWithValue }) => {
    try { const response = await patrolApi.get(`/CheckListResult/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const fetchCheckListResultsBySession = createAsyncThunk('patrol/fetchCheckListResultsBySession', async (patrolSessionId: number, { rejectWithValue }) => {
    try { const response = await patrolApi.get(`/CheckListResult/${patrolSessionId}/checklistresults`); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const createCheckListResult = createAsyncThunk('patrol/createCheckListResult', async (data: Partial<CheckListResult>, { rejectWithValue }) => {
    try { const response = await patrolApi.post('/CheckListResult', data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const deleteCheckListResult = createAsyncThunk('patrol/deleteCheckListResult', async (id: number, { rejectWithValue }) => {
    try { await patrolApi.delete(`/CheckListResult/${id}`); return id; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const updateCheckListResult = createAsyncThunk('patrol/updateCheckListResult', async ({ id, data }: { id: number, data: Partial<CheckListResult> }, { rejectWithValue }) => {
    try { const response = await patrolApi.put(`/CheckListResult/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});

// --- Image ---
export const fetchImagesBySession = createAsyncThunk('patrol/fetchImagesBySession', async (sessionId: number, { rejectWithValue }) => {
    try { const response = await patrolApi.get(`/Image/session/${sessionId}`); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const fetchImageByFilename = createAsyncThunk('patrol/fetchImageByFilename', async (fileName: string, { rejectWithValue }) => {
    try { const response = await patrolApi.get(`/Image/image/${fileName}`, { responseType: 'blob' }); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
// API mới: upload ảnh theo từng câu hỏi (checkListResultId) + loại ảnh (Before/After/Evidence)
export const uploadImage = createAsyncThunk('patrol/uploadImage', async ({ checkListResultId, typeImage, formData }: { checkListResultId: number, typeImage: string, formData: FormData }, { rejectWithValue }) => {
    try { const response = await patrolApi.post(`/Image/upload/${checkListResultId}/type/${typeImage}`, formData); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
// Lấy ảnh theo 1 câu hỏi + 1 loại ảnh (nếu cần dùng riêng)
export const fetchImagesByResultType = createAsyncThunk('patrol/fetchImagesByResultType', async ({ checkListResultId, typeImage }: { checkListResultId: number, typeImage: string }, { rejectWithValue }) => {
    try { const response = await patrolApi.get(`/Image/checklistresult/${checkListResultId}/type/${typeImage}`); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const deleteImage = createAsyncThunk('patrol/deleteImage', async (id: number, { rejectWithValue }) => {
    try { await patrolApi.delete(`/Image/${id}`); return id; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});

// --- LineArea ---
export const fetchLineAreas = createAsyncThunk('patrol/fetchLineAreas', async (_, { rejectWithValue }) => {
    try { const response = await patrolApi.get('/LineArea'); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const fetchLineAreaById = createAsyncThunk('patrol/fetchLineAreaById', async (id: number, { rejectWithValue }) => {
    try { const response = await patrolApi.get(`/LineArea/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const createLineArea = createAsyncThunk('patrol/createLineArea', async (data: Partial<LineArea>, { rejectWithValue }) => {
    try { const response = await patrolApi.post('/LineArea', data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const deleteLineArea = createAsyncThunk('patrol/deleteLineArea', async (id: number, { rejectWithValue }) => {
    try { await patrolApi.delete(`/LineArea/${id}`); return id; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const updateLineArea = createAsyncThunk('patrol/updateLineArea', async ({ id, data }: { id: number, data: Partial<LineArea> }, { rejectWithValue }) => {
    try { const response = await patrolApi.put(`/LineArea/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});

// --- PatrolSession ---
export const fetchPatrolSessions = createAsyncThunk('patrol/fetchPatrolSessions', async (_, { rejectWithValue }) => {
    try { const response = await patrolApi.get('/PatrolSession'); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const fetchPatrolSessionById = createAsyncThunk('patrol/fetchPatrolSessionById', async (id: number, { rejectWithValue }) => {
    try { const response = await patrolApi.get(`/PatrolSession/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const createPatrolSession = createAsyncThunk('patrol/createPatrolSession', async (data: Partial<PatrolSession>, { rejectWithValue }) => {
    try { const response = await patrolApi.post('/PatrolSession', data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const deletePatrolSession = createAsyncThunk('patrol/deletePatrolSession', async (id: number, { rejectWithValue }) => {
    try { await patrolApi.delete(`/PatrolSession/${id}`); return id; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const updatePatrolSession = createAsyncThunk('patrol/updatePatrolSession', async ({ id, data }: { id: number, data: Partial<PatrolSession> }, { rejectWithValue }) => {
    try { const response = await patrolApi.put(`/PatrolSession/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const updatePatrolSessionStatus = createAsyncThunk(
  'patrol/updatePatrolSessionStatus',
  async ({ id, status }: { id: number; status: string }, { rejectWithValue }) => {
    try {
      const response = await patrolApi.patch(
        `/PatrolSession/${id}/status`,
        `"${status}"`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const rejectPatrolSessionStatus = createAsyncThunk(
  'patrol/rejectPatrolSessionStatus',
  async ({ id }: { id: number }, { rejectWithValue }) => {
    try {
      const response = await patrolApi.patch(`/PatrolSession/${id}/status-reject`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// --- Stage ---
export const fetchStages = createAsyncThunk('patrol/fetchStages', async (_, { rejectWithValue }) => {
    try { const response = await patrolApi.get('/Stage'); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const fetchStageById = createAsyncThunk('patrol/fetchStageById', async (id: number, { rejectWithValue }) => {
    try { const response = await patrolApi.get(`/Stage/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const fetchStagesByPatrolType = createAsyncThunk('patrol/fetchStagesByPatrolType', async (patrolType: string, { rejectWithValue }) => {
    // patrolType: "1" for daily, "7" for weekly
    try { const response = await patrolApi.get(`/Stage/patroltype/${patrolType}`); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const createStage = createAsyncThunk('patrol/createStage', async (data: Partial<Stage>, { rejectWithValue }) => {
    try { const response = await patrolApi.post('/Stage', data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const deleteStage = createAsyncThunk('patrol/deleteStage', async (id: number, { rejectWithValue }) => {
    try { await patrolApi.delete(`/Stage/${id}`); return id; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});
export const updateStage = createAsyncThunk('patrol/updateStage', async ({ id, data }: { id: number, data: Partial<Stage> }, { rejectWithValue }) => {
    try { const response = await patrolApi.put(`/Stage/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(error.response?.data || error.message); }
});

// ---- Status history and filter
export const fetchStatusHistoryBySession = createAsyncThunk(
    'patrol/fetchStatusHistoryBySession',
    async (sessionId: number, { rejectWithValue }) => {
        try {
            const response = await patrolApi.get(`/StatusHistory/session/${sessionId}`);
            return response.data;
        } catch (error: any) {
            const data = error.response?.data;
            const message =
                (typeof data === 'object' && data !== null
                    ? data?.message || data?.detail || data?.title
                    : typeof data === 'string' ? data : null) ||
                error.message || 'Đã xảy ra lỗi';
            return rejectWithValue(message);
        }
    }
);

export const filterPatrolSessions = createAsyncThunk(
    'patrol/filterPatrolSessions',
    async (params: PatrolSessionFilter, { rejectWithValue }) => {
        try {
            const response = await patrolApi.get('/PatrolSession/filter', { params });
            return response.data;
        } catch (error: any) {
            const data = error.response?.data;
            const message =
                (typeof data === 'object' && data !== null
                    ? data?.message || data?.detail || data?.title
                    : typeof data === 'string' ? data : null) ||
                error.message || 'Đã xảy ra lỗi';
            return rejectWithValue(message);
        }
    }
);


// ======================== SLICE ========================
const patrolSlice = createSlice({
    name: 'Patrol',
    initialState,
    reducers: {
        clearPatrolHistoryStatus(state) {
            state.statusHistory = [];
            state.error = null;
        },

        clearPatrolError(state) {
            state.error = null;
        },

        clearCurrentPatrolSession(state) {
            state.currentSession = null;
            state.statusHistories = [];
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Generic handlers
        const handlePending = (state: PatrolState) => {
            state.loading = true;
            state.error = null;
            state.success = false;
        };
        const handleRejected = (state: PatrolState, action: any) => {
            state.loading = false;
            state.error = action.payload as string || 'An error occurred';
            state.success = false;
        };

        builder
            // --- Category ---
            .addCase(fetchCategories.pending, handlePending)
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, handleRejected)
            
            .addCase(createCategory.pending, handlePending)
            .addCase(createCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.categories.push(action.payload);
            })
            .addCase(createCategory.rejected, handleRejected)

            .addCase(deleteCategory.pending, handlePending)
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.categories = state.categories.filter(item => item.id !== action.payload);
            })
            .addCase(deleteCategory.rejected, handleRejected)

            .addCase(updateCategory.pending, handlePending)
            .addCase(updateCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.categories.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
            })
            .addCase(updateCategory.rejected, handleRejected)

            // --- CheckList ---
            .addCase(fetchCheckLists.pending, handlePending)
            .addCase(fetchCheckLists.fulfilled, (state, action) => {
                state.loading = false;
                state.checkLists = action.payload;
            })
            .addCase(fetchCheckLists.rejected, handleRejected)

            .addCase(createCheckList.pending, handlePending)
            .addCase(createCheckList.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.checkLists.push(action.payload);
            })
            .addCase(createCheckList.rejected, handleRejected)

            .addCase(deleteCheckList.pending, handlePending)
            .addCase(deleteCheckList.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.checkLists = state.checkLists.filter(item => item.id !== action.payload);
            })
            .addCase(deleteCheckList.rejected, handleRejected)

            .addCase(updateCheckList.pending, handlePending)
            .addCase(updateCheckList.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.checkLists.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.checkLists[index] = action.payload;
                }
            })
            .addCase(updateCheckList.rejected, handleRejected)

            // --- CheckListResult ---
            .addCase(fetchCheckListResults.pending, handlePending)
            .addCase(fetchCheckListResults.fulfilled, (state, action) => {
                state.loading = false;
                state.checkListResults = action.payload;
            })
            .addCase(fetchCheckListResults.rejected, handleRejected)

            .addCase(fetchCheckListResultsBySession.pending, handlePending)
            .addCase(fetchCheckListResultsBySession.fulfilled, (state, action) => {
                state.loading = false;
                state.checkListResults = action.payload;
            })
            .addCase(fetchCheckListResultsBySession.rejected, handleRejected)

            .addCase(createCheckListResult.pending, handlePending)
            .addCase(createCheckListResult.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;

                state.checkListResults.push(action.payload);

                if (
                    state.currentSession &&
                    state.currentSession.id === action.payload.patrolSessionId
                ) {
                    state.currentSession.checkListResults = [
                        ...(state.currentSession.checkListResults || []),
                        action.payload
                    ];
                }
            })
            .addCase(createCheckListResult.rejected, handleRejected)

            .addCase(deleteCheckListResult.pending, handlePending)
            .addCase(deleteCheckListResult.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.checkListResults = state.checkListResults.filter(item => item.id !== action.payload);
            })
            .addCase(deleteCheckListResult.rejected, handleRejected)

            .addCase(updateCheckListResult.pending, handlePending)
            .addCase(updateCheckListResult.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;

                const index = state.checkListResults.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.checkListResults[index] = action.payload;
                }

                if (state.currentSession?.checkListResults) {
                    const currentIndex = state.currentSession.checkListResults.findIndex(
                        item => item.id === action.payload.id
                    );

                    if (currentIndex !== -1) {
                        state.currentSession.checkListResults[currentIndex] = action.payload;
                    }
                }
            })
            .addCase(updateCheckListResult.rejected, handleRejected)

            // --- Image ---
            .addCase(fetchImagesBySession.pending, (state) => {
                state.error = null;
            })
            .addCase(fetchImagesBySession.fulfilled, (state, action) => {
                state.loading = false;

                const payload = Array.isArray(action.payload) ? action.payload : [];

                // API mới: ảnh trả về theo session (gắn checkListResultId + typeImage),
                // không còn trường patrolSessionId. Trang chi tiết chỉ xử lý 1 session
                // tại một thời điểm nên thay toàn bộ danh sách ảnh đang giữ trong store.
                const requestedSessionId = Number(action.meta.arg);
                if (requestedSessionId && !state.loadedImageSessionIds.includes(requestedSessionId)) {
                    state.loadedImageSessionIds.push(requestedSessionId);
                }

                state.images = payload;
            })
            .addCase(fetchImagesBySession.rejected, handleRejected)

            .addCase(uploadImage.pending, (state) => {
                state.uploadLoading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(uploadImage.fulfilled, (state) => {
                state.uploadLoading = false;
                state.success = true;
            })
            .addCase(uploadImage.rejected, (state, action) => {
                state.uploadLoading = false;
                state.error = action.payload as string || 'Upload failed';
                state.success = false;
            })

            .addCase(deleteImage.pending, handlePending)
            .addCase(deleteImage.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.images = state.images.filter(item => item.id !== action.payload);
            })
            .addCase(deleteImage.rejected, handleRejected)

            // --- LineArea ---
            .addCase(fetchLineAreas.pending, handlePending)
            .addCase(fetchLineAreas.fulfilled, (state, action) => {
                state.loading = false;
                state.lineAreas = action.payload;
            })
            .addCase(fetchLineAreas.rejected, handleRejected)

            .addCase(createLineArea.pending, handlePending)
            .addCase(createLineArea.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.lineAreas.push(action.payload);
            })
            .addCase(createLineArea.rejected, handleRejected)

            .addCase(deleteLineArea.pending, handlePending)
            .addCase(deleteLineArea.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.lineAreas = state.lineAreas.filter(item => item.id !== action.payload);
            })
            .addCase(deleteLineArea.rejected, handleRejected)

            .addCase(updateLineArea.pending, handlePending)
            .addCase(updateLineArea.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.lineAreas.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.lineAreas[index] = action.payload;
                }
            })
            .addCase(updateLineArea.rejected, handleRejected)

            // --- PatrolSession ---
            .addCase(fetchPatrolSessions.pending, handlePending)
            .addCase(fetchPatrolSessions.fulfilled, (state, action) => {
                state.loading = false;
                state.sessions = action.payload;
            })
            .addCase(fetchPatrolSessions.rejected, handleRejected)

            .addCase(createPatrolSession.pending, handlePending)
            .addCase(createPatrolSession.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.currentSession = action.payload;

                const exists = state.sessions.some(item => item.id === action.payload.id);
                if (!exists) {
                    state.sessions.push(action.payload);
                }
            })
            .addCase(createPatrolSession.rejected, handleRejected)
            
            .addCase(fetchPatrolSessionById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.currentSession = null;
            })
            .addCase(fetchPatrolSessionById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentSession = action.payload;

                // Nếu API detail có trả checkListResults thì lưu luôn vào state riêng
                state.checkListResults = action.payload?.checkListResults || [];

                // Optional: đồng bộ lại item trong list nếu list đã có sẵn
                const index = state.sessions.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.sessions[index] = action.payload;
                }
            })
            .addCase(fetchPatrolSessionById.rejected, handleRejected)

            .addCase(deletePatrolSession.pending, handlePending)
            .addCase(deletePatrolSession.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;

                state.sessions = state.sessions.filter(item => item.id !== action.payload);
                state.filteredSessionsResult = state.filteredSessionsResult.filter(item => item.id !== action.payload);

                if (state.currentSession?.id === action.payload) {
                    state.currentSession = null;
                    state.checkListResults = [];
                    state.images = [];
                    state.statusHistories = [];
                }
            })
            .addCase(deletePatrolSession.rejected, handleRejected)

            .addCase(updatePatrolSession.pending, handlePending)
            .addCase(updatePatrolSession.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;

                state.currentSession = action.payload;

                const index = state.sessions.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.sessions[index] = action.payload;
                }
            })
            .addCase(updatePatrolSession.rejected, handleRejected)

            .addCase(updatePatrolSessionStatus.pending, handlePending)
            .addCase(updatePatrolSessionStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;

                state.currentSession = action.payload;

                const index = state.sessions.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.sessions[index] = action.payload;
                }
            })
            .addCase(updatePatrolSessionStatus.rejected, handleRejected)

            .addCase(rejectPatrolSessionStatus.pending, handlePending)
            .addCase(rejectPatrolSessionStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;

                state.currentSession = action.payload;

                const index = state.sessions.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.sessions[index] = action.payload;
                }
            })
            .addCase(rejectPatrolSessionStatus.rejected, handleRejected)

            // --- Stage ---
            .addCase(fetchStages.pending, handlePending)
            .addCase(fetchStages.fulfilled, (state, action) => {
                state.loading = false;
                state.stages = action.payload;
            })
            .addCase(fetchStages.rejected, handleRejected)

            .addCase(fetchStagesByPatrolType.pending, handlePending)
            .addCase(fetchStagesByPatrolType.fulfilled, (state, action) => {
                state.loading = false;
                state.stages = action.payload;
            })
            .addCase(fetchStagesByPatrolType.rejected, handleRejected)

            .addCase(createStage.pending, handlePending)
            .addCase(createStage.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.stages.push(action.payload);
            })
            .addCase(createStage.rejected, handleRejected)

            .addCase(deleteStage.pending, handlePending)
            .addCase(deleteStage.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.stages = state.stages.filter(item => item.id !== action.payload);
            })
            .addCase(deleteStage.rejected, handleRejected)

            .addCase(updateStage.pending, handlePending)
            .addCase(updateStage.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.stages.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.stages[index] = action.payload;
                }
            })
            .addCase(updateStage.rejected, handleRejected)
            
            // --- StatusHistory ---
            .addCase(fetchStatusHistoryBySession.pending, handlePending)
            .addCase(fetchStatusHistoryBySession.fulfilled, (state, action) => {
                state.loading = false;
                state.statusHistories = action.payload;
            })
            .addCase(fetchStatusHistoryBySession.rejected, handleRejected)

            // --- Filter PatrolSession ---
            .addCase(filterPatrolSessions.pending, handlePending)
            .addCase(filterPatrolSessions.fulfilled, (state, action) => {
                state.loading = false;
                state.filteredSessionsResult = action.payload;
            })
            .addCase(filterPatrolSessions.rejected, handleRejected)
                }
            });

export const { clearPatrolHistoryStatus, clearPatrolError, clearCurrentPatrolSession } = patrolSlice.actions;

export default patrolSlice.reducer;
// (patrol image API: ảnh gắn theo checkListResultId + typeImage)

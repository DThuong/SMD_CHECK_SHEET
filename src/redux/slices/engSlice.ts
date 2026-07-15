/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import engApi from "../services/engApi";

// ======================== TYPES ========================

export interface vehicleSession {
    id: number,
    accountId: number,
    fullName: string,
    status: string,
    sheetType: string, // "1": ngày (daily), "7": tuần (weekly), "30": tháng (monthly)
    lineId: number,
    lineName: string,
    note: string,
    sessionShift: string,
    createdAt: string,
    checkListResults?: CheckListResult[],
}

export interface Category {
    id: number,
    name: string,
    sheetType: string,
    isActive: boolean,
    checkLists: CheckList[]
}

export interface CheckList {
    id: number,
    categoryId: number,
    questionCheck: string,
    isActive: boolean,
    machineTypeId: number,
    machineType: machineType,
    category: Category
}

export interface CheckListResult {
    id: number,
    vehicleSheetSessionId: number,
    checkListId: number,
    machineId: number,
    result: string, // "OK" | "NG"
    vehicleSheetSession: vehicleSession,
    note: string,
    checkAt: string,
    checkList: CheckList
}

export interface Line {
    id: number,
    lineName: string,
    areaPart: string,
    machines: machine[]
}

export interface machine {
    id: number,
    machineName: string,
    lineId: number,
    machineTypeId: number,
    line: Line,
    machineType: machineType
}

export interface machineType {
    id: number,
    name: string,
}

export interface EngImage {
    id: number,
    vehicleSheetSessionId?: number,
    checkListResultId?: number,
    imageType?: string,
    fileName: string,
    imageUrl: string,
    note?: string,
    isActive?: boolean,
}

export interface StatusHistory {
    id: number,
    vehicleSheetSessionId: number,
    accountId: number,
    fullName: string,
    role: string,
    status: string,
    createdAt: string
}

export interface vehicleSessionFilter {
    fullName?: string,
    fromDate?: string,
    toDate?: string,
    status?: string,
    lineAreaName?: string,
}

export interface vehicleSessionState {
    loading: boolean;
    error: string | null;
    success: boolean;
    uploadLoading: boolean;

    // Detail hiện tại
    currentSession: vehicleSession | null;

    // Data arrays
    sessions: vehicleSession[];
    filteredSessionsResult: vehicleSession[];
    categories: Category[];
    checkLists: CheckList[];
    checkListResults: CheckListResult[];
    lines: Line[];
    machines: machine[];
    machineTypes: machineType[];
    images: EngImage[];
    statusHistories: StatusHistory[];
}

const initialState: vehicleSessionState = {
    loading: false,
    error: null,
    success: false,
    uploadLoading: false,
    currentSession: null,
    sessions: [],
    filteredSessionsResult: [],
    categories: [],
    checkLists: [],
    checkListResults: [],
    lines: [],
    machines: [],
    machineTypes: [],
    images: [],
    statusHistories: [],
};

// Helper: lấy message lỗi dễ đọc
const getErrorMessage = (error: any): string => {
    const data = error.response?.data;
    return (
        (typeof data === 'object' && data !== null
            ? data?.message || data?.detail || data?.title
            : typeof data === 'string' ? data : null) ||
        error.message || 'Đã xảy ra lỗi'
    );
};

// ======================== ASYNC THUNKS ========================

// --- Category ---
export const fetchEngCategories = createAsyncThunk('eng/fetchCategories', async (_, { rejectWithValue }) => {
    try { const response = await engApi.get('/Category'); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngCategoryById = createAsyncThunk('eng/fetchCategoryById', async (id: number, { rejectWithValue }) => {
    try { const response = await engApi.get(`/Category/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngCategoriesBySheetType = createAsyncThunk('eng/fetchCategoriesBySheetType', async (sheetType: string, { rejectWithValue }) => {
    // sheetType: "1" ngày, "7" tuần
    try { const response = await engApi.get(`/Category/sheettype/${sheetType}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const createEngCategory = createAsyncThunk('eng/createCategory', async (data: Partial<Category>, { rejectWithValue }) => {
    try { const response = await engApi.post('/Category', data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const updateEngCategory = createAsyncThunk('eng/updateCategory', async ({ id, data }: { id: number, data: Partial<Category> }, { rejectWithValue }) => {
    try { const response = await engApi.put(`/Category/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const deleteEngCategory = createAsyncThunk('eng/deleteCategory', async (id: number, { rejectWithValue }) => {
    try { await engApi.delete(`/Category/${id}`); return id; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const checkAuthEngCategory = createAsyncThunk('eng/checkAuthCategory', async (_, { rejectWithValue }) => {
    try { const response = await engApi.get('/Category/check-auth'); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});

// --- CheckList ---
export const fetchEngCheckLists = createAsyncThunk('eng/fetchCheckLists', async (_, { rejectWithValue }) => {
    try { const response = await engApi.get('/CheckList'); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngCheckListById = createAsyncThunk('eng/fetchCheckListById', async (id: number, { rejectWithValue }) => {
    try { const response = await engApi.get(`/CheckList/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngCheckListsByMachineType = createAsyncThunk('eng/fetchCheckListsByMachineType', async (machineTypeId: number, { rejectWithValue }) => {
    try { const response = await engApi.get(`/CheckList/machinetype/${machineTypeId}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngCheckListsByMachineTypeAndSheetType = createAsyncThunk(
    'eng/fetchCheckListsByMachineTypeAndSheetType',
    async ({ machineTypeId, sheetType }: { machineTypeId: number, sheetType: string }, { rejectWithValue }) => {
        try { const response = await engApi.get(`/CheckList/machinetype/${machineTypeId}/sheettype/${sheetType}`); return response.data; }
        catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
    }
);
export const createEngCheckList = createAsyncThunk('eng/createCheckList', async (data: Partial<CheckList>, { rejectWithValue }) => {
    try { const response = await engApi.post('/CheckList', data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const updateEngCheckList = createAsyncThunk('eng/updateCheckList', async ({ id, data }: { id: number, data: Partial<CheckList> }, { rejectWithValue }) => {
    try { const response = await engApi.put(`/CheckList/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const deleteEngCheckList = createAsyncThunk('eng/deleteCheckList', async (id: number, { rejectWithValue }) => {
    try { await engApi.delete(`/CheckList/${id}`); return id; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});

// --- CheckListResult ---
export const fetchEngCheckListResults = createAsyncThunk('eng/fetchCheckListResults', async (_, { rejectWithValue }) => {
    try { const response = await engApi.get('/CheckListResult'); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngCheckListResultById = createAsyncThunk('eng/fetchCheckListResultById', async (id: number, { rejectWithValue }) => {
    try { const response = await engApi.get(`/CheckListResult/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngCheckListResultsBySession = createAsyncThunk('eng/fetchCheckListResultsBySession', async (sessionId: number, { rejectWithValue }) => {
    try { const response = await engApi.get(`/CheckListResult/${sessionId}/checklistresults`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const createEngCheckListResult = createAsyncThunk('eng/createCheckListResult', async (data: Partial<CheckListResult>, { rejectWithValue }) => {
    try { const response = await engApi.post('/CheckListResult', data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const updateEngCheckListResult = createAsyncThunk('eng/updateCheckListResult', async ({ id, data }: { id: number, data: Partial<CheckListResult> }, { rejectWithValue }) => {
    try { const response = await engApi.put(`/CheckListResult/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const deleteEngCheckListResult = createAsyncThunk('eng/deleteCheckListResult', async (id: number, { rejectWithValue }) => {
    try { await engApi.delete(`/CheckListResult/${id}`); return id; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
// Lưu bulk toàn bộ kết quả của 1 session (điền sheet xong bấm lưu)
export const bulkUpdateEngCheckListResults = createAsyncThunk(
    'eng/bulkUpdateCheckListResults',
    async ({ sessionId, data }: { sessionId: number, data: Partial<CheckListResult>[] }, { rejectWithValue }) => {
        try { const response = await engApi.put(`/CheckListResult/session/${sessionId}/bulk`, data); return response.data; }
        catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
    }
);
// Check nhanh toàn bộ kết quả (OK/NG) cho 1 máy trong session
export const bulkResultEngByMachine = createAsyncThunk(
    'eng/bulkResultByMachine',
    async ({ sessionId, machineId, result }: { sessionId: number, machineId: number, result: string }, { rejectWithValue }) => {
        try { const response = await engApi.patch(`/CheckListResult/session/${sessionId}/machine/${machineId}/bulk-result`, { result }); return response.data; }
        catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
    }
);
// Check nhanh toàn bộ kết quả (OK/NG) cho 1 session
export const bulkResultEngBySession = createAsyncThunk(
    'eng/bulkResultBySession',
    async ({ sessionId, result }: { sessionId: number, result: string }, { rejectWithValue }) => {
        try { const response = await engApi.patch(`/CheckListResult/session/${sessionId}/bulk-result`, { result }); return response.data; }
        catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
    }
);

// --- Image ---
export const fetchEngImagesBySession = createAsyncThunk('eng/fetchImagesBySession', async (sessionId: number, { rejectWithValue }) => {
    try { const response = await engApi.get(`/Image/session/${sessionId}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const uploadEngImage = createAsyncThunk('eng/uploadImage', async ({ checkListResultId, formData }: { checkListResultId: number, formData: FormData }, { rejectWithValue }) => {
    try { const response = await engApi.post(`/Image/upload/${checkListResultId}`, formData); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngImageByFilename = createAsyncThunk('eng/fetchImageByFilename', async (fileName: string, { rejectWithValue }) => {
    try { const response = await engApi.get(`/Image/image/${fileName}`, { responseType: 'blob' }); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const deleteEngImage = createAsyncThunk('eng/deleteImage', async (id: number, { rejectWithValue }) => {
    try { await engApi.delete(`/Image/${id}`); return id; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});

// --- Lines ---
export const fetchEngLines = createAsyncThunk('eng/fetchLines', async (_, { rejectWithValue }) => {
    try { const response = await engApi.get('/Lines'); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngLineById = createAsyncThunk('eng/fetchLineById', async (id: number, { rejectWithValue }) => {
    try { const response = await engApi.get(`/Lines/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngLinesByArea = createAsyncThunk('eng/fetchLinesByArea', async (areaPart: string, { rejectWithValue }) => {
    try { const response = await engApi.get(`/Lines/area/${areaPart}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const createEngLine = createAsyncThunk('eng/createLine', async (data: Partial<Line>, { rejectWithValue }) => {
    try { const response = await engApi.post('/Lines', data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const updateEngLine = createAsyncThunk('eng/updateLine', async ({ id, data }: { id: number, data: Partial<Line> }, { rejectWithValue }) => {
    try { const response = await engApi.put(`/Lines/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const deleteEngLine = createAsyncThunk('eng/deleteLine', async (id: number, { rejectWithValue }) => {
    try { await engApi.delete(`/Lines/${id}`); return id; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});

// --- Machines ---
export const fetchEngMachines = createAsyncThunk('eng/fetchMachines', async (_, { rejectWithValue }) => {
    try { const response = await engApi.get('/Machines'); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngMachineById = createAsyncThunk('eng/fetchMachineById', async (id: number, { rejectWithValue }) => {
    try { const response = await engApi.get(`/Machines/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const createEngMachine = createAsyncThunk('eng/createMachine', async (data: Partial<machine>, { rejectWithValue }) => {
    try { const response = await engApi.post('/Machines', data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const updateEngMachine = createAsyncThunk('eng/updateMachine', async ({ id, data }: { id: number, data: Partial<machine> }, { rejectWithValue }) => {
    try { const response = await engApi.put(`/Machines/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const deleteEngMachine = createAsyncThunk('eng/deleteMachine', async (id: number, { rejectWithValue }) => {
    try { await engApi.delete(`/Machines/${id}`); return id; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});

// --- MachineType ---
export const fetchEngMachineTypes = createAsyncThunk('eng/fetchMachineTypes', async (_, { rejectWithValue }) => {
    try { const response = await engApi.get('/MachineType'); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngMachineTypeById = createAsyncThunk('eng/fetchMachineTypeById', async (id: number, { rejectWithValue }) => {
    try { const response = await engApi.get(`/MachineType/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const createEngMachineType = createAsyncThunk('eng/createMachineType', async (data: Partial<machineType>, { rejectWithValue }) => {
    try { const response = await engApi.post('/MachineType', data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const updateEngMachineType = createAsyncThunk('eng/updateMachineType', async ({ id, data }: { id: number, data: Partial<machineType> }, { rejectWithValue }) => {
    try { const response = await engApi.put(`/MachineType/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const deleteEngMachineType = createAsyncThunk('eng/deleteMachineType', async (id: number, { rejectWithValue }) => {
    try { await engApi.delete(`/MachineType/${id}`); return id; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});

// --- StatusHistory ---
export const fetchEngStatusHistoryBySession = createAsyncThunk('eng/fetchStatusHistoryBySession', async (sessionId: number, { rejectWithValue }) => {
    try { const response = await engApi.get(`/StatusHistory/session/${sessionId}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});

// --- VehicleSheetSession ---
export const fetchEngSessions = createAsyncThunk('eng/fetchSessions', async (_, { rejectWithValue }) => {
    try { const response = await engApi.get('/VehicleSheetSession'); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngSessionById = createAsyncThunk('eng/fetchSessionById', async (id: number, { rejectWithValue }) => {
    try { const response = await engApi.get(`/VehicleSheetSession/${id}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const fetchEngSessionsBySheetType = createAsyncThunk('eng/fetchSessionsBySheetType', async (sheetType: string, { rejectWithValue }) => {
    // sheetType: "1" ngày, "7" tuần
    try { const response = await engApi.get(`/VehicleSheetSession/sheettype/${sheetType}`); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const filterEngSessions = createAsyncThunk('eng/filterSessions', async (params: vehicleSessionFilter, { rejectWithValue }) => {
    try { const response = await engApi.get('/VehicleSheetSession/filter', { params }); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const createEngSession = createAsyncThunk('eng/createSession', async (data: Partial<vehicleSession>, { rejectWithValue }) => {
    try { const response = await engApi.post('/VehicleSheetSession', data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const updateEngSession = createAsyncThunk('eng/updateSession', async ({ id, data }: { id: number, data: Partial<vehicleSession> }, { rejectWithValue }) => {
    try { const response = await engApi.put(`/VehicleSheetSession/${id}`, data); return response.data; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
export const deleteEngSession = createAsyncThunk('eng/deleteSession', async (id: number, { rejectWithValue }) => {
    try { await engApi.delete(`/VehicleSheetSession/${id}`); return id; }
    catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
});
// Đổi trạng thái: Pending -> Submitted (Engineer tự hoàn tất)
export const updateEngSessionStatus = createAsyncThunk(
    'eng/updateSessionStatus',
    async ({ id, status }: { id: number; status: string }, { rejectWithValue }) => {
        try {
            const response = await engApi.patch(
                `/VehicleSheetSession/${id}/status`,
                `"${status}"`,
                { headers: { 'Content-Type': 'application/json' } }
            );
            return response.data;
        } catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
    }
);
export const rejectEngSessionStatus = createAsyncThunk(
    'eng/rejectSessionStatus',
    async ({ id }: { id: number }, { rejectWithValue }) => {
        try { const response = await engApi.patch(`/VehicleSheetSession/${id}/status-reject`); return response.data; }
        catch (error: any) { return rejectWithValue(getErrorMessage(error)); }
    }
);

// ======================== SLICE ========================

const engSlice = createSlice({
    name: 'Eng',
    initialState,
    reducers: {
        clearEngError(state) {
            state.error = null;
        },
        clearEngSuccess(state) {
            state.success = false;
        },
        clearCurrentEngSession(state) {
            state.currentSession = null;
            state.checkListResults = [];
            state.images = [];
            state.statusHistories = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        const handlePending = (state: vehicleSessionState) => {
            state.loading = true;
            state.error = null;
            state.success = false;
        };
        const handleRejected = (state: vehicleSessionState, action: any) => {
            state.loading = false;
            state.error = action.payload as string || 'Đã xảy ra lỗi';
            state.success = false;
        };

        builder
            // --- Category ---
            .addCase(fetchEngCategories.pending, handlePending)
            .addCase(fetchEngCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload;
            })
            .addCase(fetchEngCategories.rejected, handleRejected)

            .addCase(fetchEngCategoriesBySheetType.pending, handlePending)
            .addCase(fetchEngCategoriesBySheetType.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload;
            })
            .addCase(fetchEngCategoriesBySheetType.rejected, handleRejected)

            .addCase(createEngCategory.pending, handlePending)
            .addCase(createEngCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.categories.push(action.payload);
            })
            .addCase(createEngCategory.rejected, handleRejected)

            .addCase(updateEngCategory.pending, handlePending)
            .addCase(updateEngCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.categories.findIndex(item => item.id === action.payload.id);
                if (index !== -1) state.categories[index] = action.payload;
            })
            .addCase(updateEngCategory.rejected, handleRejected)

            .addCase(deleteEngCategory.pending, handlePending)
            .addCase(deleteEngCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.categories = state.categories.filter(item => item.id !== action.payload);
            })
            .addCase(deleteEngCategory.rejected, handleRejected)

            // --- CheckList ---
            .addCase(fetchEngCheckLists.pending, handlePending)
            .addCase(fetchEngCheckLists.fulfilled, (state, action) => {
                state.loading = false;
                state.checkLists = action.payload;
            })
            .addCase(fetchEngCheckLists.rejected, handleRejected)

            .addCase(fetchEngCheckListsByMachineType.pending, handlePending)
            .addCase(fetchEngCheckListsByMachineType.fulfilled, (state, action) => {
                state.loading = false;
                state.checkLists = action.payload;
            })
            .addCase(fetchEngCheckListsByMachineType.rejected, handleRejected)

            .addCase(fetchEngCheckListsByMachineTypeAndSheetType.pending, handlePending)
            .addCase(fetchEngCheckListsByMachineTypeAndSheetType.fulfilled, (state, action) => {
                state.loading = false;
                state.checkLists = action.payload;
            })
            .addCase(fetchEngCheckListsByMachineTypeAndSheetType.rejected, handleRejected)

            .addCase(createEngCheckList.pending, handlePending)
            .addCase(createEngCheckList.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.checkLists.push(action.payload);
            })
            .addCase(createEngCheckList.rejected, handleRejected)

            .addCase(updateEngCheckList.pending, handlePending)
            .addCase(updateEngCheckList.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.checkLists.findIndex(item => item.id === action.payload.id);
                if (index !== -1) state.checkLists[index] = action.payload;
            })
            .addCase(updateEngCheckList.rejected, handleRejected)

            .addCase(deleteEngCheckList.pending, handlePending)
            .addCase(deleteEngCheckList.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.checkLists = state.checkLists.filter(item => item.id !== action.payload);
            })
            .addCase(deleteEngCheckList.rejected, handleRejected)

            // --- CheckListResult ---
            .addCase(fetchEngCheckListResults.pending, handlePending)
            .addCase(fetchEngCheckListResults.fulfilled, (state, action) => {
                state.loading = false;
                state.checkListResults = action.payload;
            })
            .addCase(fetchEngCheckListResults.rejected, handleRejected)

            .addCase(fetchEngCheckListResultsBySession.pending, handlePending)
            .addCase(fetchEngCheckListResultsBySession.fulfilled, (state, action) => {
                state.loading = false;
                state.checkListResults = action.payload;
            })
            .addCase(fetchEngCheckListResultsBySession.rejected, handleRejected)

            .addCase(createEngCheckListResult.pending, handlePending)
            .addCase(createEngCheckListResult.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.checkListResults.push(action.payload);
                if (state.currentSession && state.currentSession.id === action.payload.vehicleSheetSessionId) {
                    state.currentSession.checkListResults = [
                        ...(state.currentSession.checkListResults || []),
                        action.payload
                    ];
                }
            })
            .addCase(createEngCheckListResult.rejected, handleRejected)

            .addCase(updateEngCheckListResult.pending, handlePending)
            .addCase(updateEngCheckListResult.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.checkListResults.findIndex(item => item.id === action.payload.id);
                if (index !== -1) state.checkListResults[index] = action.payload;
                if (state.currentSession?.checkListResults) {
                    const currentIndex = state.currentSession.checkListResults.findIndex(item => item.id === action.payload.id);
                    if (currentIndex !== -1) state.currentSession.checkListResults[currentIndex] = action.payload;
                }
            })
            .addCase(updateEngCheckListResult.rejected, handleRejected)

            .addCase(deleteEngCheckListResult.pending, handlePending)
            .addCase(deleteEngCheckListResult.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.checkListResults = state.checkListResults.filter(item => item.id !== action.payload);
            })
            .addCase(deleteEngCheckListResult.rejected, handleRejected)

            .addCase(bulkUpdateEngCheckListResults.pending, handlePending)
            .addCase(bulkUpdateEngCheckListResults.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // API bulk trả về danh sách kết quả sau khi lưu
                if (Array.isArray(action.payload)) {
                    state.checkListResults = action.payload;
                }
            })
            .addCase(bulkUpdateEngCheckListResults.rejected, handleRejected)

            .addCase(bulkResultEngByMachine.pending, handlePending)
            .addCase(bulkResultEngByMachine.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Nếu API trả về danh sách kết quả của máy → merge vào store
                if (Array.isArray(action.payload)) {
                    action.payload.forEach((r: CheckListResult) => {
                        const index = state.checkListResults.findIndex(item => item.id === r.id);
                        if (index !== -1) state.checkListResults[index] = r;
                        else state.checkListResults.push(r);
                    });
                }
            })
            .addCase(bulkResultEngByMachine.rejected, handleRejected)

            .addCase(bulkResultEngBySession.pending, handlePending)
            .addCase(bulkResultEngBySession.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Nếu API trả về danh sách kết quả của session → merge vào store
                if (Array.isArray(action.payload)) {
                    action.payload.forEach((r: CheckListResult) => {
                        const index = state.checkListResults.findIndex(item => item.id === r.id);
                        if (index !== -1) state.checkListResults[index] = r;
                        else state.checkListResults.push(r);
                    });
                }
            })
            .addCase(bulkResultEngBySession.rejected, handleRejected)

            // --- Image ---
            .addCase(fetchEngImagesBySession.pending, (state) => {
                state.error = null;
            })
            .addCase(fetchEngImagesBySession.fulfilled, (state, action) => {
                state.loading = false;
                state.images = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchEngImagesBySession.rejected, handleRejected)

            .addCase(uploadEngImage.pending, (state) => {
                state.uploadLoading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(uploadEngImage.fulfilled, (state, action) => {
                state.uploadLoading = false;
                state.success = true;
                if (action.payload && action.payload.id) {
                    state.images.push(action.payload);
                }
            })
            .addCase(uploadEngImage.rejected, (state, action) => {
                state.uploadLoading = false;
                state.error = action.payload as string || 'Upload thất bại';
                state.success = false;
            })

            .addCase(deleteEngImage.pending, handlePending)
            .addCase(deleteEngImage.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.images = state.images.filter(item => item.id !== action.payload);
            })
            .addCase(deleteEngImage.rejected, handleRejected)

            // --- Lines ---
            .addCase(fetchEngLines.pending, handlePending)
            .addCase(fetchEngLines.fulfilled, (state, action) => {
                state.loading = false;
                state.lines = action.payload;
            })
            .addCase(fetchEngLines.rejected, handleRejected)

            .addCase(fetchEngLinesByArea.pending, handlePending)
            .addCase(fetchEngLinesByArea.fulfilled, (state, action) => {
                state.loading = false;
                state.lines = action.payload;
            })
            .addCase(fetchEngLinesByArea.rejected, handleRejected)

            .addCase(createEngLine.pending, handlePending)
            .addCase(createEngLine.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.lines.push(action.payload);
            })
            .addCase(createEngLine.rejected, handleRejected)

            .addCase(updateEngLine.pending, handlePending)
            .addCase(updateEngLine.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.lines.findIndex(item => item.id === action.payload.id);
                if (index !== -1) state.lines[index] = action.payload;
            })
            .addCase(updateEngLine.rejected, handleRejected)

            .addCase(deleteEngLine.pending, handlePending)
            .addCase(deleteEngLine.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.lines = state.lines.filter(item => item.id !== action.payload);
            })
            .addCase(deleteEngLine.rejected, handleRejected)

            // --- Machines ---
            .addCase(fetchEngMachines.pending, handlePending)
            .addCase(fetchEngMachines.fulfilled, (state, action) => {
                state.loading = false;
                state.machines = action.payload;
            })
            .addCase(fetchEngMachines.rejected, handleRejected)

            .addCase(createEngMachine.pending, handlePending)
            .addCase(createEngMachine.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.machines.push(action.payload);
            })
            .addCase(createEngMachine.rejected, handleRejected)

            .addCase(updateEngMachine.pending, handlePending)
            .addCase(updateEngMachine.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.machines.findIndex(item => item.id === action.payload.id);
                if (index !== -1) state.machines[index] = action.payload;
            })
            .addCase(updateEngMachine.rejected, handleRejected)

            .addCase(deleteEngMachine.pending, handlePending)
            .addCase(deleteEngMachine.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.machines = state.machines.filter(item => item.id !== action.payload);
            })
            .addCase(deleteEngMachine.rejected, handleRejected)

            // --- MachineType ---
            .addCase(fetchEngMachineTypes.pending, handlePending)
            .addCase(fetchEngMachineTypes.fulfilled, (state, action) => {
                state.loading = false;
                state.machineTypes = action.payload;
            })
            .addCase(fetchEngMachineTypes.rejected, handleRejected)

            .addCase(createEngMachineType.pending, handlePending)
            .addCase(createEngMachineType.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.machineTypes.push(action.payload);
            })
            .addCase(createEngMachineType.rejected, handleRejected)

            .addCase(updateEngMachineType.pending, handlePending)
            .addCase(updateEngMachineType.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.machineTypes.findIndex(item => item.id === action.payload.id);
                if (index !== -1) state.machineTypes[index] = action.payload;
            })
            .addCase(updateEngMachineType.rejected, handleRejected)

            .addCase(deleteEngMachineType.pending, handlePending)
            .addCase(deleteEngMachineType.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.machineTypes = state.machineTypes.filter(item => item.id !== action.payload);
            })
            .addCase(deleteEngMachineType.rejected, handleRejected)

            // --- StatusHistory ---
            .addCase(fetchEngStatusHistoryBySession.pending, handlePending)
            .addCase(fetchEngStatusHistoryBySession.fulfilled, (state, action) => {
                state.loading = false;
                state.statusHistories = action.payload;
            })
            .addCase(fetchEngStatusHistoryBySession.rejected, handleRejected)

            // --- VehicleSheetSession ---
            .addCase(fetchEngSessions.pending, handlePending)
            .addCase(fetchEngSessions.fulfilled, (state, action) => {
                state.loading = false;
                state.sessions = action.payload;
            })
            .addCase(fetchEngSessions.rejected, handleRejected)

            .addCase(fetchEngSessionsBySheetType.pending, handlePending)
            .addCase(fetchEngSessionsBySheetType.fulfilled, (state, action) => {
                state.loading = false;
                state.sessions = action.payload;
            })
            .addCase(fetchEngSessionsBySheetType.rejected, handleRejected)

            .addCase(filterEngSessions.pending, handlePending)
            .addCase(filterEngSessions.fulfilled, (state, action) => {
                state.loading = false;
                state.filteredSessionsResult = action.payload;
            })
            .addCase(filterEngSessions.rejected, handleRejected)

            .addCase(fetchEngSessionById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.currentSession = null;
            })
            .addCase(fetchEngSessionById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentSession = action.payload;
                state.checkListResults = action.payload?.checkListResults || [];
                const index = state.sessions.findIndex(item => item.id === action.payload.id);
                if (index !== -1) state.sessions[index] = action.payload;
            })
            .addCase(fetchEngSessionById.rejected, handleRejected)

            .addCase(createEngSession.pending, handlePending)
            .addCase(createEngSession.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.currentSession = action.payload;
                const exists = state.sessions.some(item => item.id === action.payload.id);
                if (!exists) state.sessions.push(action.payload);
            })
            .addCase(createEngSession.rejected, handleRejected)

            .addCase(updateEngSession.pending, handlePending)
            .addCase(updateEngSession.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.currentSession = action.payload;
                const index = state.sessions.findIndex(item => item.id === action.payload.id);
                if (index !== -1) state.sessions[index] = action.payload;
            })
            .addCase(updateEngSession.rejected, handleRejected)

            .addCase(deleteEngSession.pending, handlePending)
            .addCase(deleteEngSession.fulfilled, (state, action) => {
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
            .addCase(deleteEngSession.rejected, handleRejected)

            .addCase(updateEngSessionStatus.pending, handlePending)
            .addCase(updateEngSessionStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.currentSession = action.payload;
                const index = state.sessions.findIndex(item => item.id === action.payload.id);
                if (index !== -1) state.sessions[index] = action.payload;
            })
            .addCase(updateEngSessionStatus.rejected, handleRejected)

            .addCase(rejectEngSessionStatus.pending, handlePending)
            .addCase(rejectEngSessionStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.currentSession = action.payload;
                const index = state.sessions.findIndex(item => item.id === action.payload.id);
                if (index !== -1) state.sessions[index] = action.payload;
            })
            .addCase(rejectEngSessionStatus.rejected, handleRejected);
    }
});

export const { clearEngError, clearEngSuccess, clearCurrentEngSession } = engSlice.actions;

export default engSlice.reducer;

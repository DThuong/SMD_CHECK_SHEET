import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import smdApi from "../services/smdApi";

export interface Plan {
    id: number
    workOrder: string
    setToWork: string
    status: string
    quantity: number
}

export interface PlanByDate {
    total: number
    created: number
    items: Plan[]
}

export interface PlanWorkState {
    plans: Plan[]
    planByDate: PlanByDate | null
    loading: boolean
    error: string | null
}

const initialState: PlanWorkState = {
    plans: [],
    planByDate: null,
    loading: false,
    error: null
}

// ============ THUNKS ============

export const getAllPlan = createAsyncThunk(
    'PlanWork/all',
    async (_, { rejectWithValue }) => {
        try {
            const res = await smdApi.get('/PlanWork/all')
            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const uploadPlan = createAsyncThunk(
    'PlanWork/upload-files',
    async ({ file }: { file: File }, { rejectWithValue }) => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await smdApi.post('/PlanWork/upload-files', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const getPlanWorkByDate = createAsyncThunk(
    'PlanWork/bydate',
    async ({ date }: { date: Date }, { rejectWithValue }) => {
        try {
            const formatDate = date.toISOString().split('T')[0]
            const res = await smdApi.get(`/PlanWork/bydate?date=${formatDate}`)
            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const putPlanWorkStatus = createAsyncThunk(
    'PlanWork/status',
    async ({ workOrder }: { workOrder: string }, { rejectWithValue }) => {
        try {
            const res = await smdApi.put(`/PlanWork/${workOrder}/status`)
            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const deletePlanWorkById = createAsyncThunk(
    'PlanWork/delete/id',
    async ({ id }: { id: number }, { rejectWithValue }) => {
        try {
            const res = await smdApi.delete(`/PlanWork/${id}`)
            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const deletePlanWorkByDate = createAsyncThunk(
    'PlanWork/delete/date',
    async ({ date }: { date: Date }, { rejectWithValue }) => {
        try {
            const formatDate = date.toISOString().split('T')[0]
            const res = await smdApi.delete(`/PlanWork/date/${formatDate}`)
            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

// ============ HELPERS ============

// Dùng lại cho pending/rejected thay vì lặp code
const handlePending = (state: PlanWorkState) => {
    state.loading = true
    state.error = null
}

const handleRejected = (state: PlanWorkState, action: PayloadAction<unknown>) => {
    state.loading = false
    state.error = action.payload as string ?? 'Đã xảy ra lỗi'
}

// ============ SLICE ============

const planWorkSlice = createSlice({
    name: 'PlanWork',
    initialState,
    reducers: {
        // Dùng khi cần reset state (vd: khi unmount trang)
        resetPlanByDate(state) {
            state.planByDate = null
        },
        clearError(state) {
            state.error = null
        }
    },
    extraReducers: (builder) => {
        // getAllPlan
        builder
            .addCase(getAllPlan.pending, handlePending)
            .addCase(getAllPlan.fulfilled, (state, action) => {
                state.loading = false
                state.plans = action.payload
            })
            .addCase(getAllPlan.rejected, handleRejected)

        // uploadPlan — sau khi upload xong thì fetch lại data mới
        // nên dùng dispatch(getAllPlan()) ở component thay vì cập nhật state thủ công
        builder
            .addCase(uploadPlan.pending, handlePending)
            .addCase(uploadPlan.fulfilled, (state) => {
                state.loading = false
                // không cần cập nhật plans ở đây
                // gọi lại getAllPlan hoặc getPlanWorkByDate ở component sau khi fulfilled
            })
            .addCase(uploadPlan.rejected, handleRejected)

        // getPlanWorkByDate
        builder
            .addCase(getPlanWorkByDate.pending, handlePending)
            .addCase(getPlanWorkByDate.fulfilled, (state, action) => {
                state.loading = false
                state.planByDate = action.payload
            })
            .addCase(getPlanWorkByDate.rejected, handleRejected)

        // putPlanWorkStatus — cập nhật status của item trong danh sách
        builder
            .addCase(putPlanWorkStatus.pending, handlePending)
            .addCase(putPlanWorkStatus.fulfilled, (state, action: PayloadAction<Plan>) => {
                state.loading = false
                // cập nhật trực tiếp item trong plans (optimistic-style)
                const index = state.plans.findIndex(p => p.workOrder === action.payload.workOrder)
                if (index !== -1) state.plans[index] = action.payload

                // cập nhật luôn trong planByDate nếu đang có
                if (state.planByDate) {
                    const i = state.planByDate.items.findIndex(p => p.workOrder === action.payload.workOrder)
                    if (i !== -1) state.planByDate.items[i] = action.payload
                }
            })
            .addCase(putPlanWorkStatus.rejected, handleRejected)

        // deletePlanWorkById
        builder
            .addCase(deletePlanWorkById.pending, handlePending)
            .addCase(deletePlanWorkById.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false
                state.plans = state.plans.filter(p => p.id !== action.payload)
                if (state.planByDate) {
                    state.planByDate.items = state.planByDate.items.filter(p => p.id !== action.payload)
                    state.planByDate.total = state.planByDate.items.length
                }
            })
            .addCase(deletePlanWorkById.rejected, handleRejected)

        // deletePlanWorkByDate — xóa hết → reset planByDate
        builder
            .addCase(deletePlanWorkByDate.pending, handlePending)
            .addCase(deletePlanWorkByDate.fulfilled, (state) => {
                state.loading = false
                state.planByDate = null
            })
            .addCase(deletePlanWorkByDate.rejected, handleRejected)
    }
})

export const { resetPlanByDate, clearError } = planWorkSlice.actions
export default planWorkSlice.reducer
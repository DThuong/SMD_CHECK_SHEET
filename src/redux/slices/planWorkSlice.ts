import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import smdApi from "../services/smdApi";

export interface Plan {
    id: number
    workOrder: string
    setToWork: string
    status: string
    quantity: number
    oper: string
    sCode: string
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
    /** Cờ RIÊNG cho upload — xem ghi chú ở reducer uploadPlan.pending. */
    uploading: boolean
    /** % byte đã đẩy lên server (0-100). 100 mà vẫn chờ = server đang xử lý file. */
    uploadProgress: number
    error: string | null
}

const initialState: PlanWorkState = {
    plans: [],
    planByDate: null,
    loading: false,
    uploading: false,
    uploadProgress: 0,
    error: null
}

/**
 * Rút message đọc được từ lỗi Axios.
 *
 * TRƯỚC ĐÂY mọi thunk ở file này gọi rejectWithValue(error) với NGUYÊN object lỗi
 * Axios. Object đó chứa `config` (kèm luôn FormData và File vừa upload), `request`
 * (XMLHttpRequest) và `response` — không serialize được, lại còn nằm luôn trong
 * Redux state qua `state.error`. Hệ quả:
 *   - serializableCheck / immutableCheck của RTK (bật ở môi trường dev) phải duyệt
 *     đống đó ở MỌI dispatch sau đó -> cả app chậm dần sau một lần lỗi.
 *   - `state.error` không phải string nên không hiển thị được lỗi thật cho người dùng.
 */
const getErrorMessage = (error: unknown): string => {
    const err = error as {
        code?: string
        message?: string
        response?: { data?: unknown; status?: number }
    }
    if (err?.code === 'ECONNABORTED') {
        return 'Quá thời gian chờ — server xử lý file quá lâu hoặc mạng nhà máy đang nghẽn.'
    }
    const data = err?.response?.data
    if (typeof data === 'string' && data.trim()) return data
    if (data && typeof data === 'object') {
        const d = data as { message?: string; detail?: string; title?: string }
        const msg = d.message || d.detail || d.title
        if (msg) return msg
    }
    return err?.message || 'Đã xảy ra lỗi'
}

// ============ THUNKS ============

export const getAllPlan = createAsyncThunk(
    'PlanWork/all',
    async (_, { rejectWithValue }) => {
        try {
            const res = await smdApi.get('/PlanWork/all')
            return res.data
        } catch (error) {
            return rejectWithValue(getErrorMessage(error))
        }
    }
)

/** Chờ tối đa 3 phút cho một lần import kế hoạch. */
const UPLOAD_TIMEOUT_MS = 180_000

export const uploadPlan = createAsyncThunk(
    'PlanWork/upload-files',
    async ({ file }: { file: File }, { rejectWithValue, dispatch }) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await smdApi.post('/PlanWork/upload-files', formData, {
                // KHÔNG tự đặt 'Content-Type': 'multipart/form-data'.
                // Đặt tay là thiếu boundary; phải để trình duyệt tự sinh header.
                // (Request interceptor của smdApi cũng đã xoá Content-Type mặc định
                // khi data là FormData, nhưng dựa vào đó thì mong manh.)

                // smdApi không cấu hình timeout -> axios mặc định là 0 = chờ VÔ HẠN.
                // Request treo là spinner quay mãi, không báo lỗi, người dùng không
                // biết nên chờ tiếp hay thử lại.
                timeout: UPLOAD_TIMEOUT_MS,

                // Báo tiến độ để phân biệt "đang đẩy file lên" với "server đang xử lý".
                // Chạm 100% mà vẫn chờ nghĩa là file đã lên xong, phần chậm nằm ở
                // backend đọc Excel + ghi DB — không phải lỗi mạng.
                onUploadProgress: (e) => {
                    if (!e.total) return
                    dispatch(setUploadProgress(Math.round((e.loaded * 100) / e.total)))
                },
            })
            return res.data
        } catch (error) {
            return rejectWithValue(getErrorMessage(error))
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
            return rejectWithValue(getErrorMessage(error))
        }
    }
)

export const closePlanWorkByDate = createAsyncThunk(
    'PlanWork/close-alldate',
    async (_, { rejectWithValue }) => {
        try {
            const res = await smdApi.put("/PlanWork/close-alldate/")
            return res.data
        } catch (error) {
            return rejectWithValue(getErrorMessage(error))
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
            return rejectWithValue(getErrorMessage(error))
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
            return rejectWithValue(getErrorMessage(error))
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
        },
        setUploadProgress(state, action: PayloadAction<number>) {
            state.uploadProgress = action.payload
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
        // Upload dùng cờ RIÊNG `uploading`, KHÔNG dùng chung `loading`.
        //
        // TRƯỚC ĐÂY uploadPlan.pending cũng chạy handlePending -> loading = true, mà
        // `loading` đang điều khiển cả khối bảng dữ liệu (`{loading ? <LoadingSpinner/>`)
        // lẫn nút Làm mới và Đóng WorkOrder. Nên chỉ cần bấm Import là toàn bộ bảng
        // biến thành vòng xoay và cả thanh công cụ bị khoá suốt thời gian upload —
        // đúng cái "quay loading rất lâu" mà người dùng nhìn thấy, dù dữ liệu cũ vẫn
        // còn nguyên và hoàn toàn hiển thị được.
        builder
            .addCase(uploadPlan.pending, (state) => {
                state.uploading = true
                state.uploadProgress = 0
                state.error = null
            })
            .addCase(uploadPlan.fulfilled, (state) => {
                state.uploading = false
                state.uploadProgress = 0
                // không cần cập nhật plans ở đây
                // gọi lại getAllPlan hoặc getPlanWorkByDate ở component sau khi fulfilled
            })
            .addCase(uploadPlan.rejected, (state, action) => {
                state.uploading = false
                state.uploadProgress = 0
                state.error = (action.payload as string) ?? 'Đã xảy ra lỗi'
            })

        // getPlanWorkByDate
        builder
            .addCase(getPlanWorkByDate.pending, handlePending)
            .addCase(getPlanWorkByDate.fulfilled, (state, action) => {
                state.loading = false
                state.planByDate = action.payload
            })
            .addCase(getPlanWorkByDate.rejected, handleRejected)

        // closePlanWorkByDate
        builder
            .addCase(closePlanWorkByDate.pending, handlePending)
            .addCase(closePlanWorkByDate.fulfilled, (state) => {
                state.loading = false
                // Sau khi đóng ngày, có thể fetch lại data để thấy status thay đổi
            })
            .addCase(closePlanWorkByDate.rejected, handleRejected)

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

export const { resetPlanByDate, clearError, setUploadProgress } = planWorkSlice.actions
export default planWorkSlice.reducer
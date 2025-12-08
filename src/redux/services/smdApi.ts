import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * RTK QUERY API - Tự động handle API calls
 * 
 * Ưu điểm RTK Query:
 * Tự động cache data
 * Tự động refetch khi cần
 * Loading states tự động
 * Error handling
 * TypeScript support tốt
 */

// ===================================
// 📝 TYPES - Định nghĩa kiểu dữ liệu
// ===================================

export interface SmdLog {
  id: string;
  submittedBy: string;
  submittedByRole: string;
  submittedAt: string;
  confirmed: boolean;
  confirmedBy?: string;
  confirmedByRole?: string;
  confirmedAt?: string;
  confirmations?: {
    ENG?: ConfirmationStep;
    SUPERVISOR?: ConfirmationStep;
    MANAGER?: ConfirmationStep;
    MANAGER_KOREA?: ConfirmationStep;
  };
  data: any;
}

export interface ConfirmationStep {
  role: string;
  confirmedBy: string;
  confirmedAt: string;
}

export interface CreateSmdRequest {
  submittedBy: string;
  submittedByRole: string;
  data: any;
}

export interface ConfirmSmdRequest {
  logId: string;
  role: 'ENG' | 'SUPERVISOR' | 'MANAGER' | 'MANAGER_KOREA';
  confirmedBy: string;
}

// ===================================
// 🔧 API CONFIGURATION
// ===================================

export const smdApi = createApi({
  reducerPath: 'smdApi',  // Tên của reducer trong store
  
  // ✅ Base URL của backend API
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:3000/api',  // 👈 Thay đổi URL backend của bạn
    
    // ✅ Tự động gửi credentials (cookies, auth headers...)
    credentials: 'include',
    
    // ✅ Thêm headers mặc định
    prepareHeaders: (headers) => {
      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  
  // ✅ Tags để quản lý cache invalidation
  tagTypes: ['SmdLogs', 'SmdLog'],
  
  // ===================================
  // 📡 ENDPOINTS - Các API calls
  // ===================================
  endpoints: (builder) => ({
    
    // 📋 GET ALL LOGS
    getAllLogs: builder.query<SmdLog[], void>({
      query: () => '/smd-logs',
      // ✅ Provide tags để cache
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'SmdLogs' as const, id })),
              { type: 'SmdLogs', id: 'LIST' },
            ]
          : [{ type: 'SmdLogs', id: 'LIST' }],
    }),
    
    // 🔍 GET LOG BY ID
    getLogById: builder.query<SmdLog, string>({
      query: (id) => `/smd-logs/${id}`,
      providesTags: (result, error, id) => [{ type: 'SmdLog', id }],
    }),
    
    // ➕ CREATE NEW LOG
    createLog: builder.mutation<SmdLog, CreateSmdRequest>({
      query: (body) => ({
        url: '/smd-logs',
        method: 'POST',
        body,
      }),
      // ✅ Invalidate cache để refetch data
      invalidatesTags: [{ type: 'SmdLogs', id: 'LIST' }],
    }),
    
    // ✅ CONFIRM LOG
    confirmLog: builder.mutation<SmdLog, ConfirmSmdRequest>({
      query: ({ logId, ...body }) => ({
        url: `/smd-logs/${logId}/confirm`,
        method: 'PUT',
        body,
      }),
      // ✅ Invalidate cache của log cụ thể
      invalidatesTags: (result, error, { logId }) => [
        { type: 'SmdLog', id: logId },
        { type: 'SmdLogs', id: 'LIST' },
      ],
    }),
    
    // ✏️ UPDATE LOG
    updateLog: builder.mutation<SmdLog, { id: string; data: Partial<SmdLog> }>({
      query: ({ id, data }) => ({
        url: `/smd-logs/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SmdLog', id },
        { type: 'SmdLogs', id: 'LIST' },
      ],
    }),
    
    // 🗑️ DELETE LOG
    deleteLog: builder.mutation<void, string>({
      query: (id) => ({
        url: `/smd-logs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'SmdLogs', id: 'LIST' }],
    }),
    
    // 📊 GET LOGS WITH FILTERS
    getLogsWithFilters: builder.query<SmdLog[], {
      date?: string;
      submittedBy?: string;
      status?: 'confirmed' | 'pending' | 'all';
    }>({
      query: (params) => ({
        url: '/smd-logs/filter',
        params,
      }),
      providesTags: [{ type: 'SmdLogs', id: 'FILTERED' }],
    }),
  }),
});

// ===================================
// 🪝 EXPORT HOOKS - Sử dụng trong components
// ===================================

// ✅ RTK Query tự động generate hooks cho mỗi endpoint
export const {
  useGetAllLogsQuery,           // GET all logs
  useGetLogByIdQuery,           // GET log by ID
  useCreateLogMutation,         // POST create log
  useConfirmLogMutation,        // PUT confirm log
  useUpdateLogMutation,         // PATCH update log
  useDeleteLogMutation,         // DELETE log
  useGetLogsWithFiltersQuery,   // GET filtered logs
} = smdApi;
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import smdApi from '../services/smdApi'; // Chỉ import smdApi

// ==================== TYPES ====================

// CheckModel
export interface CheckModelData {
    id?: number,
    lineChange?: string,
    model?: string,
    fCode?: string,
    pcBver?: string,
    workOrder?: string,
    usedCNcard?: boolean,
    revS15?: string,
    revMounter?: string,
    qty?: string,
    feederCheck?: string,
    opAccept?: string,
    jig?: boolean,
    codePCB?: string,
    note?: string, // thêm
    imgIssue?: string[]; // thêm
}

// StandardProduction
export interface StandardProductionData {
  id?: number;
  numMASK?: string;
  numMES?: string;
  numScanPrinter?: string;
  numScanSignMES?: string;
  mlS3Closed?: string;
  useOnly?: string;
  labelProgram?: string;
  imgStandard?: string[];
  note?: string; // thêm
  imgIssue?: string[]; // thêm
}

// TimeChangeModel
export interface TimeChangeModelData {
  qc?: string;
  result?: string;
  startTime?: string;
  endTime?: string;
  countTime?: number;
  history?: string;
  id?: number;
  note?: string; // thêm
  imgIssue?: string[] // thêm
}

// StandardVehicle
export interface StandardVehicleData {
  printerSpecGTAL?: string;
  printerSpecTDQ?: string;
  printerSpecTDKC?: string;
  printerSpecSLL?: string;
  printerSpecDSL?: string;

  printerRealGTAL?: string;
  printerRealTDQ?: string;
  printerRealTDKC?: string;
  printerRealSLL?: string;
  printerRealDSL?: string;

  printerQ1?: boolean;
  spiQ1?: boolean;
  mountQ1?: boolean;
  mountQ2?: boolean;

  reflowQ1?: boolean;
  reFlowSettingRail?: string;
  reFlowRealRail?: string;

  aoiQ1?: boolean;
  aoiCheck?: string;

  outputQ1?: boolean;
  outputModelValue?: string;
  outputPitchValue?: string;
  outputChecker?: string;

  nameOP?: string;
  nameAOI?: string;

  printerProgram?: string;
  spiProgram?: string;
  mounterProgram?: string;
  pointMounter?: string;
  maoiProgram?: string;
  saoiProgram?: string;
  pointSAOI?: string;
  reflowProgram?: string;
  reflowSpeed?: string;
  rev?: string;

  imgSPI?: string[];
  imgAOI?: string[];

  id?: number;

  note?: string; // thêm
  imgIssue?: string[]; // thêm
  imgMounter?: string[]; // thêm
  imgPrinter?: string[]; // thêm
  imgPrinterClean?: string[]; // thêm
  imgXray?: string[]; // thêm
}

// PQCCheck
export interface PQCCheckData {
  id?: number;
  icPlan?: string;
  checksumReal?: string;
  checksumConfirm?: string;
  turner?: string;
  startLCR?: string;
  endLCR?: string;
  nameCheck?: string;
  resultLCR?: boolean;
  imgIC?: string[];
  note?: string; // thêm
  imgIssue?: string[]; // thêm
}

// ==================== STATE ====================
interface subTableState {
    loading: boolean;
    error: string | null;
    success: boolean;
    lastUpdatedTable: string | null;
    completedTables: string[];

    // data của từng bảng con
    checkModel: CheckModelData | null;
    standardProduction: StandardProductionData | null;
    timeChangeModel: TimeChangeModelData | null;
    standardVehicle: StandardVehicleData | null;
    pqcCheck: PQCCheckData | null;
}

const initialState: subTableState = {
  loading: false,
  error: null,
  success: false,
  lastUpdatedTable: null,
  completedTables: [],
  
  // Initialize data
  checkModel: null,
  standardProduction: null,
  timeChangeModel: null,
  standardVehicle: null,
  pqcCheck: null,
};

// ==================== ASYNC THUNKS ====================

// ==================== PUT (UPDATE) APIs ====================

// CheckModel
export const updateCheckModel = createAsyncThunk(
  'subTable/updateCheckModel',
  async ({ id, data }: { id: number; data: CheckModelData }, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`CheckModel/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật CheckModel');
    }
  }
);


// StandardProduction
export const updateStandardProduction = createAsyncThunk(
  'subTable/updateStandardProduction',
  async ({ id, data }: { id: number; data: StandardProductionData }, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`StandardProduction/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật StandardProduction');
    }
  }
);

// TimeChangeModel
export const updateTimeChangeModel = createAsyncThunk(
  'subTable/updateTimeChangeModel',
  async ({ id, data }: { id: number; data: TimeChangeModelData }, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`TimeChangeModel/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật TimeChangeModel');
    }
  }
);

// StandardVehicle
export const updateStandardVehicle = createAsyncThunk(
  'subTable/updateStandardVehicle',
  async ({ id, data }: { id: number; data: StandardVehicleData }, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`StandardVehicle/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật StandardVehicle');
    }
  }
);

// PQCCheck
export const updatePQCCheck = createAsyncThunk(
  'subTable/updatePQCCheck',
  async ({ id, data }: { id: number; data: PQCCheckData }, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`PQCCheck/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật PQCCheck');
    }
  }
);

// ==================== GET (FETCH) APIs ====================

// ✅ CheckModel
export const fetchCheckModel = createAsyncThunk(
  'subTable/fetchCheckModel',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`CheckModel/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải CheckModel');
    }
  }
);

// StandardProduction
export const fetchStandardProduction = createAsyncThunk(
  'subTable/fetchStandardProduction',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`StandardProduction/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardProduction');
    }
  }
);

// StandardVehicle
export const fetchStandardVehicle = createAsyncThunk(
  'subTable/fetchStandardVehicle',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`StandardVehicle/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardVehicle');
    }
  }
);

// PQCCheck
export const fetchPQCCheck = createAsyncThunk(
  'subTable/fetchPQCCheck',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`PQCCheck/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải PQCCheck');
    }
  }
);

// TimeChangeModel
export const fetchTimeChangeModel = createAsyncThunk(
  'subTable/fetchTimeChangeModel',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`TimeChangeModel/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải TimeChangeModel');
    }
  }
);

// ----------------------------------UPLOAD IMAGE ----------------------------------------
// upload standard product image
export const uploadStandardProductionImage = createAsyncThunk(
  'subTable/uploadStandardProductionImage',
  async ({ standardProductionId, file }: { standardProductionId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardProduction/image/${standardProductionId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardProduction');
    }
  }
);

// upload spi image
export const uploadSPIImage = createAsyncThunk(
  'subTable/uploadSPIImage',
  async ({ id, file }: { id: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardVehicle/image-spi/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardVehicle');
    }
  }
);

// upload aoi image
export const uploadAOIImage = createAsyncThunk(
  'subTable/uploadAOIImage',
  async ({ id, file }: { id: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardVehicle/image-aoi/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardVehicle');
    }
  }
);

// upload pqc image
export const uploadPQCCheckImage = createAsyncThunk(
  'subTable/uploadPQCCheckImage',
  async ({ pqcCheckId, file }: { pqcCheckId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`PQCCheck/image/${pqcCheckId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải PQCCheck');
    }
  }
)

// Upload check model issue image
export const uploadCheckModelIssueImage = createAsyncThunk(
  'subTable/uploadCheckModelIssueImage',
  async ({ checkModelId, file }: { checkModelId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`CheckModel/image-issue/${checkModelId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải CheckModelIssue');
    }
  }
)

// Upload StandardProduction issue image
export const uploadStandardProductionIssueImage = createAsyncThunk(
  'subTable/uploadProductionIssueImage',
  async ({ StandardProductionId, file }: { StandardProductionId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardProduction/image-issue/${StandardProductionId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải ProductionIssue');
    }
  }
)

// Upload StandardVehicle issue image
export const uploadStandardVehicleIssueImage = createAsyncThunk(
  'subTable/uploadVehicleIssueImage',
  async ({ StandardVehicleId, file }: { StandardVehicleId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardVehicle/image-issue/${StandardVehicleId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải VehicleIssue');
    }
  }
)

// Upload StandardVehicle mounter image
export const uploadMounterImage = createAsyncThunk(
  'subTable/uploadVehicleMounterImage',
  async ({ StandardVehicleId, file }: { StandardVehicleId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardVehicle/image-mounter/${StandardVehicleId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải Mounter');
    }
  }
)

// Upload StandardVehicle printer image
export const uploadPrinterImage = createAsyncThunk(
  'subTable/uploadVehiclePrinterImage',
  async ({ StandardVehicleId, file }: { StandardVehicleId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardVehicle/image-printer/${StandardVehicleId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải Printer');
    }
  }
)

// Upload StandardVehicle printer clean image
export const uploadPrinterCleanImage = createAsyncThunk(
  'subTable/uploadVehiclePrinterCleanImage',
  async ({ StandardVehicleId, file }: { StandardVehicleId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardVehicle/image-printer-clean/${StandardVehicleId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải PrinterClean');
    }
  }
)

// Upload timeChangeModel issue image
export const uploadTimeChangeModelIssueImage = createAsyncThunk(
  'subTable/uploadTimeChangeModelIssueImage',
  async ({ timeChangeModelId, file }: { timeChangeModelId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`TimeChangeModel/image-issue/${timeChangeModelId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải TimeChangeModelIssue');
    }
  }
)

// Upload pqcCheck issue image
export const uploadPQCCheckIssueImage = createAsyncThunk(
  'subTable/uploadPQCCheckIssueImage',
  async ({ pqcCheckId, file }: { pqcCheckId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`PQCCheck/image-issue/${pqcCheckId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải PQCCheckIssue');
    }
  }
)

// Upload image-xray StandardVehicle
export const uploadXRayImage = createAsyncThunk(
  'subTable/uploadXRayImage',
  async ({ StandardVehicleId, file }: { StandardVehicleId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardVehicle/image-xray/${StandardVehicleId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải XRay');
    }
  }
)
// ==================== SLICE ====================

const subTableSlice = createSlice({
  name: 'subTable',
  initialState,
  reducers: {
    clearSubTableError: (state) => {
      state.error = null;
    },
    clearSubTableSuccess: (state) => {
      state.success = false;
      state.lastUpdatedTable = null;
    },
    resetCompletedTables: (state) => {
      state.completedTables = [];
    },
    // Clear all data
    clearAllSubTableData: (state) => {
      state.completedTables = [];
      state.checkModel = null;
      state.standardProduction = null;
      state.timeChangeModel = null;
      state.standardVehicle = null;
      state.pqcCheck = null;
      state.error = null;
      state.success = false;
      state.lastUpdatedTable = null;
    },

    // Set actions
    setCheckModel: (state, action) => {
      state.checkModel = action.payload;
    },
    setPQCCheck: (state, action) => {
      state.pqcCheck = action.payload;
    },
    setStandardProduction: (state, action) => {
      state.standardProduction = action.payload;
    },
    setTimeChangeModel: (state, action) => {
      state.timeChangeModel = action.payload;
    },
    setStandardVehicle: (state, action) => {
      state.standardVehicle = action.payload;
    },
    addCompletedTable: (state, action) => {
      const tableName = action.payload;
      if (!state.completedTables.includes(tableName)) {
        console.log(`✅ Adding '${tableName}' to completedTables`);
        state.completedTables.push(tableName);
      } else {
        console.log(`ℹ️ '${tableName}' already in completedTables`);
      }
    },
    // THÊM ACTION MỚI: removeCompletedTable
    removeCompletedTable: (state, action) => {
      const tableName = action.payload;
      const index = state.completedTables.indexOf(tableName);
      if (index > -1) {
        console.log(`❌ Removing '${tableName}' from completedTables`);
        state.completedTables = state.completedTables.filter(t => t !== tableName);
      } else {
        console.log(`ℹ️ '${tableName}' not found in completedTables`);
      }
    },
  },
  extraReducers: (builder) => {
    // ==================== FETCH DATA ====================
    
    // CheckModel
    builder
      .addCase(fetchCheckModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCheckModel.fulfilled, (state, action) => {
        state.loading = false;
        state.checkModel = action.payload;
        state.error = null;
      })
      .addCase(fetchCheckModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // StandardProduction
    builder
      .addCase(fetchStandardProduction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStandardProduction.fulfilled, (state, action) => {
        state.loading = false;
        state.standardProduction = action.payload;
        state.error = null;
      })
      .addCase(fetchStandardProduction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // StandardVehicle
    builder
      .addCase(fetchStandardVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStandardVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.standardVehicle = action.payload;
        state.error = null;
      })
      .addCase(fetchStandardVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // PQCCheck
    builder
      .addCase(fetchPQCCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPQCCheck.fulfilled, (state, action) => {
        state.loading = false;
        state.pqcCheck = action.payload;
        state.error = null;
      })
      .addCase(fetchPQCCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // TimeChangeModel
    builder
      .addCase(fetchTimeChangeModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimeChangeModel.fulfilled, (state, action) => {
        state.loading = false;
        state.timeChangeModel = action.payload;
        state.error = null;
      })
      .addCase(fetchTimeChangeModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ==================== UPDATE DATA ====================
    
    // CheckModel
    builder
      .addCase(updateCheckModel.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateCheckModel.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedTable = 'CheckModel';
        if (!state.completedTables.includes('CheckModel')) {
          state.completedTables.push('CheckModel');
        }
        state.error = null;
      })
      .addCase(updateCheckModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // StandardProduction
    builder
      .addCase(updateStandardProduction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateStandardProduction.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedTable = 'StandardProduction';
        if (!state.completedTables.includes('StandardProduction')) {
          state.completedTables.push('StandardProduction');
        }
        state.error = null;
      })
      .addCase(updateStandardProduction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // TimeChangeModel
    builder
      .addCase(updateTimeChangeModel.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateTimeChangeModel.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedTable = 'TimeChangeModel';
        if (!state.completedTables.includes('TimeChangeModel')) {
          state.completedTables.push('TimeChangeModel');
        }
        state.error = null;
      })
      .addCase(updateTimeChangeModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // StandardVehicle
    builder
      .addCase(updateStandardVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateStandardVehicle.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedTable = 'StandardVehicle';
        if (!state.completedTables.includes('StandardVehicle')) {
          state.completedTables.push('StandardVehicle');
        }
        state.error = null;
      })
      .addCase(updateStandardVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // PQCCheck
    builder
      .addCase(updatePQCCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updatePQCCheck.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedTable = 'PQCCheck';
        if (!state.completedTables.includes('PQCCheck')) {
          state.completedTables.push('PQCCheck');
        }
        state.error = null;
      })
      .addCase(updatePQCCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
    // ----------------------------------- UPLOAD IMAGE -----------------------------------
    // Upload check model issue image
    builder
      .addCase(uploadCheckModelIssueImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadCheckModelIssueImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.checkModel && action.payload?.imageUrl) {
          if (!Array.isArray(state.checkModel.imgIssue)) {
            state.checkModel.imgIssue = [];
          }
          if (!state.checkModel.imgIssue.includes(action.payload.imageUrl)) {
            state.checkModel.imgIssue.push(action.payload.imageUrl);
          }
        }
      })
      .addCase(uploadCheckModelIssueImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    // Upload StandardProduction issue image
    builder
      .addCase(uploadStandardProductionIssueImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadStandardProductionIssueImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardProduction && action.payload?.imageUrl) {
          if (!Array.isArray(state.standardProduction.imgIssue)) {
            state.standardProduction.imgIssue = [];
          }
          if (!state.standardProduction.imgIssue.includes(action.payload.imageUrl)) {
            state.standardProduction.imgIssue.push(action.payload.imageUrl);
          }
        }
      })
      .addCase(uploadStandardProductionIssueImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    // Upload StandardVehicle issue image
    builder
      .addCase(uploadStandardVehicleIssueImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadStandardVehicleIssueImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && action.payload?.imageUrl) {
          if (!Array.isArray(state.standardVehicle.imgIssue)) {
            state.standardVehicle.imgIssue = [];
          }
          if (!state.standardVehicle.imgIssue.includes(action.payload.imageUrl)) {
            state.standardVehicle.imgIssue.push(action.payload.imageUrl);
          }
        }
      })
      .addCase(uploadStandardVehicleIssueImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
    })

    // Upload StandardVehicle printer image
    builder
      .addCase(uploadPrinterImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadPrinterImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && action.payload?.imageUrl) {
          if (!Array.isArray(state.standardVehicle.imgPrinter)) {
            state.standardVehicle.imgPrinter = [];
          }
          if (!state.standardVehicle.imgPrinter.includes(action.payload.imageUrl)) {
            state.standardVehicle.imgPrinter.push(action.payload.imageUrl);
          }
        }
      })
      .addCase(uploadPrinterImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
    })

    // Upload StandardVehicle mounter image
    builder
      .addCase(uploadMounterImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadMounterImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && action.payload?.imageUrl) {
          if (!Array.isArray(state.standardVehicle.imgMounter)) {
            state.standardVehicle.imgMounter = [];
          }
          if (!state.standardVehicle.imgMounter.includes(action.payload.imageUrl)) {
            state.standardVehicle.imgMounter.push(action.payload.imageUrl);
          }
        }
      })
      .addCase(uploadMounterImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
    })

    // Upload StandardVehicle printer clean image
    builder
      .addCase(uploadPrinterCleanImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadPrinterCleanImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && action.payload?.imageUrl) {
          if (!Array.isArray(state.standardVehicle.imgPrinterClean)) {
            state.standardVehicle.imgPrinterClean = [];
          }
          if (!state.standardVehicle.imgPrinterClean.includes(action.payload.imageUrl)) {
            state.standardVehicle.imgPrinterClean.push(action.payload.imageUrl);
          }
        }
      })
      .addCase(uploadPrinterCleanImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
    })

    // Upload timeChangeModel issue image
    builder
      .addCase(uploadTimeChangeModelIssueImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadTimeChangeModelIssueImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.timeChangeModel && action.payload?.imageUrl) {
          if (!Array.isArray(state.timeChangeModel.imgIssue)) {
            state.timeChangeModel.imgIssue = [];
          }
          if (!state.timeChangeModel.imgIssue.includes(action.payload.imageUrl)) {
            state.timeChangeModel.imgIssue.push(action.payload.imageUrl);
          }
        }
      })
      .addCase(uploadTimeChangeModelIssueImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
    })

    // Upload pqcCheck issue image
    builder
      .addCase(uploadPQCCheckIssueImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadPQCCheckIssueImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.pqcCheck && action.payload?.imageUrl) {
          if (!Array.isArray(state.pqcCheck.imgIssue)) {
            state.pqcCheck.imgIssue = [];
          }
          if (!state.pqcCheck.imgIssue.includes(action.payload.imageUrl)) {
            state.pqcCheck.imgIssue.push(action.payload.imageUrl);
          }
        }
      })
      .addCase(uploadPQCCheckIssueImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
    })
    
    // Upload SPI Image
    builder
      .addCase(uploadSPIImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadSPIImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && action.payload?.imageUrl) {
          if (!Array.isArray(state.standardVehicle.imgSPI)) {
            state.standardVehicle.imgSPI = [];
          }
          if (!state.standardVehicle.imgSPI.includes(action.payload.imageUrl)) {
            state.standardVehicle.imgSPI.push(action.payload.imageUrl);
          }
        }
      })
      .addCase(uploadSPIImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Upload AOI Image
    builder
      .addCase(uploadAOIImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadAOIImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && action.payload?.imageUrl) {
          if (!Array.isArray(state.standardVehicle.imgAOI)) {
            state.standardVehicle.imgAOI = [];
          }
          if (!state.standardVehicle.imgAOI.includes(action.payload.imageUrl)) {
            state.standardVehicle.imgAOI.push(action.payload.imageUrl);
          }
        }
      })
      .addCase(uploadAOIImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

      // upload Standard Production Image
      builder
        .addCase(uploadStandardProductionImage.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(uploadStandardProductionImage.fulfilled, (state, action) => {
          state.loading = false;
          if (state.standardProduction && action.payload?.imageUrl) {
            if (!Array.isArray(state.standardProduction.imgStandard)) {
              state.standardProduction.imgStandard = [];
            }
            if (!state.standardProduction.imgStandard.includes(action.payload.imageUrl)) {
              state.standardProduction.imgStandard.push(action.payload.imageUrl);
            }
          }
        })
        .addCase(uploadStandardProductionImage.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        });

      // upload pqc check Image
      builder
        .addCase(uploadPQCCheckImage.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(uploadPQCCheckImage.fulfilled, (state, action) => {
          state.loading = false;
          if (state.pqcCheck && action.payload?.imageUrl) {
            if (!Array.isArray(state.pqcCheck.imgIC)) {
              state.pqcCheck.imgIC = [];
            }
            if (!state.pqcCheck.imgIC.includes(action.payload.imageUrl)) {
              state.pqcCheck.imgIC.push(action.payload.imageUrl);
            }
          }
        })
        .addCase(uploadPQCCheckImage.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        });

        // upload image-xray StandardVehicle
        builder
        .addCase(uploadXRayImage.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(uploadXRayImage.fulfilled, (state, action) => {
          state.loading = false;
          // Cập nhật URL hình ảnh nếu backend trả về
          if (state.standardVehicle && action.payload?.imageUrl) {
            // Nếu imgXray chưa tồn tại hoặc không phải array, khởi tạo mảng mới
            if (!Array.isArray(state.standardVehicle.imgXray)) {
              state.standardVehicle.imgXray = [];
            }
            
            // Thêm URL mới vào array (không trùng lặp)
            if (!state.standardVehicle.imgXray.includes(action.payload.imageUrl)) {
              state.standardVehicle.imgXray.push(action.payload.imageUrl);
            }
          }
        })
        .addCase(uploadXRayImage.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        });
  },
});

export const { 
  clearSubTableError, 
  clearSubTableSuccess, 
  resetCompletedTables, 
  clearAllSubTableData, 
  addCompletedTable,
  setCheckModel,
  setPQCCheck,
  setStandardProduction,
  setTimeChangeModel,
  removeCompletedTable,
  setStandardVehicle
} = subTableSlice.actions;

export default subTableSlice.reducer;
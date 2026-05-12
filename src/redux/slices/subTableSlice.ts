/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import smdApi from '../services/smdApi'; // Chỉ import smdApi
import { extractFileName } from '../../utils/imageUrl';

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

  note?: string;
  imgIssue?: string[];
  imgMounter?: string[];
  imgPrinter?: string[];
  imgPrinterClean?: string[];
  imgXray?: string[];
  imgReflow?: string[];
  imgOCR?: string[];
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
  note?: string;
  imgIssue?: string[];
}

// ==================== STATE ====================
interface subTableState {
  loading: boolean;
  error: string | null;
  success: boolean;
  lastUpdatedTable: string | null;
  completedTables: string[];
  loadedFromSheetId: number | null; // flag để check data đã load từ bảng cha hay chưa ?

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
  loadedFromSheetId: null,
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

// CheckModel
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
// upload ocr image
export const uploadOcrImage = createAsyncThunk(
  'subTable/uploadOcrImage',
  async ({ standardVehicleId, file }: { standardVehicleId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardVehicle/image-ocr/${standardVehicleId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải lên hình ảnh OCR');
    }
  }
)
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

// Upload StandardVehicle reflow image
export const uploadStandardVehicleReflowImage = createAsyncThunk(
  'subTable/uploadVehicleReflowImage',
  async ({ StandardVehicleId, file }: { StandardVehicleId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardVehicle/image-reflow/${StandardVehicleId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải VehicleReflow');
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

// ---------------------------------- DELETE ----------------------------------------
// Delete image-ocr StandardVehicle
export const deleteOCRImage = createAsyncThunk(
  'subTable/deleteOCRImage',
  async ({ standardVehicleId, imageUrl }: { standardVehicleId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl);
      const response = await smdApi.delete(`StandardVehicle/image-ocr/${standardVehicleId}/${imageName}`);
      return { data: response.data, imageUrl };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh OCR của StandardVehicle');
    }
  }
)
// Delete checkModel issue image
export const deleteCheckModelIssueImage = createAsyncThunk(
  'subTable/deleteCheckModelIssueImage',
  async ({ checkModelId, imageUrl }: { checkModelId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl);
      const response = await smdApi.delete(`CheckModel/image-issue/${checkModelId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl để filter
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh Issue của CheckModel');
    }
  }
)

// Delete pqcCheck ic image
export const deletePQCCheckImage = createAsyncThunk(
  'subTable/deletePQCCheckImage',
  async ({ pqcCheckId, imageUrl }: { pqcCheckId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`PQCCheck/image/${pqcCheckId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh của PQCCheck');
    }
  }
)

// Delete pqcCheck issue image
export const deletePQCCheckIssueImage = createAsyncThunk(
  'subTable/deletePQCCheckIssueImage',
  async ({ pqcCheckId, imageUrl }: { pqcCheckId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`PQCCheck/image-issue/${pqcCheckId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh Issue của PQCCheck');
    }
  }
)

// Delete StandardProduction image
export const deleteStandardProductionImage = createAsyncThunk(
  'subTable/deleteStandardProductionImage',
  async ({ standardProductionId, imageUrl }: { standardProductionId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`StandardProduction/image/${standardProductionId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh của StandardProduction');
    }
  }
)

// Delete StandardProduction issue image
export const deleteStandardProductionIssueImage = createAsyncThunk(
  'subTable/deleteStandardProductionIssueImage',
  async ({ standardProductionId, imageUrl }: { standardProductionId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`StandardProduction/image-issue/${standardProductionId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh Issue của StandardProduction');
    }
  }
)

// Delete StandardVehicle spi image
export const deleteSPIImage = createAsyncThunk(
  'subTable/deleteSPIImage',
  async ({ standardVehicleId, imageUrl }: { standardVehicleId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`StandardVehicle/image-spi/${standardVehicleId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh SPI');
    }
  }
)

// Delete StandardVehicle aoi image
export const deleteAOIImage = createAsyncThunk(
  'subTable/deleteAOIImage',
  async ({ standardVehicleId, imageUrl }: { standardVehicleId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`StandardVehicle/image-aoi/${standardVehicleId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh AOI');
    }
  }
)

// Delete StandardVehicle issue image
export const deleteStandardVehicleIssueImage = createAsyncThunk(
  'subTable/deleteStandardVehicleIssueImage',
  async ({ standardVehicleId, imageUrl }: { standardVehicleId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`StandardVehicle/image-issue/${standardVehicleId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh Issue của StandardVehicle');
    }
  }
)

// Delete StandardVehicle printer image
export const deletePrinterImage = createAsyncThunk(
  'subTable/deletePrinterImage',
  async ({ standardVehicleId, imageUrl }: { standardVehicleId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`StandardVehicle/image-printer/${standardVehicleId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh Printer');
    }
  }
)

// Delete StandardVehicle printer clean image
export const deletePrinterCleanImage = createAsyncThunk(
  'subTable/deletePrinterCleanImage',
  async ({ standardVehicleId, imageUrl }: { standardVehicleId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`StandardVehicle/image-printer-clean/${standardVehicleId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh Printer Clean');
    }
  }
)

// Delete StandardVehicle mounter image
export const deleteMounterImage = createAsyncThunk(
  'subTable/deleteMounterImage',
  async ({ standardVehicleId, imageUrl }: { standardVehicleId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`StandardVehicle/image-mounter/${standardVehicleId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh Mounter');
    }
  }
)

// Delete StandardVehicle xray image
export const deleteXRayImage = createAsyncThunk(
  'subTable/deleteXRayImage',
  async ({ standardVehicleId, imageUrl }: { standardVehicleId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`StandardVehicle/image-xray/${standardVehicleId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh X-Ray');
    }
  }
)

// Delete timeChangeModel issue image
export const deleteTimeChangeModelIssueImage = createAsyncThunk(
  'subTable/deleteTimeChangeModelIssueImage',
  async ({ timeChangeModelId, imageUrl }: { timeChangeModelId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl); //  Thêm extract
      const response = await smdApi.delete(`TimeChangeModel/image-issue/${timeChangeModelId}/${imageName}`);
      return { data: response.data, imageUrl }; //  Return imageUrl
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh Issue của TimeChangeModel');
    }
  }
)

// Delete standardVehicle reflow image
export const deleteStandardVehicleReflowImage = createAsyncThunk(
  'subTable/deleteStandardVehicleReflowImage',
  async ({ standardVehicleId, imageUrl }: { standardVehicleId: number; imageUrl: string }, { rejectWithValue }) => {
    try {
      const imageName = extractFileName(imageUrl);
      const response = await smdApi.delete(`StandardVehicle/image-reflow/${standardVehicleId}/${imageName}`);
      return { data: response.data, imageUrl };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa hình ảnh Reflow');
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
      state.loadedFromSheetId = null;
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
        console.log(` Adding '${tableName}' to completedTables`);
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
        state.completedTables = state.completedTables.filter(t => t !== tableName);
      } else {
        console.log(`ℹ️ '${tableName}' not found in completedTables`);
      }
    },
    setAllSubTableData: (state, action: PayloadAction<{
      checkModel?: CheckModelData | null;
      standardProduction?: StandardProductionData | null;
      timeChangeModel?: TimeChangeModelData | null;
      standardVehicle?: StandardVehicleData | null;
      pqcCheck?: PQCCheckData | null;
      loadedFromSheetId?: number;
    }>) => {
      const { checkModel, standardProduction, timeChangeModel, standardVehicle, pqcCheck, loadedFromSheetId } = action.payload;
      if (checkModel !== undefined) state.checkModel = checkModel;
      if (standardProduction !== undefined) state.standardProduction = standardProduction;
      if (timeChangeModel !== undefined) state.timeChangeModel = timeChangeModel;
      if (standardVehicle !== undefined) state.standardVehicle = standardVehicle;
      if (pqcCheck !== undefined) state.pqcCheck = pqcCheck;
      if (loadedFromSheetId !== undefined) state.loadedFromSheetId = loadedFromSheetId;
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
    // Upload image ocr
    builder
      .addCase(uploadOcrImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadOcrImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && action.payload?.imageUrl) {
          if (!Array.isArray(state.standardVehicle.imgOCR)) {
            state.standardVehicle.imgOCR = [];
          }
          if (!state.standardVehicle.imgOCR.includes(action.payload.imageUrl)) {
            state.standardVehicle.imgOCR.push(action.payload.imageUrl);
          }
        }
        state.error = null;
      })
      .addCase(uploadOcrImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    // Upload reflow image
    builder
      .addCase(uploadStandardVehicleReflowImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadStandardVehicleReflowImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && action.payload?.imageUrl) {
          if (!Array.isArray(state.standardVehicle.imgReflow)) {
            state.standardVehicle.imgReflow = [];
          }
          if (!state.standardVehicle.imgReflow.includes(action.payload.imageUrl)) {
            state.standardVehicle.imgReflow.push(action.payload.imageUrl);
          }
        }
        state.error = null;
      })
      .addCase(uploadStandardVehicleReflowImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
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
    // ----------------------------------- DELETE IMAGE -----------------------------------
    // Delete image ocr StandardVehicle
    builder
      .addCase(deleteOCRImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOCRImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && state.standardVehicle.imgOCR) {
          state.standardVehicle.imgOCR = state.standardVehicle.imgOCR.filter(
            url => url !== action.payload.imageUrl //  giữ lại các hình ảnh không trùng với imageUrl đã xóa
          );
        }
      })
      .addCase(deleteOCRImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    // Delete checkModel issue image
    builder
      .addCase(deleteCheckModelIssueImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCheckModelIssueImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.checkModel && state.checkModel.imgIssue) {
          state.checkModel.imgIssue = state.checkModel.imgIssue.filter(
            url => url !== action.payload.imageUrl //  giữ lại các hình ảnh không trùng với imageUrl đã xóa
          );
        }
      })
      .addCase(deleteCheckModelIssueImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete pqcCheck ic image
    builder
      .addCase(deletePQCCheckImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePQCCheckImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.pqcCheck && state.pqcCheck.imgIC) {
          state.pqcCheck.imgIC = state.pqcCheck.imgIC.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deletePQCCheckImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete pqcCheck issue image
    builder
      .addCase(deletePQCCheckIssueImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePQCCheckIssueImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.pqcCheck && state.pqcCheck.imgIssue) {
          state.pqcCheck.imgIssue = state.pqcCheck.imgIssue.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deletePQCCheckIssueImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete StandardVehicle reflow image
    builder
      .addCase(deleteStandardVehicleReflowImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStandardVehicleReflowImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && state.standardVehicle.imgReflow) {
          state.standardVehicle.imgReflow = state.standardVehicle.imgReflow.filter(
            url => url !== action.payload.imageUrl
          );
        }
      })
      .addCase(deleteStandardVehicleReflowImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete StandardProduction image
    builder
      .addCase(deleteStandardProductionImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStandardProductionImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardProduction && state.standardProduction.imgStandard) {
          state.standardProduction.imgStandard = state.standardProduction.imgStandard.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deleteStandardProductionImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete StandardProduction issue image
    builder
      .addCase(deleteStandardProductionIssueImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStandardProductionIssueImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardProduction && state.standardProduction.imgIssue) {
          state.standardProduction.imgIssue = state.standardProduction.imgIssue.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deleteStandardProductionIssueImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete StandardVehicle spi image
    builder
      .addCase(deleteSPIImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSPIImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && state.standardVehicle.imgSPI) {
          state.standardVehicle.imgSPI = state.standardVehicle.imgSPI.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deleteSPIImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete StandardVehicle aoi image
    builder
      .addCase(deleteAOIImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAOIImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && state.standardVehicle.imgAOI) {
          state.standardVehicle.imgAOI = state.standardVehicle.imgAOI.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deleteAOIImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete StandardVehicle issue image
    builder
      .addCase(deleteStandardVehicleIssueImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStandardVehicleIssueImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && state.standardVehicle.imgIssue) {
          state.standardVehicle.imgIssue = state.standardVehicle.imgIssue.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deleteStandardVehicleIssueImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete StandardVehicle printer image
    builder
      .addCase(deletePrinterImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePrinterImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && state.standardVehicle.imgPrinter) {
          state.standardVehicle.imgPrinter = state.standardVehicle.imgPrinter.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deletePrinterImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete StandardVehicle printer clean image
    builder
      .addCase(deletePrinterCleanImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePrinterCleanImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && state.standardVehicle.imgPrinterClean) {
          state.standardVehicle.imgPrinterClean = state.standardVehicle.imgPrinterClean.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deletePrinterCleanImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete StandardVehicle mounter image
    builder
      .addCase(deleteMounterImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMounterImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && state.standardVehicle.imgMounter) {
          state.standardVehicle.imgMounter = state.standardVehicle.imgMounter.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deleteMounterImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete StandardVehicle xray image
    builder
      .addCase(deleteXRayImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteXRayImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.standardVehicle && state.standardVehicle.imgXray) {
          state.standardVehicle.imgXray = state.standardVehicle.imgXray.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deleteXRayImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete timeChangeModel issue image
    builder
      .addCase(deleteTimeChangeModelIssueImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTimeChangeModelIssueImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.timeChangeModel && state.timeChangeModel.imgIssue) {
          state.timeChangeModel.imgIssue = state.timeChangeModel.imgIssue.filter(
            url => url !== action.payload.imageUrl //  Sửa logic filter
          );
        }
      })
      .addCase(deleteTimeChangeModelIssueImage.rejected, (state, action) => {
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
  setStandardVehicle,
  setAllSubTableData,
} = subTableSlice.actions;

export default subTableSlice.reducer;
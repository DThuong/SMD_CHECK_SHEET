import { useState } from "react";
import Modal from "../general/Modal";
import ViewDetailButton from "../general/ViewDetailButton";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { uploadBothFiles } from "../../redux/slices/changeModelSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import { useNavigate } from "react-router-dom";
import { IoEyeSharp } from "react-icons/io5";

interface FileUploadState {
  lcr?: File;
  reflow?: File;
}

const SheetHeader = ({ canEdit }: { canEdit: boolean }) => {
  const dispatch = useAppDispatch();
  const { currentSheet, error, uploadLoading } = useAppSelector((state) => state.changeModel);
  
  const [open, setOpen] = useState(false);
  const [tempFileState, setTempFileState] = useState<FileUploadState>({});
  
  const { user } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  const { notification, showNotification, hideNotification } = useNotification();

  const setFile = (key: keyof FileUploadState, file?: File) => {
    setTempFileState(prev => ({ ...prev, [key]: file }));
  };

  const submit = async () => {
    if (!currentSheet?.id) {
      showNotification('error', 'Lỗi', 'Không tìm thấy Change Model ID!');
      return;
    }

    if (!tempFileState.lcr || !tempFileState.reflow) {
      showNotification('warning', 'Thiếu file', 'Làm ơn upload cả 2 file: pdf và excel.');
      return;
    }

    try {
      await dispatch(uploadBothFiles({
        changeModelId: currentSheet.id,
        excelFile: tempFileState.lcr,
        pdfFile: tempFileState.reflow,
      })).unwrap();

      showNotification('success', 'Upload thành công!', 'Cả hai file đã được upload thành công.');
      setTempFileState({});
      setOpen(false);
    } catch (err: any) {
      showNotification('error', 'Upload thất bại', err?.message || 'Có lỗi xảy ra khi upload file.');
    }
  };

  const handleOpenModal = () => {
    setTempFileState({});
    setOpen(true);
  };

  const handleCloseModal = () => {
    setTempFileState({});
    setOpen(false);
  };

  const handleViewFiles = () => {
    if (!currentSheet?.id) return;
    
    let basePath = '/pqc-files';
    if (user?.role === 'Admin') {
      basePath = '/admin/files';
    } else if (user?.role && ['ENG', 'Supervisior', 'Manager', 'KoreaManager'].includes(user.role)) {
      basePath = `/${user.role.toLowerCase()}/files`;
    }
    
    navigate(`${basePath}/${currentSheet.id}/reflow`);
  };

  const handleFileChange = (type: keyof FileUploadState, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFile(type, file);
    e.target.value = ''; 
  };
  
  const lcrName = currentSheet?.excelFileUrl && currentSheet.excelFileUrl !== ""
    ? currentSheet.excelFileUrl.split('/').pop() 
    : 'Chưa có file';
  
  const reflowName = currentSheet?.pdfFileUrl && currentSheet.pdfFileUrl !== ""
    ? currentSheet.pdfFileUrl.split('/').pop() 
    : 'Chưa có file';

  const modalLcrName = tempFileState.lcr?.name || lcrName;
  const modalReflowName = tempFileState.reflow?.name || reflowName;

  // CHECK CẢ 2 FILE - DỰA VÀO currentSheet, KHÔNG DỰA VÀO completedTables
    const bothFilesUploaded = 
    !!currentSheet?.excelFileUrl && 
    currentSheet.excelFileUrl.trim() !== "" &&
    !!currentSheet?.pdfFileUrl && 
    currentSheet.pdfFileUrl.trim() !== "";

  return (
    <div>
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />

      <div className="p-0 w-full">
        {/* CHỈ HIỂN THỊ KHI CẢ 2 ĐIỀU KIỆN ĐỀU ĐÚNG */}
          {bothFilesUploaded && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800 font-semibold flex items-center gap-2 mb-0">
              ✓ Cả hai file đã được upload thành công.
            </p>
          </div>
        )}
        {/* Website View */}
        <div className="hidden lg:block w-full overflow-x-auto">
          <table className="border border-gray-600 w-full min-w-[1400px] text-center">
            <thead>
              <tr>
                <th rowSpan={2} colSpan={7} className="border border-gray-600 px-4 py-6 text-2xl font-bold text-left">
                  SMD Check Sheet Change Model
                </th>
                <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-sm font-bold bg-gray-100"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                  PQC SMD
                </th>
                <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-sm font-bold bg-gray-100"
                  style={{ textOrientation: 'mixed' }}>
                  FILE ATTACH
                </th>
                <th colSpan={2} className="border border-gray-600 px-2 py-1 text-xs font-semibold bg-gray-100">
                  LCR FILE (xlsx)
                </th>
                <th colSpan={2} className="border border-gray-600 px-2 py-1 text-xs font-semibold bg-gray-100">
                  REFLOW FILE (pdf)
                </th>
              </tr>

              <tr>
                <td colSpan={2} className={`border border-gray-600 px-2 py-1 text-xs text-left ${
                  currentSheet?.excelFileUrl ? 'bg-green-50' : 'bg-orange-50'
                }`}>
                  <div className="text-sm font-semibold truncate text-gray-800">
                    {currentSheet?.excelFileUrl || currentSheet?.excelFileUrl === "" ? (
                      <>✓ {lcrName}</>
                    ) : (
                      <>⚠️ Chưa upload</>
                    )}
                  </div>
                </td>

                <td colSpan={2} className={`border border-gray-600 px-2 py-1 text-xs text-left ${
                  currentSheet?.pdfFileUrl ? 'bg-green-50' : 'bg-orange-50'
                }`}>
                  <div className="text-sm font-semibold truncate text-gray-800">
                    {currentSheet?.pdfFileUrl || currentSheet?.pdfFileUrl === ""  ? (
                      <>✓ {reflowName}</>
                    ) : (
                      <>⚠️ Chưa upload</>
                    )}
                  </div>
                </td>
              </tr>
            </thead>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden">
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm" onClick={handleOpenModal}>
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">
              SMD Check Sheet Change Model
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">lcr file (xlsx)</div>
                <div className={`w-full text-sm px-2 py-1 border rounded truncate overflow-hidden ${
                  currentSheet?.excelFileUrl 
                    ? 'bg-green-50 border-green-300 text-green-800' 
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                  {currentSheet?.excelFileUrl 
                    ? `✓ ${lcrName}` 
                    : `⚠️ Chưa upload`}
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">reflow file (pdf)</div>
                <div className={`w-full text-sm px-2 py-1 border rounded truncate overflow-hidden ${
                  currentSheet?.pdfFileUrl 
                    ? 'bg-green-50 border-green-300 text-green-800' 
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                  {currentSheet?.pdfFileUrl 
                    ? `✓ ${reflowName}` 
                    : `⚠️ Chưa upload`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-row justify-end w-full gap-2 mt-3">
          {bothFilesUploaded && (
            <ViewDetailButton 
              onOpen={handleViewFiles}
              disabled={false}
            >
              <div className="flex gap-2 items-center justify-center">
                <div><IoEyeSharp size={20} /></div> <div>Xem chi tiết</div>
              </div>
            </ViewDetailButton>
          )}
          
          <ViewDetailButton onOpen={handleOpenModal} disabled={!canEdit}>
            Chỉnh sửa
          </ViewDetailButton>
        </div>

        {/* Modal */}
        <Modal
          open={open}
          title="Upload LCR & REFLOW Files"
          onClose={handleCloseModal}
          onSave={submit}
        >
          <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
            {uploadLoading && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-sm text-blue-600 font-semibold">⏳ Đang tải...</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-semibold">❌ {error}</p>
              </div>
            )}

            {/* LCR File Input */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                lcr file (xlsx) <span className="text-red-500">*</span>
                {tempFileState.lcr && <span className="text-green-600 text-xs">✓</span>}
              </h4>
              
              <p className="text-xs text-gray-600 mb-2 truncate">
                File hiện tại: <strong>{modalLcrName}</strong>
              </p>

              <label className="text-xs block mb-2 w-full">
                Chọn file mới:
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileChange("lcr", e)}
                  disabled={uploadLoading}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm cursor-pointer hover:bg-gray-600 bg-gray-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                />
              </label>
              
              {tempFileState.lcr && (
                <button
                  type="button"
                  onClick={() => setFile("lcr", undefined)}
                  disabled={uploadLoading}
                  className="w-full text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Xóa file
                </button>
              )}
            </div>

            {/* Reflow File Input */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                reflow file (pdf) <span className="text-red-500">*</span>
                {tempFileState.reflow && <span className="text-green-600 text-xs">✓</span>}
              </h4>
              
              <p className="text-xs text-gray-600 mb-2 truncate">
                File hiện tại: <strong>{modalReflowName}</strong>
              </p>

              <label className="text-xs block mb-2 w-full">
                Chọn file mới:
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange("reflow", e)}
                  disabled={uploadLoading}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm cursor-pointer hover:bg-gray-600 bg-gray-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                />
              </label>
              
              {tempFileState.reflow && (
                <button
                  type="button"
                  onClick={() => setFile("reflow", undefined)}
                  disabled={uploadLoading}
                  className="w-full text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Xóa file
                </button>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SheetHeader;
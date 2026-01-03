import ViewDetailButton from "../general/ViewDetailButton"
import { useState, useEffect, useRef, memo } from "react"
import Modal from "../general/Modal";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchPQCCheck, updatePQCCheck } from "../../redux/slices/subTableSlice";
import { uploadPQCCheckImage, type PQCCheckData } from "../../redux/slices/subTableSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import { formatDateTime } from "../../utils/formatTime";
import ImageViewIcon from "../files/ImageViewIcon";
import { FaCamera } from "react-icons/fa6";
import { IoEyeSharp } from "react-icons/io5";
import ImagePreviewModal from "../files/ImagePreviewModal";
import { useTranslation } from "react-i18next";

const initialPQCChecksState: PQCCheckData = {
  id: undefined,
  icPlan: "",
  checksumReal: "",
  checksumConfirm: "",
  turner: "",
  startLCR: "",
  endLCR: "",
  nameCheck: "",
  resultLCR: false,
  imgIC: ""
};

const PQCChecks = memo(({canEdit}: {canEdit: boolean}) => {
      const [form, setForm] = useState<PQCCheckData>(initialPQCChecksState);
       const [open, setOpen] = useState(false);
   
       const dispatch = useAppDispatch();
       
       // Lấy dữ liệu từ Redux store
       const {completedTables } = useAppSelector(state => state.subTable);
       const pqcCheck = useAppSelector(state => state.subTable.pqcCheck);
       const smdSheetId = useAppSelector(state => state.changeModel?.currentSheet?.id);
       const currentSheet = useAppSelector(state => state.changeModel.currentSheet);
       const pqcCheckId = currentSheet?.pqcCheckId || pqcCheck?.id;
       const isSaved = completedTables.includes('PQCCheck');
       const { notification, showNotification, hideNotification } = useNotification();

      const isUploadingRef = useRef(false);
      const hasUserEditedRef = useRef(false);

      const {t} = useTranslation('pqcCheck');
      const {t: t2} = useTranslation('common');

         // xử lý upload hình ảnh + preview modal
  const [imagePreview, setImagePreview] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
  }>({
    isOpen: false,
    imageUrl: "",
    title: ""
  });

  // hàm mở preview
  const openImagePreview = (imageUrl: string, title: string) => {
    setImagePreview({
      isOpen: true,
      imageUrl,
      title
    });
  };

  // hàm đóng preview
  const closeImagePreview = () => {
    setImagePreview({
      isOpen: false,
      imageUrl: "",
      title: ""
    });
  };


  //  FIXED: Upload handler với flag protection
  const handleImageUpload = async (field: 'imgIC', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    if (!pqcCheckId) {
      showNotification('error', 'Lỗi upload', 'Không tìm thấy PQC Check ID');
      return;
    }
  
    try {
      //  Set flag TRƯỚC KHI upload
      isUploadingRef.current = true;
      
      if (field === 'imgIC') {
        const result = await dispatch(uploadPQCCheckImage({ 
          pqcCheckId: Number(pqcCheckId), 
          file 
        })).unwrap();
        
        //  Chỉ cập nhật field imgIC, KHÔNG trigger re-sync toàn bộ form
        if (result?.imageUrl) {
          setForm(prev => ({
            ...prev,
            imgIC: result.imageUrl
          }));
        }
        
        showNotification('success', 'Thành công', 'Upload hình ảnh IC thành công');
      }
  
    } catch (error) {
      console.error('Failed to upload image:', error);
      showNotification('error', 'Lỗi upload', 'Có lỗi xảy ra khi upload hình ảnh');
    } finally {
      //  Reset flag SAU KHI upload xong (thành công hay thất bại)
      isUploadingRef.current = false;
    }
  };
  
  // fetch data khi pqcCheck thay đổi
  useEffect(() => {
    if (pqcCheckId) {
      dispatch(fetchPQCCheck(pqcCheckId));
    }
  }, [pqcCheckId, dispatch]);

    useEffect(() => {
    if (pqcCheck && !hasUserEditedRef.current && !isUploadingRef.current) {
      setForm(pqcCheck);
    }
  }, [pqcCheck]);

  useEffect(() => {
    if (open && pqcCheck && !hasUserEditedRef.current && !isUploadingRef.current) {
      setForm(pqcCheck);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      hasUserEditedRef.current = false;
      isUploadingRef.current = false;
    }
  }, [open]);
  
  if (!pqcCheckId) {
    return (
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-500">Đang tải dữ liệu pqc check...</p>
      </div>
    );
  }

  //  Wrapper cho set() để đánh dấu user đã edit
  const set = <K extends keyof PQCCheckData>(k: K, v: PQCCheckData[K]) => {
    hasUserEditedRef.current = true; // Đánh dấu user đã edit
    setForm((s) => ({ ...s, [k]: v }));
  };

  const submit = async () => {
    if (!pqcCheckId) {
      showNotification('error', 'Lỗi lưu PQC Checks', 'Không tìm thấy PQC Check ID');
      return;
    }
    
    console.log("smdSheet id của pqc: ", smdSheetId)
    if (!smdSheetId) {
      showNotification('error', 'Lỗi lưu PQC Checks', 'Không tìm thấy SMD Sheet ID');
      return;
    }

    try {
      // Dispatch action để update
      await dispatch(updatePQCCheck({
        id: smdSheetId,
        data: form
      })).unwrap();
      
      // Fetch lại data SAU KHI lưu thành công
      if (pqcCheckId) {
        await dispatch(fetchPQCCheck(pqcCheckId)).unwrap();
      }
      
      // Reset flags
      hasUserEditedRef.current = false;
      isUploadingRef.current = false;
      
      setOpen(false);
      showNotification('success', 'Thành công', 'Cập nhật PQC Check thành công');
    } catch (error) {
      console.error('Failed to update pqc checks:', error);
      showNotification('error', 'Lỗi lưu PQC Checks', 'Có lỗi xảy ra khi cập nhật pqc Checks');
    }
  };

  return (
    <div className="p-0 py-4 w-full">
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
       {/* Status indicator */}
      {pqcCheckId && (
        <div className={`mb-2 text-xs p-2 rounded flex items-center gap-2 ${
          isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {isSaved && <span className="text-green-600">✓</span>}
          <span>PQCCheck ID: <strong>{pqcCheckId}</strong></span>
          {currentSheet?.id && <span>| ChangeModel ID: <strong>{currentSheet.id}</strong></span>}
          {isSaved && <span className="ml-auto font-semibold">{t('status.saved')}</span>}
        </div>
      )}
      {/* Website View - Bảng ngang */}
      <div className="hidden lg:block w-full overflow-x-auto">
  <table className="border border-gray-600 w-full text-center opacity-80">
    <tbody>
      {/** Row 31 */}
      <tr>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('title')}</th>
        <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 32 */}
      <tr>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.icPlan')}</th>
        <td colSpan={8} className="border border-gray-600 px-2 py-2 text-xs">{form.icPlan || ""}</td>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.checksumReal')}</th>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">{form.checksumReal || ""}</td>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.checksumConfirm')}</th>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">
          <div className="flex items-center justify-center">
            <input 
              type="text"
              value={form.checksumConfirm || ""}
              onChange={(e) => set("checksumConfirm", e.target.value)}
            />
          </div>
        </td>
      </tr>

      {/** Row 33 */}
      <tr>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tuner</th>
        <td colSpan={8} className="border border-gray-600 px-2 py-2 text-xs">{form.turner || ""}</td>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 34 */}
      <tr>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.stage')}</th>
        <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.startLCR')}</th>
        <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.endLCR')}</th>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.nameCheck')}</th>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.resultLCR')}</th>
      </tr>

      {/** Row 35 */}
      <tr>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">PQC</th>
        <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs">{formatDateTime(form.startLCR) || ""}</td>
        <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs">{formatDateTime(form.endLCR) || ""}</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.nameCheck || ""}</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">
          <div className="flex items-center justify-center flex-row gap-2">
            <label className="font-bold">OK</label>
            <input 
              type="checkbox"
              checked={!!form.resultLCR}
              onChange={(e) => set("resultLCR", e.target.checked)}
            />
          </div>
        </td>
      </tr>
      {/** Row 36: pqc image */}
      <tr>
        <td colSpan={1} className="border border-gray-300 px-2 py-2 text-xs bg-gray-100 font-bold">{t('fields.imageIC')}</td>
        <td colSpan={12} className="border border-gray-600 px-2 py-2 text-xs">
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center gap-2">
                <ImageViewIcon 
                  imageUrl={form.imgIC || "" } 
                  title="Hình ảnh Standard Production"
                  onView={openImagePreview}
                />
              </div>
            </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

      {/* Mobile View - Card dọc (mỗi trường 1 dòng full-width) */}
      <div className="lg:hidden">
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm" onClick={() => setOpen(true)}>
    <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">{t('title')}</h3>
          {/* each field full width row */}
          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.icPlan')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.icPlan || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.checksumReal')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.checksumReal || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.checksumConfirm')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.checksumConfirm || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tuner</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.turner || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.startLCR')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {formatDateTime(form.startLCR) || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.endLCR')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {formatDateTime(form.endLCR) || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.pqcName')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.nameCheck || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.resultLCR')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.resultLCR ? "OK" : "NG"}
            </div>
          </div>

          {/** Hình ảnh image ic */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.imageICLabel')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center">
              <ImageViewIcon 
                imageUrl={form.imgIC} 
                title="Hình ảnh image IC"
                onView={openImagePreview}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)} disabled={!canEdit}>{t2('button.edit')}</ViewDetailButton>
        {/* <ViewDetailButton color="green" onOpen={() => submit()}>Lưu</ViewDetailButton> */}
      </div>

        {/* Modal chỉnh sửa — style & input */}
      <Modal open={open} title="Chi tiết PQC Check" onClose={() => setOpen(false)} onSave={submit}>
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
          <label className="text-xs">
            IC nạp kế hoạch
            <input
              value={form.icPlan ?? ""}
              onChange={(e) => set("icPlan", e.target.value.toUpperCase())}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </label>

          <label className="text-xs">
            Checksum thực tế
            <input
              value={form.checksumReal ?? ""}
              onChange={(e) => set("checksumReal", e.target.value.toUpperCase())}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </label>

          <label className="text-xs">
            Xác nhận khi có thay đổi Checksum mới
            <input
              value={form.checksumConfirm ?? ""}
              onChange={(e) => set("checksumConfirm", e.target.value.toUpperCase())}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-1 gap-3">
            <label className="text-xs">
              Tuner
              <input
                value={form.turner ?? ""}
                onChange={(e) => set("turner", e.target.value.toUpperCase())}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              />
            </label>

          </div>

         <div className="grid grid-cols-2 gap-3">
      <label className="text-xs">
        Thời gian bắt đầu đo LCR
        <input 
          type="datetime-local" 
          value={form.startLCR ?? ""}
          onChange={(e) => set("startLCR", e.target.value)}
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        />
      </label>

      <label className="text-xs">
        Thời gian kết thúc đo LCR
        <input 
          type="datetime-local" 
          value={form.endLCR ?? ""}
          onChange={(e) => set("endLCR", e.target.value)}
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        />
      </label>
    </div>

          <label className="text-xs">
            Tên PQC
            <input
              value={form.nameCheck ?? ""}
              onChange={(e) => set("nameCheck", e.target.value.toUpperCase())}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-center gap-2">
            <div className="text-xs">Kết quả đo LCR</div>
            <input type="checkbox" checked={form.resultLCR} onChange={(e) => set("resultLCR", e.target.checked)} />
          </div>

             <label className="block text-sm font-medium mb-1">Hình ảnh IC Image</label>
                <div className="">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('imgIC', e)}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  />
                </div>
          
                
                      <div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleImageUpload('imgIC', e)}
                        className="hidden"
                        id="camera-capture-standard-production"
                      />
                      <label
                      htmlFor="camera-capture-standard-production"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors font-medium shadow-sm"
                    >
                      {/* Thêm display: inline-block hoặc inline-flex */}
                        <div className="inline-flex items-center">
                          <FaCamera size={15} />
                        </div>
                        <div className="inline-flex items-center mx-2">
                          Chụp ảnh IC Image
                        </div>
                    </label>
                    </div>
                
                {/* Preview Section */}
                {form.imgIC && (
                <div className="mt-0 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Ảnh đã chọn:</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={form.imgIC} 
                      alt="Standard Production Preview" 
                      className="w-24 h-24 object-cover rounded-lg border-2 border-blue-500 cursor-pointer hover:opacity-80 transition-opacity" 
                      onClick={() => openImagePreview(form.imgIC!, "Hình ảnh Standard Production")} 
                    />
                    <button
                      type="button"
                      onClick={() => openImagePreview(form.imgIC!, "Hình ảnh Standard Production")}
                      className="flex-1 text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 py-2 px-3 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <IoEyeSharp size={20} />
                      <span className="text-sm font-medium">Xem ảnh</span>
                    </button>
                  </div>
                </div>
              )}

        </div>
      </Modal>
      <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        imageUrl={imagePreview.imageUrl}
        title={imagePreview.title}
        onClose={closeImagePreview}
      />
    </div>
  )
})

export default PQCChecks
import ViewDetailButton from "../general/ViewDetailButton"
import { useState, useEffect, useRef, memo } from "react"
import Modal from "../general/Modal";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchPQCCheck, updatePQCCheck, uploadPQCCheckIssueImage, deletePQCCheckImage, deletePQCCheckIssueImage } from "../../redux/slices/subTableSlice";
import { uploadPQCCheckImage, type PQCCheckData } from "../../redux/slices/subTableSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import { formatDateTime } from "../../utils/formatTime";
import ImageViewIcon from "../files/ImageViewIcon";
import ImagePreviewModal from "../files/ImagePreviewModal";
import { useTranslation } from "react-i18next";
import MultiImageUpload from "../files/MultiImageUpload";
// import { useIOSInputFix } from "../../utils/useIOSInputFix";

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
  imgIC: [],
  note: "",
  imgIssue: []
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
      //  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null); // kiểm tra input có đang được focus hay không
       const hasUserEditedRef = useRef(false);

      const isUploadingRef = useRef(false);

      // useIOSInputFix();

      const {t} = useTranslation('pqcCheck');
      const {t: t2} = useTranslation('common');
      const deletingRef = useRef(false);

      //  useEffect #1: Fetch data khi ID thay đổi
      useEffect(() => {
        if (pqcCheckId) {
          dispatch(fetchPQCCheck(pqcCheckId));
        }
      }, [pqcCheckId, dispatch]);

      // useEffect #3: Sync form với Redux
      useEffect(() => {
        if (pqcCheck && !hasUserEditedRef.current && !isUploadingRef.current && !deletingRef.current) {
          setForm(pqcCheck);
        }
      }, [pqcCheck]);

      // useEffect #4: Reset flags khi đóng modal
      useEffect(() => {
        if (!open) {
          hasUserEditedRef.current = false;
          isUploadingRef.current = false;
          deletingRef.current = false;
        }
      }, [open]);

      // xử lý upload hình ảnh + preview modal
    const [imagePreview, setImagePreview] = useState<{
      isOpen: boolean;
      imageUrl: string | string[]; // ← Hỗ trợ cả string và array
      title: string;
      initialIndex?: number; // ← Thêm initialIndex
    }>({
      isOpen: false,
      imageUrl: "",
      title: "",
      initialIndex: 0
    });

    // Hàm mở preview cũng cần cập nhật
    const openImagePreview = (imageUrl: string | string[], title: string, initialIndex = 0) => {
      setImagePreview({
        isOpen: true,
        imageUrl,
        title,
        initialIndex
      });
    };

    const closeImagePreview = () => {
      setImagePreview({
        isOpen: false,
        imageUrl: "",
        title: "",
        initialIndex: 0
      });
    };


  //  FIXED: Upload handler với flag protection
  const handleImageUpload = async (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!pqcCheckId) {
    showNotification('error', 'Lỗi upload', 'Không tìm thấy PQC Check ID');
    return;
  }

  try {
    isUploadingRef.current = true;
    
    let result;
    let successMessage = '';

    switch (field) {
      case 'imgIC':
        result = await dispatch(uploadPQCCheckImage({ 
          pqcCheckId: Number(pqcCheckId), 
          file 
        })).unwrap();
        successMessage = 'Upload hình ảnh IC thành công';
        break;
      
      case 'imgIssue':
        result = await dispatch(uploadPQCCheckIssueImage({ 
          pqcCheckId: Number(pqcCheckId), 
          file 
        })).unwrap();
        successMessage = 'Upload hình ảnh vấn đề phát sinh thành công';
        break;
    }

    // Thêm ảnh mới vào array, update local state
    if (result?.imageUrl) {
      setForm(prev => {
        const fieldKey = field as 'imgIC' | 'imgIssue';
        const currentArray = prev[fieldKey] || [];
        
        return {
          ...prev,
          [fieldKey]: [...currentArray, result.imageUrl]
        };
      });
    }
    
    showNotification('success', 'Thành công', successMessage);
    
  } catch (error) {
    console.error('Failed to upload image:', error);
    showNotification('error', 'Lỗi upload', 'Có lỗi xảy ra khi upload hình ảnh');
  } finally {
    isUploadingRef.current = false;
  }
};

  const handleRemoveImage = async (field: 'imgIC' | 'imgIssue', index: number) => {
  if (!pqcCheckId) {
    showNotification('error', 'Lỗi xóa', 'Không tìm thấy PQC Check ID');
    return;
  }

  const imageUrl = form[field]?.[index];
  if (!imageUrl) return;

  try {
    deletingRef.current = true;
    // Gọi API delete tương ứng với field
    if (field === 'imgIC') {
      await dispatch(deletePQCCheckImage({ 
        pqcCheckId: Number(pqcCheckId), 
        imageUrl 
      })).unwrap();
    } else if (field === 'imgIssue') {
      await dispatch(deletePQCCheckIssueImage({ 
        pqcCheckId: Number(pqcCheckId), 
        imageUrl 
      })).unwrap();
    }

    // Cập nhật local state
    setForm(prev => ({
      ...prev,
      [field]: (prev[field] as string[])?.filter((_, i) => i !== index) || []
    }));

    showNotification('success', 'Đã xóa', `Đã xóa ảnh ${field === 'imgIC' ? 'IC' : 'vấn đề phát sinh'}`);
  } catch (error) {
    console.error('Failed to delete image:', error);
    showNotification('error', 'Lỗi xóa', 'Không thể xóa ảnh');
  } finally {
    deletingRef.current = false; // ← Reset flag
  }
};
  
  if (!pqcCheckId) {
    return (
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-500">Đang tải dữ liệu pqc check...</p>
      </div>
    );
  }

  //  Wrapper cho set() để đánh dấu user đã edit
  const set = <K extends keyof PQCCheckData>(k: K, v: PQCCheckData[K]) => {
    hasUserEditedRef.current = true;
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
      // Uppercase TẤT CẢ field text trước khi submit
    const dataToSubmit = {
      ...form,
      icPlan: form.icPlan?.toUpperCase() || "",
      checksumReal: form.checksumReal?.toUpperCase() || "",
      checksumConfirm: form.checksumConfirm?.toUpperCase() || "",
      turner: form.turner?.toUpperCase() || "",
      nameCheck: form.nameCheck?.toUpperCase() || "",
      note: form.note?.toUpperCase() || ""
    };

    await dispatch(updatePQCCheck({
      id: pqcCheckId,
      data: dataToSubmit // ← Dùng data đã uppercase
    })).unwrap();
    
    // Fetch lại data SAU KHI lưu thành công
    if (pqcCheckId) {
      await dispatch(fetchPQCCheck(pqcCheckId)).unwrap();
    }
    
    setOpen(false);
    showNotification('success', 'Thành công', 'Cập nhật PQC Check thành công');
    } catch (error) {
      console.error('Failed to update pqc checks:', error);
      showNotification('error', 'Lỗi lưu PQC Checks', 'Có lỗi xảy ra khi cập nhật pqc Checks');
    }
  };

  // scroll input vào viewport
  // const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  //   activeInputRef.current = e.target;
    
  //   // Delay để đợi keyboard xuất hiện
  //   setTimeout(() => {
  //     e.target.scrollIntoView({
  //       behavior: 'smooth',
  //       block: 'center', // Đặt input ở giữa màn hình
  //       inline: 'nearest'
  //     });
  //   }, 300); // iOS keyboard mất ~300ms để xuất hiện
  // };

  return (
    <>
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
        <div className={`mb-2 text-xs p-2 rounded flex items-center gap-2 no-print ${
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
              <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">{form.checksumConfirm || ""}</td>
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
                  <span className="text-base font-bold">
                    {form.resultLCR ? "✓" : ""}
                  </span>
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
                        title="Hình ảnh IC"
                        onView={openImagePreview}
                      />
                    </div>
                  </div>
              </td>
            </tr>

            {/** Row 37: Note */}
            <tr>
              <td colSpan={1} className="border border-gray-300 px-2 py-2 text-xs bg-gray-100 font-bold">{t2('issueNote')}</td>
              <td colSpan={12} className="border border-gray-600 px-2 py-2 text-xs">{form.note || ""}</td>
            </tr>

            {/** Row 38: Hình ảnh vấn đề phát sinh */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t2('issueImg')}</th>
                <td colSpan={12} className="border border-gray-600 px-2 py-2 text-xs">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center justify-center gap-2">
                          <ImageViewIcon 
                            imageUrl={form.imgIssue} 
                            title="Hình ảnh vấn đề phát sinh"
                            onView={openImagePreview}
                          />
                    </div>
                  </div>
                </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile View - Card dọc */}
<div className="lg:hidden">
  <div
    className="w-full bg-white border border-gray-300 rounded-lg shadow-sm"
  >
    {/* Phần có thể click để mở modal */}
    <div
      onClick={() => canEdit && setOpen(true)}
      className={`p-4 pb-0 ${
        canEdit ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : 'cursor-not-allowed opacity-90'
      }`}
      role="button"
      tabIndex={canEdit ? 0 : -1}
      onKeyDown={(e) => {
        if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setOpen(true);
        }
      }}
      aria-disabled={!canEdit}
    >
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">
        {t('title')}
        {isSaved && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded ml-2">✓ Đã lưu</span>}
      </h3>
      
      {/* IC nạp kế hoạch */}
      <div className="mb-3 min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.icPlan')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.icPlan || "—"}
        </div>
      </div>

      {/* Checksum thực tế */}
      <div className="mb-3 min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.checksumReal')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.checksumReal || "—"}
        </div>
      </div>

      {/* Xác nhận Checksum */}
      <div className="mb-3 min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.checksumConfirm')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.checksumConfirm || "—"}
        </div>
      </div>

      {/* Tuner */}
      <div className="mb-3 min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Tuner</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.turner || "—"}
        </div>
      </div>

      {/* Thời gian bắt đầu LCR */}
      <div className="mb-3 min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.startLCR')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {formatDateTime(form.startLCR) || "—"}
        </div>
      </div>

      {/* Thời gian kết thúc LCR */}
      <div className="mb-3 min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.endLCR')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {formatDateTime(form.endLCR) || "—"}
        </div>
      </div>

      {/* Tên PQC */}
      <div className="mb-3 min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.pqcName')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.nameCheck || "—"}
        </div>
      </div>

      {/* Kết quả LCR */}
      <div className="mb-3 min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.resultLCR')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.resultLCR ? "OK" : "NG"}
        </div>
      </div>

      {/* Ghi chú vấn đề phát sinh */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t2('issueNote')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.note || "—"}
        </div>
      </div>
    </div>

    {/* PHẦN HÌNH ẢNH - Không trigger modal, nằm trong cùng container */}
    <div className="px-4 pb-4 border-t-0 border-gray-200">
      {/* Hình ảnh vấn đề phát sinh */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t2('issueImg')}</div>
        <div 
          className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <ImageViewIcon 
            imageUrl={form.imgIssue} 
            title={t2('issueImg')}
            onView={openImagePreview}
          />
        </div>
      </div>

      {/* Hình ảnh IC */}
      <div className="mb-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.imageICLabel')}</div>
        <div 
          className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center" 
          onClick={(e) => e.stopPropagation()}
        >
          <ImageViewIcon 
            imageUrl={form.imgIC} 
            title={t('fields.imageICLabel')}
            onView={openImagePreview}
          />
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3 no-print">
        <ViewDetailButton onOpen={() => setOpen(true)} disabled={!canEdit} {...(!canEdit ? {} : { 'data-edit-button': 'true' })}>
          {t2('button.edit')}
        </ViewDetailButton>
      </div>

        {/* Modal chỉnh sửa — style & input */}
    <Modal open={open} title="Chi tiết PQC Check" onClose={() => setOpen(false)} onSave={submit}>
      <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
        <div className="grid gap-3 p-1">
          {/* IC nạp kế hoạch */}
          <label className="text-xs">
            IC nạp kế hoạch
            <input
              value={form.icPlan ?? ""}
              onChange={(e) => set("icPlan", e.target.value)}
              // onFocus={handleInputFocus}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
              placeholder=""
            />
          </label>

          {/* Checksum thực tế */}
          <label className="text-xs">
            Checksum thực tế
            <input
              value={form.checksumReal ?? ""}
              onChange={(e) => set("checksumReal", e.target.value)}
              // onFocus={handleInputFocus}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
              placeholder=""
            />
          </label>

          {/* Xác nhận Checksum */}
          <label className="text-xs">
            Xác nhận khi có thay đổi Checksum mới
            <input
              value={form.checksumConfirm ?? ""}
              onChange={(e) => set("checksumConfirm", e.target.value)}
              // onFocus={handleInputFocus}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
              placeholder=""
            />
          </label>

          {/* Tuner */}
          <label className="text-xs">
            Tuner
            <input
              value={form.turner ?? ""}
              onChange={(e) => set("turner", e.target.value)}
              // onFocus={handleInputFocus}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
              placeholder=""
            />
          </label>

          {/* Datetime-local GIỮ NGUYÊN style */}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              Thời gian bắt đầu đo LCR
              <input 
                type="datetime-local" 
                value={form.startLCR ?? ""}
                onChange={(e) => set("startLCR", e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                style={{ 
                  WebkitAppearance: 'none',
                  minHeight: '44px'
                }}
              />
            </label>

            <label className="text-xs">
              Thời gian kết thúc đo LCR
              <input 
                type="datetime-local" 
                value={form.endLCR ?? ""}
                onChange={(e) => set("endLCR", e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                style={{ 
                  WebkitAppearance: 'none',
                  minHeight: '44px'
                }}
              />
            </label>
          </div>

          {/* Tên PQC */}
          <label className="text-xs">
            Tên PQC
            <input
              value={form.nameCheck ?? ""}
              onChange={(e) => set("nameCheck", e.target.value)}
              // onFocus={handleInputFocus}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
              placeholder=""
            />
          </label>

          {/* Checkbox giữ nguyên */}
          <div className="flex items-center gap-2">
            <div className="text-xs">Kết quả đo LCR</div>
            <input type="checkbox" checked={form.resultLCR} onChange={(e) => set("resultLCR", e.target.checked)} />
          </div>

          {/* MultiImageUpload giữ nguyên */}
          <MultiImageUpload
            label="IC"
            images={form.imgIC}
            fieldName="imgIC"
            onUpload={handleImageUpload}
            onRemove={(index) => handleRemoveImage('imgIC', index)}
            onViewAll={() => openImagePreview(form.imgIC || [], 'Hình ảnh IC', 0)}
            onViewSingle={(url, title) => openImagePreview(url, title)}
          />

          {/* Textarea giữ nguyên style */}
          <label className="text-xs">
            Ghi chú vấn đề phát sinh
            <textarea 
              value={form.note} 
              onChange={(e) => set("note", e.target.value)} 
              className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
              // onFocus={handleInputFocus}
              placeholder=""
              rows={3}
              style={{ 
                touchAction: 'manipulation',
                resize: 'vertical'
              }}
            />
          </label>

          <MultiImageUpload
            label="Vấn đề phát sinh"
            images={form.imgIssue}
            fieldName="imgIssue"
            onUpload={handleImageUpload}
            onRemove={(index) => handleRemoveImage('imgIssue', index)}
            onViewAll={() => openImagePreview(form.imgIssue || [], 'Hình ảnh Vấn đề phát sinh', 0)}
            onViewSingle={(url, title) => openImagePreview(url, title)}
          />
        </div>
      </div>
    </Modal>
      
    </div>
    <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        imageUrl={imagePreview.imageUrl}
        title={imagePreview.title}
        initialIndex={imagePreview.initialIndex}
        onClose={closeImagePreview}
      />
    </>
  )
})

export default PQCChecks
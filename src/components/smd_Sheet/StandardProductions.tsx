import ViewDetailButton from "../general/ViewDetailButton";
import { useEffect, useRef, useState, memo } from "react";
import Modal from "../general/Modal";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchStandardProduction, updateStandardProduction, uploadStandardProductionFile, uploadStandardProductionIssueImage } from "../../redux/slices/subTableSlice";
import type { StandardProductionData } from "../../redux/slices/subTableSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import ImageViewIcon from "../files/ImageViewIcon";
import { IoEyeSharp } from "react-icons/io5";
import { FaCamera } from "react-icons/fa6";
import ImagePreviewModal from "../files/ImagePreviewModal";
import { useTranslation } from "react-i18next";


const initialStandardProductState: StandardProductionData = {
    id: undefined,
    numMASK: "",
    numMES: "",
    numScanPrinter: "",
    numScanSignMES: "",
    mlS3Closed: "",
    useOnly: "",
    labelProgram: "",
    imgStandard: "",
    note: "",
    imgIssue: "",
};

// Standard Production Section
const StandardProductionSection = memo(({canEdit}: {canEdit: boolean}) => {

  const dispatch = useAppDispatch();
    // khai báo loading để xử lý loading state trong modal
  const { completedTables } = useAppSelector(state => state.subTable);
    // lấy checkModel data từ redux store
  const {standardProduction} = useAppSelector(state => state.subTable);
    // lấy checkModel id từ currentSheet trong changeModel Slice
  const currentSheet = useAppSelector(state => state.changeModel.currentSheet);
  const smdSheetId = currentSheet?.id;
  const standardProductionId = currentSheet?.standardProductionId || standardProduction?.id;
  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StandardProductionData>(initialStandardProductState);
  
  const isSaved = completedTables.includes('StandardProduction');

  const { notification, showNotification,  hideNotification } = useNotification();
  const isUploadingRef = useRef(false);
  const hasUserEditedRef = useRef(false);

  const {t} = useTranslation('standardProduction');

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

    // fetch data khi StandardProduction thay đổi
    useEffect(() => {
      if (standardProductionId) {
        dispatch(fetchStandardProduction(standardProductionId));
      }
    }, [standardProductionId, dispatch]);

    // THÊM: Sync form khi data từ Redux về (lần đầu load)
    useEffect(() => {
      if (standardProduction && !hasUserEditedRef.current && !isUploadingRef.current) {
        setForm(standardProduction);
      }
    }, [standardProduction]); // ← Listen standardProduction

    // GIỮ NGUYÊN: Sync khi mở modal
    useEffect(() => {
      if (open && standardProduction && !hasUserEditedRef.current && !isUploadingRef.current) {
        setForm(standardProduction);
      }
    }, [open]);

    // Reset flags khi đóng modal
    useEffect(() => {
      if (!open) {
        hasUserEditedRef.current = false;
        isUploadingRef.current = false;
      }
    }, [open]);
    if (!standardProductionId) {
    return (
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-500">Đang tải dữ liệu Standard Production...</p>
      </div>
    );
  }

  // xử lý upload hình ảnh với flag
  const handleImageUpload = async (field: 'imgStandard' | 'imgIssue', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    if (!standardProductionId) {
      showNotification('error', 'Lỗi upload', 'Không tìm thấy StandardProduction ID');
      return;
    }
  
    try {
      // Set flag TRƯỚC KHI upload
      isUploadingRef.current = true;
      
      if (field === 'imgStandard') {
        const result = await dispatch(uploadStandardProductionFile({ 
          standardProductionId: Number(standardProductionId), 
          file 
        })).unwrap();
      
        // Chỉ cập nhật field imgStandard, KHÔNG trigger re-sync toàn bộ form
        if (result?.imageUrl) {
          setForm(prev => ({
            ...prev,
            imgStandard: result.imageUrl
          }));
        }
        
        showNotification('success', 'Thành công', 'Upload hình ảnh Standard Production thành công');
      }

      if (field === 'imgIssue') {
        const result = await dispatch(uploadStandardProductionIssueImage({ 
          StandardProductionId: Number(standardProductionId), 
          file 
        })).unwrap();
      
        // Chỉ cập nhật field imgStandard, KHÔNG trigger re-sync toàn bộ form
        if (result?.imageUrl) {
          setForm(prev => ({
            ...prev,
            imgIssue: result.imageUrl
          }));
        }
        
        showNotification('success', 'Thành công', 'Upload hình ảnh Standard Production: Vấn đề phát sinh thành công');
      }
  
    } catch (error) {
      console.error('Failed to upload image:', error);
      showNotification('error', 'Lỗi upload', 'Có lỗi xảy ra khi upload hình ảnh');
    } finally {
      // Reset flag SAU KHI upload xong (thành công hay thất bại)
      isUploadingRef.current = false;
    }
  };
  

  // Wrapper cho set() để đánh dấu user đã edit
  const set = <K extends keyof StandardProductionData>(k: K, v: StandardProductionData[K]) => {
    hasUserEditedRef.current = true; // Đánh dấu user đã edit
    setForm((s) => ({ ...s, [k]: v }));
  };
    
  const submit = async() => {
    if (!standardProductionId) {
      showNotification('error', 'Lỗi lưu Standard Production', 'Không tìm thấy StandardProduction ID');
      return;
    }

    if (!smdSheetId) {
      showNotification('error', 'Lỗi lưu Standard Production', 'Không tìm thấy SMD Sheet ID');
      return;
    }

    try {
      // Dispatch action để update
      await dispatch(updateStandardProduction({
        id: standardProductionId,
        data: form
      })).unwrap();
      
      //Fetch lại data SAU KHI lưu thành công
      if (standardProductionId) {
        await dispatch(fetchStandardProduction(standardProductionId)).unwrap();
      }
      
      // Reset flags
      hasUserEditedRef.current = false;
      isUploadingRef.current = false;
      
      setOpen(false);
      showNotification('success', 'Thành công', 'Cập nhật Standard Production thành công');
    } catch (error) {
      console.error('Failed to update StandardProductions:', error);
      showNotification('error', 'Lỗi lưu Standard Production', 'Có lỗi xảy ra khi cập nhật StandardProductions');
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
      {standardProductionId && (
        <div className={`mb-2 text-xs p-2 rounded flex items-center gap-2 ${
          isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {isSaved && <span className="text-green-600">✓</span>}
          <span>StandardProduction ID: <strong>{standardProductionId}</strong></span>
          {currentSheet?.id && <span>| ChangeModel ID: <strong>{currentSheet.id}</strong></span>}
          {isSaved && <span className="ml-auto font-semibold">{t('status.saved')}</span>}
        </div>
      )}
        {/** repsponsive for desktop */}
        <div className='hidden lg:block w-full overflow-x-auto'>
        <table className="border border-gray-600 w-full text-center opacity-80">
          <tbody>
            {/* Row 10 */}
            <tr>
              <th rowSpan={3} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">{t('title')}</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.numMASK')}</th>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.numMASK || ""}</td>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.numScanPrinter')}</th>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.numScanPrinter || ""}</td>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.mlS3Closed')}</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.useOnly')}</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.labelProgram')}</th>
            </tr>

            {/* Row 11 */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.numMES')}</th>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.numMES || ""}</td>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.numScanSignMES')}</th>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.numScanSignMES || ""}</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.mlS3Closed || ""}</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex flex-row justify-center items-center gap-3">
                  <div className="flex flex-row items-center justify-center gap-1">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4"
                      checked={form.useOnly === "Duksan"}
                      onChange={() => set("useOnly", form.useOnly === "Duksan" ? undefined : "Duksan")}
                    />
                    <label className="flex items-center justify-center gap-2 text-xs">
                      Duksan
                    </label>
                  </div>
                  <div className="flex flex-row items-center justify-center gap-1">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4"
                      checked={form.useOnly === "Heesung"}
                      onChange={() => set("useOnly", form.useOnly === "Heesung" ? undefined : "Heesung")}
                    />
                    <label className="flex items-center justify-center gap-2 text-xs">
                      Heesung
                    </label>
                  </div>
                </div>
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.labelProgram || ""}</td>
            </tr>

            {/** row 12: hình ảnh standard production */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.imageStandard')}</th>
              <td colSpan={10} className="border border-gray-600 px-2 py-2 text-xs">
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <ImageViewIcon 
                      imageUrl={form.imgStandard} 
                      title="Hình ảnh Standard Production"
                      onView={openImagePreview}
                    />
                  </div>
                </div>
              </td>
            </tr>
            {/** row 12.1: Ghi chú vấn đề phát sinh */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Ghi chú vấn đề phát sinh</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">{form.note || ""}</td>
            </tr>
            {/** row 13: hình ảnh vấn đề phát sinh */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Hình ảnh vấn đề phát sinh</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">
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
        
{/* Responsive for mobile */}
{/* Mobile View - Card dọc */}
<div className="lg:hidden">
  <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm" onClick={() => setOpen(true)}>
    <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">{t('title')}</h3>
    {/* Row 1: Số quản lý trên Mask & Số đăng ký trên MES */}
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.numMASK')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.numMASK || "—"}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.numMES')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.numMES || "—"}
        </div>
      </div>
    </div>

    {/* Row 2: Số dao quét Printer */}
        <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.numScanPrinter')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
            {form.numScanPrinter || "—"}
        </div>
        </div>

        {/* Row 3: Số đăng ký dao quét trên MES */}
        <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.numScanSignMES')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
            {form.numScanSignMES || "—"}
        </div>
        </div>

    {/* Row 3: Liệu MSL3 mở đóng gói & Chương trình máy label */}
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.mlS3Closed')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.mlS3Closed || "—"}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.labelProgram')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.labelProgram || "—"}
        </div>
      </div>
    </div>

    {/* Row 4: Chỉ sử dụng (full width) */}
    <div className="mb-3">
      <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.useOnly')}</div>
      <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
        {form.useOnly === "Duksan" 
          ? "Duksan" 
          : form.useOnly === "Heesung" 
          ? "Heesung" 
          : "—"}
      </div>
    </div>

    {/** Hình ảnh Standard production */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.imageStandard')}</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center">
          <ImageViewIcon 
            imageUrl={form.imgStandard} 
            title="Hình ảnh Standard Production"
            onView={openImagePreview}
          />
        </div>
      </div>

    {/* ghi chú vấn đề phát sinh */}
    <div className="mb-3">
      <div className="text-xs font-semibold text-gray-600 mb-1">Ghi chú vấn đề phát sinh</div>
      <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
        {form.note || "—"}
      </div>
    </div>

    {/** hình ảnh vấn đề phát sinh */}
    <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Hình ảnh vấn đề phát sinh</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center">
          <ImageViewIcon 
            imageUrl={form.imgIssue} 
            title="Hình ảnh StandardProduction: Vấn đề phát sinh"
            onView={openImagePreview}
          />
        </div>
      </div>
  </div>
</div>
      {/** buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)} disabled={!canEdit}>{t('button.edit')}</ViewDetailButton>
        {/* <ViewDetailButton color="green" onOpen={() => {}}>Lưu</ViewDetailButton> */}
      </div>

<Modal
  open={open}
  title="Chi tiết Tiêu chuẩn sản xuất"
  onClose={() => setOpen(false)}
  onSave={submit}
>
  <div className="grid gap-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
    <div className="grid grid-cols-2 gap-3">
      <label className="text-xs">
        Số quản lý trên Mask
        <input 
          value={form.numMASK ?? ""} 
          onChange={(e) => set("numMASK", e.target.value.toUpperCase())} 
          className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
          placeholder=""
        />
      </label>

      <label className="text-xs">
        Số đăng ký trên MES
        <input 
          value={form.numMES ?? ""} 
          onChange={(e) => set("numMES", e.target.value.toUpperCase())} 
          className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
          placeholder=""
        />
      </label>
    </div>

    <label className="text-xs">
    Số dao quét Printer
    <input 
        value={form.numScanPrinter ?? ""} 
        onChange={(e) => set("numScanPrinter", e.target.value.toUpperCase())}
        className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
        placeholder=""
    />
    </label>

    <label className="text-xs">
    Số đăng ký dao quét trên MES
    <input 
        value={form.numScanSignMES ?? ""} 
        onChange={(e) => set("numScanSignMES", e.target.value.toUpperCase())}
        className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
        placeholder=""
    />
    </label>

    <label className="text-xs">
      Liệu MSL3 mở đóng gói
      <input 
        value={form.mlS3Closed ?? ""} 
        onChange={(e) => set("mlS3Closed", e.target.value.toUpperCase())} 
        className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
        placeholder=""
      />
    </label>

    <label className="text-xs">
      Chương trình máy label
      <input 
        value={form.labelProgram ?? ""} 
        onChange={(e) => set("labelProgram", e.target.value.toUpperCase())} 
        className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
        placeholder=""
      />
    </label>

    <div className="flex flex-col gap-2">
      <div>
        <div className="text-xs mb-1">Chỉ sử dụng</div>
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={() => set("useOnly", "Duksan")} 
            className={`px-3 py-2 rounded text-sm border ${form.useOnly === "Duksan" ? "bg-blue-100 border-blue-500" : ""}`}
          >
            Duksan
          </button>
          <button 
            type="button" 
            onClick={() => set("useOnly", "Heesung")} 
            className={`px-3 py-2 rounded text-sm border ${form.useOnly === "Heesung" ? "bg-blue-100 border-blue-500" : ""}`}
          >
            Heesung
          </button>
          <button 
            type="button" 
            onClick={() => set("useOnly", undefined)} 
            className="px-3 py-2 rounded text-sm border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>

    <label className="block text-sm font-medium mb-1">Hình ảnh Standard Production</label>
      <div className="">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload('imgStandard', e)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
      </div>

      
            <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleImageUpload('imgStandard', e)}
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
                Chụp ảnh Standard Production
              </div>
          </label>
          </div>
      
      {/* Preview Section */}
      {form.imgStandard && (
      <div className="mt-0 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600 mb-2">Ảnh đã chọn:</p>
        <div className="flex items-center gap-3">
          <img 
            src={form.imgStandard} 
            alt="Standard Production Preview" 
            className="w-24 h-24 object-cover rounded-lg border-2 border-blue-500 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => openImagePreview(form.imgStandard!, "Hình ảnh Standard Production")} 
          />
          <button
            type="button"
            onClick={() => openImagePreview(form.imgStandard!, "Hình ảnh Standard Production")}
            className="flex-1 text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 py-2 px-3 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <IoEyeSharp size={20} />
            <span className="text-sm font-medium">Xem ảnh</span>
          </button>
        </div>
      </div>
    )}

    <label className="text-xs">
      Ghi chú vấn đề phát sinh
      <textarea 
        value={form.note} 
        onChange={(e) => set("note", e.target.value.toUpperCase())} 
        className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
        placeholder=""
      />
    </label>

      <label className="block text-sm font-medium mb-1">Hình ảnh Vấn đề phát sinh</label>
      <div className="">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload('imgIssue', e)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
      </div>

      
            <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleImageUpload('imgIssue', e)}
              className="hidden"
              id="camera-capture-issue-standard"
            />
            <label
            htmlFor="camera-capture-issue-standard"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors font-medium shadow-sm"
          >
            {/* Thêm display: inline-block hoặc inline-flex */}
              <div className="inline-flex items-center">
                <FaCamera size={15} />
              </div>
              <div className="inline-flex items-center mx-2">
                Chụp ảnh vấn đề phát sinh
              </div>
          </label>
          </div>
      
      {/* Preview Section */}
      {form.imgIssue && (
      <div className="mt-0 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600 mb-2">Ảnh đã chọn:</p>
        <div className="flex items-center gap-3">
          <img 
            src={form.imgIssue} 
            alt="Standard Production Preview" 
            className="w-24 h-24 object-cover rounded-lg border-2 border-blue-500 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => openImagePreview(form.imgIssue!, "Hình ảnh Standard Production: Vấn đề phát sinh")} 
          />
          <button
            type="button"
            onClick={() => openImagePreview(form.imgIssue!, "Hình ảnh Standard Production: Vấn đề phát sinh")}
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
  );
});

export default StandardProductionSection
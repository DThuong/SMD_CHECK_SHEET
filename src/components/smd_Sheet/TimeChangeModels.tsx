/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, memo, useRef } from "react";
import Modal from "../general/Modal";
import ViewDetailButton from "../general/ViewDetailButton";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { updateTimeChangeModel, fetchTimeChangeModel, uploadTimeChangeModelIssueImage, deleteTimeChangeModelIssueImage } from "../../redux/slices/subTableSlice";
import type { TimeChangeModelData } from "../../redux/slices/subTableSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import { formatDateTime } from "../../utils/formatTime";
import { useTranslation } from "react-i18next";
import ImageViewIcon from "../files/ImageViewIcon";
import ImagePreviewModal from "../files/ImagePreviewModal";
import MultiImageUpload from "../files/MultiImageUpload";

const initialTimeChangeState: TimeChangeModelData = {
    qc: "",
    result: "",
    startTime: undefined, // time
    endTime: undefined, // time
    countTime: undefined,
    history: "",
    note: "",
    imgIssue: [],
};

const TimeChangeModels = memo(({canEdit}: {canEdit: boolean}) => {
      const [form, setForm] = useState<TimeChangeModelData>(initialTimeChangeState);
      const [open, setOpen] = useState(false);
  
      const dispatch = useAppDispatch();
      
      // Lấy dữ liệu từ Redux store
      const { timeChangeModel ,completedTables } = useAppSelector(state => state.subTable);
      const smdSheetId = useAppSelector(state => state.changeModel?.currentSheet?.id);
      const currentSheet = useAppSelector(state => state.changeModel.currentSheet);
      const timeChangeModelId = currentSheet?.timeChangeModelId || timeChangeModel?.id;
      const isSaved = completedTables.includes('TimeChangeModel');
      const { notification, showNotification,  hideNotification } = useNotification();
      const {t} = useTranslation('timeChangeModel');
      const {t: t2} = useTranslation('common');

      const isUploadingRef = useRef(false);
      const hasUserEditedRef = useRef(false);
      const deletingRef = useRef(false);

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

      // fetch data khi id thay đổi
      useEffect(() => {
        if (timeChangeModelId) {
          dispatch(fetchTimeChangeModel(timeChangeModelId));
        }
      }, [timeChangeModelId, dispatch]);

      useEffect(() => {
        if (timeChangeModel && !hasUserEditedRef.current && !isUploadingRef.current && !deletingRef.current) {
          setForm(timeChangeModel);
        }
      }, [timeChangeModel]);

      useEffect(() => {
        if (!open) {
          hasUserEditedRef.current = false;
          isUploadingRef.current = false;
          deletingRef.current = false;
        }
      }, [open]);

        // xử lý upload hình ảnh với flag
        const handleImageUpload = async (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (!file) return;
        
          if (!timeChangeModelId) {
            showNotification('error', 'Lỗi upload', 'Không tìm thấy TimeChangeModel ID');
            return;
          }
        
          try {
            // Set flag TRƯỚC KHI upload
            isUploadingRef.current = true;
            
            if (field === 'imgIssue') {
              const result = await dispatch(uploadTimeChangeModelIssueImage({ 
                timeChangeModelId: Number(timeChangeModelId), 
                file 
              })).unwrap();
            
              // Thêm ảnh mới vào array
               if (result?.imageUrl) {
                  const fetchData = await dispatch(fetchTimeChangeModel(timeChangeModelId)).unwrap();
                  setForm(fetchData);
                }
              
              showNotification('success', 'Thành công', 'Upload hình ảnh Vấn đề phát sinh thành công');
            }
        
          } catch (error) {
            console.error('Failed to upload image:', error);
            showNotification('error', 'Lỗi upload', 'Có lỗi xảy ra khi upload hình ảnh');
          } finally {
            // Reset flag SAU KHI upload xong (thành công hay thất bại)
            isUploadingRef.current = false;
          }
        };
        
    const handleRemoveImage = async (index: number) => {
      if (!timeChangeModelId) {
        showNotification('error', 'Lỗi xóa', 'Không tìm thấy TimeChangeModel ID');
        return;
      }

      const imageUrl = form.imgIssue?.[index];
      if (!imageUrl) return;

      try {
        deletingRef.current = true;
        // Gọi API delete từ backend
        await dispatch(deleteTimeChangeModelIssueImage({ 
          timeChangeModelId: Number(timeChangeModelId), 
          imageUrl 
        })).unwrap();

        // Cập nhật local state
        setForm(prev => ({
          ...prev,
          imgIssue: prev.imgIssue?.filter((_, i) => i !== index) || []
        }));

        showNotification('success', 'Đã xóa', 'Đã xóa ảnh thành công');
      } catch (error) {
        console.error('Failed to delete image:', error);
        showNotification('error', 'Lỗi xóa', 'Không thể xóa ảnh');
      } finally {
        deletingRef.current = false;
      }
    };
  
       const set = <K extends keyof TimeChangeModelData>(k: K, v: TimeChangeModelData[K]) => {
        hasUserEditedRef.current = true;
        setForm((s) => ({ ...s, [k]: v }));
      };
  
      const submit = async () => {
        // kiểm tra program Check id
        if (!timeChangeModelId) {
          showNotification('error', 'Lỗi lưu Time Change Model', 'Không tìm thấy timeChangeModel ID');
          return;
        }
  
        if (!smdSheetId) {
          showNotification('error', 'Lỗi lưu Time Change Model', 'Không tìm thấy SMD Sheet ID');
          return;
        }
  
        try {
          // Dispatch action để update
          await dispatch(updateTimeChangeModel({
            id: timeChangeModelId,
            data: form
          })).unwrap();
          
          setOpen(false);
          showNotification('success', 'Thành công', 'Cập nhật Time Change Model thành công');
        } catch (error) {
          console.error('Failed to update timeChangeModel:', error);
          showNotification('error', 'Lỗi lưu Time Change Model', 'Có lỗi xảy ra khi cập nhật timeChangeModel');
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
      {timeChangeModelId && (
        <div className={`mb-2 text-xs p-2 rounded flex items-center gap-2 no-print ${
          isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {isSaved && <span className="text-green-600">✓</span>}
          <span>TimeChangeModel ID: <strong>{timeChangeModelId}</strong></span>
          {currentSheet?.id && <span>| ChangeModel ID: <strong>{currentSheet.id}</strong></span>}
          {isSaved && <span className="ml-auto font-semibold">{t('status.saved')}</span>}
        </div>
      )}
      {/* Desktop View */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="border border-gray-600 w-full min-w-[1400px] text-center opacity-80">
          <tbody>
            {/* Row 12 - Title */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">
                {t('title')}
              </th>
              <td colSpan={12} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>

            {/* Row 13 - Section Headers */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.category')}</th>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.name')}</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.startTime')}</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.endTime')}</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.countTime')}</th>
              <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">{t('fields.history')}</th>
            </tr>

            {/* Row 14 - Result */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Result</th>
              <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">{form.result || ""}</td>
              <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{formatDateTime(form.startTime || "")}</td>
              <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{formatDateTime(form.endTime || "")}</td>
              <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.countTime ?? ""}</td>
              <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.history || ""}</td>
            </tr>

            {/* Row 15 - QC */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">QC</th>
              <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">{form.qc || ""}</td>
            </tr>

            {/*** Row 16 - Note */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">{t2('issueNote')}</th>
              <td colSpan={13} className="border border-gray-600 px-2 py-2 text-xs">{form.note || ""}</td>
            </tr>

            {/** Row 17 - Hình ảnh vấn đề phát sinh */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">{t2('issueImg')}</th>
              <td colSpan={13} className="border border-gray-600 px-2 py-2 text-xs">
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
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
          <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">{t('title')}</h3>

          {/* tên QC */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.nameQC')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.qc || "—"}
            </div>
          </div>

          {/* Tên Result */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.nameResult')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.result || "—"}
            </div>
          </div>
          
          {/* Thời gian bắt đầu */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.startTime')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {formatDateTime(form.startTime) || "—"}
            </div>
          </div>

          {/* Thời gian kết thúc */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.endTime')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {formatDateTime(form.endTime) || "—"}
            </div>
          </div>

          {/* Số phút */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.countTime')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.countTime ?? "—"}
            </div>
          </div>

          {/* Lịch sử */}
          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t('fields.history')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap wrap-break-word">
              {form.history || "—"}
            </div>
          </div>

          {/** Note */}
          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t2('issueNote')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap wrap-break-word">
              {form.note || "—"}
            </div>
          </div>

          {/** Hình ảnh Vấn đề phát sinh */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">{t2('issueImg')}</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center">
              <ImageViewIcon 
                imageUrl={form.imgIssue} 
                title="Hình ảnh Vấn đề phát sinh"
                onView={openImagePreview}
              />
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

      {/* Modal */}
<Modal
  open={open}
  title="Chi tiết Thời gian đổi model"
  onClose={() => setOpen(false)}
  onSave={submit}
>
  <div className="grid gap-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
    {/* Time change model Section */}
    <div className="pb-3 border-b border-gray-200">
      <div className="grid grid-cols-2 gap-3 mb-3">

        <div className="min-w-0">
          <label className="text-xs block mb-1">Tên QC</label>
          <input
            type="text"
            value={form.qc ?? ""}
            onChange={(e) => set("qc", e.target.value.toUpperCase())}
            className="block w-full border rounded px-3 py-2 text-sm uppercase"
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Tên Result</label>
          <input
            type="text"
            value={form.result ?? ""}
            onChange={(e) => set("result", e.target.value.toUpperCase())}
            className="block w-full border rounded px-3 py-2 text-sm uppercase"
          />
        </div>
        
        <div className="min-w-0">
          <label className="text-xs block mb-1">Thời gian bắt đầu</label>
          <input
            type="datetime-local"
            value={form.startTime || ""}
            onChange={(e) => set("startTime", e.target.value || undefined)}
            className="block w-full border rounded px-3 py-2 text-sm"
            style={{ 
              WebkitAppearance: 'none',
              minHeight: '44px'
            }}
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Thời gian kết thúc</label>
          <input
            type="datetime-local"
            value={form.endTime || ""}
            onChange={(e) => set("endTime", e.target.value || undefined)}
            className="block w-full border rounded px-3 py-2 text-sm"
            style={{ 
              WebkitAppearance: 'none',
              minHeight: '44px'
            }}
          />
        </div>
      </div>

      <div className="mb-3 min-w-0">
        <label className="text-xs block mb-1">Số phút</label>
        <input
          type="number"
          value={form.countTime ?? ""}
          onChange={(e) => set("countTime", Number(e.target.value))}
          className="block w-full border rounded px-3 py-2 text-sm"
          placeholder="Nhập số phút..."
        />
      </div>

      <div className="min-w-0">
        <label className="text-xs block mb-1">Lịch sử</label>
        <textarea
          value={form.history ?? ""}
          onChange={(e) => set("history", e.target.value.toUpperCase())}
          className="focus:outline-none block w-full border rounded px-3 py-2 text-sm min-h-20 resize-y wrap-break-words uppercase"
          placeholder=""
        />
      </div>

      {/** Vấn đề phát sinh */}
      <div className="min-w-0">
        <label className="text-xs block mb-1">Ghi chú vấn đề phát sinh</label>
        <textarea
          value={form.note}
          onChange={(e) => set("note", e.target.value.toUpperCase())}
          className="focus:outline-none block w-full border rounded px-3 py-2 text-sm min-h-20 resize-y wrap-break-words uppercase"
          placeholder=""
        />
      </div>

      {/** Hình ảnh vấn đề phát sinh */}
      <MultiImageUpload
        label="Vấn đề phát sinh"
        images={form.imgIssue}
        fieldName="imgIssue"
        onUpload={handleImageUpload}
        onRemove={handleRemoveImage}
        onViewAll={() => openImagePreview(form.imgIssue || [], 'Hình ảnh Vấn đề phát sinh', 0)}
        onViewSingle={(url, title) => openImagePreview(url, title)}
      />
    </div>
  </div>
</Modal>
<ImagePreviewModal
  isOpen={imagePreview.isOpen}
  imageUrl={imagePreview.imageUrl}
  title={imagePreview.title}
  initialIndex={imagePreview.initialIndex} 
  onClose={closeImagePreview}
/>
    </div>
  );
});

export default TimeChangeModels;
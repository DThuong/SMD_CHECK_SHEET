/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, memo, useRef } from "react";
import Modal from "../general/Modal";
import ViewDetailButton from "../general/ViewDetailButton";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { updateTimeChangeModel, fetchTimeChangeModel, uploadTimeChangeModelIssueImage } from "../../redux/slices/subTableSlice";
import type { TimeChangeModelData } from "../../redux/slices/subTableSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import { formatDateTime } from "../../utils/formatTime";
import { useTranslation } from "react-i18next";
import ImageViewIcon from "../files/ImageViewIcon";
import { FaCamera } from "react-icons/fa";
import { IoEyeSharp } from "react-icons/io5";
import ImagePreviewModal from "../files/ImagePreviewModal";

const initialTimeChangeState: TimeChangeModelData = {
    qc: "",
    result: "",
    startTime: undefined, // time
    endTime: undefined, // time
    countTime: undefined,
    history: "",
    note: "",
    imgIssue: "",
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

        // xử lý upload hình ảnh với flag
        const handleImageUpload = async (field: 'imgIssue', event: React.ChangeEvent<HTMLInputElement>) => {
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
            
              // Chỉ cập nhật field, KHÔNG trigger re-sync toàn bộ form
              if (result?.imageUrl) {
                setForm(prev => ({
                  ...prev,
                  imgIssue: result.imageUrl
                }));
              }
              
              showNotification('success', 'Thành công', 'Upload hình ảnh time change model: Vấn đề phát sinh thành công');
            }
        
          } catch (error) {
            console.error('Failed to upload image:', error);
            showNotification('error', 'Lỗi upload', 'Có lỗi xảy ra khi upload hình ảnh');
          } finally {
            // Reset flag SAU KHI upload xong (thành công hay thất bại)
            isUploadingRef.current = false;
          }
        };
        

  
      // fetch data khi timeChangeModel thay đổi
      useEffect(() => {
        if (timeChangeModelId) {
          dispatch(fetchTimeChangeModel(timeChangeModelId));
        }
      }, [timeChangeModelId, dispatch]);
      // sync form với redux store thay vì sử dụng context
      useEffect(() => {
        if (timeChangeModel) {
          setForm(timeChangeModel);
        }
      }, [timeChangeModel]);
  
      const set = <K extends keyof TimeChangeModelData>(k: K, v: TimeChangeModelData[K]) =>
        setForm((s) => ({ ...s, [k]: v }));
  
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
            id: smdSheetId,
            data: form
          })).unwrap();
          
          setOpen(false);
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
  <div className="grid gap-3 max-h-[60vh] overflow-y-auto px-1">
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
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Thời gian kết thúc</label>
          <input
            type="datetime-local"
            value={form.endTime || ""}
            onChange={(e) => set("endTime", e.target.value || undefined)}
            className="block w-full border rounded px-3 py-2 text-sm"
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
        <label className="block text-xs font-medium mb-1 mt-2">Hình ảnh vấn đề phát sinh</label>
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
                    id="camera-capture-issue-timeChangeModel"
                  />
                  <label
                  htmlFor="camera-capture-issue-timeChangeModel"
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors font-medium shadow-sm"
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
                  onClick={() => openImagePreview(form.imgIssue!, "Hình ảnh TimeChangeModel: vấn đề phát sinh")} 
                />
                <button
                  type="button"
                  onClick={() => openImagePreview(form.imgIssue!, "Hình ảnh TimeChangeModel: vấn đề phát sinh")}
                  className="flex-1 text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 py-2 px-3 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <IoEyeSharp size={20} />
                  <span className="text-sm font-medium">Xem ảnh</span>
                </button>
              </div>
            </div>
          )}
    </div>
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

export default TimeChangeModels;
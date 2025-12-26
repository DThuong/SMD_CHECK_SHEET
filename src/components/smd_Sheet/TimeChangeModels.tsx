import { useEffect, useState } from "react";
import Modal from "../general/Modal";
import ViewDetailButton from "../general/ViewDetailButton";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { updateTimeChangeModel, fetchTimeChangeModel } from "../../redux/slices/subTableSlice";
import type { TimeChangeModelData } from "../../redux/slices/subTableSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import { formatDateTime } from "../../utils/formatTime";

const initialTimeChangeState: TimeChangeModelData = {
    qc: "",
    result: "",
    startTime: undefined, // time
    endTime: undefined, // time
    countTime: undefined,
    history: "",
};

const TimeChangeModels = ({canEdit}: {canEdit: boolean}) => {
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
  
      // fetch data khi programcheck thay đổi
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
        <div className={`mb-2 text-xs p-2 rounded flex items-center gap-2 ${
          isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {isSaved && <span className="text-green-600">✓</span>}
          <span>TimeChangeModel ID: <strong>{timeChangeModelId}</strong></span>
          {currentSheet?.id && <span>| ChangeModel ID: <strong>{currentSheet.id}</strong></span>}
          {isSaved && <span className="ml-auto font-semibold">Đã lưu</span>}
        </div>
      )}
      {/* Desktop View */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="border border-gray-600 w-full min-w-[1400px] text-center opacity-80">
          <tbody>
            {/* Row 12 - Title */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">
                Thời gian đổi model
              </th>
              <td colSpan={12} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>

            {/* Row 13 - Section Headers */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Hạng mục</th>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tên</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian bắt đầu</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian kết thúc</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số phút</th>
              <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Lịch sử</th>
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
          </tbody>
        </table>
      </div>

      {/* Mobile View - Card dọc */}
      <div className="lg:hidden">
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
          <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">Thời gian đổi model</h3>

          {/* tên QC */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên QC</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.qc || "—"}
            </div>
          </div>

          {/* Tên Result */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên Result</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.result || "—"}
            </div>
          </div>
          
          {/* Thời gian bắt đầu */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian bắt đầu</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.startTime || "—"}
            </div>
          </div>

          {/* Thời gian kết thúc */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian kết thúc</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.endTime || "—"}
            </div>
          </div>

          {/* Số phút */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Số phút</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.countTime ?? "—"}
            </div>
          </div>

          {/* Lịch sử */}
          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Lịch sử</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap wrap-break-word">
              {form.history || "—"}
            </div>
          </div>
        </div>

      </div>

      {/* Buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)} disabled={!canEdit}>Chỉnh sửa</ViewDetailButton>
        {/* <ViewDetailButton color="green" onOpen={() => {}}>Lưu</ViewDetailButton> */}
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
            onChange={(e) => set("qc", e.target.value)}
            className="block w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Tên Result</label>
          <input
            type="text"
            value={form.result ?? ""}
            onChange={(e) => set("result", e.target.value)}
            className="block w-full border rounded px-3 py-2 text-sm"
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
          onChange={(e) => set("countTime", e.target.value ? Number(e.target.value) : undefined)}
          className="block w-full border rounded px-3 py-2 text-sm"
          placeholder="Nhập số phút..."
        />
      </div>

      <div className="min-w-0">
        <label className="text-xs block mb-1">Lịch sử</label>
        <textarea
          value={form.history ?? ""}
          onChange={(e) => set("history", e.target.value)}
          className="focus:outline-none block w-full border rounded px-3 py-2 text-sm min-h-20 resize-y wrap-break-words"
          placeholder="Nhập lịch sử..."
        />
      </div>
    </div>
  </div>
</Modal>
    </div>
  );
};

export default TimeChangeModels;
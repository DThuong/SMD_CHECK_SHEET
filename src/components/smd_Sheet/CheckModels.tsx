import { useState, useEffect } from "react";
import Modal from "../Modal";
import ViewDetailButton from "../ViewDetailButton";
import { useAppDispatch, useAppSelector  } from "../../redux/hooks";
import { updateCheckModel } from "../../redux/slices/subTableSlice";
import type { CheckModelData } from "../../redux/slices/subTableSlice";

const initialFormState: CheckModelData = {
  lineChange: "",
  model: "",
  fCode: "",
  pcBver: "",
  workOrder: "",
  usedCNcard: undefined,
  revS15: "",
  revMounter: "",
  qty: undefined,
  feederCheck: "",
  opAccept: "",
  jig: undefined,
  codePCB: "",
};


export default function CheckModels() {
  const dispatch = useAppDispatch();
  // khai báo loading để xử lý loading state trong modal
  const { completedTables } = useAppSelector(state => state.subTable);
  // lấy checkModel data từ redux store
  const {checkModel} = useAppSelector(state => state.subTable);
  // lấy checkModel id từ currentSheet trong changeModel Slice
  const currentSheet = useAppSelector(state => state.changeModel.currentSheet);
  const checkModelId = currentSheet?.checkModelId;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CheckModelData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSaved = completedTables.includes('CheckModel');

  // sync form với redux store thay vì sử dụng context
  useEffect(() => {
      if (checkModel) {
        setForm(checkModel);
      }
    }, [checkModel]);

  const set = <K extends keyof CheckModelData>(k: K, v: CheckModelData[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  // VALIDATION
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!form.lineChange?.trim()) {
      newErrors.lineChange = "Vui lòng nhập Line đổi";
    }
    if (!form.model?.trim()) {
      newErrors.model = "Vui lòng nhập Model/Side";
    }
    if (!form.workOrder?.trim()) {
      newErrors.workOrder = "Vui lòng nhập WorkOrder";
    }

    // Number validation
    if (form.qty !== undefined && form.qty < 0) {
      newErrors.qty = "Qty phải là số dương";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // thay đổi submit
  const submit = async () => {
    // Validate
    if (!validate()) {
      alert('❌ Vui lòng kiểm tra lại các trường bắt buộc!');
      return;
    }

    if (!checkModelId) {
      alert('❌ Không có CheckModel ID!');
      return;
    }

    try {
      const apiData: CheckModelData = {
        lineChange: form.lineChange,
        model: form.model,
        fCode: form.fCode,
        pcBver: form.pcBver,
        workOrder: form.workOrder,
        usedCNcard: form.usedCNcard,
        revS15: form.revS15,
        revMounter: form.revMounter,
        qty: form.qty,
        feederCheck: form.feederCheck,
        opAccept: form.opAccept,
        jig: form.jig,
        codePCB: form.codePCB,
      };

      // dispatch redux action
      await dispatch(updateCheckModel({
        id: checkModelId,
        data: apiData
      })).unwrap();
      
      setOpen(false);
      setErrors({});
      
    } catch (error: any) {
      console.error('❌ Lỗi:', error);
      alert('❌ Lỗi: ' + (error || 'Không thể cập nhật'));
    }
  };

  return (
    <div className="p-0 py-4 w-full">
      {/* Status indicator */}
      {checkModelId && (
        <div className={`mb-2 text-xs p-2 rounded flex items-center gap-2 ${
          isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {isSaved && <span className="text-green-600">✓</span>}
          <span>CheckModel ID: <strong>{checkModelId}</strong></span>
          {currentSheet?.id && <span>| ChangeModel ID: <strong>{currentSheet.id}</strong></span>}
          {isSaved && <span className="ml-auto font-semibold">Đã lưu</span>}
        </div>
      )}

      {/* Website View - Table (giữ nguyên từ component gốc) */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="border border-gray-600 w-full text-center opacity-60">
          <thead>
            <tr>
              <th rowSpan={2} className="border px-2 py-2 text-xs bg-gray-100">Line đổi</th>
              <td rowSpan={2} className="border px-2 py-2 text-xs">{form.lineChange || ""}</td>
              <td rowSpan={2} className="border px-2 py-2 text-xs bg-gray-300"></td>
              <th className="border px-2 py-2 text-xs bg-gray-100">Model/Side</th>
              <th colSpan={2} className="border px-2 py-2 text-xs bg-gray-100">T/B</th>
              <th className="border px-2 py-2 text-xs bg-gray-100">REV S15</th>
              <td className="border px-2 py-2">{form.revS15 || ""}</td>
              <th rowSpan={2} className="border px-2 py-2 text-xs bg-gray-100">DATE</th>
              <th colSpan={2} className="border px-2 py-2 text-xs bg-gray-100">Feeder Check</th>
              <td className="border px-2 py-2 text-xs">{form.feederCheck || ""}</td>
              <td rowSpan={2} className="border px-2 py-2 bg-gray-300"></td>
            </tr>

            <tr>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">F Code(3in1)</th>
              <td colSpan={2} className="border px-2 py-2 text-xs">{form.model || ""}</td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">REV MOUNTER</th>
              <td className="border px-2 py-2 text-xs">{form.revMounter || ""}</td>
              <th colSpan={2} className="border px-2 py-2 text-xs bg-gray-100">OP Accept</th>
              <td className="border px-2 py-2 text-xs">{form.opAccept || ""}</td>
            </tr>

            <tr>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">PCB ver</th>
              <td colSpan={2} className="border px-2 py-2 text-xs">{form.fCode || ""}</td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">Work Order</th>
              <td className="border px-2 py-2">{form.pcBver || ""}</td>
              <th colSpan={2} className="border px-2 py-2 text-xs bg-gray-100">Used CN card</th>
              <td className="border px-2 py-2">
                {form.usedCNcard !== undefined ? (form.usedCNcard ? "Yes" : "No") : "—"}
              </td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">Qty</th>
              <td className="border px-2 py-2 text-xs">{form.qty}</td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">JIG</th>
              <td className="border px-2 py-2">
                {form.jig !== undefined ? (form.jig ? "Yes" : "No") : "—"}
              </td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">Mã PCB</th>
              <td className="border px-2 py-2 text-xs">{form.codePCB || ""}</td>
            </tr>
          </thead>
        </table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden">
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm" onClick={() => setOpen(true)}>
          <h3 className="text-base font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300 flex items-center gap-2">
            Check Model
            {isSaved && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Đã lưu</span>}
          </h3>
          {/* Mobile fields */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Line đổi</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.lineChange || "—"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Model/Side</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.model || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)}>
          {isSaved ? 'Chỉnh sửa' : 'Chỉnh sửa'}
        </ViewDetailButton>
      </div>

      {/* Modal with Validation */}
      <Modal
        open={open}
        title="Chi tiết Check Model"
        onClose={() => {
          setOpen(false);
          setErrors({});
        }}
        onSave={submit}
        // saveButtonDisabled={loading}
        // saveButtonText={loading ? 'Đang lưu...' : 'Lưu'}
      >
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
          {/* Line đổi - Required */}
          <label className="text-xs">
            Line đổi <span className="text-red-500">*</span>
            <input 
              value={form.lineChange ?? ""} 
              onChange={(e) => {
                set("lineChange", e.target.value);
                if (errors.lineChange) setErrors(prev => ({ ...prev, lineChange: '' }));
              }}
              className={`mt-1 block w-full border rounded px-3 py-2 text-base ${
                errors.lineChange ? 'border-red-500' : ''
              }`}
              placeholder="Nhập line đổi..."
            />
            {errors.lineChange && <p className="text-red-500 text-xs mt-1">{errors.lineChange}</p>}
          </label>

          {/* Model/Side - Required */}
          <label className="text-xs">
            Model/Side <span className="text-red-500">*</span>
            <input 
              value={form.model ?? ""} 
              onChange={(e) => {
                set("model", e.target.value);
                if (errors.model) setErrors(prev => ({ ...prev, model: '' }));
              }}
              className={`mt-1 block w-full border rounded px-3 py-2 text-base ${
                errors.model ? 'border-red-500' : ''
              }`}
              placeholder="Nhập model/side..."
            />
            {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
          </label>

          {/* F Code (3in1) */}
          <label className="text-xs">
            F Code (3in1)
            <input 
              value={form.fCode ?? ""} 
              onChange={(e) => set("fCode", e.target.value)} 
              className="mt-1 block w-full border rounded px-3 py-2 text-base"
              placeholder="Nhập F code..."
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* REV S15 */}
            <label className="text-xs">
              REV S15
              <input 
                value={form.revS15 ?? ""} 
                onChange={(e) => set("revS15", e.target.value)} 
                className="mt-1 block w-full border rounded px-3 py-2 text-base"
              />
            </label>

            {/* REV MOUNTER */}
            <label className="text-xs">
              REV MOUNTER
              <input 
                value={form.revMounter ?? ""} 
                onChange={(e) => set("revMounter", e.target.value)} 
                className="mt-1 block w-full border rounded px-3 py-2 text-base"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Feeder Check */}
            <label className="text-xs">
              Feeder Check
              <input 
                type="datetime-local" 
                value={form.feederCheck ?? ""} 
                onChange={(e) => set("feederCheck", e.target.value)} 
                className="mt-1 block w-full border rounded px-3 py-2 text-base"
              />
            </label>

            {/* OP Accept */}
            <label className="text-xs">
              OP Accept
              <input 
                type="datetime-local" 
                value={form.opAccept ?? ""} 
                onChange={(e) => set("opAccept", e.target.value)} 
                className="mt-1 block w-full border rounded px-3 py-2 text-base"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* PCB ver */}
            <label className="text-xs">
              PCB ver
              <input 
                value={form.pcBver ?? ""} 
                onChange={(e) => set("pcBver", e.target.value)} 
                className="mt-1 block w-full border rounded px-3 py-2 text-base"
              />
            </label>

            {/* Work Order - Required */}
            <label className="text-xs">
              Work Order <span className="text-red-500">*</span>
              <input 
                value={form.workOrder ?? ""} 
                onChange={(e) => {
                  set("workOrder", e.target.value);
                  if (errors.workOrder) setErrors(prev => ({ ...prev, workOrder: '' }));
                }}
                className={`mt-1 block w-full border rounded px-3 py-2 text-base ${
                  errors.workOrder ? 'border-red-500' : ''
                }`}
                placeholder="Nhập work order..."
              />
              {errors.workOrder && <p className="text-red-500 text-xs mt-1">{errors.workOrder}</p>}
            </label>
          </div>

          {/* Qty */}
          <label className="text-xs">
            Qty
            <input 
              type="number"
              value={form.qty ?? ""} 
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                set("qty", val);
                if (errors.qty) setErrors(prev => ({ ...prev, qty: '' }));
              }}
              className={`mt-1 block w-full border rounded px-3 py-2 text-base ${
                errors.qty ? 'border-red-500' : ''
              }`}
              min="0"
            />
            {errors.qty && <p className="text-red-500 text-xs mt-1">{errors.qty}</p>}
          </label>
          
          {/* Mã PCB */}
          <label className="text-xs">
            Mã PCB (Code PCB)
            <textarea 
              value={form.codePCB ?? ""} 
              onChange={(e) => set("codePCB", e.target.value)} 
              className="mt-1 block w-full border rounded px-3 py-2 text-base min-h-[60px] resize-y"
              placeholder="Nhập mã PCB..."
            />
          </label>

          {/* Checkboxes */}
          <div className="flex flex-col gap-3">
            {/* Used CN card */}
            <div>
              <div className="text-xs mb-2 font-semibold">Sử dụng CN card</div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => set("usedCNcard", true)} 
                  className={`px-4 py-2 rounded text-base border ${
                    form.usedCNcard === true ? "bg-blue-100 border-blue-500 font-semibold" : "border-gray-300"
                  }`}
                >
                  Yes
                </button>
                <button 
                  type="button" 
                  onClick={() => set("usedCNcard", false)} 
                  className={`px-4 py-2 rounded text-base border ${
                    form.usedCNcard === false ? "bg-blue-100 border-blue-500 font-semibold" : "border-gray-300"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* JIG */}
            <div>
              <div className="text-xs mb-2 font-semibold">JIG</div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => set("jig", true)} 
                  className={`px-4 py-2 rounded text-base border ${
                    form.jig === true ? "bg-blue-100 border-blue-500 font-semibold" : "border-gray-300"
                  }`}
                >
                  Yes
                </button>
                <button 
                  type="button" 
                  onClick={() => set("jig", false)} 
                  className={`px-4 py-2 rounded text-base border ${
                    form.jig === false ? "bg-blue-100 border-blue-500 font-semibold" : "border-gray-300"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
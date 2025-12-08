import { useState, useEffect } from "react";
import Modal from "../Modal";
import ViewDetailButton from "../ViewDetailButton";
import { useSmdSheet } from "../../contexts/SmdSheetContext";

type FormState = {
  lineDoi?: string;
  modelSide?: string;
  fCode?: string;
  pcbVer?: string;
  workOrder?: string;
  revS15?: string;
  revMounter?: string;
  feederList?: string;
  opMounter?: string;
  qty?: string;
  date?: string;
  maPcb?: string;
  useCnCard?: "yes" | "no" | undefined;
  jig?: "yes" | "no" | undefined;
};

const initialFormState: FormState = {
  lineDoi: "",
  modelSide: "",
  fCode: "",
  pcbVer: "",
  workOrder: "",
  qty: "",
  revS15: "",
  feederList: "",
  opMounter: "",
  revMounter: "",
  maPcb: "",
  useCnCard: undefined,
  jig: undefined,
};



export default function CheckModels() {
  const {sheetData , updateCheckModels} = useSmdSheet();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);

  useEffect(() => {
  setForm(sheetData.checkModels);
}, [sheetData.checkModels]);

    const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const submit = () => {
    updateCheckModels(form);
    setOpen(false);
    alert('Check Models updated successfully!');
  };

  return (
    <div className="p-0 py-4 w-full">
      {/* Website View - Bảng ngang */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="border border-gray-600 w-full text-center opacity-60">
          <thead>
            <tr>
              <th rowSpan={2} className="border px-2 py-2 text-xs bg-gray-100">Line đổi</th>
              <td rowSpan={2} className="border px-2 py-2 text-xs">{form.lineDoi || ""}</td>
              <td rowSpan={2} className="border px-2 py-2 text-xs bg-gray-300"></td>
              <th className="border px-2 py-2 text-xs bg-gray-100">Model/Side</th>
              <th colSpan={2} className="border px-2 py-2 text-xs bg-gray-100">T/B</th>
              <th className="border px-2 py-2 text-xs bg-gray-100">REV S15</th>
              <td className="border px-2 py-2">{form.revS15 || ""}</td>
              <th rowSpan={2} className="border px-2 py-2 text-xs bg-gray-100">DATE</th>
              <th colSpan={2} className="border px-2 py-2 text-xs bg-gray-100">Thời gian kiểm tra xong Feeder list</th>
              <td className="border px-2 py-2 text-xs">{form.feederList || ""}</td>
              <td rowSpan={2} className="border px-2 py-2 bg-gray-300"></td>
              <td rowSpan={2} className="border px-2 py-2 bg-gray-300"></td>
            </tr>

            <tr>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">F Code(3in1)</th>
              <td colSpan={2} className="border px-2 py-2 text-xs">{form.modelSide || ""}</td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">REV MOUNTER</th>
              <td className="border px-2 py-2 text-xs">{form.revMounter || ""}</td>
              <th colSpan={2} className="border px-2 py-2 text-xs bg-gray-100">OP Mounter xác nhận</th>
              <td className="border px-2 py-2 text-xs">{form.opMounter || ""}</td>

            </tr>

            <tr>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">PCB ver</th>
              <td colSpan={2} className="border px-2 py-2 text-xs">{form.fCode || ""}</td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">Work Order</th>
              <td className="border px-2 py-2">{form.pcbVer || ""}</td>
              <th colSpan={2} className="border px-2 py-2 text-xs bg-gray-100">Sử dụng CN card</th>
              <td className="border px-2 py-2">
                <div className="flex flex-col items-center gap-1">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.useCnCard === "yes"} onChange={() => set("useCnCard", form.useCnCard === "yes" ? undefined : "yes")} /> Yes</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.useCnCard === "no"} onChange={() => set("useCnCard", form.useCnCard === "no" ? undefined : "no")} /> No</label>
                </div>
              </td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">Qty</th>
              <td className="border px-2 py-2 text-xs">{form.qty || ""}</td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">JIG</th>
              <td className="border px-2 py-2">
                <div className="flex flex-col items-center gap-1">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.jig === "yes"} onChange={() => set("jig", form.jig === "yes" ? undefined : "yes")} /> Yes</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.jig === "no"} onChange={() => set("jig", form.jig === "no" ? undefined : "no")} /> No</label>
                </div>
              </td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">Mã PCB</th>
              <td className="border px-2 py-2 text-xs">{form.maPcb || ""}</td>
            </tr>
          </thead>
        </table>
      </div>

      {/* Mobile View - Card dọc */}
      <div className="lg:hidden">
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm" onClick={() => setOpen(true)}>
          <h3 className="text-base font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Check Model</h3>

          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Line đổi</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.lineDoi || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Model/Side</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.modelSide || "—"}
              </div>
            </div>
          </div>

          {/* Row bổ xung */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">REV S15</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.revS15 || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">REV MOUNTER</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.revMounter || "—"}
              </div>
            </div>
          </div>

          {/* Row bổ xung */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian kiểm tra feeder</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.feederList || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">OP Mounter xác nhận</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.opMounter || "—"}
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">F Code (3in1)</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.fCode || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">PCB ver</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.pcbVer || "—"}
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Work Order</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.workOrder || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Qty</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.qty || "—"}
              </div>
            </div>
          </div>

          {/* Mã PCB */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Mã PCB</div>
            <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words">
              {form.maPcb || "—"}
            </div>
          </div>

          {/* Row 4 - Radio buttons */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Sử dụng CN card</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100">
                {form.useCnCard === "yes" ? "Yes" : form.useCnCard === "no" ? "No" : "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">JIG</div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100">
                {form.jig === "yes" ? "Yes" : form.jig === "no" ? "No" : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/** buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)}>Chỉnh sửa</ViewDetailButton>
        {/* <ViewDetailButton color="green" onOpen={() => {}}>Lưu</ViewDetailButton> */}
      </div>

      <Modal
        open={open}
        title="Chi tiết Check Model"
        onClose={() => setOpen(false)}
        onSave={submit}
      >
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
          <label className="text-xs">
            Line đổi
            <input 
              value={form.lineDoi ?? ""} 
              onChange={(e) => set("lineDoi", e.target.value)} 
              className="mt-1 block w-full border rounded px-3 py-2 text-base wrap-break-words"
            />
          </label>

          <label className="text-xs">
            Model/Side
            <input 
              value={form.modelSide ?? ""} 
              onChange={(e) => set("modelSide", e.target.value)} 
              className="mt-1 block w-full border rounded px-3 py-2 text-base"
            />
          </label>

          <label className="text-xs">
            F Code (3in1)
            <input 
              value={form.fCode ?? ""} 
              onChange={(e) => set("fCode", e.target.value)} 
              className="mt-1 block w-full border rounded px-3 py-2 text-base"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              REV S15
              <input 
                value={form.revS15 ?? ""} 
                onChange={(e) => set("revS15", e.target.value)} 
                className="mt-1 block w-full border rounded px-3 py-2 text-base"
              />
            </label>

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
            <label className="text-xs">
              Thời gian kiểm tra xong Feeder List
              <input 
                type="datetime-local" 
                value={form.feederList ?? ""} 
                onChange={(e) => set("feederList", e.target.value)} 
                className="mt-1 block w-full border rounded px-3 py-2 text-base"
              />
            </label>

            <label className="text-xs">
              Thời gian OP Mounter xác nhận
              <input 
                type="datetime-local" 
                value={form.opMounter ?? ""} 
                onChange={(e) => set("opMounter", e.target.value)} 
                className="mt-1 block w-full border rounded px-3 py-2 text-base"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              PCB ver
              <input 
                value={form.pcbVer ?? ""} 
                onChange={(e) => set("pcbVer", e.target.value)} 
                className="mt-1 block w-full border rounded px-3 py-2 text-base"
              />
            </label>

            <label className="text-xs">
              Work Order
              <input 
                value={form.workOrder ?? ""} 
                onChange={(e) => set("workOrder", e.target.value)} 
                className="mt-1 block w-full border rounded px-3 py-2 text-base"
              />
            </label>
          </div>

          <label className="text-xs">
            Qty
            <input 
              value={form.qty ?? ""} 
              onChange={(e) => set("qty", e.target.value)} 
              className="mt-1 block w-full border rounded px-3 py-2 text-base"
            />
          </label>
          
          <label className="text-xs">
            Mã PCB
            <textarea 
              value={form.maPcb ?? ""} 
              onChange={(e) => set("maPcb", e.target.value)} 
              className="mt-1 block w-full border rounded px-3 py-2 text-base min-h-[60px] resize-y"
              placeholder="Nhập mã PCB..."
            />
          </label>

          <div className="flex flex-col gap-2">
            <div>
              <div className="text-xs mb-1">Sử dụng CN card</div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => set("useCnCard", "yes")} 
                  className={`px-3 py-2 rounded text-base border ${form.useCnCard === "yes" ? "bg-blue-100 border-blue-500" : ""}`}
                >
                  Yes
                </button>
                <button 
                  type="button" 
                  onClick={() => set("useCnCard", "no")} 
                  className={`px-3 py-2 rounded text-base border ${form.useCnCard === "no" ? "bg-blue-100 border-blue-500" : ""}`}
                >
                  No
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs mb-1">JIG</div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => set("jig", "yes")} 
                  className={`px-3 py-2 rounded text-base border ${form.jig === "yes" ? "bg-blue-100 border-blue-500" : ""}`}
                >
                  Yes
                </button>
                <button 
                  type="button" 
                  onClick={() => set("jig", "no")} 
                  className={`px-3 py-2 rounded text-base border ${form.jig === "no" ? "bg-blue-100 border-blue-500" : ""}`}
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
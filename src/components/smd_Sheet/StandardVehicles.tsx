import ViewDetailButton from "../ViewDetailButton"
import Modal from "../Modal";
import { useEffect, useState } from "react";
import { useSmdSheet } from "../../contexts/SmdSheetContext";

type StandardVehiclesState = {
  printer: {
    pressureSpec?: string;                    // Giá trị áp lực Spec (kg)
    scanSpeedSpec?: string;                   // Tốc độ quét Spec (mm/s)
    separationSpeedSpec?: string;             // Tốc độ khoảng cách tách bàn Spec (mm/s)
    wipeCountSpec?: string;                   // Số lần lau Spec
    bladeUsedSpec?: string;                   // Dao sử dụng Spec
    pressureActual?: string;                  // Giá trị áp lực thực tế trên máy (kg)
    scanSpeedActual?: string;                 // Tốc độ quét thực tế trên máy (mm/s)
    separationSpeedActual?: string;           // Tốc độ tách bàn thực tế trên máy (mm/s)
    wipeCountActual?: string;                 // Số lần lau thực tế trên máy
    bladeUsedActual?: string;                 // Dao sử dụng thực tế trên máy
    vacuumBlockOk: boolean;                   // Sau khi sử dụng Vaccum Block
  };
  spi: {
    inspectionSettingOk: boolean;             // Điều kiện setting Inspection
  };
  mount: {
    firstThreeBoardsOk: boolean;              // Kiểm tra 3 board đầu tiên
    bottomBoardOk: boolean;                   // Kiểm tra 1 tấm ở mặt dưới
  };
  reflow: {
    conveyorWidthOk: boolean;                 // Kiểm tra tình trạng chiều rộng của Conveyor
    railSettingValue?: string;                // Giá trị cài đặt Rail (mm)
    railActualValue?: string;                 // Giá trị thực tế Rail (mm)
  };
  aoi: {
    xrayThreeBoardsOk: boolean;               // Xoay 3 board đầu tiên
    xrayInspector?: string;                   // Người kiểm tra
  };
  output: {
    magazineDistanceOk: boolean;              // Kiểm tra tình trạng setting
    magazineInspector?: string;               // Người kiểm tra
    settingModel?: string;                    // Giá trị cài đặt theo yêu cầu Model
    settingPitch?: string;                    // Giá trị cài đặt theo yêu cầu Pitch
  };
  worker: {
    opName?: string;                          // Tên OP
    aoiName?: string;                         // Tên AOI
  };
};

const initialStandardVehiclesState: StandardVehiclesState = {
  printer: {
    pressureSpec: "",
    scanSpeedSpec: "",
    separationSpeedSpec: "",
    wipeCountSpec: "",
    bladeUsedSpec: "",
    pressureActual: "",
    scanSpeedActual: "",
    separationSpeedActual: "",
    wipeCountActual: "",
    bladeUsedActual: "",
    vacuumBlockOk: false,
  },
  spi: {
    inspectionSettingOk: false,
  },
  mount: {
    firstThreeBoardsOk: false,
    bottomBoardOk: false,
  },
  reflow: {
    conveyorWidthOk: false,
    railSettingValue: "",
    railActualValue: "",
  },
  aoi: {
    xrayThreeBoardsOk: false,
    xrayInspector: "",
  },
  output: {
    magazineDistanceOk: false,
    magazineInspector: "",
    settingModel: "",
    settingPitch: "",
  },
  worker: {
    opName: "",
    aoiName: "",
  },
};

const StandardVehicles = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StandardVehiclesState>(initialStandardVehiclesState);
  const { sheetData, updateStandardVehicles } = useSmdSheet();
  useEffect(() => {
    setForm(sheetData.standardVehicles);
  }, [sheetData.standardVehicles]);

  const setPrinter = <K extends keyof StandardVehiclesState["printer"]>(k: K, v: StandardVehiclesState["printer"][K]) =>
    setForm((s) => ({ ...s, printer: { ...s.printer, [k]: v } }));

  const setSPI = <K extends keyof StandardVehiclesState["spi"]>(k: K, v: StandardVehiclesState["spi"][K]) =>
    setForm((s) => ({ ...s, spi: { ...s.spi, [k]: v } }));

  const setMount = <K extends keyof StandardVehiclesState["mount"]>(k: K, v: StandardVehiclesState["mount"][K]) =>
    setForm((s) => ({ ...s, mount: { ...s.mount, [k]: v } }));

  const setReflow = <K extends keyof StandardVehiclesState["reflow"]>(k: K, v: StandardVehiclesState["reflow"][K]) =>
    setForm((s) => ({ ...s, reflow: { ...s.reflow, [k]: v } }));

  const setAOI = <K extends keyof StandardVehiclesState["aoi"]>(k: K, v: StandardVehiclesState["aoi"][K]) =>
    setForm((s) => ({ ...s, aoi: { ...s.aoi, [k]: v } }));

  const setOutput = <K extends keyof StandardVehiclesState["output"]>(k: K, v: StandardVehiclesState["output"][K]) =>
    setForm((s) => ({ ...s, output: { ...s.output, [k]: v } }));

  const setWorker = <K extends keyof StandardVehiclesState["worker"]>(k: K, v: StandardVehiclesState["worker"][K]) =>
    setForm((s) => ({ ...s, worker: { ...s.worker, [k]: v } }));

  // const setSampleInspection = <K extends keyof StandardVehiclesState["sampleInspection"]>(
  //   k: K,
  //   v: StandardVehiclesState["sampleInspection"][K]
  // ) =>
  //   setForm((s) => ({
  //     ...s,
  //     sampleInspection: { ...s.sampleInspection, [k]: v },
  //   }));

  const submit = () => {
    // console.log("submit", form);
    updateStandardVehicles(form);
    setOpen(false);
    alert("Standard Vehicles updated successfully!");
  };
  return (
    <div className="p-0 py-4 w-full">
      {/* Desktop View */}
      <div className="hidden lg:block w-full overflow-x-auto">
  <table className="border border-gray-600 w-full text-center opacity-60">
    <tbody>
      {/* Row 16 */}
      <tr>
        <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Tiêu chuẩn thiết bị</th>
        <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 17 */}
      <tr>
        <th rowSpan={4} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Printer</th>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Giá trị cài đặt Screen Sprint</th>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Giá trị áp lực</th>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tốc độ quét</th>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tốc độ khoảng cách tách bàn</th>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số lần lau</th>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Dao sử dụng</th>
      </tr>
      
      {/** Row 18 */}
      <tr>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tiêu chuẩn Spec đưa ra</th>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printer.pressureSpec || ""} kg</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printer.scanSpeedSpec || ""} mm/s</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printer.separationSpeedSpec || ""} mm/s</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printer.wipeCountSpec || ""}</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printer.bladeUsedSpec || ""}</td>
      </tr>

      {/** Row 19 */}
      <tr>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Giá trị cài đặt thực tế trên máy</th>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printer.pressureActual || ""} kg</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printer.scanSpeedActual || ""} mm/s</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printer.separationSpeedActual || ""} mm/s</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printer.wipeCountActual || ""}</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printer.bladeUsedActual || ""}</td>
      </tr>

      {/** Row 20 */}
      <tr>
        <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">
          Sau khi sử dụng Vaccum Block thì có ảnh hưởng tác động tới pcb hay linh kiện không ?
        </th>
        <td colSpan={2} className="border border-gray-600 px-2 py-2">
          <div className="flex items-center justify-center flex-row gap-2">
            <label className="font-bold text-xs">OK</label>
            <input 
              type="checkbox" 
              checked={!!form.printer.vacuumBlockOk}
              onChange={(e) => setPrinter("vacuumBlockOk", e.target.checked)}
            />
          </div>
        </td>
        <td colSpan={3} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 21 */}
      <tr>
        <th colSpan={1} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">SPI</th>
        <th colSpan={8} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Hạng mục check (kiểm tra tiêu chuẩn setting SPI)</th>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 22 */}
      <tr>
        <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Điều kiện setting Inspection (volume: 60-180%; Area: 40-200%; ofset: 0.15, short: 60)</th>
        <td colSpan={2} className="border border-gray-600 px-2 py-2">
          <div className="flex items-center justify-center flex-row gap-2">
            <label className="font-bold text-xs">OK</label>
            <input 
              type="checkbox"
              checked={!!form.spi.inspectionSettingOk}
              onChange={(e) => setSPI("inspectionSettingOk", e.target.checked)}
            />
          </div>
        </td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 23 */}
      <tr>
        <th colSpan={1} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Mount</th>
        <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Kiểm tra 3 board đầu tiên sau khi cắm linh kiện có ok không ?</th>
        <td colSpan={2} className="border border-gray-600 px-2 py-2">
          <div className="flex items-center justify-center flex-row gap-2">
            <label className="font-bold text-xs">OK</label>
            <input 
              type="checkbox"
              checked={!!form.mount.firstThreeBoardsOk}
              onChange={(e) => setMount("firstThreeBoardsOk", e.target.checked)}
            />
          </div>
        </td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 24 */}
      <tr>
        <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Kiểm tra 1 tấm ở mặt dưới có NG hay bể linh kiện không ?</th>
        <td colSpan={2} className="border border-gray-600 px-2 py-2">
          <div className="flex items-center justify-center flex-row gap-2">
            <label className="font-bold text-xs">OK</label>
            <input 
              type="checkbox"
              checked={!!form.mount.bottomBoardOk}
              onChange={(e) => setMount("bottomBoardOk", e.target.checked)}
            />
          </div>
        </td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 25 */}
      <tr>
        <th colSpan={1} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Reflow</th>
        <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Kiểm tra tình trạng chiều rộng của Conveyor ?</th>
        <td colSpan={2} className="border border-gray-600 px-2 py-2">
          <div className="flex items-center justify-center flex-row gap-2">
            <label className="font-bold text-xs">OK</label>
            <input 
              type="checkbox"
              checked={!!form.reflow.conveyorWidthOk}
              onChange={(e) => setReflow("conveyorWidthOk", e.target.checked)}
            />
          </div>
        </td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 26 */}
      <tr>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Giá trị cài đặt Rail</th>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">{form.reflow.railSettingValue || ""} mm</th>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Giá trị thực tế Rail</th>
        <th colSpan={3} className="border border-gray-600 px-2 py-2 text-xs">{form.reflow.railActualValue || ""} mm</th>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 bg-gray-300"></td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 27 */}
      <tr>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">AOI</th>
        <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Xray 3 board đầu tiên có OK hay không ?</th>
        <td colSpan={2} className="border border-gray-600 px-2 py-2">
          <div className="flex items-center justify-center flex-row gap-2">
            <label className="font-bold text-xs">OK</label>
            <input 
              type="checkbox"
              checked={!!form.aoi.xrayThreeBoardsOk}
              onChange={(e) => setAOI("xrayThreeBoardsOk", e.target.checked)}
            />
          </div>
        </td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-left! text-xs">Người kiểm tra: {form.aoi.xrayInspector || ""}</td>
      </tr>

      {/** Row 27.1 */}
      <tr>
        <th colSpan={1} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">OUTPUT</th>
        <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Kiểm tra tình trạng setting. khoảng cách input magazine tại unloader ?</th>
        <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2">
          <div className="flex items-center justify-center flex-row gap-2">
            <label className="font-bold text-xs">OK</label>
            <input 
              type="checkbox"
              checked={!!form.output.magazineDistanceOk}
              onChange={(e) => setOutput("magazineDistanceOk", e.target.checked)}
            />
          </div>
        </td>
        <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-left! text-xs">Người kiểm tra: {form.output.magazineInspector || ""}</td>
      </tr>

      {/** Row 27.2 */}
      <tr>
        <th colSpan={8} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">
          <div className="px-3 font-semibold mb-2">Giá trị cài đặt theo yêu cầu</div>
          <div className="flex flex-row justify-center items-center gap-3">
            <div className="flex flex-row items-center gap-1">
              <label className="flex items-center gap-2">Model:</label>
              <span className="text-xs">{form.output.settingModel || ""}</span>
            </div>
            <div className="flex flex-row items-center gap-1">
              <label className="flex items-center gap-2">Pitch:</label>
              <span className="text-xs">{form.output.settingPitch || ""}</span>
            </div>
          </div>
        </th>
      </tr>

      {/** Row 28 */}
      <tr>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Công nhân</th>
        <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tên</th>
        <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Ghi chú</th>
        <th colSpan={1} rowSpan={3} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Mẫu kiểm tra (5PCB)</th>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tên lỗi</th>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số lượng lỗi</th>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tình trạng sửa chữa</th>
      </tr>

      {/** Row 29 */}
      <tr>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">OP</th>
        <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs">{form.worker.opName || ""}</td>
        <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 30 */}
      <tr>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">AOI</th>
        <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs">{form.worker.aoiName || ""}</td>
        <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>
    </tbody>
  </table>
      </div>
    {/* Mobile View */}
  <div className="lg:hidden space-y-4">
    {/* Printer Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">Printer</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Áp lực Spec (kg)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printer.pressureSpec || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Áp lực thực tế (kg)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printer.pressureActual || "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Tốc độ quét Spec (mm/s)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printer.scanSpeedSpec || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Tốc độ quét thực tế (mm/s)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printer.scanSpeedActual || "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Tốc độ tách bàn Spec (mm/s)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printer.separationSpeedSpec || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Tốc độ tách bàn thực tế (mm/s)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printer.separationSpeedActual || "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Số lần lau Spec</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printer.wipeCountSpec || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Số lần lau thực tế</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printer.wipeCountActual || "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Dao sử dụng Spec</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printer.bladeUsedSpec || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Dao sử dụng thực tế</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printer.bladeUsedActual || "—"}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Vacuum Block</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.printer.vacuumBlockOk ? "✓ OK" : "—"}
        </div>
      </div>

      {/* <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Ghi chú Vacuum Block</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
          {form.printer.vacuumBlockNote || "—"}
        </div>
      </div> */}
    </div>

    {/* SPI Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">SPI</h3>
      
      {/* <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Hạng mục check</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
          {form.spi.inspectionCheck || "—"}
        </div>
      </div> */}

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Inspection Setting OK</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.spi.inspectionSettingOk ? "✓ OK" : "—"}
        </div>
      </div>

      {/* <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Ghi chú</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
          {form.spi.inspectionSettingNote || "—"}
        </div>
      </div> */}
    </div>

    {/* Mount Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Mount</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Kiểm tra 3 board đầu tiên sau khi cắm linh kiện có OK không ?</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.mount.firstThreeBoardsOk ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Kiểm tra 1 tấm ở mặt dưới có NG hay bể linh kiện không ?</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.mount.bottomBoardOk ? "✓ OK" : "—"}
        </div>
      </div>
    </div>

    {/* Reflow Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Reflow</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Chiều rộng Conveyor</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.reflow.conveyorWidthOk ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Rail cài đặt (mm)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.reflow.railSettingValue || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Rail thực tế (mm)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.reflow.railActualValue || "—"}
          </div>
        </div>
      </div>
    </div>

    {/* AOI Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">AOI</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Xray 3 board đầu tiên có OK hay không ?</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.aoi.xrayThreeBoardsOk ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Người kiểm tra</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.aoi.xrayInspector || "—"}
        </div>
      </div>
    </div>

    {/* Output Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Output</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Khoảng cách input magazine tại uploader</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.output.magazineDistanceOk ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Người kiểm tra</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.output.magazineInspector || "—"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Model</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.output.settingModel || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Pitch</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.output.settingPitch || "—"}
          </div>
        </div>
      </div>
    </div>

    {/* Worker Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Công nhân</h3>
      <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-600 mb-2">OP</h4>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.worker.opName || "—"}
            </div>
          </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-600 mb-2">AOI</h4>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.worker.aoiName || "—"}
            </div>
          </div>
      </div>
    </div>

  </div>

  {/* Buttons */}
  <div className="flex flex-row justify-end w-full gap-2 mt-3">
    <ViewDetailButton onOpen={() => setOpen(true)}>Chỉnh sửa</ViewDetailButton>
    {/* <ViewDetailButton color="green" onOpen={() => {}}>Lưu</ViewDetailButton> */}
  </div>

   {/* Modal */}
    <Modal open={open} title="Chi tiết PQC Check" onClose={() => setOpen(false)} onSave={submit}>
  <div className="grid gap-4 max-h-[70vh] overflow-y-auto px-1">
    {/* Printer */}
    <section className="pb-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Printer</h4>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <label className="text-xs block mb-1">Giá trị áp lực Spec (kg)</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printer.pressureSpec ?? ""}
            onChange={(e) => setPrinter("pressureSpec", e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Tốc độ quét Spec (mm/s)</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printer.scanSpeedSpec ?? ""}
            onChange={(e) => setPrinter("scanSpeedSpec", e.target.value)}
          />
        </div>
      </div>

      <div className="min-w-0 mb-3">
        <label className="text-xs block mb-1">Tốc độ khoảng cách tách bàn Spec (mm/s)</label>
        <input
          className="block w-full border rounded px-3 py-2 text-sm min-w-0"
          value={form.printer.separationSpeedSpec ?? ""}
          onChange={(e) => setPrinter("separationSpeedSpec", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <label className="text-xs block mb-1">Số lần lau Spec</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printer.wipeCountSpec ?? ""}
            onChange={(e) => setPrinter("wipeCountSpec", e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Dao sử dụng Spec</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printer.bladeUsedSpec ?? ""}
            onChange={(e) => setPrinter("bladeUsedSpec", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <label className="text-xs block mb-1">Giá trị áp lực thực tế trên máy (kg)</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printer.pressureActual ?? ""}
            onChange={(e) => setPrinter("pressureActual", e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Tốc độ quét thực tế trên máy (mm/s)</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printer.scanSpeedActual ?? ""}
            onChange={(e) => setPrinter("scanSpeedActual", e.target.value)}
          />
        </div>
      </div>

      <div className="min-w-0 mb-3">
        <label className="text-xs block mb-1">Tốc độ tách bàn thực tế trên máy (mm/s)</label>
        <input
          className="block w-full border rounded px-3 py-2 text-sm min-w-0"
          value={form.printer.separationSpeedActual ?? ""}
          onChange={(e) => setPrinter("separationSpeedActual", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <label className="text-xs block mb-1">Số lần lau thực tế trên máy</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printer.wipeCountActual ?? ""}
            onChange={(e) => setPrinter("wipeCountActual", e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Dao sử dụng thực tế trên máy</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printer.bladeUsedActual ?? ""}
            onChange={(e) => setPrinter("bladeUsedActual", e.target.value)}
          />
        </div>
      </div>

      <div className="min-w-0 flex items-center">
        <input
          id="vacuumBlockOk"
          type="checkbox"
          checked={!!form.printer.vacuumBlockOk}
          onChange={(e) => setPrinter("vacuumBlockOk", e.target.checked)}
          className=""
        />
        <label htmlFor="vacuumBlockOk" className="text-xs mx-2">
          Sau khi sử dụng Vaccum Block thì có ảnh hưởng, tác động tới PCB hay linh kiện không ?
        </label>
      </div>
    </section>

    {/* SPI */}
    <section className="pb-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">SPI</h4>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0 flex items-center gap-2">
          <input
            id="inspectionSettingOk"
            type="checkbox"
            checked={!!form.spi.inspectionSettingOk}
            onChange={(e) => setSPI("inspectionSettingOk", e.target.checked)}
            className=""
          />
          <label htmlFor="inspectionSettingOk" className="text-xs">
            Điều kiện setting Inspection (volume: 60-180%; Area: 40-200%; ofset: 0.15, short: 60)
          </label>
        </div>
      </div>
    </section>

    {/* Mount */}
    <section className="pb-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Mount</h4>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0 flex items-center gap-2">
          <input
            id="firstThreeBoardsOk"
            type="checkbox"
            checked={!!form.mount.firstThreeBoardsOk}
            onChange={(e) => setMount("firstThreeBoardsOk", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="firstThreeBoardsOk" className="text-xs">
            Kiểm tra 3 board đầu tiên sau khi cắm linh kiện có OK không ?
          </label>
        </div>

        <div className="min-w-0 flex items-center gap-2">
          <input
            id="bottomBoardOk"
            type="checkbox"
            checked={!!form.mount.bottomBoardOk}
            onChange={(e) => setMount("bottomBoardOk", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="bottomBoardOk" className="text-xs">
            Kiểm tra 1 tấm ở mặt dưới có NG hay bể linh kiện không ?
          </label>
        </div>
      </div>
    </section>

    {/* Reflow */}
    <section className="pb-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Reflow</h4>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0 flex items-center gap-2">
          <input
            id="conveyorWidthOk"
            type="checkbox"
            checked={!!form.reflow.conveyorWidthOk}
            onChange={(e) => setReflow("conveyorWidthOk", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="conveyorWidthOk" className="text-xs">
            Kiểm tra tình trạng chiều rộng của Conveyor
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="text-xs block mb-1">Giá trị cài đặt Rail (mm)</label>
            <input
              className="block w-full border rounded px-3 py-2 text-sm min-w-0"
              value={form.reflow.railSettingValue ?? ""}
              onChange={(e) => setReflow("railSettingValue", e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <label className="text-xs block mb-1">Giá trị thực tế Rail (mm)</label>
            <input
              className="block w-full border rounded px-3 py-2 text-sm min-w-0"
              value={form.reflow.railActualValue ?? ""}
              onChange={(e) => setReflow("railActualValue", e.target.value)}
            />
          </div>
        </div>
      </div>
    </section>

    {/* AOI */}
    <section className="pb-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">AOI</h4>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0 flex items-center gap-2">
          <input
            id="xrayThreeBoardsOk"
            type="checkbox"
            checked={!!form.aoi.xrayThreeBoardsOk}
            onChange={(e) => setAOI("xrayThreeBoardsOk", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="xrayThreeBoardsOk" className="text-xs">
            Xoay 3 board đầu tiên có OK hay không ?
          </label>
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Người kiểm tra</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.aoi.xrayInspector ?? ""}
            onChange={(e) => setAOI("xrayInspector", e.target.value)}
          />
        </div>
      </div>
    </section>

    {/* Output */}
    <section className="pb-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Output</h4>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0 flex items-center gap-2">
          <input
            id="magazineDistanceOk"
            type="checkbox"
            checked={!!form.output.magazineDistanceOk}
            onChange={(e) => setOutput("magazineDistanceOk", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="magazineDistanceOk" className="text-xs">
            Kiểm tra tình trạng setting, khoảng cách input magazine tại uploader ?
          </label>
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Người kiểm tra</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.output.magazineInspector ?? ""}
            onChange={(e) => setOutput("magazineInspector", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="text-xs block mb-1">Giá trị cài đặt theo yêu cầu Model</label>
            <input
              className="block w-full border rounded px-3 py-2 text-sm min-w-0"
              value={form.output.settingModel ?? ""}
              onChange={(e) => setOutput("settingModel", e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <label className="text-xs block mb-1">Giá trị cài đặt theo yêu cầu Pitch</label>
            <input
              className="block w-full border rounded px-3 py-2 text-sm min-w-0"
              value={form.output.settingPitch ?? ""}
              onChange={(e) => setOutput("settingPitch", e.target.value)}
            />
          </div>
        </div>
      </div>
    </section>

    {/* Worker */}
    <section>
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Công nhân</h4>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0">
          <label className="text-xs block mb-1">Tên OP</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.worker.opName ?? ""}
            onChange={(e) => setWorker("opName", e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Tên AOI</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.worker.aoiName ?? ""}
            onChange={(e) => setWorker("aoiName", e.target.value)}
          />
        </div>
      </div>
    </section>
  </div>
</Modal>


    </div>
  )
}

export default StandardVehicles
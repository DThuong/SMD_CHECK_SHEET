import ViewDetailButton from "../ViewDetailButton"
import Modal from "../Modal";
import { useState } from "react";

type PrinterState = {
  screenSprintSetting?: string;
  screenSprintSpec?: string;
  screenSprintActual?: string;
  pressureSpec?: string;
  pressureActual?: string;
  scanSpeedSpec?: string;
  scanSpeedActual?: string;
  separationSpeedSpec?: string;
  separationSpeedActual?: string;
  wipeCountSpec?: string;
  wipeCountActual?: string;
  bladeUsedSpec?: string;
  bladeUsedActual?: string;
  vacuumBlockOk?: boolean;
  vacuumBlockNote?: string;
};

type SPIState = {
  inspectionCheck?: string;
  inspectionSettingOk?: boolean;
  inspectionSettingNote?: string;
};

type MountState = {
  firstThreeBoardsOk?: boolean;
  firstThreeBoardsNote?: string;
  bottomBoardOk?: boolean;
  bottomBoardNote?: string;
};

type ReflowState = {
  conveyorWidthOk?: boolean;
  conveyorWidthNote?: string;
  railSettingValue?: string;
  railActualValue?: string;
  railCheckOk?: boolean;
  railCheckNote?: string;
};

type AOIState = {
  xrayThreeBoardsOk?: boolean;
  xrayInspector?: string;
};

type OutputState = {
  magazineDistanceOk?: boolean;
  magazineInspector?: string;
  settingModel?: string;
  settingPitch?: string;
};

type WorkerState = {
  opName?: string;
  opNote?: string;
  aoiName?: string;
  aoiNote?: string;
};

type SampleInspectionState = {
  errorName1?: string;
  errorCount1?: string;
  repairStatus1?: string;
  errorName2?: string;
  errorCount2?: string;
  repairStatus2?: string;
};

type StandardVehiclesState = {
  printer: PrinterState;
  spi: SPIState;
  mount: MountState;
  reflow: ReflowState;
  aoi: AOIState;
  output: OutputState;
  worker: WorkerState;
  sampleInspection: SampleInspectionState;
};

const initialStandardVehiclesState: StandardVehiclesState = {
  printer: {
    screenSprintSetting: "",
    screenSprintSpec: "",
    screenSprintActual: "",
    pressureSpec: "",
    pressureActual: "",
    scanSpeedSpec: "",
    scanSpeedActual: "",
    separationSpeedSpec: "",
    separationSpeedActual: "",
    wipeCountSpec: "",
    wipeCountActual: "",
    bladeUsedSpec: "",
    bladeUsedActual: "",
    vacuumBlockOk: false,
    vacuumBlockNote: "",
  },
  spi: {
    inspectionCheck: "",
    inspectionSettingOk: false,
    inspectionSettingNote: "",
  },
  mount: {
    firstThreeBoardsOk: false,
    firstThreeBoardsNote: "",
    bottomBoardOk: false,
    bottomBoardNote: "",
  },
  reflow: {
    conveyorWidthOk: false,
    conveyorWidthNote: "",
    railSettingValue: "",
    railActualValue: "",
    railCheckOk: false,
    railCheckNote: "",
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
    opNote: "",
    aoiName: "",
    aoiNote: "",
  },
  sampleInspection: {
    errorName1: "",
    errorCount1: "",
    repairStatus1: "",
    errorName2: "",
    errorCount2: "",
    repairStatus2: "",
  },
};

const StandardVehicles = () => {
    const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StandardVehiclesState>(initialStandardVehiclesState);

  const setPrinter = <K extends keyof PrinterState>(k: K, v: PrinterState[K]) =>
    setForm((s) => ({ ...s, printer: { ...s.printer, [k]: v } }));

  const setSPI = <K extends keyof SPIState>(k: K, v: SPIState[K]) =>
    setForm((s) => ({ ...s, spi: { ...s.spi, [k]: v } }));

  const setMount = <K extends keyof MountState>(k: K, v: MountState[K]) =>
    setForm((s) => ({ ...s, mount: { ...s.mount, [k]: v } }));

  const setReflow = <K extends keyof ReflowState>(k: K, v: ReflowState[K]) =>
    setForm((s) => ({ ...s, reflow: { ...s.reflow, [k]: v } }));

  const setAOI = <K extends keyof AOIState>(k: K, v: AOIState[K]) =>
    setForm((s) => ({ ...s, aoi: { ...s.aoi, [k]: v } }));

  const setOutput = <K extends keyof OutputState>(k: K, v: OutputState[K]) =>
    setForm((s) => ({ ...s, output: { ...s.output, [k]: v } }));

  const setWorker = <K extends keyof WorkerState>(k: K, v: WorkerState[K]) =>
    setForm((s) => ({ ...s, worker: { ...s.worker, [k]: v } }));

  const submit = () => {
    console.log("submit", form);
    setOpen(false);
  };
  return (
    <div className="p-3 sm:p-4 w-full">
      {/* Desktop View */}
      <div className="hidden lg:block w-full overflow-x-auto">
            <table className="border border-gray-600 w-full text-center opacity-60">
                <tbody>

            {/* Row 16 */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Tiêu chuẩn thiết bị</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
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
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">kg</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">mm/s</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">mm/s</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 19 */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Giá trị cài đặt thực tế trên máy</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">kg</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">mm/s</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">mm/s</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 20 */}
            <tr>
              <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">
                Sau khi sử dụng Vaccum Block thì có ảnh hưởng tác động tới pcb hay linh kiện không ?
              </th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2"><label className="font-bold text-xs">OK</label><input type="checkbox" /></div>
              </td>
              <td colSpan={3} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 21 */}
            <tr>
              <th colSpan={1} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">SPI</th>
              <th colSpan={8} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Hạng mục check (kiểm tra tiêu chuẩn setting SPI)</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 22 */}
            <tr>
              <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Điều kiện setting Inspection (volume: 60-180%; Area: 40-200%; ofset: 0.15, short: 60)</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2"><label className="font-bold text-xs">OK</label><input type="checkbox" /></div>
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 23 */}
            <tr>
                <th colSpan={1} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Mount</th>
                <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Kiểm tra 3 board đầu tiên sau khi cắm linh kiện có ok không ?</th>
                <td colSpan={2} className="border border-gray-600 px-2 py-2">
                    <div className="flex items-center justify-center flex-row gap-2"><label className="font-bold text-xs">OK</label><input type="checkbox" /></div>
                </td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 24 */}
            <tr>
                <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Kiểm tra 1 tấm ở mặt dưới có NG hay bể linh kiện không ?</th>
                <td colSpan={2} className="border border-gray-600 px-2 py-2">
                    <div className="flex items-center justify-center flex-row gap-2"><label className="font-bold text-xs">OK</label><input type="checkbox" /></div>
                </td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 25 */}
            <tr>
                <th colSpan={1} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Reflow</th>
                <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Kiểm tra tình trạng chiều rộng của Conveyor ?</th>
                <td colSpan={2} className="border border-gray-600 px-2 py-2">
                    <div className="flex items-center justify-center flex-row gap-2"><label className="font-bold text-xs">OK</label><input type="checkbox" /></div>
                </td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 26 */}
            <tr>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Giá trị cài đặt Rail</th>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">mm</th>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Giá trị thực tế Rail</th>
                <th colSpan={3} className="border border-gray-600 px-2 py-2 text-xs">mm</th>
                <td colSpan={2} className="border border-gray-600 px-2 py-2">
                    <div className="flex items-center justify-center flex-row gap-2"><label className="font-bold text-xs">OK</label><input type="checkbox" /></div>
                </td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 27 */}
            <tr>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">AOI</th>
                <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Xray 3 board đầu tiên có OK hay không ?</th>
                <td colSpan={2} className="border border-gray-600 px-2 py-2">
                    <div className="flex items-center justify-center flex-row gap-2"><label className="font-bold text-xs">OK</label><input type="checkbox" /></div>
                </td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-left! text-xs">Người kiểm tra:</td>
            </tr>

            {/** Row 27.1 */}
            <tr>
                <th colSpan={1} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">OUTPUT</th>
                <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Kiểm tra tình trạng setting. khoảng cách input magazine tại unloader ?</th>
                <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2">
                    <div className="flex items-center justify-center flex-row gap-2"><label className="font-bold text-xs">OK</label><input type="checkbox" /></div>
                </td>
                <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-left! text-xs">Người kiểm tra:</td>
            </tr>
            {/** Row 27.2 */}
            <tr>
              <th colSpan={8} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">
                <div className="px-3 font-semibold mb-2">Giá trị cài đặt theo yêu cầu</div>

                <div className="flex flex-row justify-center items-center gap-3">
                  <div className="flex flex-row items-center gap-1">
                    <label className="flex items-center gap-2">Model:</label>
                    <input
                      type="text"
                      className="border border-gray-600 px-2 py-1 text-xs w-full focus:bg-white focus:border-blue-500 outline-none hover:bg-white hover:border-blue-400 transition-colors"
                    />
                  </div>

                  <div className="flex flex-row items-center gap-1">
                    <label className="flex items-center gap-2">Pitch:</label>
                    <input
                      type="text"
                      className="border border-gray-600 px-2 py-1 text-xs w-full focus:bg-white focus:border-blue-500 outline-none hover:bg-white hover:border-blue-400 transition-colors"
                    />
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
                <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 30 */}
            <tr>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">AOI</th>
                <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>
                </tbody>

            </table>
    </div>
    {/* Mobile View */}
  <div className="lg:hidden space-y-4">
    {/* Printer Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4">
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
        <div className="text-xs font-semibold text-gray-600 mb-1">Vacuum Block OK</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.printer.vacuumBlockOk ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Ghi chú Vacuum Block</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
          {form.printer.vacuumBlockNote || "—"}
        </div>
      </div>
    </div>

    {/* SPI Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">SPI</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Hạng mục check</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
          {form.spi.inspectionCheck || "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Inspection Setting OK</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.spi.inspectionSettingOk ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Ghi chú</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
          {form.spi.inspectionSettingNote || "—"}
        </div>
      </div>
    </div>

    {/* Mount Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Mount</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">3 board đầu OK</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.mount.firstThreeBoardsOk ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Ghi chú 3 board đầu</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
          {form.mount.firstThreeBoardsNote || "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Mặt dưới OK</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.mount.bottomBoardOk ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Ghi chú mặt dưới</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
          {form.mount.bottomBoardNote || "—"}
        </div>
      </div>
    </div>

    {/* Reflow Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Reflow</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Chiều rộng Conveyor OK</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.reflow.conveyorWidthOk ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Ghi chú Conveyor</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
          {form.reflow.conveyorWidthNote || "—"}
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

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Rail check OK</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.reflow.railCheckOk ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Ghi chú Rail</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
          {form.reflow.railCheckNote || "—"}
        </div>
      </div>
    </div>

    {/* AOI Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">AOI</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Xray 3 board OK</div>
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
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Output</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Khoảng cách magazine OK</div>
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
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Công nhân</h3>
      
      <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-600 mb-2">OP</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.worker.opName || "—"}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Ghi chú</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.worker.opNote || "—"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-600 mb-2">AOI</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.worker.aoiName || "—"}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Ghi chú</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.worker.aoiNote || "—"}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Sample Inspection Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Mẫu kiểm tra (5PCB)</h3>
      
      <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-600 mb-2">Lỗi 1</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên lỗi</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.sampleInspection.errorName1 || "—"}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Số lượng</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.sampleInspection.errorCount1 || "—"}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Sửa chữa</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.sampleInspection.repairStatus1 || "—"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-600 mb-2">Lỗi 2</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên lỗi</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.sampleInspection.errorName2 || "—"}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Số lượng</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.sampleInspection.errorCount2 || "—"}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Sửa chữa</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.sampleInspection.repairStatus2 || "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Buttons */}
  <div className="flex flex-row justify-end w-full gap-2 mt-3">
    <ViewDetailButton onOpen={() => setOpen(true)}>Chỉnh sửa</ViewDetailButton>
    <ViewDetailButton color="green" onOpen={() => {}}>Lưu</ViewDetailButton>
  </div>

   {/* Modal */}
    <Modal open={open} title="Chi tiết PQC Check" onClose={() => setOpen(false)} onSave={submit}>
      <div className="grid gap-4 max-h-[70vh] overflow-y-auto px-1">
        {/* Printer */}
        <section className="pb-3 border-b border-gray-200">
          <h4 className="text-sm font-semibold mb-3 text-gray-700">Printer</h4>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="min-w-0">
              <label className="text-xs block mb-1">Screen Sprint Setting</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0 break-words wrap-break-words"
                value={form.printer.screenSprintSetting ?? ""}
                onChange={(e) => setPrinter("screenSprintSetting", e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs block mb-1">Screen Sprint Spec</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0 break-words wrap-break-words"
                value={form.printer.screenSprintSpec ?? ""}
                onChange={(e) => setPrinter("screenSprintSpec", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="min-w-0">
              <label className="text-xs block mb-1">Screen Sprint Actual</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0 break-words wrap-break-words"
                value={form.printer.screenSprintActual ?? ""}
                onChange={(e) => setPrinter("screenSprintActual", e.target.value)}
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">Áp lực Spec (kg)</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.printer.pressureSpec ?? ""}
                onChange={(e) => setPrinter("pressureSpec", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="min-w-0">
              <label className="text-xs block mb-1">Áp lực thực tế (kg)</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.printer.pressureActual ?? ""}
                onChange={(e) => setPrinter("pressureActual", e.target.value)}
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

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="min-w-0">
              <label className="text-xs block mb-1">Tốc độ quét thực tế (mm/s)</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.printer.scanSpeedActual ?? ""}
                onChange={(e) => setPrinter("scanSpeedActual", e.target.value)}
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">Tốc độ tách bàn Spec (mm/s)</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.printer.separationSpeedSpec ?? ""}
                onChange={(e) => setPrinter("separationSpeedSpec", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="min-w-0">
              <label className="text-xs block mb-1">Tốc độ tách bàn thực tế (mm/s)</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.printer.separationSpeedActual ?? ""}
                onChange={(e) => setPrinter("separationSpeedActual", e.target.value)}
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">Số lần lau Spec</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.printer.wipeCountSpec ?? ""}
                onChange={(e) => setPrinter("wipeCountSpec", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="min-w-0">
              <label className="text-xs block mb-1">Số lần lau thực tế</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.printer.wipeCountActual ?? ""}
                onChange={(e) => setPrinter("wipeCountActual", e.target.value)}
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">Blade used Spec</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.printer.bladeUsedSpec ?? ""}
                onChange={(e) => setPrinter("bladeUsedSpec", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="min-w-0">
              <label className="text-xs block mb-1">Blade used Actual</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.printer.bladeUsedActual ?? ""}
                onChange={(e) => setPrinter("bladeUsedActual", e.target.value)}
              />
            </div>

            <div className="min-w-0 flex items-center">
              <input
                id="vacuumBlockOk"
                type="checkbox"
                checked={!!form.printer.vacuumBlockOk}
                onChange={(e) => setPrinter("vacuumBlockOk", e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="vacuumBlockOk" className="text-xs">Vacuum Block OK</label>
            </div>
          </div>

          <div className="min-w-0 mb-3">
            <label className="text-xs block mb-1">Ghi chú Vacuum Block</label>
            <textarea
              className="block w-full border rounded px-3 py-2 text-sm min-w-0 wrap-break-words wrap-break-words"
              value={form.printer.vacuumBlockNote ?? ""}
              onChange={(e) => setPrinter("vacuumBlockNote", e.target.value)}
              rows={3}
            />
          </div>
        </section>

        {/* SPI */}
        <section className="pb-3 border-b border-gray-200">
          <h4 className="text-sm font-semibold mb-3 text-gray-700">SPI</h4>

          <div className="grid grid-cols-1 gap-3 mb-3">
            <div className="min-w-0">
              <label className="text-xs block mb-1">Inspection Check</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.spi.inspectionCheck ?? ""}
                onChange={(e) => setSPI("inspectionCheck", e.target.value)}
              />
            </div>

            <div className="min-w-0 flex items-center gap-2">
              <input
                id="inspectionSettingOk"
                type="checkbox"
                checked={!!form.spi.inspectionSettingOk}
                onChange={(e) => setSPI("inspectionSettingOk", e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="inspectionSettingOk" className="text-xs">Inspection Setting OK</label>
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">Inspection Note</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.spi.inspectionSettingNote ?? ""}
                onChange={(e) => setSPI("inspectionSettingNote", e.target.value)}
              />
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
              <label htmlFor="firstThreeBoardsOk" className="text-xs">First three boards OK</label>
            </div>
            <div className="min-w-0">
              <label className="text-xs block mb-1">Note</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.mount.firstThreeBoardsNote ?? ""}
                onChange={(e) => setMount("firstThreeBoardsNote", e.target.value)}
              />
            </div>

            <div className="min-w-0 flex items-center gap-2">
              <input
                id="bottomBoardOk"
                type="checkbox"
                checked={!!form.mount.bottomBoardOk}
                onChange={(e) => setMount("bottomBoardOk", e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="bottomBoardOk" className="text-xs">Bottom board OK</label>
            </div>
            <div className="min-w-0">
              <label className="text-xs block mb-1">Note</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.mount.bottomBoardNote ?? ""}
                onChange={(e) => setMount("bottomBoardNote", e.target.value)}
              />
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
              <label htmlFor="conveyorWidthOk" className="text-xs">Conveyor width OK</label>
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">Conveyor Note</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.reflow.conveyorWidthNote ?? ""}
                onChange={(e) => setReflow("conveyorWidthNote", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="text-xs block mb-1">Rail setting value</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                  value={form.reflow.railSettingValue ?? ""}
                  onChange={(e) => setReflow("railSettingValue", e.target.value)}
                />
              </div>
              <div className="min-w-0">
                <label className="text-xs block mb-1">Rail actual value</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                  value={form.reflow.railActualValue ?? ""}
                  onChange={(e) => setReflow("railActualValue", e.target.value)}
                />
              </div>
            </div>

            <div className="min-w-0 flex items-center gap-2">
              <input
                id="railCheckOk"
                type="checkbox"
                checked={!!form.reflow.railCheckOk}
                onChange={(e) => setReflow("railCheckOk", e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="railCheckOk" className="text-xs">Rail check OK</label>
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">Rail check note</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.reflow.railCheckNote ?? ""}
                onChange={(e) => setReflow("railCheckNote", e.target.value)}
              />
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
              <label htmlFor="xrayThreeBoardsOk" className="text-xs">X-ray three boards OK</label>
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">X-ray inspector</label>
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
              <label htmlFor="magazineDistanceOk" className="text-xs">Magazine distance OK</label>
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">Magazine inspector</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.output.magazineInspector ?? ""}
                onChange={(e) => setOutput("magazineInspector", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="text-xs block mb-1">Setting model</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                  value={form.output.settingModel ?? ""}
                  onChange={(e) => setOutput("settingModel", e.target.value)}
                />
              </div>
              <div className="min-w-0">
                <label className="text-xs block mb-1">Setting pitch</label>
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
          <h4 className="text-sm font-semibold mb-3 text-gray-700">Worker</h4>

          <div className="grid grid-cols-1 gap-3 mb-3">
            <div className="min-w-0">
              <label className="text-xs block mb-1">OP Name</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.worker.opName ?? ""}
                onChange={(e) => setWorker("opName", e.target.value)}
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">OP Note</label>
              <textarea
                className="block w-full border rounded px-3 py-2 text-sm min-w-0 wrap-break-words wrap-break-words"
                value={form.worker.opNote ?? ""}
                onChange={(e) => setWorker("opNote", e.target.value)}
                rows={2}
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">AOI Name</label>
              <input
                className="block w-full border rounded px-3 py-2 text-sm min-w-0"
                value={form.worker.aoiName ?? ""}
                onChange={(e) => setWorker("aoiName", e.target.value)}
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs block mb-1">AOI Note</label>
              <textarea
                className="block w-full border rounded px-3 py-2 text-sm min-w-0 wrap-break-words wrap-break-words"
                value={form.worker.aoiNote ?? ""}
                onChange={(e) => setWorker("aoiNote", e.target.value)}
                rows={2}
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
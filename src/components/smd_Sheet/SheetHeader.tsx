/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, memo, useEffect, useMemo } from "react";
import Modal from "../general/Modal";
import ViewDetailButton from "../general/ViewDetailButton";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  getSheetWithFullObject,
  uploadBothFiles,
  updateNoteFile,
} from "../../redux/slices/changeModelSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import { useNavigate } from "react-router-dom";
import { IoEyeSharp } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { getLcrFileData } from "../../redux/slices/FileSlice";
// import { useLocation } from "react-router-dom";

interface FileUploadState {
  lcr?: File;
  reflow?: File;
  noteFile?: string;
  lcrWorker?: string;
  reflowWorker?: string;
}

interface SheetHeaderProps {
  canEdit: boolean;
  returnPath?: string;
}

const SheetHeader = memo(({ canEdit, returnPath }: SheetHeaderProps) => {
  const dispatch = useAppDispatch();
  const { currentSheet, error, uploadLoading } = useAppSelector(
    (state) => state.changeModel,
  );
  const { checkModel } = useAppSelector((state) => state.subTable);
  const [open, setOpen] = useState(false);
  const [tempFileState, setTempFileState] = useState<FileUploadState>({});

  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const { notification, showNotification, hideNotification } =
    useNotification();
  const { t } = useTranslation("sheetHeader");
  const { t: t2 } = useTranslation("common");
  const [tempNoteFile, setTempNoteFile] = useState<string>("");
  const { lcrFileData, lcrValidation } = useAppSelector(
    (state) => state.fileSlice,
  );

  useEffect(() => {
    if (currentSheet?.noteFile) {
      setTempNoteFile(currentSheet.noteFile);
    }
  }, [currentSheet?.noteFile]);

  // Parse workerFile từ backend
  useEffect(() => {
    if (currentSheet?.noteFile) {
      setTempNoteFile(currentSheet.noteFile);
    }

    // Parse workerFile
    if (currentSheet?.workerFile) {
      try {
        const parsed = JSON.parse(currentSheet.workerFile);
        setTempFileState((prev) => ({
          ...prev,
          lcrWorker: parsed.lcrWorker || "",
          reflowWorker: parsed.reflowWorker || "",
        }));
      } catch {
        // Nếu không parse được thì để trống
        setTempFileState((prev) => ({
          ...prev,
          lcrWorker: "",
          reflowWorker: "",
        }));
      }
    }
  }, [currentSheet?.noteFile, currentSheet?.workerFile]);

  const setFile = (key: keyof FileUploadState, file?: File) => {
    setTempFileState((prev) => ({ ...prev, [key]: file }));
  };

  const submit = async () => {
    if (!currentSheet?.id) {
      showNotification("error", "Lỗi", "Không tìm thấy Change Model ID!");
      return;
    }

    // CHỈ CHECK NẾU CHƯA CÓ FILE NÀO TRONG HỆ THỐNG
    const hasExistingLcr =
      currentSheet.excelFileUrl && currentSheet.excelFileUrl.trim() !== "";
    const hasExistingReflow =
      currentSheet.pdfFileUrl && currentSheet.pdfFileUrl.trim() !== "";

    if (tempFileState.lcr) {
      const effectiveLcrWorker = tempFileState.lcrWorker?.trim() || "";
      if (!effectiveLcrWorker) {
        showNotification(
          "warning",
          "Thiếu thông tin",
          "Vui lòng nhập tên người đo LCR trước khi upload.",
        );
        return;
      }
    }

    if (tempFileState.reflow) {
      const effectiveReflowWorker = tempFileState.reflowWorker?.trim() || "";
      if (!effectiveReflowWorker) {
        showNotification(
          "warning",
          "Thiếu thông tin",
          "Vui lòng nhập tên người đo Reflow trước khi upload.",
        );
        return;
      }
    }

    // Nếu chưa có file nào trong hệ thống → BẮT BUỘC phải upload cả 2
    if (!hasExistingLcr && !hasExistingReflow) {
      if (!tempFileState.lcr || !tempFileState.reflow) {
        showNotification(
          "warning",
          "Thiếu file",
          "Lần đầu tiên phải upload cả 2 file: Excel và PDF.",
        );
        return;
      }
    }

    // Nếu đã có file rồi → CHỈ upload file nào được chọn
    if (
      !tempFileState.lcr &&
      !tempFileState.reflow &&
      tempNoteFile === currentSheet.noteFile
    ) {
      showNotification(
        "warning",
        "Chưa có thay đổi",
        "Vui lòng chọn file mới để upload hoặc sửa ghi chú.",
      );
      return;
    }

    if (!checkModel?.workOrder || checkModel.workOrder.trim() === "") {
      showNotification(
        "warning",
        "Thiếu Work Order",
        "Làm ơn nhập Work Order trước khi upload file !!!",
      );
      return;
    }

    try {
      // Flag để biết có upload LCR file mới không
      const uploadedNewLcr = !!tempFileState.lcr;

      // CHỈ GỌI API UPLOAD NẾU CÓ FILE MỚI
      // 1. Upload files
      if (tempFileState.lcr || tempFileState.reflow) {
        await dispatch(
          uploadBothFiles({
            changeModelId: currentSheet.id,
            excelFile: tempFileState.lcr,
            pdfFile: tempFileState.reflow,
          }),
        ).unwrap();
      }

      // 2. Chuẩn bị workerFile JSON
      // Parse existing workerFile
      let existingWorkers = { lcrWorker: "", reflowWorker: "" };
      if (currentSheet.workerFile) {
        try {
          existingWorkers = JSON.parse(currentSheet.workerFile);
        } catch {
          // Keep default empty
        }
      }

      // Update workers (chỉ update field nào có thay đổi)
      const updatedWorkers = {
        lcrWorker: tempFileState.lcrWorker || existingWorkers.lcrWorker,
        reflowWorker:
          tempFileState.reflowWorker || existingWorkers.reflowWorker,
      };

      const workerFileJson = JSON.stringify(updatedWorkers);

      // 3. Update noteFile + workerFile (LUÔN GỌI vì workerFile bắt buộc)
      await dispatch(
        updateNoteFile({
          changeModelId: currentSheet.id,
          noteFile: tempNoteFile,
          workerFile: workerFileJson, // ← BẮT BUỘC phải truyền
        }),
      ).unwrap();

      // RELOAD SHEET DATA
      await dispatch(getSheetWithFullObject(currentSheet.id)).unwrap();

      // NẾU UPLOAD LCR FILE MỚI → VALIDATE NGAY
      if (uploadedNewLcr) {
        showNotification("info", "Đang kiểm tra file LCR...", "Vui lòng đợi");

        // Delay nhỏ để backend kịp lưu file
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Load LCR data để validate
        await dispatch(getLcrFileData(currentSheet.id)).unwrap();
      }

      showNotification("success", "Upload thành công!", t("success_msg"));
      setTempFileState({});
      setOpen(false);
    } catch (err: any) {
      showNotification(
        "error",
        "Upload thất bại",
        err?.message || "Có lỗi xảy ra khi upload file.",
      );
    }
  };

  const handleOpenModal = () => {
    const existingWorkers = (() => {
      if (!currentSheet?.workerFile) return { lcrWorker: "", reflowWorker: "" };
      try {
        return JSON.parse(currentSheet.workerFile);
      } catch {
        return { lcrWorker: "", reflowWorker: "" };
      }
    })();

    setTempFileState({
      lcrWorker: existingWorkers.lcrWorker || "",
      reflowWorker: existingWorkers.reflowWorker || "",
    });
    setOpen(true);
  };

  const handleCloseModal = () => {
    setTempFileState({});
    setOpen(false);
  };

  const handleViewFiles = () => {
    if (!currentSheet?.id) return;

    const roleLower = user?.role?.toLowerCase() || "pqc";
    const hasReflow =
      currentSheet.pdfFileUrl && currentSheet.pdfFileUrl.trim() !== "";
    const defaultFileType = hasReflow ? "reflow" : "lcr";

    // NAVIGATE với đầy đủ state
    navigate(`/${roleLower}/files/${currentSheet.id}/${defaultFileType}`, {
      state: {
        from: "sheetDetail",
        returnPath: window.location.pathname,
        returnSearch: window.location.search,
        originalReturnPath: returnPath,
      },
    });
  };

  const handleFileChange = (
    type: keyof FileUploadState,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    setFile(type, file);
    e.target.value = "";
  };

  const lcrName =
    currentSheet?.excelFileUrl && currentSheet.excelFileUrl.trim() !== ""
      ? currentSheet.excelFileUrl.split("/").pop()
      : t("noFile");

  const reflowName =
    currentSheet?.pdfFileUrl && currentSheet.pdfFileUrl.trim() !== ""
      ? currentSheet.pdfFileUrl.split("/").pop()
      : t("noFile");

  const modalLcrName = tempFileState.lcr?.name || lcrName;
  const modalReflowName = tempFileState.reflow?.name || reflowName;

  // CHECK CẢ 2 FILE - DỰA VÀO currentSheet
  const bothFilesUploaded =
    !!currentSheet?.excelFileUrl &&
    currentSheet.excelFileUrl.trim() !== "" &&
    !!currentSheet?.pdfFileUrl &&
    currentSheet.pdfFileUrl.trim() !== "";

  // Kiểm tra validation của LCR file
  const lcrFileStatus = useMemo(() => {
    if (
      !currentSheet?.excelFileUrl ||
      currentSheet.excelFileUrl.trim() === ""
    ) {
      return {
        hasFile: false,
        isValid: false,
        message: "⚠️ Chưa upload",
        bgColor: "bg-orange-50",
        notMeasuredCount: 0,
      };
    }

    // Nếu chưa load được data từ API
    if (!lcrFileData) {
      return {
        hasFile: true,
        isValid: true,
        message: lcrName,
        bgColor: "bg-green-50",
        notMeasuredCount: 0,
      };
    }

    // Sử dụng validation result từ Redux store
    if (!lcrValidation || !lcrValidation.isValid) {
      return {
        hasFile: true,
        isValid: false,
        message: `❌ ${lcrValidation?.errorMessage || "File không hợp lệ"}`,
        stats: lcrValidation?.stats,
        bgColor: "bg-red-50",
        notMeasuredCount: lcrValidation?.stats?.notMeasured || 0,
      };
    }

    // File hợp lệ (OK === total)
    return {
      hasFile: true,
      isValid: true,
      message: `${lcrName}`,
      bgColor: "bg-green-50",
      notMeasuredCount: 0,
    };
  }, [currentSheet?.excelFileUrl, lcrFileData, lcrValidation, lcrName]);

  const hasExistingLcr =
    currentSheet?.excelFileUrl && currentSheet.excelFileUrl.trim() !== "";
  const hasExistingReflow =
    currentSheet?.pdfFileUrl && currentSheet.pdfFileUrl.trim() !== "";

  const getWorkerNames = useMemo(() => {
    if (!currentSheet?.workerFile) return { lcrWorker: "", reflowWorker: "" };

    try {
      return JSON.parse(currentSheet.workerFile);
    } catch {
      return { lcrWorker: "", reflowWorker: "" };
    }
  }, [currentSheet]);

  return (
    <div>
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />

      {/* WARNING BANNER - File LCR không hợp lệ */}
      {lcrFileStatus.hasFile && !lcrFileStatus.isValid && lcrFileData && (
        <div className="mb-3 p-4 bg-red-50 border-2 border-red-400 rounded-lg no-print animate-pulse">
          <div className="flex items-center justify-center gap-3">
            {lcrFileStatus.stats && (
              <div className="flex gap-4 text-xs bg-white p-2 rounded border border-red-200">
                <span className="text-gray-700">
                  <strong>Total:</strong> {lcrFileStatus.stats.total}
                </span>
                <span className="text-green-600 font-semibold">
                  <strong>OK:</strong> {lcrFileStatus.stats.ok}
                </span>
                <span className="text-red-600 font-bold">
                  <strong>NG:</strong> {lcrFileStatus.stats.ng}
                </span>
                <span className="text-orange-600 font-bold">
                  <strong>SKIP:</strong> {lcrFileStatus.stats.skip}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHỈ HIỂN THỊ KHI CẢ 2 ĐIỀU KIỆN ĐỀU ĐÚNG */}
      {bothFilesUploaded && lcrFileStatus.isValid && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800 font-semibold flex items-center gap-2 mb-0">
            ✓ {t("success_msg")}
          </p>
        </div>
      )}

      <div className="p-0 w-full no-print">
        {/* Website View */}
        <div className="hidden lg:block w-full overflow-x-auto">
          <table className="border border-gray-600 w-full min-w-[1400px] text-center">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  colSpan={7}
                  className="border border-gray-600 px-4 py-6 text-2xl font-bold text-left"
                >
                  SMD Check Sheet Change Model
                </th>
                <th
                  rowSpan={2}
                  className="border border-gray-600 px-2 py-2 text-sm font-bold bg-gray-100"
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                  }}
                >
                  PQC SMD
                </th>
                {/* LCR FILE DATA */}
                <td
                  colSpan={2}
                  className={`border border-gray-600 px-2 py-1 text-xs text-left ${lcrFileStatus.bgColor}`}
                  style={{ maxWidth: "300px", width: "300px" }}
                >
                  <div className="text-sm font-semibold text-gray-800">
                    <div className="wrap-break-words whitespace-normal">
                      {lcrFileStatus.message}
                    </div>
                  </div>

                  {/* Hiển thị tên người đo LCR */}
                  {getWorkerNames.lcrWorker && (
                    <div className="text-xs mt-1 text-blue-600 font-medium">
                      Người đo: {getWorkerNames.lcrWorker}
                    </div>
                  )}

                  {/* Stats */}
                  {!lcrFileStatus.isValid && lcrFileStatus.stats && (
                    <div className="text-xs mt-1 flex flex-wrap gap-2">
                      {lcrFileStatus.stats.notMeasured > 0 && (
                        <span className="text-purple-600 font-semibold whitespace-nowrap">
                          {lcrFileStatus.stats.notMeasured} partCode chưa đo
                        </span>
                      )}
                      {lcrFileStatus.stats.ng > 0 && (
                        <span className="text-red-600 font-semibold whitespace-nowrap">
                          NG: {lcrFileStatus.stats.ng}
                        </span>
                      )}
                      {lcrFileStatus.stats.skip > 0 && (
                        <span className="text-orange-600 font-semibold whitespace-nowrap">
                          SKIP: {lcrFileStatus.stats.skip}
                        </span>
                      )}
                    </div>
                  )}
                </td>

                {/* REFLOW FILE DATA */}
                <td
                  colSpan={2}
                  className={`border border-gray-600 px-2 py-1 text-xs text-left ${
                    currentSheet?.pdfFileUrl &&
                    currentSheet.pdfFileUrl.trim() !== ""
                      ? "bg-green-50"
                      : "bg-orange-50"
                  }`}
                  style={{ maxWidth: "180px", width: "180px" }}
                >
                  <div className="text-sm font-semibold text-gray-800 wrap-break-words whitespace-normal">
                    {currentSheet?.pdfFileUrl &&
                    currentSheet.pdfFileUrl.trim() !== "" ? (
                      <>{reflowName}</>
                    ) : (
                      <>⚠️ Chưa upload</>
                    )}
                  </div>

                  {/* Hiển thị tên người đo Reflow */}
                  {getWorkerNames.reflowWorker && (
                    <div className="text-xs mt-1 text-blue-600 font-medium">
                      Người đo: {getWorkerNames.reflowWorker}
                    </div>
                  )}
                </td>

                {/* NOTE FILE DATA - giữ nguyên */}
                <td
                  colSpan={2}
                  className={`border border-gray-600 px-2 py-1 text-xs text-left ${
                    currentSheet?.noteFile &&
                    currentSheet.noteFile.trim() !== ""
                      ? "bg-green-50"
                      : "bg-orange-50"
                  }`}
                  style={{ maxWidth: "150px", width: "150px" }}
                >
                  <div className="text-sm font-semibold text-gray-800 wrap-break-words whitespace-normal">
                    {currentSheet?.noteFile &&
                    currentSheet.noteFile.trim() !== "" ? (
                      <>{currentSheet.noteFile}</>
                    ) : (
                      <>⚠️ Chưa có ghi chú</>
                    )}
                  </div>
                </td>
              </tr>
            </thead>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => canEdit && setOpen(true)}
            disabled={!canEdit}
            className={`w-full bg-white border border-gray-300 rounded-lg p-4 shadow-sm text-left ${
              canEdit
                ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                : "cursor-not-allowed opacity-90"
            }`}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">
              SMD Check Sheet Change Model
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  LCR file (xlsx)
                </div>
                <div
                  className={`w-full text-sm px-2 py-1 border rounded truncate overflow-hidden ${
                    !lcrFileStatus.hasFile
                      ? "bg-orange-50 border-orange-300 text-orange-800"
                      : lcrFileStatus.isValid
                        ? "bg-green-50 border-green-300 text-green-800"
                        : "bg-red-50 border-red-300 text-red-800"
                  }`}
                >
                  {lcrFileStatus.message}
                </div>

                {/* HIỂN THỊ STATS CHO MOBILE */}
                {!lcrFileStatus.isValid && lcrFileStatus.stats && (
                  <div className="text-xs mt-1 space-y-1">
                    {lcrFileStatus.stats.notMeasured > 0 && (
                      <div className="text-purple-600 font-semibold">
                        Có: {lcrFileStatus.stats.notMeasured} partCode chưa đo
                      </div>
                    )}
                    {lcrFileStatus.stats.ng > 0 && (
                      <div className="text-red-600">
                        NG: {lcrFileStatus.stats.ng}
                      </div>
                    )}
                    {lcrFileStatus.stats.skip > 0 && (
                      <div className="text-orange-600">
                        SKIP: {lcrFileStatus.stats.skip}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  reflow file (pdf)
                </div>
                <div
                  className={`w-full text-sm px-2 py-1 border rounded truncate overflow-hidden ${
                    currentSheet?.pdfFileUrl
                      ? "bg-green-50 border-green-300 text-green-800"
                      : "bg-red-50 border-red-300 text-red-800"
                  }`}
                >
                  {currentSheet?.pdfFileUrl
                    ? `✓ ${reflowName}`
                    : `⚠️ Chưa upload`}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  Note File
                </div>
                <div
                  className={`w-full text-sm px-2 py-1 border rounded truncate overflow-hidden ${
                    currentSheet?.noteFile &&
                    currentSheet.noteFile.trim() !== ""
                      ? "bg-green-50 border-green-300 text-green-800"
                      : "bg-gray-50 border-gray-300 text-gray-600"
                  }`}
                >
                  {currentSheet?.noteFile && currentSheet.noteFile.trim() !== ""
                    ? currentSheet.noteFile
                    : "Chưa có ghi chú"}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Buttons */}
        <div className="flex flex-row justify-end w-full gap-2 mt-3 no-print">
          {bothFilesUploaded && (
            <ViewDetailButton
              onOpen={handleViewFiles}
              disabled={false}
              data-view-detail="true"
            >
              <div className="flex gap-2 items-center justify-center">
                <div>
                  <IoEyeSharp size={20} />
                </div>{" "}
                <div>{t2("button.viewDetail")}</div>
              </div>
            </ViewDetailButton>
          )}

          <ViewDetailButton
            onOpen={handleOpenModal}
            disabled={!canEdit}
            {...(!canEdit ? {} : { "data-edit-button": "true" })}
          >
            {t2("button.edit")}
          </ViewDetailButton>
        </div>

        {/* Modal */}
        <Modal
          open={open}
          title="Upload LCR & REFLOW Files"
          onClose={handleCloseModal}
          onSave={submit}
        >
          <div className="grid gap-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
            {uploadLoading && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-sm text-blue-600 font-semibold">
                  ⏳ Đang tải...
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-semibold">❌ {error}</p>
              </div>
            )}

            {/* LCR File Section */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                LCR file (xlsx)
                {tempFileState.lcr && (
                  <span className="text-green-600 text-xs">✓ Sẽ thay thế</span>
                )}
                {!tempFileState.lcr && hasExistingLcr && (
                  <span className="text-blue-600 text-xs">→ Giữ nguyên</span>
                )}
              </h4>

              <p className="text-xs text-gray-600 mb-2 truncate">
                File hiện tại: <strong>{modalLcrName}</strong>
              </p>

              {/* Input tên người đo LCR */}
              <label className="text-xs block mb-2 w-full">
                <span className="text-red-500">* </span>Tên người đo LCR:
                <input
                  type="text"
                  value={tempFileState.lcrWorker || ""}
                  onChange={(e) =>
                    setTempFileState((prev) => ({
                      ...prev,
                      lcrWorker: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Nhập tên người đo LCR..."
                  disabled={uploadLoading}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
                />
              </label>

              <label className="text-xs block mb-2 w-full">
                {hasExistingLcr
                  ? "Chọn file mới (tùy chọn):"
                  : "Chọn file mới:"}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileChange("lcr", e)}
                  disabled={uploadLoading}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm cursor-pointer hover:bg-gray-600 bg-gray-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                />
              </label>

              {tempFileState.lcr && (
                <button
                  type="button"
                  onClick={() => setFile("lcr", undefined)}
                  disabled={uploadLoading}
                  className="w-full text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Hủy thay thế
                </button>
              )}
            </div>

            {/* Reflow File Section */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                reflow file (pdf)
                {tempFileState.reflow && (
                  <span className="text-green-600 text-xs">✓ Sẽ thay thế</span>
                )}
                {!tempFileState.reflow && hasExistingReflow && (
                  <span className="text-blue-600 text-xs">→ Giữ nguyên</span>
                )}
              </h4>

              <p className="text-xs text-gray-600 mb-2 truncate">
                File hiện tại: <strong>{modalReflowName}</strong>
              </p>

              {/*  Input tên người đo Reflow */}
              <label className="text-xs block mb-2 w-full">
                <span className="text-red-500">* </span>Tên người đo Reflow:
                <input
                  type="text"
                  value={tempFileState.reflowWorker || ""}
                  onChange={(e) =>
                    setTempFileState((prev) => ({
                      ...prev,
                      reflowWorker: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Nhập tên người đo Reflow..."
                  disabled={uploadLoading}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
                />
              </label>

              <label className="text-xs block mb-2 w-full">
                {hasExistingReflow
                  ? "Chọn file mới (tùy chọn):"
                  : "Chọn file mới:"}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange("reflow", e)}
                  disabled={uploadLoading}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm cursor-pointer hover:bg-gray-600 bg-gray-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                />
              </label>

              {tempFileState.reflow && (
                <button
                  type="button"
                  onClick={() => setFile("reflow", undefined)}
                  disabled={uploadLoading}
                  className="w-full text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Hủy thay thế
                </button>
              )}
            </div>

            {/* Note File Section */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-semibold mb-2">Ghi chú File</h4>
              <textarea
                value={tempNoteFile}
                onChange={(e) => setTempNoteFile(e.target.value)}
                placeholder="Nhập ghi chú về file..."
                className="w-full border rounded px-3 py-2 text-sm min-h-20"
                disabled={uploadLoading}
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
});

export default SheetHeader;

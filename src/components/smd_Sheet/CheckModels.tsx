/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, memo, useRef } from "react";
import Modal from "../general/Modal";
import ViewDetailButton from "../general/ViewDetailButton";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { updateCheckModel } from "../../redux/slices/subTableSlice";
import ImagePreviewModal from "../files/ImagePreviewModal";
import ImageViewIcon from "../files/ImageViewIcon";
import type { CheckModelData } from "../../redux/slices/subTableSlice";
import { uploadCheckModelIssueImage } from "../../redux/slices/subTableSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import { formatDateTime } from "../../utils/formatTime";
import { useTranslation } from "react-i18next";
import {
  fetchCheckModel,
  deleteCheckModelIssueImage,
} from "../../redux/slices/subTableSlice";
import { useSubTableFetch } from "../../utils/useSubTableFetch";
import MultiImageUpload from "../files/MultiImageUpload";
const initialFormState: CheckModelData = {
  lineChange: "",
  model: "",
  fCode: "",
  pcBver: "",
  workOrder: "",
  usedCNcard: undefined,
  revS15: "",
  revMounter: "",
  qty: "",
  feederCheck: "",
  opAccept: "",
  jig: undefined,
  codePCB: "",
  note: "",
  imgIssue: [],
};

const CheckModels = memo(function CheckModels({
  canEdit,
}: {
  canEdit: boolean;
}) {
  const dispatch = useAppDispatch();
  const { completedTables } = useAppSelector((state) => state.subTable);
  const checkModel = useAppSelector((state) => state.subTable.checkModel);
  const currentSheet = useAppSelector(
    (state) => state.changeModel.currentSheet,
  );
  const checkModelId = currentSheet?.checkModelId || checkModel?.id;
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CheckModelData>(initialFormState);
  const isUploadingRef = useRef(false);
  const hasUserEditedRef = useRef(false);
  const isSaved = completedTables.includes("CheckModel");
  const { t } = useTranslation("checkModel");
  const { t: t2 } = useTranslation("common");
  const deletingRef = useRef(false);

  // fetch data khi id thay đổi dựa vào id của sheet cha
  useSubTableFetch(checkModelId, fetchCheckModel);

  useEffect(() => {
    if (
      checkModel &&
      !hasUserEditedRef.current &&
      !isUploadingRef.current &&
      !deletingRef.current
    ) {
      setForm(checkModel);
    }
  }, [checkModel]);

  useEffect(() => {
    if (!open) {
      hasUserEditedRef.current = false;
      isUploadingRef.current = false;
      deletingRef.current = false; // ← Reset khi đóng modal
    }
  }, [open]);

  const [imagePreview, setImagePreview] = useState<{
    isOpen: boolean;
    imageUrl: string | string[];
    title: string;
    initialIndex?: number;
  }>({
    isOpen: false,
    imageUrl: "",
    title: "",
    initialIndex: 0,
  });

  const openImagePreview = (
    imageUrl: string | string[],
    title: string,
    initialIndex = 0,
  ) => {
    setImagePreview({
      isOpen: true,
      imageUrl,
      title,
      initialIndex,
    });
  };

  const closeImagePreview = () => {
    setImagePreview({
      isOpen: false,
      imageUrl: "",
      title: "",
      initialIndex: 0,
    });
  };
  // xử lý upload hình ảnh với flag
  const handleImageUpload = async (
    field: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!checkModelId) {
      showNotification("error", "Lỗi upload", "Không tìm thấy CheckModel ID");
      return;
    }

    try {
      isUploadingRef.current = true;

      if (field === "imgIssue") {
        const result = await dispatch(
          uploadCheckModelIssueImage({
            checkModelId: Number(checkModelId),
            file,
          }),
        ).unwrap();

        // Thêm ảnh mới vào array, update local state
        if (result?.imageUrl) {
          setForm((prev) => {
            const fieldKey = field as "imgIssue";
            const currentArray = prev[fieldKey] || [];
            return {
              ...prev,
              [fieldKey]: [...currentArray, result.imageUrl],
            };
          });
        }
        showNotification(
          "success",
          "Thành công",
          "Upload hình ảnh Vấn đề phát sinh thành công",
        );
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      showNotification(
        "error",
        "Lỗi upload",
        "Có lỗi xảy ra khi upload hình ảnh",
      );
    } finally {
      isUploadingRef.current = false;
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!checkModelId) {
      showNotification("error", "Lỗi xóa", "Không tìm thấy CheckModel ID");
      return;
    }
    const imageUrl = form.imgIssue?.[index];
    if (!imageUrl) return;
    try {
      deletingRef.current = true;
      // Gọi API delete
      await dispatch(
        deleteCheckModelIssueImage({
          checkModelId: Number(checkModelId),
          imageUrl,
        }),
      ).unwrap();

      // Cập nhật local state
      setForm((prev) => ({
        ...prev,
        imgIssue: prev.imgIssue?.filter((_, i) => i !== index) || [],
      }));

      showNotification("success", "Đã xóa", "Đã xóa ảnh thành công");
    } catch (error) {
      console.error("Failed to delete image:", error);
      showNotification("error", "Lỗi xóa", "Không thể xóa ảnh");
    } finally {
      deletingRef.current = false; // ← Reset flag SAU khi xong
    }
  };

  const set = <K extends keyof CheckModelData>(k: K, v: CheckModelData[K]) => {
    hasUserEditedRef.current = true;
    setForm((s) => ({ ...s, [k]: v }));
  };

  // SUBMIT WITHOUT VALIDATION
  const submit = async () => {
    if (!checkModelId) {
      showNotification(
        "error",
        "Lỗi",
        "Không tìm thấy CheckModel ID. Vui lòng thử lại.",
      );
      return;
    }

    const workOrder = form.workOrder?.replace(/\s/g, "") ?? "";

    if (workOrder.length !== 14) {
      showNotification(
        "error",
        "Sai format Work Order",
        "Work Order phải đủ đúng 14 ký tự (VD: PD2026XXXXXXXX)",
      );
      return; // KHÔNG cho dispatch
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
        note: form.note,
        imgIssue: form.imgIssue,
      };

      // dispatch redux action
      await dispatch(
        updateCheckModel({
          id: checkModelId,
          data: apiData,
        }),
      ).unwrap();

      if (currentSheet?.id) {
        await dispatch(fetchCheckModel(checkModelId)).unwrap();
      }

      hasUserEditedRef.current = false;
      isUploadingRef.current = false;

      showNotification(
        "success",
        "Thành công",
        "Cập nhật Check Model thành công",
      );
      setOpen(false);
    } catch (error: any) {
      console.error("❌ Lỗi:", error);
      showNotification("error", "Lỗi", error || "Không thể cập nhật");
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
      {checkModelId && (
        <div
          className={`mb-2 text-xs p-2 rounded flex items-center gap-2 no-print ${
            isSaved
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-50 text-gray-600 border border-gray-200"
          }`}
        >
          {isSaved && <span className="text-green-600">✓</span>}
          <span>
            CheckModel ID: <strong>{checkModelId}</strong>
          </span>
          {currentSheet?.id && (
            <span>
              | ChangeModel ID: <strong>{currentSheet.id}</strong>
            </span>
          )}
        </div>
      )}

      {/* Website View - Table */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="border border-gray-600 w-full text-center opacity-80">
          <thead>
            <tr>
              <th rowSpan={2} className="border px-2 py-2 text-xs bg-gray-100">
                {t("line")}
              </th>
              <td rowSpan={2} className="border px-2 py-2 text-xs">
                {form.lineChange || ""}
              </td>
              <td
                rowSpan={2}
                className="border px-2 py-2 text-xs bg-gray-300"
              ></td>
              <th className="border px-2 py-2 text-xs bg-gray-100">
                Model/Side
              </th>
              <th colSpan={2} className="border px-2 py-2 text-xs font-normal">
                {form.model}
              </th>
              <th className="border px-2 py-2 text-xs bg-gray-100">REV S15</th>
              <td className="border px-2 py-2 text-xs">{form.revS15 || ""}</td>
              <th rowSpan={2} className="border px-2 py-2 text-xs bg-gray-100">
                DATE
              </th>
              <th colSpan={2} className="border px-2 py-2 text-xs bg-gray-100">
                Feeder Check
              </th>
              <td className="border px-2 py-2 text-xs">
                {formatDateTime(form.feederCheck) || ""}
              </td>
              <td rowSpan={2} className="border px-2 py-2 bg-gray-300"></td>
            </tr>

            <tr>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">
                F Code(3in1)
              </th>
              <td colSpan={2} className="border px-2 py-2 text-xs">
                {form.fCode || ""}
              </td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">
                REV MOUNTER
              </th>
              <td className="border px-2 py-2 text-xs">
                {form.revMounter || ""}
              </td>
              <th colSpan={2} className="border px-2 py-2 text-xs bg-gray-100">
                OP Accept
              </th>
              <td className="border px-2 py-2 text-xs">
                {formatDateTime(form.opAccept) || ""}
              </td>
            </tr>

            <tr>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">
                PCB ver
              </th>
              <td colSpan={2} className="border px-2 py-2 text-xs">
                {form.pcBver || ""}
              </td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">
                Work Order
              </th>
              <td className="border px-2 py-2 text-xs">
                {form.workOrder || ""}
              </td>
              <th colSpan={2} className="border px-2 py-2 text-xs bg-gray-100">
                Used CN card
              </th>
              <td className="border px-2 py-2 text-xs">
                {form.usedCNcard !== undefined
                  ? form.usedCNcard
                    ? "Yes"
                    : "No"
                  : ""}
              </td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">
                Qty
              </th>
              <td className="border px-2 py-2 text-xs">{form.qty}</td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">
                JIG
              </th>
              <td className="border px-2 py-2 text-xs">
                {form.jig !== undefined ? (form.jig ? "Yes" : "No") : ""}
              </td>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">
                Code PCB
              </th>
              <td className="border px-2 py-2 text-xs">{form.codePCB || ""}</td>
            </tr>

            <tr>
              <th className="border px-2 py-2 text-xs text-left bg-gray-100">
                {t2("issueNote")}
              </th>
              <td colSpan={13} className="border px-2 py-2 text-xs">
                {form.note || ""}
              </td>
            </tr>

            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t2("issueImg")}
              </th>
              <td
                colSpan={13}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <ImageViewIcon
                      imageUrl={form.imgIssue}
                      title="Hình ảnh Vấn đề phát sinh"
                      onView={openImagePreview}
                    />
                  </div>
                </div>
              </td>
            </tr>
          </thead>
        </table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden">
        <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm">
          {/* Phần có thể click để mở modal */}
          <div
            onClick={() => canEdit && setOpen(true)}
            className={`p-4 ${
              canEdit
                ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                : "cursor-not-allowed opacity-90"
            }`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            onKeyDown={(e) => {
              if (canEdit && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            aria-disabled={!canEdit}
          >
            <h3 className="text-base font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300 flex items-center gap-2">
              Check Model
            </h3>

            {/* Line đổi */}
            <div className="min-w-0 mb-2">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("line")}
              </div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.lineChange || "—"}
              </div>
            </div>

            {/* F Code 3in1 */}
            <div className="min-w-0 mb-2">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                F Code 3in1
              </div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.fCode || "—"}
              </div>
            </div>

            {/* Model/Side */}
            <div className="min-w-0 mb-2">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                Model/Side
              </div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.model || "—"}
              </div>
            </div>

            {/* REV S15 & REV MOUNTER */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  REV S15
                </div>
                <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.revS15 || "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  REV MOUNTER
                </div>
                <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.revMounter || "—"}
                </div>
              </div>
            </div>

            {/* Feeder Check & OP Accept */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  Feeder Check
                </div>
                <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {formatDateTime(form.feederCheck) || "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  OP Accept
                </div>
                <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {formatDateTime(form.opAccept) || "—"}
                </div>
              </div>
            </div>

            {/* PCB ver & Work Order */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  PCB ver
                </div>
                <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.pcBver || "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  Work Order
                </div>
                <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.workOrder || "—"}
                </div>
              </div>
            </div>

            {/* Qty & Code PCB */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  Qty
                </div>
                <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.qty || "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  Code PCB
                </div>
                <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.codePCB || "—"}
                </div>
              </div>
            </div>

            {/* Used CN card & JIG */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("useCNCard")}
                </div>
                <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.usedCNcard !== undefined
                    ? form.usedCNcard
                      ? "Yes"
                      : "No"
                    : "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  JIG
                </div>
                <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.jig !== undefined ? (form.jig ? "Yes" : "No") : "—"}
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="min-w-0 mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t2("issueNote")}
              </div>
              <div className="w-full text-base px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.note || "—"}
              </div>
            </div>
          </div>

          {/* PHẦN HÌNH ẢNH - Không trigger modal */}
          <div className="px-4 pb-4 pt-0">
            {/* Hình ảnh vấn đề phát sinh */}
            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t2("issueImg")}
              </div>
              <div
                className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageViewIcon
                  imageUrl={form.imgIssue}
                  title={t2("issueImg")}
                  onView={openImagePreview}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3 no-print">
        <ViewDetailButton
          onOpen={() => setOpen(true)}
          disabled={!canEdit}
          {...(!canEdit ? {} : { "data-edit-button": "true" })}
        >
          {t2("button.edit")}
        </ViewDetailButton>
      </div>

      {/* Modal without Validation */}
      <Modal
        open={open}
        title="Chi tiết Check Model"
        onClose={() => {
          setOpen(false);
        }}
        onSave={submit}
      >
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
          {/* Line đổi */}
          <label className="text-xs">
            Line đổi
            <input
              value={form.lineChange ?? ""}
              onChange={(e) => {
                set("lineChange", e.target.value.toUpperCase());
              }}
              className="mt-1 block w-full border rounded px-3 py-2 text-base uppercase"
              placeholder=""
              style={{
                fontSize: "16px",
                touchAction: "manipulation",
              }}
            />
          </label>

          {/* Model/Side */}
          <label className="text-xs">
            Model/Side
            <input
              value={form.model ?? ""}
              onChange={(e) => {
                set("model", e.target.value.toUpperCase());
              }}
              className="mt-1 block w-full border rounded px-3 py-2 text-base uppercase"
              placeholder=""
              style={{
                fontSize: "16px",
                touchAction: "manipulation",
              }}
            />
          </label>

          {/* F Code (3in1) */}
          <label className="text-xs">
            F Code (3in1)
            <input
              value={form.fCode ?? ""}
              onChange={(e) => set("fCode", e.target.value.toUpperCase())}
              className="mt-1 block w-full border rounded px-3 py-2 text-base uppercase"
              placeholder=""
              style={{
                fontSize: "16px",
                touchAction: "manipulation",
              }}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* REV S15 */}
            <label className="text-xs">
              REV S15
              <input
                value={form.revS15 ?? ""}
                onChange={(e) => set("revS15", e.target.value.toUpperCase())}
                className="mt-1 block w-full border rounded px-3 py-2 text-base uppercase"
                placeholder=""
                style={{
                  fontSize: "16px",
                  touchAction: "manipulation",
                }}
              />
            </label>

            {/* REV MOUNTER */}
            <label className="text-xs">
              REV MOUNTER
              <input
                value={form.revMounter ?? ""}
                onChange={(e) =>
                  set("revMounter", e.target.value.toUpperCase())
                }
                className="mt-1 block w-full border rounded px-3 py-2 text-base uppercase"
                placeholder=""
                style={{
                  fontSize: "16px",
                  touchAction: "manipulation",
                }}
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
                style={{
                  WebkitAppearance: "none",
                  minHeight: "44px",
                }}
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
                style={{
                  WebkitAppearance: "none",
                  minHeight: "44px",
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* PCB ver */}
            <label className="text-xs">
              PCB ver
              <input
                value={form.pcBver ?? ""}
                onChange={(e) => set("pcBver", e.target.value.toUpperCase())}
                className="mt-1 block w-full border rounded px-3 py-2 text-base uppercase"
                placeholder=""
                style={{
                  fontSize: "16px",
                  touchAction: "manipulation",
                }}
              />
            </label>

            {/* Work Order */}
            <label className="text-xs">
              Work Order
              <input
                placeholder="PD2026XXXXXXXX"
                value={form.workOrder ?? "PD2026"}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  if (value.length > 14) {
                    showNotification(
                      "error",
                      "Work Order đã vượt qua 14 ký tự",
                      "Vui lòng kiểm tra lại",
                    );
                    return;
                  }
                  if (value.startsWith("PD2026")) {
                    set("workOrder", value);
                  } else if (value.length < "PD2026".length) {
                    set("workOrder", "PD2026");
                  }
                }}
                className="mt-1 block w-full border rounded px-3 py-2 text-base uppercase"
              />
            </label>
          </div>

          {/* Qty */}
          <label className="text-xs">
            Qty
            <input
              type="text"
              value={form.qty ?? ""}
              placeholder=""
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                set("qty", val);
              }}
              className="mt-1 block w-full border rounded px-3 py-2 text-base uppercase"
              min="0"
              style={{
                fontSize: "16px",
                touchAction: "manipulation",
              }}
            />
          </label>

          {/* Mã PCB */}
          <label className="text-xs">
            Code PCB
            <textarea
              value={form.codePCB ?? "BN41-"}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                if (value.startsWith("BN41-")) {
                  set("codePCB", value);
                } else if (value.length < "BN41-".length) {
                  // Nếu user xóa, set lại về "BN41-"
                  set("codePCB", "BN41-");
                }
              }}
              className="mt-1 block w-full border rounded px-3 py-2 text-base min-h-[60px] resize-y uppercase"
              placeholder=""
              style={{
                fontSize: "16px",
                touchAction: "manipulation",
              }}
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
                    form.usedCNcard === true
                      ? "bg-blue-100 border-blue-500 font-semibold"
                      : "border-gray-300"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => set("usedCNcard", false)}
                  className={`px-4 py-2 rounded text-base border ${
                    form.usedCNcard === false
                      ? "bg-blue-100 border-blue-500 font-semibold"
                      : "border-gray-300"
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
                    form.jig === true
                      ? "bg-blue-100 border-blue-500 font-semibold"
                      : "border-gray-300"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => set("jig", false)}
                  className={`px-4 py-2 rounded text-base border ${
                    form.jig === false
                      ? "bg-blue-100 border-blue-500 font-semibold"
                      : "border-gray-300"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/** note */}
            <label className="text-xs">
              Ghi chú vấn đề phát sinh
              <textarea
                value={form.note}
                onChange={(e) => set("note", e.target.value.toUpperCase())}
                className="mt-1 block w-full border rounded px-3 py-2 text-base min-h-[60px] resize-y uppercase"
                placeholder=""
                style={{
                  fontSize: "16px",
                  touchAction: "manipulation",
                }}
              />
            </label>
            {/** imgIssue */}
            <MultiImageUpload
              label="Vấn đề phát sinh"
              images={form.imgIssue}
              fieldName="imgIssue"
              onUpload={handleImageUpload}
              onRemove={handleRemoveImage}
              onViewAll={() =>
                openImagePreview(
                  form.imgIssue || [],
                  "Hình ảnh Vấn đề phát sinh",
                  0,
                )
              }
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

export default CheckModels;

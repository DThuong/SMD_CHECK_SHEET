/* eslint-disable react-hooks/exhaustive-deps */
import ViewDetailButton from "../general/ViewDetailButton";
import { useEffect, useRef, useState, memo } from "react";
import Modal from "../general/Modal";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  fetchStandardProduction,
  updateStandardProduction,
  uploadStandardProductionImage,
  uploadStandardProductionIssueImage,
  deleteStandardProductionImage,
  deleteStandardProductionIssueImage,
} from "../../redux/slices/subTableSlice";
import type { StandardProductionData } from "../../redux/slices/subTableSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import ImageViewIcon from "../files/ImageViewIcon";

import ImagePreviewModal from "../files/ImagePreviewModal";
import { useTranslation } from "react-i18next";
import MultiImageUpload from "../files/MultiImageUpload";

import { useSubTableFetch } from "../../utils/useSubTableFetch";

const initialStandardProductState: StandardProductionData = {
  id: undefined,
  numMASK: "",
  numMES: "",
  numScanPrinter: "",
  numScanSignMES: "",
  mlS3Closed: "",
  useOnly: "",
  labelProgram: "",
  imgStandard: [],
  note: "",
  imgIssue: [],
};

// Standard Production Section
const StandardProductionSection = memo(({ canEdit }: { canEdit: boolean }) => {
  const dispatch = useAppDispatch();
  // khai báo loading để xử lý loading state trong modal
  const { completedTables } = useAppSelector((state) => state.subTable);
  const { standardProduction } = useAppSelector((state) => state.subTable);
  const currentSheet = useAppSelector(
    (state) => state.changeModel.currentSheet,
  );
  const smdSheetId = currentSheet?.id;
  const standardProductionId =
    currentSheet?.standardProductionId || standardProduction?.id;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StandardProductionData>(
    initialStandardProductState,
  );

  const isSaved = completedTables.includes("StandardProduction");

  const { notification, showNotification, hideNotification } =
    useNotification();
  const hasUserEditedRef = useRef(false);
  const isUploadingRef = useRef(false);

  const { t } = useTranslation("standardProduction");
  const { t: t2 } = useTranslation("common");

  const deletingRef = useRef(false);

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

  // Hàm mở preview cũng cần cập nhật
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

  // Fetch data khi ID thay đổi
  useSubTableFetch(standardProductionId, fetchStandardProduction);

  // Sync form với Redux
  useEffect(() => {
    if (
      standardProduction &&
      !hasUserEditedRef.current &&
      !isUploadingRef.current &&
      !deletingRef.current
    ) {
      setForm(standardProduction);
    }
  }, [standardProduction]);

  // Reset flags khi đóng modal
  useEffect(() => {
    if (!open) {
      hasUserEditedRef.current = false;
      isUploadingRef.current = false;
      deletingRef.current = false;
    }
  }, [open]);

  if (!standardProductionId) {
    return (
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-500">
          Đang tải dữ liệu Standard Production...
        </p>
      </div>
    );
  }

  // xử lý upload hình ảnh với flag
  const handleImageUpload = async (
    field: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!standardProductionId) {
      showNotification(
        "error",
        "Lỗi upload",
        "Không tìm thấy StandardProduction ID",
      );
      return;
    }

    try {
      isUploadingRef.current = true;

      let result;
      let successMessage = "";

      switch (field) {
        case "imgStandard":
          result = await dispatch(
            uploadStandardProductionImage({
              standardProductionId: Number(standardProductionId),
              file,
            }),
          ).unwrap();
          successMessage = "Upload hình ảnh Tiêu Chuẩn Sản Xuất thành công";
          break;

        case "imgIssue":
          result = await dispatch(
            uploadStandardProductionIssueImage({
              StandardProductionId: Number(standardProductionId),
              file,
            }),
          ).unwrap();
          successMessage = "Upload hình ảnh vấn đề phát sinh thành công";
          break;
      }

      // Thêm ảnh mới vào array, update local state
      if (result?.imageUrl) {
        setForm((prev) => {
          const fieldKey = field as "imgStandard" | "imgIssue";
          const currentArray = prev[fieldKey] || [];

          return {
            ...prev,
            [fieldKey]: [...currentArray, result.imageUrl],
          };
        });
      }

      showNotification("success", "Thành công", successMessage);
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

  const handleRemoveImage = async (
    field: "imgStandard" | "imgIssue",
    index: number,
  ) => {
    if (!standardProductionId) {
      showNotification(
        "error",
        "Lỗi xóa",
        "Không tìm thấy StandardProduction ID",
      );
      return;
    }

    const imageUrl = form[field]?.[index];
    if (!imageUrl) return;

    try {
      deletingRef.current = true;
      // Gọi API delete tương ứng với field
      if (field === "imgStandard") {
        await dispatch(
          deleteStandardProductionImage({
            standardProductionId: Number(standardProductionId),
            imageUrl,
          }),
        ).unwrap();
      } else if (field === "imgIssue") {
        await dispatch(
          deleteStandardProductionIssueImage({
            standardProductionId: Number(standardProductionId),
            imageUrl,
          }),
        ).unwrap();
      }

      // Cập nhật local state
      setForm((prev) => ({
        ...prev,
        [field]: (prev[field] as string[])?.filter((_, i) => i !== index) || [],
      }));

      showNotification(
        "success",
        "Đã xóa",
        `Đã xóa ảnh ${field === "imgStandard" ? "Tiêu Chuẩn Sản Xuất" : "vấn đề phát sinh"}`,
      );
    } catch (error) {
      console.error("Failed to delete image:", error);
      showNotification("error", "Lỗi xóa", "Không thể xóa ảnh");
    } finally {
      deletingRef.current = false;
    }
  };

  // Wrapper cho set() để đánh dấu user đã edit
  const set = <K extends keyof StandardProductionData>(
    k: K,
    v: StandardProductionData[K],
  ) => {
    hasUserEditedRef.current = true;
    setForm((s) => ({ ...s, [k]: v }));
  };

  const submit = async () => {
    if (!standardProductionId) {
      showNotification(
        "error",
        "Lỗi lưu Standard Production",
        "Không tìm thấy StandardProduction ID",
      );
      return;
    }

    if (!smdSheetId) {
      showNotification(
        "error",
        "Lỗi lưu Standard Production",
        "Không tìm thấy SMD Sheet ID",
      );
      return;
    }

    try {
      const dataToSubmit = {
        ...form,
        numMASK: form.numMASK?.toUpperCase() || "",
        numMES: form.numMES?.toUpperCase() || "",
        numScanPrinter: form.numScanPrinter?.toUpperCase() || "",
        numScanSignMES: form.numScanSignMES?.toUpperCase() || "",
        mlS3Closed: form.mlS3Closed?.toUpperCase() || "",
        labelProgram: form.labelProgram?.toUpperCase() || "",
        note: form.note?.toUpperCase() || "",
      };

      await dispatch(
        updateStandardProduction({
          id: standardProductionId,
          data: dataToSubmit,
        }),
      ).unwrap();

      await dispatch(fetchStandardProduction(standardProductionId)).unwrap();

      setOpen(false);
      showNotification(
        "success",
        "Thành công",
        "Cập nhật Standard Production thành công",
      );
    } catch (error) {
      console.error("Failed to update StandardProductions:", error);
      showNotification(
        "error",
        "Lỗi lưu Standard Production",
        "Có lỗi xảy ra khi cập nhật StandardProductions",
      );
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
        <div
          className={`mb-2 text-xs p-2 rounded flex items-center gap-2 no-print ${
            isSaved
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-50 text-gray-600 border border-gray-200"
          }`}
        >
          {isSaved && <span className="text-green-600">✓</span>}
          <span>
            StandardProduction ID: <strong>{standardProductionId}</strong>
          </span>
          {currentSheet?.id && (
            <span>
              | ChangeModel ID: <strong>{currentSheet.id}</strong>
            </span>
          )}
          {isSaved && (
            <span className="ml-auto font-semibold">{t("status.saved")}</span>
          )}
        </div>
      )}
      {/** repsponsive for desktop */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="border border-gray-600 w-full text-center opacity-80">
          <tbody>
            {/* Row 10 */}
            <tr>
              <th
                rowSpan={3}
                className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100"
              >
                {t("title")}
              </th>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("fields.numMASK")}
              </th>
              <td className="border border-gray-600 px-2 py-2 text-xs">
                {form.numMASK || ""}
              </td>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("fields.numScanPrinter")}
              </th>
              <td className="border border-gray-600 px-2 py-2 text-xs">
                {form.numScanPrinter || ""}
              </td>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("fields.mlS3Closed")}
              </th>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("fields.useOnly")}
              </th>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("fields.labelProgram")}
              </th>
            </tr>

            {/* Row 11 */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("fields.numMES")}
              </th>
              <td className="border border-gray-600 px-2 py-2 text-xs">
                {form.numMES || ""}
              </td>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("fields.numScanSignMES")}
              </th>
              <td className="border border-gray-600 px-2 py-2 text-xs">
                {form.numScanSignMES || ""}
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.mlS3Closed || ""}
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex flex-row justify-center items-center gap-3">
                  <div className="flex flex-row items-center justify-center gap-1">
                    <span className="text-base font-bold">
                      {form.useOnly === "Duksan" ? "✓" : ""}
                    </span>
                    <label className="flex items-center justify-center gap-2 text-xs">
                      Duksan
                    </label>
                  </div>
                  <div className="flex flex-row items-center justify-center gap-1">
                    <span className="text-base font-bold">
                      {form.useOnly === "Heesung" ? "✓" : ""}
                    </span>
                    <label className="flex items-center justify-center gap-2 text-xs">
                      Heesung
                    </label>
                  </div>
                </div>
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.labelProgram || ""}
              </td>
            </tr>

            {/** row 12: hình ảnh standard production */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("fields.imageStandard")}
              </th>
              <td
                colSpan={10}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <ImageViewIcon
                      imageUrl={form.imgStandard}
                      title="Hình ảnh Tiêu Chuẩn Sản Xuất"
                      onView={openImagePreview}
                    />
                  </div>
                </div>
              </td>
            </tr>
            {/** row 12.1: Ghi chú vấn đề phát sinh */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t2("issueNote")}
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.note || ""}
              </td>
            </tr>
            {/** row 13: hình ảnh vấn đề phát sinh */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t2("issueImg")}
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
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
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">
              {t("title")}
              {isSaved && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded ml-2">
                  ✓ Đã lưu
                </span>
              )}
            </h3>

            {/* Row 1: Số quản lý trên Mask & Số đăng ký trên MES */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("fields.numMASK")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.numMASK || "—"}
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("fields.numMES")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.numMES || "—"}
                </div>
              </div>
            </div>

            {/* Row 2: Số dao quét Printer */}
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("fields.numScanPrinter")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.numScanPrinter || "—"}
              </div>
            </div>

            {/* Row 3: Số đăng ký dao quét trên MES */}
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("fields.numScanSignMES")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.numScanSignMES || "—"}
              </div>
            </div>

            {/* Row 4: Liệu MSL3 mở đóng gói & Chương trình máy label */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("fields.mlS3Closed")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.mlS3Closed || "—"}
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("fields.labelProgram")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.labelProgram || "—"}
                </div>
              </div>
            </div>

            {/* Row 5: Chỉ sử dụng (full width) */}
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("fields.useOnly")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.useOnly === "Duksan"
                  ? "Duksan"
                  : form.useOnly === "Heesung"
                    ? "Heesung"
                    : "—"}
              </div>
            </div>

            {/* Ghi chú vấn đề phát sinh */}
            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t2("issueNote")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.note || "—"}
              </div>
            </div>
          </div>

          {/* PHẦN HÌNH ẢNH - Không trigger modal */}
          <div className="px-4 pb-4 pt-0">
            {/* Hình ảnh Standard production */}
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("fields.imageStandard")}
              </div>
              <div
                className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageViewIcon
                  imageUrl={form.imgStandard}
                  title="Hình ảnh Tiêu Chuẩn Sản Xuất"
                  onView={openImagePreview}
                />
              </div>
            </div>

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
                  title="Hình ảnh Vấn đề phát sinh"
                  onView={openImagePreview}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/** buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3 no-print">
        <ViewDetailButton
          onOpen={() => setOpen(true)}
          disabled={!canEdit}
          {...(!canEdit ? {} : { "data-edit-button": "true" })}
        >
          {t("button.edit")}
        </ViewDetailButton>
      </div>

      <Modal
        open={open}
        title="Chi tiết Tiêu chuẩn sản xuất"
        onClose={() => setOpen(false)}
        onSave={submit}
      >
        <div
          className="max-h-[60vh] overflow-y-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="grid gap-3 p-1">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs">
                Số quản lý trên Mask
                <input
                  value={form.numMASK ?? ""}
                  onChange={(e) => set("numMASK", e.target.value)}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
                  placeholder=""
                />
              </label>

              <label className="text-xs">
                Số đăng ký trên MES
                <input
                  value={form.numMES ?? ""}
                  onChange={(e) => set("numMES", e.target.value)}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
                  placeholder=""
                />
              </label>
            </div>

            <label className="text-xs">
              Số dao quét Printer
              <input
                value={form.numScanPrinter ?? ""}
                onChange={(e) => set("numScanPrinter", e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
                placeholder=""
              />
            </label>

            <label className="text-xs">
              Số đăng ký dao quét trên MES
              <input
                value={form.numScanSignMES ?? ""}
                onChange={(e) => set("numScanSignMES", e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
                placeholder=""
              />
            </label>

            <label className="text-xs">
              Liệu MSL3 mở đóng gói
              <input
                value={form.mlS3Closed ?? ""}
                onChange={(e) => set("mlS3Closed", e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
                placeholder=""
              />
            </label>

            <label className="text-xs">
              Chương trình máy label
              <input
                value={form.labelProgram ?? ""}
                onChange={(e) => set("labelProgram", e.target.value)}
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

            <MultiImageUpload
              label="Tiêu Chuẩn Sản Xuất"
              images={form.imgStandard}
              fieldName="imgStandard"
              onUpload={handleImageUpload}
              onRemove={(index) => handleRemoveImage("imgStandard", index)}
              onViewAll={() =>
                openImagePreview(
                  form.imgStandard || [],
                  "Hình ảnh Tiêu Chuẩn Sản Xuất",
                  0,
                )
              }
              onViewSingle={(url, title) => openImagePreview(url, title)}
            />

            <label className="text-xs">
              Ghi chú vấn đề phát sinh
              <textarea
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                rows={3}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm uppercase"
                placeholder=""
                style={{
                  fontSize: "16px",
                  touchAction: "manipulation",
                  resize: "vertical",
                }}
              />
            </label>

            <MultiImageUpload
              label="Vấn đề phát sinh"
              images={form.imgIssue}
              fieldName="imgIssue"
              onUpload={handleImageUpload}
              onRemove={(index) => handleRemoveImage("imgIssue", index)}
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

export default StandardProductionSection;

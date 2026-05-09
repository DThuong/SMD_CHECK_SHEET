# Kế Hoạch Triển Khai Tính Năng "Patrol Check List" (Cập Nhật Lần 3)

Tài liệu này phác thảo kế hoạch cụ thể để triển khai tính năng "Patrol Check List" hoàn toàn ở phía Frontend sử dụng dữ liệu mẫu (mock data), phân quyền động, thiết kế responsive trên mobile, và tập trung xây dựng hệ thống Báo Cáo (Dashboard) với các biểu đồ đa dạng, trực quan.

## Chi Tiết Kế Hoạch

### 1. Cập Nhật Navigation & Phân Quyền (Layouts)
*   **Subnav duy nhất**: Chỉ áp dụng cho menu "Patrol Check list".
*   **Menu gồm 3 Subnav**:
    1.  **Quản lý Patrol**: Cấu hình mẫu Sheet. Chỉ dành cho `PQCLeader`. Các role khác không thể truy cập (hiển thị thông báo).
    2.  **Patrol check list**: Nơi xem, tạo và xử lý các tờ check sheet. Tất cả role đều truy cập được (phân quyền nút bấm theo role).
    3.  **Báo cáo Patrol**: Màn hình xem thống kê, biểu đồ. Tất cả role đều truy cập được.
*   **Mobile Responsive**: Subnav thiết kế thụt lề (indent) bên trong menu cha trên Sidebar di động.

### 2. Bỏ Qua Đa Ngôn Ngữ (i18n) Tạm Thời
*   Toàn bộ UI và các nhãn (labels) sẽ thiết kế 100% bằng **Tiếng Việt**.
*   Phần đa ngôn ngữ sẽ được thêm sau khi có API.

### 3. Lưu Trữ Mock Data (LocalStorage)
*   Sử dụng `localStorage` trực tiếp bên trong Component:
    *   `patrolTemplate`: Cấu trúc do PQCLeader thiết lập.
    *   `patrolSheets`: Danh sách các phiếu Patrol.
    *   `patrolReports` (Tự động sinh/mock): Dữ liệu giả lập cho các biểu đồ báo cáo.

### 4. Component Duy Nhất: `PatrolComponent.tsx`
Tất cả các tính năng sẽ được code gom vào **một file `src/pages/PatrolComponent.tsx`**, sử dụng Local States để chuyển đổi màn hình (`currentView`). 

#### Màn hình 1: Quản lý Patrol (View dành cho PQCLeader)
*   Hiển thị form thiết lập Cấu trúc Sheet: Thêm/Sửa/Xóa *Công đoạn*, *Hạng mục*, *Câu hỏi kiểm tra* và *Dạng kết quả*.

#### Màn hình 2: Danh sách Patrol Check List
*   Danh sách các sheet đã được PQC tạo, phân quyền thao tác rõ ràng.

#### Màn hình 3: Chi Tiết / Tạo Mới Patrol Sheet (Thiết kế mới)
*   **Thiết kế Bảng Trực Quan (Card/Block)**: Thay thế giao diện bảng Excel cứng nhắc. Nhóm các câu hỏi kiểm tra theo từng **Công Đoạn (Block)** và **Hạng Mục (Card)** hiện đại, sử dụng Toggle switch (OK/NG) to, rõ, thân thiện với màn hình cảm ứng di động.
*   **Phần Hình Ảnh & Note**: Grid hình ảnh (upload/camera). Thêm textarea cho Leader ghi chú bên dưới ảnh.
*   **Phần Chữ Ký**: Tách biệt nút Ký dành cho PQC và PQCLeader.

#### Màn hình 4: Báo cáo Patrol (Report Dashboard)
Màn hình này sử dụng thư viện Recharts để cung cấp cái nhìn trực quan, phân tích hiệu suất và chất lượng sản xuất SMD. Bỏ hoàn toàn biểu đồ tròn (Pie Chart), thay vào đó sử dụng kết hợp các biểu đồ Cột và Đường:

*   **Biểu đồ 1: Tổng quan xu hướng lỗi theo thời gian (Composed Chart - Cột kết hợp Đường)**
    *   *Mục đích*: Xem tổng khối lượng kiểm tra và số lỗi phát sinh trong tuần/tháng.
    *   *Trục X*: Thời gian (Các ngày trong tuần).
    *   *Cột (Bar)*: Tổng số lượng hạng mục đã kiểm tra.
    *   *Đường (Line)*: Số lượng lỗi (NG) phát hiện trong ngày đó.
*   **Biểu đồ 2: Phân bổ chất lượng theo Công Đoạn (Stacked Bar Chart - Cột chồng)**
    *   *Mục đích*: Chỉ ra ngay công đoạn nào đang gặp vấn đề nhiều nhất để tập trung xử lý.
    *   *Trục X*: Các Công Đoạn (Metal Mask, FirmWare, Solder...).
    *   *Cột chồng*: Biểu diễn số lượng đánh giá OK (Màu xanh) nằm dưới, và NG (Màu đỏ/cam) nằm trên đỉnh cột.
*   **Biểu đồ 3: Top các Hạng mục thường xuyên lỗi (Horizontal Bar Chart - Cột ngang)**
    *   *Mục đích*: Xếp hạng các lỗi phổ biến nhất trong xưởng.
    *   *Trục Y*: Tên các Hạng mục thường bị NG nhất (Ví dụ: Nhiệt độ Solder, Vệ sinh Squeege...).
    *   *Trục X (Cột)*: Tần suất (số lần NG).
*   **Biểu đồ 4: Hiệu suất nhân sự (Grouped Bar Chart - Cột kép)**
    *   *Mục đích*: Đánh giá khối lượng công việc của từng PQC.
    *   *Trục X*: Tên nhân viên PQC.
    *   *Cột Kép*: Cột 1 (Số Sheet đã tạo) đứng cạnh Cột 2 (Số lỗi phát hiện).

## Kế Hoạch Xác Nhận (Verification Plan)
1. Kiểm tra Nav Mobile/Desktop: Mục Patrol xổ ra 3 subnav đúng yêu cầu, phân quyền chính xác.
2. Thiết kế Bảng trực quan: Xem UI tạo mới hoạt động tốt trên mobile (không dùng table ngang).
3. Báo Cáo Patrol: 4 Biểu đồ Cột/Đường hiển thị rõ ràng, trực quan, có các tooltip hiển thị số liệu khi hover.
4. Test luồng LocalStorage: Dữ liệu đồng bộ, F5 không bị mất.

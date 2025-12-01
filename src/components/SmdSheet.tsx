const SmdSheet = () => {
  return (
    <div className="w-full">
      <div className='w-full overflow-x-auto'>
        <table className="border border-gray-600-400 w-full min-w-[1400px] text-center">
          <thead>
            {/* Row 1 - Main Header */}
            <tr>
              <th 
                rowSpan={3} 
                colSpan={7}
                className="border border-gray-600 px-4 py-6 text-2xl font-bold text-left"
              >
                SMD Check Sheet Change Model
              </th>
              <th 
                rowSpan={3}
                className="border border-gray-600 px-2 py-2 text-sm font-bold bg-gray-100"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                PQC SMD
              </th>
              <th 
                colSpan={1}
                className="border border-gray-600 px-2 py-1 text-xs font-semibold bg-gray-100"
              >
                LẬP
              </th>
              <th 
                colSpan={2}
                className="border border-gray-600 px-2 py-1 text-xs font-semibold bg-gray-100"
              >
                XÁC NHẬN
              </th>
              <th 
                colSpan={2}
                className="border border-gray-600 px-2 py-1 text-xs font-semibold bg-gray-100"
              >
                DUYỆT
              </th>
            </tr>

            {/* Row 2 - Sub Header */}
            <tr>
              <th className="border border-gray-600 px-2 py-1 text-xs bg-gray-50">PQC</th>
              <th className="border border-gray-600 px-2 py-1 text-xs bg-gray-50">ENG</th>
              <th className="border border-gray-600 px-2 py-1 text-xs bg-gray-50">Supervisor</th>
              <th className="border border-gray-600 px-2 py-1 text-xs bg-gray-50">Manager</th>
              <th className="border border-gray-600 px-2 py-1 text-xs bg-gray-50">Manage Korea</th>
            </tr>

            {/* Row 3 - Checkboxes */}
            <tr>
              <td className="border border-gray-600 px-2 py-1 text-xs bg-gray-50">
                <input type="checkbox" className="w-4 h-4"/>
              </td>
              <td className="border border-gray-600 px-2 py-1 text-xs bg-gray-50">
                <input type="checkbox" className="w-4 h-4"/>
              </td>
              <td className="border border-gray-600 px-2 py-1 text-xs bg-gray-50">
                <input type="checkbox" className="w-4 h-4"/>
              </td>
              <td className="border border-gray-600 px-2 py-1 text-xs bg-gray-50">
                <input type="checkbox" className="w-4 h-4"/>
              </td>
              <td className="border border-gray-600 px-2 py-1 text-xs bg-gray-50">
                <input type="checkbox" className="w-4 h-4"/>
              </td>
            </tr>

            {/* Row 4 - Info Fields */}
            <tr>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Line đổi</th>
              <td rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs text-left"></td>
              <td rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs text-left">korea</td>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Model/Side</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">T/B</th>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">REV S15</th>
              <td className="border border-gray-600 px-2 py-2"></td>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">DATE</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">
                Thời gian kiểm tra xong Feeder list
              </th>
              <td className="border border-gray-600 px-2 py-2"></td>
              <td rowSpan={2} className="border border-gray-600 px-2 py-2">
                <input type="date" className="border border-gray-600-300 w-full px-1 text-sm" />
              </td>
            </tr>

        {/* Row 5 */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">F Code(3in1)</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">REV MOUNTER</th>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">
                OP Mounter xác nhận
              </th>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/* Row 6 */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">PCB ver</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Work Order</th>
              <td className="border border-gray-600 px-2 py-2">PD2025</td>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">
                Sử dụng CN card
              </th>
              <td className="border border-gray-600 px-2 py-2">
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4"/>
                    <label className="flex items-center gap-1">
                    Yes
                  </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4"/>
                    <label className="flex items-center gap-1">
                     No
                  </label>
                  </div>
                </div>
              </td>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Qty</th>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">JIG</th>
              <td className="border border-gray-600 px-2 py-2">
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4"/>
                    <label className="flex items-center gap-1">
                    Yes
                  </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4"/>
                    <label className="flex items-center gap-1">
                     No
                  </label>
                  </div>
                </div>
              </td>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Mã PCB</th>
            </tr>

            {/* Row 7 - Program Header */}
            <tr>
              <th rowSpan={3} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Program</th>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình Printer</th>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình SPI</th>
              <th rowSpan={2} colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình Mounter</th>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Point</th>
              <th rowSpan={2} colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình M-AOI</th>
              <th rowSpan={2} colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình S-AOI</th>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Point</th>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình Reflow</th>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Reflow speed</th>
            </tr>

            {/* Row 8 */}
            <tr>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/* Row 9 */}
            <tr>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/* Row 10 */}
            <tr>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Tiêu chuẩn sản xuất</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số quản lý trên Mask</th>
              <td className="border border-gray-600 px-2 py-2"></td>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số dao quét Printer</th>
              <td className="border border-gray-600 px-2 py-2"></td>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Liệu MSL3 mở đóng gói</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chỉ sử dụng</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình máy label</th>
            </tr>

            {/* Row 11 */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số đăng ký trên MES</th>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số đăng ký dao quét trên MES</th>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex flex-row justify-center items-center gap-3">
                  <div className="flex flex-row items-center justify-center gap-1"><input type="checkbox" className="w-4 h-4"/><label className="flex items-center justify-center gap-2">
                     Duksan
                  </label></div>
                  <div className="flex flex-row items-center justify-center gap-1">
                    <input type="checkbox" className="w-4 h-4"/>
                    <label className="flex items-center justify-center gap-2">
                     Heesung
                  </label>
                  </div>
                </div>
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/* Row 12 */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Thời gian đổi model</th>
              <td colSpan={12} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/* Row 13 - Section Headers */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Hạng mục</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian bắt đầu</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian bắt đầu</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian kết thúc</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số phút</th>
              <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Lịch sử</th>
            </tr>
          </thead>
          
          <tbody>
            {/* Row 14 */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Result</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td colSpan={4} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/* Row 15 */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">QC</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

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
                <th colSpan={8} className=" border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">
                  <th className="px-3">Giá trị cài đặt theo yêu cầu </th>
                  <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex flex-row justify-center items-center gap-3">
                  <div className="flex flex-row items-center justify-center gap-1"><label className="flex items-center justify-center gap-2">
                     Model:
                  </label><input type="text" className="border border-gray-600-400 px-2 py-4 text-xs w-full h-4 focus:bg-white focus:border-blue-500 outline-none hover:bg-white hover:border-blue-400 transition-colors"/>
</div>
                  <div className="flex flex-row items-center justify-center gap-1">
                    
                    <label className="flex items-center justify-center gap-2">
                     Pitch:
                  </label>
                  <input type="text" className="border border-gray-600-400 px-2 py-4 text-xs w-full h-4 focus:bg-white focus:border-blue-500 outline-none hover:bg-white hover:border-blue-400 transition-colors"/>
                  </div>
                </div>
              </td>
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


            {/** Row 31 */}
            <tr>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">PQC kiểm tra board đầu</th>
                <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 32 */}
            <tr>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">IC nạp kế hoạch</th>
                <td colSpan={8} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Checksum thực tế</th>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Xác nhận có thay đổi <br /> check sum mới</th>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 33 */}
            <tr>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tuner</th>
                <td colSpan={8} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 34 */}
            <tr>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Công đoạn</th>
                <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian bắt đầu đo LCR</th>
                <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian kết thúc đo LCR</th>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">tên</th>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Kết quả đo LCR</th>
            </tr>

            {/** Row 35 */}
            <tr>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">PQC</th>
                <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">
                    <div className="flex items-center justify-center flex-row gap-2"><label className="font-bold">OK</label><input type="checkbox" /></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Mobile Warning */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 md:hidden">
        <strong>Lưu ý:</strong> Bảng này được tối ưu cho màn hình lớn. Vuốt ngang để xem toàn bộ nội dung.
      </div>
    </div>
  );
};

export default SmdSheet;
const SheetHeader = () => {
  return (
    <div>
       <div className="p-3 sm:p-4 w-full">
      {/* Website View - Bảng ngang */}
      <div className="hidden lg:block w-full overflow-x-auto">
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
                </thead>
                </table>
        </div>

        {/** repsponsive for mobile */}
         {/* Mobile View - Card dọc */}
      <div className="lg:hidden">
        <div className="bg-blue-50 border border-gray-300 rounded-lg text-center font-bold p-4 shadow-sm text-gray-400">SMD CHECK SHEET CHANGE MODEL FOR PQC</div>
        </div>
    </div>
    </div>
  )
}

export default SheetHeader
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaUsers, FaFileAlt, FaChartLine, FaChartBar } from 'react-icons/fa';
// import { useAuth } from '../authLoginSample/AuthContext';

const Dashboard = () => {
    // Responsive font size cho XAxis
const [fontSize, setFontSize] = useState(12);

useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < 640) {
      setFontSize(8); // Mobile
    } else if (window.innerWidth < 1024) {
      setFontSize(10); // Tablet
    } else {
      setFontSize(12); // Desktop
    }
  };

  handleResize();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);


  // Dữ liệu mẫu cho roles
  const [roleData, setRoleData] = useState([
    { name: 'PQC', value: 25, color: '#3b82f6' },
    { name: 'ENG', value: 18, color: '#10b981' },
    { name: 'SUPERVISOR', value: 12, color: '#f59e0b' },
    { name: 'MANAGER', value: 8, color: '#ef4444' },
    { name: 'MANAGER KOREA', value: 5, color: '#8b5cf6' }
  ]);

  // Dữ liệu cho biểu đồ cột
  const [barChartData, setBarChartData] = useState([
    { name: 'PQC', users: 25 },
    { name: 'ENG', users: 18 },
    { name: 'SUPERVISOR', users: 12 },
    { name: 'MANAGER', users: 20 },
    { name: 'MANAGER KOREA', users: 5 }
  ]);

  // Thống kê tổng quan
  const [stats, setStats] = useState({
    totalUsers: 68,
    totalSMDSheets: 245,
    activeSessions: 42,
    completionRate: 87
  });

  return (
    <div className="min-h-dvh bg-linear-to-br from-slate-50 to-slate-100 pb-4">
      
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Dashboard Thống Kê</h1>
          <p className="text-slate-600">Tổng quan hệ thống quản lý SMD sheets và người dùng</p>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-col gap-4 md:gap-4 mb-4 lg:grid lg:grid-cols-4">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 md:mb-2 truncate">Tổng Users</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
              </div>
              <FaUsers className="w-10 h-10 md:w-12 md:h-12 text-blue-500 shrink-0 ml-2" />
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 md:mb-2 truncate">SMD Sheets</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.totalSMDSheets}</p>
              </div>
              <FaFileAlt className="w-10 h-10 md:w-12 md:h-12 text-green-500 shrink-0 ml-2" />
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 md:mb-2 truncate">Phiên hoạt động</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.activeSessions}</p>
              </div>
              <FaChartBar className="w-10 h-10 md:w-12 md:h-12 text-orange-500 shrink-0 ml-2" />
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 md:mb-2 truncate">Tỷ lệ hoàn thành</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.completionRate}%</p>
              </div>
              <FaChartLine className="w-10 h-10 md:w-12 md:h-12 text-purple-500 shrink-0 ml-2" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Phân bổ người dùng</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: fontSize}}  angle={-30} textAnchor="end" height={80}
                  interval={0} stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="users" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Tỷ lệ vai trò người dùng</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }:any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fontSize={fontSize}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Details Table */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Chi tiết vai trò</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200 lg:text-lg text-sm">
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Vai trò</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Số lượng</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Tỷ lệ</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {roleData.map((role, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></div>
                        <span className="font-medium text-slate-800 text-xs">{role.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{role.value}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {((role.value / stats.totalUsers) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[8px] lg:text-sm font-medium">
                        Hoạt động
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
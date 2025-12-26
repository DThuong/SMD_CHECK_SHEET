import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaUsers, FaFileAlt, FaChartLine, FaCheckCircle, FaSpinner, FaClock, FaUserCheck } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchUsers } from '../../redux/slices/authSlice';
import { fetchChangeModel } from '../../redux/slices/changeModelSlice';

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { users, usersLoading } = useAppSelector((state) => state.auth);
  const { sheets, loadingList } = useAppSelector((state) => state.changeModel);

  const [fontSize, setFontSize] = useState(12);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  // Fetch data khi component mount
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchChangeModel());
  }, [dispatch]);

  // Responsive font size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setFontSize(8);
      } else if (window.innerWidth < 1024) {
        setFontSize(10);
      } else {
        setFontSize(12);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ==================== TÍNH TOÁN DỮ LIỆU ====================

  // 1. Thống kê Users theo Role
  const roleStats = React.useMemo(() => {
    const roleCounts: Record<string, number> = {};
    users.forEach(user => {
      if (user.isActive) {
        roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
      }
    });

    const colors: Record<string, string> = {
      'PQC': '#3b82f6',
      'ENG': '#10b981',
      'Supervisior': '#f59e0b',
      'Manager': '#ef4444',
      'KoreaManager': '#8b5cf6'
    };

    return Object.entries(roleCounts).map(([role, count]) => ({
      name: role,
      value: count,
      color: colors[role] || '#6b7280'
    }));
  }, [users]);

  // 2. Thống kê Sheets theo Status
  const statusStats = React.useMemo(() => {
    const statusCounts: Record<string, number> = {};
    sheets?.forEach(sheet => {
      const status = sheet.status || 'Pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusColors: Record<string, string> = {
      'Pending': '#94a3b8',
      'PQCDone': '#3b82f6',
      'ENGDone': '#10b981',
      'SupervisiorDone': '#f59e0b',
      'ManagerDone': '#ef4444',
      'KoreaManagerDone': '#8b5cf6'
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: statusColors[status] || '#6b7280'
    }));
  }, [sheets]);

  // 3. Thống kê Sheets theo Timeline
  const timelineStats = React.useMemo(() => {
    if (!sheets || sheets.length === 0) return [];

    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeRange === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    } else {
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }

    const dailyCounts: Record<string, number> = {};
    
    sheets.forEach(sheet => {
      if (sheet.createAt) {
        const date = new Date(sheet.createAt);
        if (date >= cutoffDate) {
          const dateStr = date.toISOString().split('T')[0];
          dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
        }
      }
    });

    return Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        count
      }));
  }, [sheets, timeRange]);

  // 4. Tỷ lệ hoàn thành
  const completionRate = React.useMemo(() => {
    if (!sheets || sheets.length === 0) return 0;
    const completed = sheets.filter(s => 
      s.status === 'KoreaManagerDone' || s.status === 'ManagerDone'
    ).length;
    return Math.round((completed / sheets.length) * 100);
  }, [sheets]);

  // 5. Active users (users đang active)
  const activeUsers = React.useMemo(() => {
    return users.filter(u => u.isActive).length;
  }, [users]);

  // 6. Pending sheets (cần xử lý)
  const pendingSheets = React.useMemo(() => {
    return sheets?.filter(s => s.status === 'pending').length || 0;
  }, [sheets]);

  // 7. User activity rate
  const userActivityRate = React.useMemo(() => {
    if (users.length === 0) return 0;
    return Math.round((activeUsers / users.length) * 100);
  }, [users, activeUsers]);

  // ==================== LOADING STATE ====================
  if (usersLoading || loadingList) {
    return (
      <div className="min-h-dvh bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-500 text-5xl mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Đang tải dữ liệu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-linear-to-br from-slate-50 to-slate-100 pb-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 pt-4">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 lg:text-left md:text-left text-center">
            Dashboard Analytics
          </h1>
          <p className="text-slate-600 lg:text-left md:text-left text-center">
            Tổng quan hệ thống quản lý SMD sheets và người dùng hệ thống.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {/* Total Users */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 truncate">Tổng Users</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{users.length}</p>
                <p className="text-xs text-green-600 mt-1">
                  <FaUserCheck className="inline mx-1" />
                  {activeUsers} đang hoạt động
                </p>
              </div>
              <FaUsers className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
            </div>
          </div>
          
          {/* Total Sheets */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 truncate">SMD Sheets</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">
                  {sheets?.length || 0}
                </p>
                <p className="text-xs text-orange-400 mt-1">
                  <FaClock className="inline mx-1" />
                  {pendingSheets} đang chờ
                </p>
              </div>
              <FaFileAlt className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
            </div>
          </div>
          
          {/* User Activity Rate */}
          <div className="bg-white p-4 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 truncate">Tỷ lệ Active</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">
                  {userActivityRate}%
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {users.length - activeUsers} tài khoản bị khóa
                </p>
              </div>
              <FaChartLine className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
            </div>
          </div>
          
          {/* Completion Rate */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 truncate">Hoàn thành</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">
                  {completionRate}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <FaCheckCircle className="inline mx-1" />
                  Sheets đã duyệt
                </p>
              </div>
              <FaCheckCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
            </div>
          </div>
        </div>

        {/* Timeline Chart - NEW */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-4 mb-4 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-xl font-bold text-slate-800">Xu hướng tạo Sheet</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === 'week'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7 ngày
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === 'month'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 ngày
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timelineStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize }} 
                stroke="#64748b"
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Số sheet tạo"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-4 mb-4">
          {/* Role Distribution - Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Phân bổ Users theo Role
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roleStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize }}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  stroke="#64748b"
                />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  name="Số lượng"
                >
                  {roleStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sheet Status - Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Trạng thái SMD Sheets
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusStats}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }: any) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusStats.map((entry, index) => (
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

        {/* Role Details Table */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-4 mb-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Chi tiết phân quyền Users
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                    Vai trò
                  </th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                    Số lượng
                  </th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                    Tỷ lệ
                  </th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {roleStats.map((role, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.color }}
                        ></div>
                        <span className="font-medium text-slate-800 text-xs md:text-sm">
                          {role.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-sm">
                      {role.value}
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-sm">
                      {((role.value / activeUsers) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {role.value} Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sheet Status Details Table - NEW */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Phân tích trạng thái Sheets
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                    Trạng thái
                  </th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                    Số lượng
                  </th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                    Tỷ lệ
                  </th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                    Mô tả
                  </th>
                </tr>
              </thead>
              <tbody>
                {statusStats.map((status, index) => {
                  const descriptions: Record<string, string> = {
                    'Pending': 'Chờ PQC xác nhận',
                    'PQCDone': 'Chờ ENG xác nhận',
                    'ENGDone': 'Chờ Supervisor xác nhận',
                    'SupervisiorDone': 'Chờ Manager xác nhận',
                    'ManagerDone': 'Chờ Korea Manager xác nhận',
                    'KoreaManagerDone': 'Đã hoàn thành'
                  };

                  return (
                    <tr
                      key={index}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          ></div>
                          <span className="font-medium text-slate-800 text-xs md:text-sm">
                            {status.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-sm">
                        {status.value}
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-sm">
                        {(((status.value / (sheets?.length || 1)) * 100).toFixed(1))}%
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-600">
                          {descriptions[status.name] || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
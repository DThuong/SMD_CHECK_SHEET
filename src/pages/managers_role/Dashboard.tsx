/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaUsers, FaFileAlt, FaChartLine, FaCheckCircle, FaSpinner, FaClock, FaUserCheck } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchUsers } from '../../redux/slices/authSlice';
import { fetchChangeModel } from '../../redux/slices/changeModelSlice';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearFilterState } from '../../utils/navigationState';

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { users, usersLoading } = useAppSelector((state) => state.auth);
  const { sheets, filteredSheets ,loadingList } = useAppSelector((state) => state.changeModel);
  const [fontSize, setFontSize] = useState(12);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const displaySheets = filteredSheets && filteredSheets.length > 0 ? filteredSheets : sheets;

  const {t} = useTranslation('dashboard');

  const getStatusDescription = (statusName: string): string => {
  const statusKeyMap: Record<string, string> = {
    'pending': 'pending',
    'PQCDone': 'pqcDone',
    'PQCLeaderDone': 'pqcLeaderDone', // thêm
    'ENGDone': 'engDone',
    'SupervisiorDone': 'supervisorDone',
    'ManagerDone': 'managerDone',
    'KoreaManagerDone': 'koreaManagerDone'
  };
  
  const key = statusKeyMap[statusName];
  return key ? t(`statusDescriptions.${key}`) : 'N/A';
};

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

   // ==================== ADMIN DASHBOARD ====================

  const roleStats = React.useMemo(() => {
    const roleCounts: Record<string, number> = {};
    users.forEach(user => {
      if (user.isActive) {
        roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
      }
    });

    const colors: Record<string, string> = {
      'PQC': '#3b82f6',
      'PQCLeader': '#2563eb', // thêm
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

  const statusStats = React.useMemo(() => {
    const statusCounts: Record<string, number> = {};
    displaySheets?.forEach(sheet => {
      const status = sheet.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusColors: Record<string, string> = {
      'pending': '#94a3b8',
      'PQCDone': '#3b82f6',
      'PQCLeaderDone': '#2563eb', // thêm
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
  }, [displaySheets]);

  const timelineStats = React.useMemo(() => {
  if (!displaySheets || displaySheets.length === 0) return [];

  const now = new Date();
  let cutoffDate: Date | null = null;
  
  if (timeRange === 'week') {
    cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - 7);
    cutoffDate.setHours(0, 0, 0, 0);
  } else if (timeRange === 'month') {
    cutoffDate = new Date();
    cutoffDate.setMonth(now.getMonth() - 1);
    cutoffDate.setHours(0, 0, 0, 0);
  }

  const dailyCounts: Record<string, number> = {};
  
  displaySheets.forEach(sheet => {
    if (sheet.createAt) {
      const date = new Date(sheet.createAt);
      
      if (!cutoffDate || date >= cutoffDate) {
        // Dùng local date
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      }
    }
  });

  return Object.entries(dailyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('vi-VN', { 
        month: 'short', 
        day: 'numeric' 
      }),
      count
    }));
}, [displaySheets, timeRange]);

  const completionRate = React.useMemo(() => {
    if (!sheets || sheets.length === 0) return 0;
    const completed = sheets.filter(s => 
      s.status === 'KoreaManagerDone'
    ).length;
    return Math.round((completed / sheets.length) * 100);
  }, [sheets]);

  const activeUsers = React.useMemo(() => {
    return users.filter(u => u.isActive).length;
  }, [users]);

  const pendingSheets = React.useMemo(() => {
    return sheets?.filter(s => s.status === 'pending').length || 0;
  }, [sheets]);

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
          <p className="text-slate-600 text-lg">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // ==================== ROLE-BASED DASHBOARD ====================
  
  // DASHBOARD CHO ENG/SUPERVISOR/MANAGER/KOREA_MANAGER
  if (user?.role !== 'Admin') {
    // Định nghĩa cards theo role
    const roleCards = {
        'PQCLeader': [
        { 
          status: 'PQCDone', 
          label: t('roleBasedDashboard.statusCards.needPQCLeader'),
          description: t('roleBasedDashboard.statusCards.descPQCLeader'),
          color: 'blue',
          icon: '',
          isUserCard: true
        },
        { 
          status: 'PQCLeaderDone', 
          label: t('roleBasedDashboard.statusCards.needEng'),
          description: t('roleBasedDashboard.statusCards.descEng'),
          color: 'green',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'ENGDone', 
          label: t('roleBasedDashboard.statusCards.needSupervisor'),
          description: t('roleBasedDashboard.statusCards.descSupervisor'),
          color: 'green',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'SupervisiorDone', 
          label: t('roleBasedDashboard.statusCards.needManager'),
          description: t('roleBasedDashboard.statusCards.descManager'),
          color: 'purple',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'ManagerDone', 
          label: t('roleBasedDashboard.statusCards.needKoreaManager'),
          description: t('roleBasedDashboard.statusCards.descKoreaManager'),
          color: 'orange',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'KoreaManagerDone', 
          label: t('roleBasedDashboard.statusCards.completed'),
          description: t('roleBasedDashboard.statusCards.descCompleted'),
          color: 'teal',
          icon: '',
          isUserCard: false
        }
      ],
      'ENG': [
        { 
          status: 'PQCDone', 
          label: t('roleBasedDashboard.statusCards.needPQCLeader'),
          description: t('roleBasedDashboard.statusCards.descPQCLeader'),
          color: 'blue',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'PQCLeaderDone', 
          label: t('roleBasedDashboard.statusCards.needEng'),
          description: t('roleBasedDashboard.statusCards.descEng'),
          color: 'green',
          icon: '',
          isUserCard: true
        },
        { 
          status: 'ENGDone', 
          label: t('roleBasedDashboard.statusCards.needSupervisor'),
          description: t('roleBasedDashboard.statusCards.descSupervisor'),
          color: 'green',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'SupervisiorDone', 
          label: t('roleBasedDashboard.statusCards.needManager'),
          description: t('roleBasedDashboard.statusCards.descManager'),
          color: 'purple',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'ManagerDone', 
          label: t('roleBasedDashboard.statusCards.needKoreaManager'),
          description: t('roleBasedDashboard.statusCards.descKoreaManager'),
          color: 'orange',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'KoreaManagerDone', 
          label: t('roleBasedDashboard.statusCards.completed'),
          description: t('roleBasedDashboard.statusCards.descCompleted'),
          color: 'teal',
          icon: '',
          isUserCard: false
        }
      ],
      'Supervisior': [
        { 
          status: 'PQCDone', 
          label: t('roleBasedDashboard.statusCards.needPQCLeader'),
          description: t('roleBasedDashboard.statusCards.descPQCLeader'),
          color: 'blue',
          icon: '',
          isUserCard: false
        },
        {
          status: 'PQCLeaderDone', 
          label: t('roleBasedDashboard.statusCards.needEng'),
          description: t('roleBasedDashboard.statusCards.descEng'),
          color: 'green',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'ENGDone', 
          label: t('roleBasedDashboard.statusCards.needSupervisor'),
          description: t('roleBasedDashboard.statusCards.descSupervisor'),
          color: 'green',
          icon: '',
          isUserCard: true
        },
        { 
          status: 'SupervisiorDone', 
          label: t('roleBasedDashboard.statusCards.needManager'),
          description: t('roleBasedDashboard.statusCards.descManager'),
          color: 'purple',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'ManagerDone', 
          label: t('roleBasedDashboard.statusCards.needKoreaManager'),
          description: t('roleBasedDashboard.statusCards.descKoreaManager'),
          color: 'orange',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'KoreaManagerDone', 
          label: t('roleBasedDashboard.statusCards.completed'),
          description: t('roleBasedDashboard.statusCards.descCompleted'),
          color: 'teal',
          icon: '',
          isUserCard: false
        }
      ],
      'Manager': [
        { 
          status: 'PQCDone', 
          label: t('roleBasedDashboard.statusCards.needPQCLeader'),
          description: t('roleBasedDashboard.statusCards.descPQCLeader'),
          color: 'blue',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'PQCLeaderDone', 
          label: t('roleBasedDashboard.statusCards.needEng'),
          description: t('roleBasedDashboard.statusCards.descEng'),
          color: 'green',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'ENGDone', 
          label: t('roleBasedDashboard.statusCards.needSupervisor'),
          description: t('roleBasedDashboard.statusCards.descSupervisor'),
          color: 'green',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'SupervisiorDone', 
          label: t('roleBasedDashboard.statusCards.needManager'),
          description: t('roleBasedDashboard.statusCards.descManager'),
          color: 'purple',
          icon: '',
          isUserCard: true
        },
        { 
          status: 'ManagerDone', 
          label: t('roleBasedDashboard.statusCards.needKoreaManager'),
          description: t('roleBasedDashboard.statusCards.descKoreaManager'),
          color: 'orange',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'KoreaManagerDone', 
          label: t('roleBasedDashboard.statusCards.completed'),
          description: t('roleBasedDashboard.statusCards.descCompleted'),
          color: 'teal',
          icon: '',
          isUserCard: false
        }
      ],
      'KoreaManager': [
        { 
          status: 'PQCDone', 
          label: t('roleBasedDashboard.statusCards.needPQCLeader'),
          description: t('roleBasedDashboard.statusCards.descPQCLeader'),
          color: 'blue',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'PQCLeaderDone', 
          label: t('roleBasedDashboard.statusCards.needEng'),
          description: t('roleBasedDashboard.statusCards.descEng'),
          color: 'green',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'ENGDone', 
          label: t('roleBasedDashboard.statusCards.needSupervisor'),
          description: t('roleBasedDashboard.statusCards.descSupervisor'),
          color: 'green',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'SupervisiorDone', 
          label: t('roleBasedDashboard.statusCards.needManager'),
          description: t('roleBasedDashboard.statusCards.descManager'),
          color: 'purple',
          icon: '',
          isUserCard: false
        },
        { 
          status: 'ManagerDone', 
          label: t('roleBasedDashboard.statusCards.needKoreaManager'),
          description: t('roleBasedDashboard.statusCards.descKoreaManager'),
          color: 'orange',
          icon: '',
          isUserCard: true
        },
        { 
          status: 'KoreaManagerDone', 
          label: t('roleBasedDashboard.statusCards.completed'),
          description: t('roleBasedDashboard.statusCards.descCompleted'),
          color: 'teal',
          icon: '',
          isUserCard: false
        }
      ]
    };

    const currentRoleCards = roleCards[user?.role as keyof typeof roleCards] || roleCards['ENG'];

    // Tính số lượng sheets cho mỗi status
    const getSheetCount = (status: string) => {
      return sheets?.filter(s => s.status === status).length || 0;
    };

    // Handler khi click vào card
    const handleCardClick = (status: string) => {
      const roleLower = user?.role?.toLowerCase();
      clearFilterState();
      // Navigate với query parameter
      navigate(`/${roleLower}/smd-sheet-logs?status=${status}`);
    };

    // Color mapping
    const colorClasses: Record<string, { bg: string; hover: string; border: string; text: string }> = {
      'blue': { 
        bg: 'bg-blue-50', 
        hover: 'hover:bg-blue-100', 
        border: 'border-blue-400',
        text: 'text-blue-700'
      },
      'green': { 
        bg: 'bg-green-50', 
        hover: 'hover:bg-green-100', 
        border: 'border-green-400',
        text: 'text-green-700'
      },
      'purple': { 
        bg: 'bg-purple-50', 
        hover: 'hover:bg-purple-100', 
        border: 'border-purple-400',
        text: 'text-purple-700'
      },
      'orange': { 
        bg: 'bg-orange-50', 
        hover: 'hover:bg-orange-100', 
        border: 'border-orange-400',
        text: 'text-orange-700'
      },
      'teal': { 
        bg: 'bg-teal-50', 
        hover: 'hover:bg-teal-100', 
        border: 'border-teal-400',
        text: 'text-teal-700'
      }
    };

    return (
  <div className="min-h-dvh bg-linear-to-br from-slate-50 to-slate-100 pb-4">
    <div className="max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 pt-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 lg:text-left md:text-left text-center">
          {t('title')} - {user?.role}
        </h1>
        <p className="text-slate-600 lg:text-left md:text-left text-center">
          {t('subtitle')}
        </p>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {currentRoleCards.map((card, index) => {
          const count = getSheetCount(card.status);
          const colors = colorClasses[card.color];
          
          return (
            <button
              key={index}
              onClick={() => handleCardClick(card.status)}
              className={`${colors.bg} ${colors.hover} p-4 rounded-xl shadow-lg border-l-4 ${colors.border} transition-all duration-200 transform hover:scale-105 hover:shadow-xl text-left
                ${card.isUserCard && count > 0
                  ? 'animate-pulse-slow hover:scale-105 ring-4 ring-offset-2 ring-opacity-50 ' + 
                    // Chọn màu ring theo màu của card
                    (card.color === 'blue' ? 'ring-blue-400' : 
                     card.color === 'green' ? 'ring-green-400' : 
                     card.color === 'purple' ? 'ring-purple-400' : 
                     card.color === 'orange' ? 'ring-orange-400' : 'ring-teal-400')
                  // Nếu không phải card của user, chỉ có hover effect bình thường
                  : 'hover:scale-105 hover:shadow-xl'
                }`}
            >

              {card.isUserCard && count > 0 && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
                  {t('roleBasedDashboard.needProcess')}
                </div>
              )}
              {/* Status Label */}
              <h3 className={`text-sm font-bold ${colors.text} mb-1`}>
                {card.label}
              </h3>

              {/* Description */}
              <p className="text-xs text-gray-600 mb-3">
                {card.description}
              </p>

              {/* Count */}
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-3xl font-bold ${colors.text} ${card.isUserCard && count > 0 ? '' : ''}`}>
                    {count}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {count === 0 ? t('roleBasedDashboard.noSheet') : `${count} sheet${count > 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className={`p-2 ${colors.bg} rounded-lg ${card.isUserCard && count > 0 ? 'animate-pulse' : ''}`}>
                  <FaFileAlt className={`w-5 h-5 ${colors.text}`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 bg-white rounded-xl shadow-lg p-4">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{t('roleBasedDashboard.quickStats.title')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center border ">
            <p className="text-3xl font-bold text-blue-600 mb-0 bg-blue-50 py-2">{sheets?.length || 0}</p>
            <p className="text-sm text-gray-600 mt-1 py-2">{t('roleBasedDashboard.quickStats.totalSheets')}</p>
          </div>
          <div className="text-center border">
            <p className="text-3xl font-bold text-orange-300 mb-0 bg-blue-50 py-2">
              {sheets?.filter(s => s.status === 'pending').length || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1 py-2">{t('roleBasedDashboard.quickStats.pending')}</p>
          </div>
          <div className="text-center border">
            <p className="text-3xl font-bold text-green-600 mb-0 bg-blue-50 py-2">
              {sheets?.filter(s => s.status === 'KoreaManagerDone').length || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1 py-2">{t('roleBasedDashboard.quickStats.completed')}</p>
          </div>
          <div className="text-center border">
            <p className="text-3xl font-bold text-purple-600 mb-0 bg-blue-50 py-2">
              {Math.round(((sheets?.filter(s => s.status === 'KoreaManagerDone').length || 0) / (sheets?.length || 1)) * 100)}%
            </p>
            <p className="text-sm text-gray-600 mt-1 py-2">{t('roleBasedDashboard.quickStats.completionRate')}</p>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-4 mb-4 mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-xl font-bold text-slate-800">{t('charts.timeline.title')}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'week'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('charts.timeline.7days')}
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'month'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('charts.timeline.30days')}
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('charts.timeline.all')}
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
              name={t('charts.timeline.count')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-4 mb-4">
        {/* Role Distribution - Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            {t('charts.roleDistribution.title')}
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
                name={t('charts.roleDistribution.count')}
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
            {t('charts.sheetStatus.title')}
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

      {/* Sheet Status Details Table */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {t('tables.statusAnalysis.title')}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                  {t('tables.statusAnalysis.status')}
                </th>
                <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                  {t('tables.statusAnalysis.count')}
                </th>
                <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                  {t('tables.statusAnalysis.percentage')}
                </th>
                <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                  {t('tables.statusAnalysis.description')}
                </th>
              </tr>
            </thead>
            <tbody>
              {statusStats.map((status, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
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
                      {getStatusDescription(status.name)}
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
  }

 

  // ==================== ADMIN DASHBOARD UI (GIỮ NGUYÊN) ====================
  return (
    <div className="min-h-dvh bg-linear-to-br from-slate-50 to-slate-100 pb-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 pt-4">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 lg:text-left md:text-left text-center">
            {t('adminDashboard.title')}
          </h1>
          <p className="text-slate-600 lg:text-left md:text-left text-center">
            {t('adminDashboard.subtitle')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {/* Total Users */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 truncate">{t('adminDashboard.stats.totalUsers')}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{users.length}</p>
                <p className="text-xs text-green-600 mt-1">
                  <FaUserCheck className="inline mx-1" />
                  {activeUsers} {t('adminDashboard.stats.activeUsers')}
                </p>
              </div>
              <FaUsers className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
            </div>
          </div>
          
          {/* Total Sheets */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 truncate">{t('adminDashboard.stats.smdSheets')}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">
                  {sheets?.length || 0}
                </p>
                <p className="text-xs text-orange-400 mt-1">
                  <FaClock className="inline mx-1" />
                  {pendingSheets} {t('adminDashboard.stats.pending')}
                </p>
              </div>
              <FaFileAlt className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
            </div>
          </div>
          
          {/* User Activity Rate */}
          <div className="bg-white p-4 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 truncate">{t('adminDashboard.stats.activeRate')}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">
                  {userActivityRate}%
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {users.length - activeUsers} {t('adminDashboard.stats.lockedAccounts')}
                </p>
              </div>
              <FaChartLine className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
            </div>
          </div>
          
          {/* Completion Rate */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm mb-1 truncate">{t('adminDashboard.stats.completion')}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">
                  {completionRate}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <FaCheckCircle className="inline mx-1" />
                  {t('adminDashboard.stats.completion')}
                </p>
              </div>
              <FaCheckCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
            </div>
          </div>
        </div>

        {/* Timeline Chart - NEW */}
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-4 mb-4 mt-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <h2 className="text-xl font-bold text-slate-800">{t('charts.timeline.title')}</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTimeRange('week')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          timeRange === 'week'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {t('charts.timeline.7days')}
                      </button>
                      <button
                        onClick={() => setTimeRange('month')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          timeRange === 'month'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {t('charts.timeline.30days')}
                      </button>
                      <button
                        onClick={() => setTimeRange('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          timeRange === 'all'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {t('charts.timeline.all')}
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
                        name={t('charts.timeline.count')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-4 mb-4">
        {/* Role Distribution - Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            {t('charts.roleDistribution.title')}
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
                name={t('charts.roleDistribution.count')}
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
            {t('charts.sheetStatus.title')}
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

      {/* Sheet Status Details Table */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-4">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {t('tables.statusAnalysis.title')}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                  {t('tables.statusAnalysis.status')}
                </th>
                <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                  {t('tables.statusAnalysis.count')}
                </th>
                <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                  {t('tables.statusAnalysis.percentage')}
                </th>
                <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                  {t('tables.statusAnalysis.description')}
                </th>
              </tr>
            </thead>
            <tbody>
              {statusStats.map((status, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
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
                      {getStatusDescription(status.name)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        

      {/* Role Details Table */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-4 mb-4">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">
                    {t('tables.roleDetails.title')}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                            {t('tables.roleDetails.role')}
                          </th>
                          <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                            {t('tables.roleDetails.count')}
                          </th>
                          <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                            {t('tables.roleDetails.percentage')}
                          </th>
                          <th className="text-left py-3 px-4 text-slate-700 font-semibold text-sm md:text-base">
                            {t('tables.roleDetails.active')}
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
                                {role.value} {t('tables.roleDetails.active')}
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
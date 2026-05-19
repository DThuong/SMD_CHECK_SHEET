import React, { useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { FaArrowLeft, FaChartBar } from 'react-icons/fa';
import {
  Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import type { PatrolSharedProps } from './types';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../redux/hooks';

const ReportPatrol: React.FC<PatrolSharedProps> = ({ user, goToView }) => {
  const { t, i18n } = useTranslation('patrol');
  const { sessions, stages, categories, checkLists } = useAppSelector(state => state.patrol);

  // Force Vietnamese for PQC role
  const pT = (key: string, options?: any) => {
    if (user?.role === 'PQC') return t(key, { ...options, lng: 'vi' }) as any;
    return t(key, options) as any;
  };

  // Redirect mobile users to list view
  useEffect(() => {
    if (window.innerWidth < 768) {
      toast.error(pT('msgDeviceNotSupportedForReport'));
      goToView('list');
    }
  }, [goToView]);

  // Only analyze Approved sessions
  const approvedSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'Approved');
  }, [sessions]);

  // --- Analytics Algorithms ---

  // 1. Trend Analysis (Last 7 Days)
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const daySessions = approvedSessions.filter(s => s.createdAt.startsWith(date));
      const totalChecked = daySessions.length;
      const totalNG = daySessions.reduce((acc, s) => {
        return acc + (s.checkListResults?.filter(r => r.result === 'NG').length || 0);
      }, 0);

      return {
        name: new Date(date).toLocaleDateString(
          user?.role === 'PQC' ? 'vi-VN' : (i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'en' ? 'en-US' : 'vi-VN'),
          { weekday: 'short' }
        ),
        totalChecked,
        totalNG
      };
    });
  }, [approvedSessions]);

  // 2. Stage Distribution
  const stageDistribution = useMemo(() => {
    return stages.map(stage => {
      const stageCategories = categories.filter(c => c.stageId === stage.id).map(c => c.id);
      const stageCheckLists = checkLists.filter(cl => stageCategories.includes(cl.categoryId)).map(cl => cl.id);
      
      let okCount = 0;
      let ngCount = 0;

      approvedSessions.forEach(s => {
        s.checkListResults?.forEach(r => {
          if (stageCheckLists.includes(r.checkListId)) {
            if (r.result === 'OK') okCount++;
            else if (r.result === 'NG') ngCount++;
          }
        });
      });

      const total = okCount + ngCount;
      const ngRate = total > 0 ? (ngCount / total) * 100 : 0;

      return {
        name: stage.name,
        OK: okCount,
        NG: parseFloat(ngRate.toFixed(1))
      };
    });
  }, [approvedSessions, stages, categories, checkLists]);

  // 3. PQC Performance
  const performanceData = useMemo(() => {
    const users: Record<string, { sheets: number, ngFound: number }> = {};
    approvedSessions.forEach(s => {
      if (!users[s.fullName]) {
        users[s.fullName] = { sheets: 0, ngFound: 0 };
      }
      users[s.fullName].sheets++;
      users[s.fullName].ngFound += (s.checkListResults?.filter(r => r.result === 'NG').length || 0);
    });

    return Object.entries(users).map(([name, data]) => ({
      name,
      sheets: data.sheets,
      foundNG: data.ngFound
    }));
  }, [approvedSessions]);

  return (
    <div className="animate-fade-in space-y-4! mt-6!">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => goToView('list')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <FaArrowLeft />
        </button>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaChartBar className="hidden sm:block md:block text-gray-700" /> {pT('reportDashboard')}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 w-full">
        {/* Chart 1: Trends */}
        <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{pT('chartTrend')}</h3>
          <div className="h-72 sm:h-80 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#1e293b" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#b91c1c" axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Bar yAxisId="left" dataKey="totalChecked" name={pT('totalChecked')} fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="totalNG" name={pT('totalNG')} stroke="#b91c1c" strokeWidth={3} dot={{ r: 5, fill: '#b91c1c', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Stage Distribution */}
        <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{pT('chartStage')}</h3>
          <div className="h-72 sm:h-80 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stageDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#1e293b" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#b91c1c" axisLine={false} tickLine={false} unit="%" />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Bar yAxisId="left" dataKey="OK" name={pT('okCount')} fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="NG" name={pT('ratioNG')} stroke="#b91c1c" strokeWidth={3} dot={{ r: 5, fill: '#b91c1c', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Performance */}
        <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{pT('chartPerformance')}</h3>
          <div className="h-72 sm:h-80 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#1e293b" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#b91c1c" axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Bar yAxisId="left" dataKey="sheets" name={pT('totalChecked')} fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                <Line yAxisId="right" type="step" dataKey="foundNG" name={pT('foundNG')} stroke="#b91c1c" strokeWidth={3} dot={{ r: 5, fill: '#b91c1c', strokeWidth: 2, stroke: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPatrol;

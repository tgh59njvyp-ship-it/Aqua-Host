import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Eye, 
  Smartphone, 
  Monitor, 
  Globe2, 
  Share2, 
  ShieldCheck, 
  Calendar,
  Compass
} from 'lucide-react';
import { Site } from '../../types';

interface AnalyticsTabProps {
  site: Site;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ site }) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  const { analytics } = site;
  const dailyData = analytics?.dailyViews || [];

  // Calculate max for bar chart scaling
  const maxViews = Math.max(...dailyData.map(d => d.views), 10);

  return (
    <div className="space-y-6">
      
      {/* Header & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">アクセス解析 (Analytics)</h2>
          <p className="text-xs text-slate-400">
            Cookie不使用・完全匿名化されたプライバシー準拠の高速エッジメトリクス
          </p>
        </div>

        {/* Range switcher */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
          <button
            onClick={() => setTimeRange('day')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              timeRange === 'day' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            日別 (Daily)
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              timeRange === 'week' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            週別 (Weekly)
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              timeRange === 'month' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            月別 (Monthly)
          </button>
        </div>
      </div>

      {/* Top High-level Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">ページビュー (PV)</span>
            <Eye className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {analytics.totalViews.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">
            +18.4% 先週比
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">ユニーク訪問者 (UV)</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {analytics.uniqueVisitors.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">
            +12.1% 先週比
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">平均読込速度</span>
            <Globe2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-cyan-400 font-mono">
            42 <span className="text-sm font-normal text-slate-400">ms</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Global Edge Cache Hit 99.2%
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">プライバシー保護基準</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            Cookie-less
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            個人情報を一切保持しません
          </p>
        </div>

      </div>

      {/* Interactive Bar Chart for Daily Views */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">トラフィック推移 (PV / UV)</h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="h-2.5 w-2.5 rounded bg-cyan-400"></span>
              ページビュー (PV)
            </span>
            <span className="flex items-center gap-1.5 text-sky-600">
              <span className="h-2.5 w-2.5 rounded bg-sky-600"></span>
              ユニーク訪問者 (UV)
            </span>
          </div>
        </div>

        {/* CSS Flex Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-48 pt-6 border-b border-slate-800">
          {dailyData.map((d, i) => {
            const heightPercent = Math.max(10, Math.round((d.views / maxViews) * 100));
            const uvPercent = Math.max(5, Math.round((d.visitors / maxViews) * 100));

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[42px] flex items-end justify-center gap-1 h-full">
                  {/* UV Bar */}
                  <div
                    style={{ height: `${uvPercent}%` }}
                    className="w-1/2 rounded-t bg-sky-600/70 group-hover:bg-sky-500 transition-all"
                    title={`UV: ${d.visitors}`}
                  ></div>
                  {/* PV Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-1/2 rounded-t bg-gradient-to-t from-cyan-500 to-sky-400 group-hover:from-cyan-400 group-hover:to-sky-300 transition-all shadow-md shadow-cyan-500/20"
                    title={`PV: ${d.views}`}
                  ></div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">
                  {d.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Grids: Devices, Browsers, Referrers, Countries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Devices */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white pb-2 border-b border-slate-800">
            <Monitor className="h-4 w-4 text-cyan-400" />
            <span>アクセスデバイス</span>
          </div>
          <div className="space-y-2.5">
            {analytics.devices.map(d => {
              const total = analytics.devices.reduce((acc, x) => acc + x.count, 0) || 1;
              const pct = Math.round((d.count / total) * 100);
              return (
                <div key={d.device} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{d.device}</span>
                    <span className="font-mono text-slate-400">{pct}% ({d.count})</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-cyan-400 rounded-full"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referrers */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white pb-2 border-b border-slate-800">
            <Share2 className="h-4 w-4 text-sky-400" />
            <span>流入元 (リファラー)</span>
          </div>
          <div className="space-y-2.5">
            {analytics.referrers.map(r => {
              const total = analytics.referrers.reduce((acc, x) => acc + x.count, 0) || 1;
              const pct = Math.round((r.count / total) * 100);
              return (
                <div key={r.source} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[130px]">{r.source}</span>
                    <span className="font-mono text-slate-400">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-sky-400 rounded-full"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Browsers */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white pb-2 border-b border-slate-800">
            <Compass className="h-4 w-4 text-indigo-400" />
            <span>ブラウザ</span>
          </div>
          <div className="space-y-2.5">
            {analytics.browsers.map(b => {
              const total = analytics.browsers.reduce((acc, x) => acc + x.count, 0) || 1;
              const pct = Math.round((b.count / total) * 100);
              return (
                <div key={b.browser} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{b.browser}</span>
                    <span className="font-mono text-slate-400">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-indigo-400 rounded-full"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Countries */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white pb-2 border-b border-slate-800">
            <Globe2 className="h-4 w-4 text-emerald-400" />
            <span>アクセス地域</span>
          </div>
          <div className="space-y-2.5">
            {analytics.countries.map(c => {
              const total = analytics.countries.reduce((acc, x) => acc + x.count, 0) || 1;
              const pct = Math.round((c.count / total) * 100);
              return (
                <div key={c.country} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{c.country}</span>
                    <span className="font-mono text-slate-400">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-emerald-400 rounded-full"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

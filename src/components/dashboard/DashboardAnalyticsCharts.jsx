import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  MapPin,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

export const DashboardAnalyticsCharts = ({ articles = [], purchases = [], outward = [] }) => {
  const [metricMode, setMetricMode] = useState('pieces'); // 'pieces' | 'value'
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(null);
  const [distributionTab, setDistributionTab] = useState('category'); // 'category' | 'city'

  // Monthly Data Calculation / Simulation from real dataset
  const monthsData = [
    { month: 'May', inwardPcs: 1800, outwardPcs: 1200, inwardVal: 3870000, outwardVal: 3360000 },
    { month: 'Jun', inwardPcs: 2400, outwardPcs: 1600, inwardVal: 5160000, outwardVal: 4480000 },
    { month: 'Jul', inwardPcs: 3100, outwardPcs: 2200, inwardVal: 6665000, outwardVal: 6160000 },
    { month: 'Aug', inwardPcs: 4200, outwardPcs: 3400, inwardVal: 9030000, outwardVal: 9520000 },
    { month: 'Sep', inwardPcs: 5800, outwardPcs: 4100, inwardVal: 12470000, outwardVal: 11480000 },
    { month: 'Oct', inwardPcs: 6900, outwardPcs: 5200, inwardVal: 14835000, outwardVal: 14560000 }
  ];

  // Dynamic values
  const maxPieceValue = Math.max(...monthsData.map(d => Math.max(d.inwardPcs, d.outwardPcs)));
  const maxValueAmount = Math.max(...monthsData.map(d => Math.max(d.inwardVal, d.outwardVal)));

  const chartHeight = 180;
  const chartWidth = 540;

  // Category Breakdown
  const categoryStats = [
    { name: 'Down Puffer Jackets', stuff: 'Waterproof Nylon', color: '#2563EB', pcs: 3400, percent: 34, val: 9010000 },
    { name: 'Windbreaker Sport Jackets', stuff: 'Taslan Polyester', color: '#8B5CF6', pcs: 2800, percent: 28, val: 5460000 },
    { name: 'Dry-Fit Sports T-Shirts', stuff: 'Micro-Mesh', color: '#10B981', pcs: 1900, percent: 19, val: 2470000 },
    { name: 'Football & Cricket Jerseys', stuff: 'Sublimated Poly', color: '#F59E0B', pcs: 1200, percent: 12, val: 1800000 },
    { name: 'Cargo Trousers & Fleece', stuff: 'Cotton Twill', color: '#EC4899', pcs: 700, percent: 7, val: 1260000 }
  ];

  // City Outward Breakdown
  const cityStats = [
    { city: 'Karachi Wholesale', market: 'Bolton & Tariq Rd', color: '#3B82F6', dispatches: 32, pcs: 4800, percent: 40 },
    { city: 'Lahore Hub', market: 'Anarkali & Shah Alam', color: '#8B5CF6', dispatches: 24, pcs: 3200, percent: 27 },
    { city: 'Faisalabad Market', market: 'Rail Bazaar Cloth', color: '#10B981', dispatches: 16, pcs: 2100, percent: 17 },
    { city: 'Rawalpindi / Islamabad', market: 'Raja Bazaar Hub', color: '#F59E0B', dispatches: 11, pcs: 1200, percent: 10 },
    { city: 'Peshawar Outlet', market: 'Karkhano Wholesale', color: '#EC4899', dispatches: 7, pcs: 700, percent: 6 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* ------------------------------------------------------------- */}
      {/* GRAPH 1: INWARD VS OUTWARD FLOW (7 Cols) */}
      {/* ------------------------------------------------------------- */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs transition-colors flex flex-col justify-between">
        
        {/* Header & Metric Switcher */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Stock Flow Velocity (Inward vs Outward)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                China import arrivals vs wholesale shop dispatches over the last 6 months
              </p>
            </div>

            {/* Toggle: Pieces vs PKR Value */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-center">
              <button
                onClick={() => setMetricMode('pieces')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  metricMode === 'pieces'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Pieces (Qty)
              </button>
              <button
                onClick={() => setMetricMode('value')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  metricMode === 'value'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                PKR Value (M)
              </button>
            </div>
          </div>

          {/* Legend and Summary Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-blue-600 shadow-2xs"></span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  China Inward Purchases
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-rose-500 shadow-2xs"></span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Wholesale Dispatches
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Net Stock Growth: <strong className="text-emerald-600 dark:text-emerald-400">+6,500 pcs (Active)</strong>
            </div>
          </div>
        </div>

        {/* SVG Interactive Bar Chart */}
        <div className="relative pt-6 pb-2">
          
          {/* Floating Tooltip Box */}
          {hoveredMonthIndex !== null && (
            <div className="absolute top-0 right-4 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-xl shadow-xl text-xs z-20 pointer-events-none animate-in fade-in duration-100 border border-slate-700 flex items-center gap-3">
              <span className="font-bold text-blue-400">
                {monthsData[hoveredMonthIndex].month} 2026:
              </span>
              <span>
                Inward: <strong className="text-blue-300 font-mono">{metricMode === 'pieces' ? `${monthsData[hoveredMonthIndex].inwardPcs.toLocaleString()} pcs` : `Rs. ${(monthsData[hoveredMonthIndex].inwardVal / 1000000).toFixed(2)}M`}</strong>
              </span>
              <span>
                Outward: <strong className="text-rose-400 font-mono">{metricMode === 'pieces' ? `${monthsData[hoveredMonthIndex].outwardPcs.toLocaleString()} pcs` : `Rs. ${(monthsData[hoveredMonthIndex].outwardVal / 1000000).toFixed(2)}M`}</strong>
              </span>
            </div>
          )}

          {/* SVG Visual */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
              className="w-full h-48 select-none"
            >
              {/* Subtle Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = chartHeight - pct * chartHeight + 10;
                const label = metricMode === 'pieces' 
                  ? `${Math.round((pct * maxPieceValue) / 1000)}k`
                  : `${(pct * (maxValueAmount / 1000000)).toFixed(1)}M`;
                return (
                  <g key={idx}>
                    <line
                      x1="35"
                      y1={y}
                      x2={chartWidth - 10}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="30"
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-400 text-[9px] font-mono font-medium"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Data Bars */}
              {monthsData.map((d, i) => {
                const colWidth = (chartWidth - 50) / monthsData.length;
                const xCenter = 45 + i * colWidth + colWidth / 2;

                const inwardVal = metricMode === 'pieces' ? d.inwardPcs : d.inwardVal;
                const outwardVal = metricMode === 'pieces' ? d.outwardPcs : d.outwardVal;
                const max = metricMode === 'pieces' ? maxPieceValue : maxValueAmount;

                const inwardH = (inwardVal / max) * chartHeight;
                const outwardH = (outwardVal / max) * chartHeight;

                const barW = 16;
                const isHovered = hoveredMonthIndex === i;

                return (
                  <g
                    key={d.month}
                    onMouseEnter={() => setHoveredMonthIndex(i)}
                    onMouseLeave={() => setHoveredMonthIndex(null)}
                    className="cursor-pointer group"
                  >
                    {/* Hover column background highlight */}
                    <rect
                      x={45 + i * colWidth + 4}
                      y="5"
                      width={colWidth - 8}
                      height={chartHeight + 10}
                      fill="currentColor"
                      className={`transition-colors ${
                        isHovered 
                          ? 'text-blue-500/10 dark:text-blue-400/10' 
                          : 'text-transparent'
                      }`}
                      rx="8"
                    />

                    {/* Inward Bar (Blue) */}
                    <rect
                      x={xCenter - barW - 2}
                      y={chartHeight - inwardH + 10}
                      width={barW}
                      height={inwardH}
                      fill="#2563EB"
                      rx="4"
                      className="transition-all duration-300 group-hover:brightness-110"
                    />

                    {/* Outward Bar (Rose) */}
                    <rect
                      x={xCenter + 2}
                      y={chartHeight - outwardH + 10}
                      width={barW}
                      height={outwardH}
                      fill="#E11D48"
                      rx="4"
                      className="transition-all duration-300 group-hover:brightness-110"
                    />

                    {/* X-Axis Month Label */}
                    <text
                      x={xCenter}
                      y={chartHeight + 28}
                      textAnchor="middle"
                      className={`text-[11px] font-semibold transition-colors ${
                        isHovered 
                          ? 'fill-blue-600 dark:fill-blue-400 font-bold' 
                          : 'fill-slate-500 dark:fill-slate-400'
                      }`}
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Avg Monthly Inward</span>
            <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">4,033 pcs</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Avg Monthly Outward</span>
            <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">2,950 pcs</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Stock Turnover</span>
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">73.1% Ratio</span>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* GRAPH 2: INVENTORY & DISPATCH DISTRIBUTION (5 Cols) */}
      {/* ------------------------------------------------------------- */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs transition-colors flex flex-col justify-between">
        
        {/* Header & Tabs */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Distribution Breakdown
              </h3>
            </div>

            {/* Switch: Category vs City */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setDistributionTab('category')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  distributionTab === 'category'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                By Category
              </button>
              <button
                onClick={() => setDistributionTab('city')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  distributionTab === 'city'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                By City Hub
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {distributionTab === 'category'
              ? 'Current stock valuation and pieces share categorized by garment stuff'
              : 'Wholesale merchandise dispatches to key Pakistani retail markets'}
          </p>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-3.5">
          {distributionTab === 'category' ? (
            /* Category Progress Bars */
            categoryStats.map((item) => (
              <div key={item.name} className="space-y-1.5 group cursor-pointer">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({item.stuff})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.pcs.toLocaleString()} pcs
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {item.percent}%
                    </span>
                  </div>
                </div>

                {/* Animated Horizontal Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            /* City Dispatches */
            cityStats.map((hub) => (
              <div key={hub.city} className="space-y-1.5 group cursor-pointer">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: hub.color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {hub.city}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({hub.market})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {hub.pcs.toLocaleString()} pcs
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
                      {hub.dispatches} Challans
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                    style={{
                      width: `${hub.percent}%`,
                      backgroundColor: hub.color
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Quick Metric */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Total Garment Stock Value:</span>
          <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
            Rs. 20,000,000
          </span>
        </div>

      </div>

    </div>
  );
};

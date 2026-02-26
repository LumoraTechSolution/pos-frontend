'use client';

/**
 * Dashboard Overview page — placeholder for Step 6 (Reporting).
 * Will show KPIs, sales charts, and quick metrics.
 */
export default function OverviewPage() {
  const metrics = [
    { label: "Today's Sales", value: '$0.00', change: '+0%', icon: '💰' },
    { label: 'Transactions', value: '0', change: '+0%', icon: '🧾' },
    { label: 'Avg. Order Value', value: '$0.00', change: '+0%', icon: '📊' },
    { label: 'Active Products', value: '0', change: '+0', icon: '📦' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back! Here&apos;s your business overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{metric.icon}</span>
              <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                {metric.change}
              </span>
            </div>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="text-sm text-gray-400 mt-1">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-80">
          <h3 className="font-semibold mb-4">Sales Trend</h3>
          <div className="flex-1 flex items-center justify-center text-gray-600 h-56">
            <p className="text-sm">Chart will be implemented in Step 6</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-80">
          <h3 className="font-semibold mb-4">Top Products</h3>
          <div className="flex-1 flex items-center justify-center text-gray-600 h-56">
            <p className="text-sm">Chart will be implemented in Step 6</p>
          </div>
        </div>
      </div>
    </div>
  );
}

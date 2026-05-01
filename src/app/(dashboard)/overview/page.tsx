"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";
import {
  DashboardData,
  PaymentMethodBreakdown,
} from "@/types/dashboard";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Wallet,
  Clock,
} from "lucide-react";
import { LowStockWidget } from "@/components/dashboard/LowStockWidget";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ————————————————————————————————————————
// Helpers
// ————————————————————————————————————————
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
  }).format(amount);
}

function calcChange(current: number, previous: number): { pct: string; positive: boolean } {
  if (previous === 0) return { pct: current > 0 ? "+100%" : "0%", positive: current >= 0 };
  const change = ((current - previous) / previous) * 100;
  return {
    pct: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    positive: change >= 0,
  };
}

const PAYMENT_COLORS: Record<string, string> = {
  CASH: "#10b981",
  CARD: "#6366f1",
  ONLINE: "#f59e0b",
  SPLIT: "#8b5cf6",
  CREDIT: "#ef4444",
};

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  CASH: Banknote,
  CARD: CreditCard,
  ONLINE: Wallet,
};

// ————————————————————————————————————————
// KPI Card
// ————————————————————————————————————————
function KPICard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string;
  change: { pct: string; positive: boolean };
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-all hover:border-gray-700 hover:shadow-lg hover:shadow-primary/5 group">
      {/* Gradient glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl ${gradient} group-hover:opacity-20 transition-opacity`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-primary`}>
          <Icon size={20} className="text-primary-foreground" />
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            change.positive
              ? "text-emerald-400 bg-emerald-400/10"
              : "text-red-400 bg-red-400/10"
          }`}
        >
          {change.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change.pct}
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{title}</div>
    </div>
  );
}

// ————————————————————————————————————————
// Custom Tooltip for Charts
// ————————————————————————————————————————
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 shadow-lg">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      {payload.map((p, i: number) => (
        <div key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {p.name === "revenue" || p.name === "Revenue" ? formatCurrency(p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

// ————————————————————————————————————————
// Main Dashboard Page
// ————————————————————————————————————————
export default function OverviewPage() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: dashboardService.getDashboard,
    refetchInterval: 60000, // Auto-refresh every 60s
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-800 rounded" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-800/50 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-80 bg-gray-800/50 rounded-2xl" />
            <div className="h-80 bg-gray-800/50 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-bold mb-2">Unable to load dashboard</h2>
          <p className="text-gray-400">Please check if the backend is running and try again.</p>
        </div>
      </div>
    );
  }

  const salesChange = calcChange(data.todaySales, data.yesterdaySales);
  const txnChange = calcChange(data.todayTransactions, data.yesterdayTransactions);
  const avgChange = calcChange(data.avgOrderValue, data.yesterdayAvgOrderValue);

  const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Real-time business overview — auto-refreshes every 60 seconds.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Today's Revenue"
          value={formatCurrency(data.todaySales)}
          change={salesChange}
          icon={DollarSign}
          gradient="from-emerald-500 to-emerald-600"
        />
        <KPICard
          title="Transactions"
          value={data.todayTransactions.toString()}
          change={txnChange}
          icon={ShoppingCart}
          gradient="from-primary to-primary"
        />
        <KPICard
          title="Avg. Order Value"
          value={formatCurrency(data.avgOrderValue)}
          change={avgChange}
          icon={BarChart3}
          gradient="from-amber-500 to-amber-600"
        />
        <KPICard
          title="Active Products"
          value={`${data.activeProducts} / ${data.totalProducts}`}
          change={{ pct: `${data.totalProducts - data.activeProducts} inactive`, positive: true }}
          icon={Package}
          gradient="from-violet-500 to-violet-600"
        />
      </div>

      {/* Charts Row 1: Sales Trend + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend — 2/3 width */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Sales Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Last 7 days revenue</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp size={14} className="text-primary" /> Revenue
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesTrend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="dayLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products — 1/3 width */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Top Products</h3>
            <p className="text-xs text-gray-500 mt-0.5">Best sellers (30 days)</p>
          </div>
          {data.topProducts.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-600 text-sm">
              No sales data yet
            </div>
          ) : (
            <div className="space-y-4">
              {data.topProducts.map((product, idx) => {
                const maxQty = data.topProducts[0]?.quantitySold || 1;
                const barWidth = (product.quantitySold / maxQty) * 100;
                const colors = ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-rose-500"];

                return (
                  <div key={product.productId} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 w-5">#{idx + 1}</span>
                        <span className="text-sm font-medium text-gray-200 truncate max-w-[140px]">
                          {product.productName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400">{product.quantitySold} sold</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[idx % colors.length]} transition-all duration-500`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-emerald-400 font-medium">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Payment Breakdown + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Breakdown — Donut Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Payment Methods</h3>
            <p className="text-xs text-gray-500 mt-0.5">Today&apos;s breakdown</p>
          </div>
          {data.paymentBreakdown.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-600 text-sm">
              No transactions today
            </div>
          ) : (
            <>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.paymentBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="amount"
                      nameKey="method"
                      strokeWidth={0}
                    >
                      {data.paymentBreakdown.map((entry, idx) => (
                        <Cell
                          key={entry.method}
                          fill={PAYMENT_COLORS[entry.method] || PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as PaymentMethodBreakdown;
                        return (
                          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
                            <div className="font-medium">{d.method}</div>
                            <div className="text-gray-400">{formatCurrency(d.amount)} · {d.count} txns</div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {data.paymentBreakdown.map((pm, idx) => {
                  const PayIcon = PAYMENT_ICONS[pm.method] || Wallet;
                  return (
                    <div key={pm.method} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PAYMENT_COLORS[pm.method] || PIE_COLORS[idx] }}
                        />
                        <PayIcon size={14} className="text-gray-400" />
                        <span className="text-gray-300">{pm.method}</span>
                      </div>
                      <div className="text-gray-400">
                        {formatCurrency(pm.amount)} <span className="text-gray-600">({pm.count})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Low Stock Alerts (Replaced with Custom Widget) — 2/3 width */}
        <div className="lg:col-span-2">
          <LowStockWidget />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
          </div>
          <span className="text-xs text-gray-500">Last 10 sales</span>
        </div>
        {data.recentTransactions.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-gray-600 text-sm">
            No transactions recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase">
                  <th className="text-left pb-3 font-medium">Invoice</th>
                  <th className="text-left pb-3 font-medium">Customer</th>
                  <th className="text-left pb-3 font-medium">Cashier</th>
                  <th className="text-center pb-3 font-medium">Items</th>
                  <th className="text-left pb-3 font-medium">Payment</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-right pb-3 font-medium">Amount</th>
                  <th className="text-right pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.recentTransactions.map((txn) => (
                  <tr key={txn.saleId} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 font-mono text-primary text-xs">{txn.invoiceNumber}</td>
                    <td className="py-3 text-gray-300">{txn.customerName}</td>
                    <td className="py-3 text-gray-400 text-xs">{txn.cashierName}</td>
                    <td className="py-3 text-center">
                      <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full text-xs">
                        {txn.itemCount}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        {txn.paymentMethod === "CASH" && <Banknote size={12} />}
                        {txn.paymentMethod === "CARD" && <CreditCard size={12} />}
                        {txn.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          txn.paymentStatus === "PAID"
                            ? "text-emerald-400 bg-emerald-400/10"
                            : txn.paymentStatus === "PENDING"
                            ? "text-amber-400 bg-amber-400/10"
                            : "text-red-400 bg-red-400/10"
                        }`}
                      >
                        {txn.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-emerald-400">
                      {formatCurrency(txn.netAmount)}
                    </td>
                    <td className="py-3 text-right text-gray-500 text-xs">{txn.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

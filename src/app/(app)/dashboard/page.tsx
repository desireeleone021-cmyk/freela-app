"use client";

import { useEffect, useState } from "react";
import { StatCardSkeleton } from "@/components/skeleton";
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";

interface DashboardData {
  clients: number;
  projects: number;
  activeProjects: number;
  invoices: { total: number; totalAmount: number; paidAmount: number; pendingAmount: number; };
  expenses: { total: number; totalAmount: number; paidAmount: number; pendingAmount: number; };
  hours: { total: number; billable: number; };
  profit: { total: number; month: number; monthRevenue: number; monthExpenses: number; };
  monthlyComparison: { month: string; entrate: number; uscite: number; profitto: number }[];
  projectsByStatus: { name: string; value: number; color: string }[];
  expensesByCategory: { name: string; value: number; color: string }[];
  hoursByProject: { name: string; hours: number }[];
  topClients: { name: string; amount: number }[];
}

function StatCard({ icon, label, value, sub, color, valueColor }: {
  icon: string; label: string; value: string | number; sub?: string; color: string; valueColor?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${valueColor || "text-slate-900 dark:text-slate-100"}`}>{value}</p>
          {sub && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function fmtShort(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k€`;
  return `${n}€`;
}

interface TooltipPayload { name: string; value: number; color?: string; dataKey?: string; }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
      {label && <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{fmt(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

function CustomTooltipHours({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
      {label && <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}h</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-8 space-y-2">
          <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hasChartData = data.monthlyComparison.some((m) => m.entrate > 0 || m.uscite > 0) ||
                       data.projectsByStatus.length > 0 ||
                       data.expensesByCategory.length > 0 ||
                       data.hoursByProject.length > 0;

  const isProfitPositive = data.profit.total >= 0;
  const isMonthProfitPositive = data.profit.month >= 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Panoramica finanziaria della tua attività</p>
      </div>

      {/* Card Profitto MESE (banner grande) */}
      <div className={`rounded-2xl p-6 mb-6 shadow-sm border-2 ${
        isMonthProfitPositive
          ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
          : "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              {isMonthProfitPositive ? "🎉 Profitto del mese" : "⚠️ Perdita del mese"}
            </p>
            <p className={`text-4xl font-bold mt-2 ${
              isMonthProfitPositive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
            }`}>
              {isMonthProfitPositive ? "+" : ""}{fmt(data.profit.month)}
            </p>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                📈 Entrate: <strong className="text-green-600 dark:text-green-400">{fmt(data.profit.monthRevenue)}</strong>
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                📉 Uscite: <strong className="text-red-600 dark:text-red-400">{fmt(data.profit.monthExpenses)}</strong>
              </span>
            </div>
          </div>
          <div className="text-6xl">{isMonthProfitPositive ? "💰" : "📉"}</div>
        </div>
      </div>

      {/* Stat Cards principali */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="💰" label="Entrate totali" value={fmt(data.invoices.totalAmount)} sub={`${fmt(data.invoices.paidAmount)} incassato`} color="bg-green-50 dark:bg-green-900/30" valueColor="text-green-600 dark:text-green-400" />
        <StatCard icon="💸" label="Uscite totali" value={fmt(data.expenses.totalAmount)} sub={`${data.expenses.total} spese`} color="bg-red-50 dark:bg-red-900/30" valueColor="text-red-600 dark:text-red-400" />
        <StatCard 
          icon={isProfitPositive ? "📈" : "📉"} 
          label="Profitto netto" 
          value={fmt(data.profit.total)} 
          sub={isProfitPositive ? "In utile" : "In perdita"} 
          color={isProfitPositive ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-orange-50 dark:bg-orange-900/30"}
          valueColor={isProfitPositive ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}
        />
        <StatCard icon="⏱️" label="Ore lavorate" value={data.hours.total} sub={`${data.hours.billable} fatturabili`} color="bg-purple-50 dark:bg-purple-900/30" />
      </div>

      {/* Stat secondarie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="Clienti" value={data.clients} color="bg-blue-50 dark:bg-blue-900/30" />
        <StatCard icon="📁" label="Progetti Attivi" value={data.activeProjects} sub={`${data.projects} totali`} color="bg-indigo-50 dark:bg-indigo-900/30" />
        <StatCard icon="📄" label="Fatture" value={data.invoices.total} sub={`${fmt(data.invoices.pendingAmount)} da incassare`} color="bg-yellow-50 dark:bg-yellow-900/30" />
        <StatCard icon="🧾" label="Spese da pagare" value={fmt(data.expenses.pendingAmount)} color="bg-amber-50 dark:bg-amber-900/30" valueColor="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Grafici */}
      {hasChartData ? (
        <>
          {/* Entrate vs Uscite (full width) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              📊 Entrate vs Uscite (ultimi 6 mesi)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.monthlyComparison}>
                <defs>
                  <linearGradient id="entrateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="usciteGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="month" className="text-xs" stroke="currentColor" opacity={0.6} />
                <YAxis tickFormatter={fmtShort} className="text-xs" stroke="currentColor" opacity={0.6} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="entrate" name="Entrate" stroke="#10b981" strokeWidth={2} fill="url(#entrateGrad)" />
                <Area type="monotone" dataKey="uscite" name="Uscite" stroke="#ef4444" strokeWidth={2} fill="url(#usciteGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Profitto Mensile */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              💹 Profitto mensile
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="month" className="text-xs" stroke="currentColor" opacity={0.6} />
                <YAxis tickFormatter={fmtShort} className="text-xs" stroke="currentColor" opacity={0.6} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profitto" name="Profitto" radius={[8, 8, 0, 0]}>
                  {data.monthlyComparison.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profitto >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Spese per categoria */}
            {data.expensesByCategory.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  🥧 Spese per categoria
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }: { name?: string; value?: number }) => `${name}: ${fmtShort(value || 0)}`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => fmt(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Progetti per stato */}
            {data.projectsByStatus.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  📁 Progetti per stato
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.projectsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }: { name?: string; value?: number }) => `${name}: ${value}`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.projectsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Ore per progetto */}
            {data.hoursByProject.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  ⏱️ Ore per progetto (top 5)
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.hoursByProject}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="name" className="text-xs" stroke="currentColor" opacity={0.6} />
                    <YAxis className="text-xs" stroke="currentColor" opacity={0.6} />
                    <Tooltip content={<CustomTooltipHours />} />
                    <Bar dataKey="hours" name="Ore" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top clienti */}
            {data.topClients.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  🏆 Top 5 clienti
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.topClients} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis type="number" tickFormatter={fmtShort} className="text-xs" stroke="currentColor" opacity={0.6} />
                    <YAxis type="category" dataKey="name" width={100} className="text-xs" stroke="currentColor" opacity={0.6} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" name="Fatturato" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Nessun dato ancora</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Inizia aggiungendo clienti, fatture e spese per vedere i grafici!</p>
        </div>
      )}
    </div>
  );
}

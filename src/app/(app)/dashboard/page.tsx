"use client";

import { useEffect, useState } from "react";
import { StatCardSkeleton } from "@/components/skeleton";
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";

interface DashboardData {
  clients: number;
  projects: number;
  activeProjects: number;
  invoices: {
    total: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  };
  hours: {
    total: number;
    billable: number;
  };
  monthlyRevenue: { month: string; revenue: number; paid: number }[];
  projectsByStatus: { name: string; value: number; color: string }[];
  hoursByProject: { name: string; hours: number }[];
  topClients: { name: string; amount: number }[];
}

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
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
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k€`;
  return `${n}€`;
}

// Tooltip personalizzato per i grafici
interface TooltipPayload {
  name: string;
  value: number;
  color?: string;
}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hasChartData = data.monthlyRevenue.some((m) => m.revenue > 0) ||
                       data.projectsByStatus.length > 0 ||
                       data.hoursByProject.length > 0 ||
                       data.topClients.length > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Panoramica della tua attività freelance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="Clienti" value={data.clients} color="bg-blue-50 dark:bg-blue-900/30" />
        <StatCard icon="📁" label="Progetti Attivi" value={data.activeProjects} sub={`${data.projects} totali`} color="bg-green-50 dark:bg-green-900/30" />
        <StatCard icon="💰" label="Fatturato" value={fmt(data.invoices.totalAmount)} sub={`${fmt(data.invoices.paidAmount)} incassato`} color="bg-yellow-50 dark:bg-yellow-900/30" />
        <StatCard icon="⏱️" label="Ore Registrate" value={data.hours.total} sub={`${data.hours.billable} fatturabili`} color="bg-purple-50 dark:bg-purple-900/30" />
      </div>

      {/* Grafici */}
      {hasChartData ? (
        <>
          {/* Grafico Fatturato Mensile (full width) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              📈 Fatturato mensile (ultimi 6 mesi)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="month" className="text-xs" stroke="currentColor" opacity={0.6} />
                <YAxis tickFormatter={fmtShort} className="text-xs" stroke="currentColor" opacity={0.6} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Fatturato" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="paid" name="Incassato" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Torta Progetti per stato */}
            {data.projectsByStatus.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  🥧 Progetti per stato
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

            {/* Ore per progetto */}
            {data.hoursByProject.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  📊 Ore per progetto (top 5)
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
          </div>

          {/* Top clienti (full width) */}
          {data.topClients.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                🏆 Top 5 clienti per fatturato
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
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Nessun dato ancora</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Inizia aggiungendo clienti, progetti e fatture per vedere i grafici!</p>
        </div>
      )}

      {/* Riepilogo fatture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">💶 Riepilogo Fatture</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center"><span className="text-slate-600 dark:text-slate-400">Totale fatture</span><span className="font-semibold text-slate-900 dark:text-slate-100">{data.invoices.total}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-600 dark:text-slate-400">Importo totale</span><span className="font-semibold text-slate-900 dark:text-slate-100">{fmt(data.invoices.totalAmount)}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-600 dark:text-slate-400">Incassato</span><span className="font-semibold text-green-600 dark:text-green-400">{fmt(data.invoices.paidAmount)}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-600 dark:text-slate-400">Da incassare</span><span className="font-semibold text-amber-600 dark:text-amber-400">{fmt(data.invoices.pendingAmount)}</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">📱 Installa Freela</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Freela è una PWA installabile. Puoi aggiungerla alla schermata home del tuo dispositivo.</p>
          <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <p>📱 <strong>Mobile:</strong> Tocca &quot;Aggiungi a schermata Home&quot;</p>
            <p>💻 <strong>Desktop:</strong> Clicca l&apos;icona di installazione nella barra indirizzi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
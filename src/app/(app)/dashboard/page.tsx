"use client";

import { useEffect, useState } from "react";

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
}

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-sm text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Panoramica della tua attività freelance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="Clienti" value={data.clients} color="bg-blue-50" />
        <StatCard icon="📁" label="Progetti Attivi" value={data.activeProjects} sub={`${data.projects} totali`} color="bg-green-50" />
        <StatCard icon="💰" label="Fatturato" value={fmt(data.invoices.totalAmount)} sub={`${fmt(data.invoices.paidAmount)} incassato`} color="bg-yellow-50" />
        <StatCard icon="⏱️" label="Ore Registrate" value={data.hours.total} sub={`${data.hours.billable} fatturabili`} color="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">💶 Riepilogo Fatture</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center"><span className="text-slate-600">Totale fatture</span><span className="font-semibold">{data.invoices.total}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-600">Importo totale</span><span className="font-semibold text-slate-900">{fmt(data.invoices.totalAmount)}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-600">Incassato</span><span className="font-semibold text-green-600">{fmt(data.invoices.paidAmount)}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-600">Da incassare</span><span className="font-semibold text-amber-600">{fmt(data.invoices.pendingAmount)}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">📱 Installa Freela</h3>
          <p className="text-slate-600 text-sm mb-4">Freela è una PWA installabile. Puoi aggiungerla alla schermata home del tuo dispositivo.</p>
          <div className="space-y-2 text-sm text-slate-500">
            <p>📱 <strong>Mobile:</strong> Tocca &quot;Aggiungi a schermata Home&quot;</p>
            <p>💻 <strong>Desktop:</strong> Clicca l&apos;icona di installazione nella barra indirizzi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
}

interface TimeEntry {
  id: string;
  description: string | null;
  hours: string;
  date: string;
  billable: boolean;
  projectId: string | null;
  projectName: string | null;
  clientName: string | null;
}

interface Totals {
  totalHours: number;
  billableHours: number;
  totalEntries: number;
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TimePage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [totals, setTotals] = useState<Totals>({ totalHours: 0, billableHours: 0, totalEntries: 0 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filtri
  const [filterProject, setFilterProject] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Form
  const [form, setForm] = useState({
    projectId: "",
    description: "",
    hours: "",
    date: new Date().toISOString().split("T")[0],
    billable: true,
  });
  const [showForm, setShowForm] = useState(false);

  const fetchEntries = async () => {
    const params = new URLSearchParams();
    if (filterProject) params.set("projectId", filterProject);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const res = await fetch(`/api/time?${params}`);
    const data = await res.json();
    setEntries(data.entries);
    setTotals(data.totals);
  };

  const fetchProjects = async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : data.projects ?? []);
  };

  useEffect(() => {
    Promise.all([fetchEntries(), fetchProjects()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [filterProject, filterFrom, filterTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        hours: parseFloat(form.hours),
      }),
    });
    setForm({ projectId: "", description: "", hours: "", date: new Date().toISOString().split("T")[0], billable: true });
    setShowForm(false);
    setSaving(false);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questa registrazione?")) return;
    await fetch(`/api/time/${id}`, { method: "DELETE" });
    fetchEntries();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">⏱️ Ore</h1>
          <p className="text-slate-500 mt-1">Registra e gestisci le tue ore di lavoro</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          {showForm ? "✕ Chiudi" : "＋ Registra Ore"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Ore Totali</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{Number(totals.totalHours).toFixed(1)}</p>
              <p className="text-sm text-slate-400 mt-1">{totals.totalEntries} registrazioni</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-purple-50">⏱️</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Ore Fatturabili</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{Number(totals.billableHours).toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-green-50">💰</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Ore Non Fatturabili</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{(Number(totals.totalHours) - Number(totals.billableHours)).toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-amber-50">📊</div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Nuova Registrazione</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ore *</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                required
                placeholder="es. 2.5"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Progetto</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">— Nessun progetto —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fatturabile</label>
              <div className="flex items-center h-[42px]">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.billable}
                    onChange={(e) => setForm({ ...form, billable: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  <span className="ml-2 text-sm text-slate-600">{form.billable ? "Sì" : "No"}</span>
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
            <input
              type="text"
              placeholder="Cosa hai fatto..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : "💾 Salva"}
            </button>
          </div>
        </form>
      )}

      {/* Filtri */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Progetto</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Tutti i progetti</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Da</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">A</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          {(filterProject || filterFrom || filterTo) && (
            <button
              onClick={() => { setFilterProject(""); setFilterFrom(""); setFilterTo(""); }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-2"
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">⏱️</p>
            <p className="text-slate-500 font-medium">Nessuna ora registrata</p>
            <p className="text-slate-400 text-sm mt-1">Clicca &quot;Registra Ore&quot; per iniziare</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg">
                    {entry.billable ? "💰" : "📋"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {entry.description || <span className="text-slate-400 italic">Senza descrizione</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{fmt(entry.date)}</span>
                      {entry.projectName && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-indigo-600 font-medium">{entry.projectName}</span>
                        </>
                      )}
                      {entry.clientName && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{entry.clientName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{Number(entry.hours).toFixed(1)}h</p>
                    <p className={`text-xs ${entry.billable ? "text-green-600" : "text-slate-400"}`}>
                      {entry.billable ? "Fatturabile" : "Non fatt."}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Elimina"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
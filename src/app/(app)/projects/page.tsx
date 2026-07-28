"use client";

import { useEffect, useState, useCallback } from "react";

interface Client { id: string; name: string; }
interface Project {
  id: string;
  clientId: string | null;
  name: string;
  description: string | null;
  status: string;
  budget: string | null;
  clientName: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Attivo", color: "bg-green-100 text-green-700" },
  paused: { label: "In pausa", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completato", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Annullato", color: "bg-red-100 text-red-700" },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", clientId: "", status: "active", budget: "" });

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]).then(([p, c]) => { setProjects(p); setClients(c); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setForm({ name: "", description: "", clientId: "", status: "active", budget: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(p: Project) {
    setForm({
      name: p.name,
      description: p.description || "",
      clientId: p.clientId || "",
      status: p.status,
      budget: p.budget || "",
    });
    setEditingId(p.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editingId ? `/api/projects/${editingId}` : "/api/projects";
    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, clientId: form.clientId || null, budget: form.budget || null }),
    });
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questo progetto?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  function fmt(n: string) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(parseFloat(n));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Progetti</h1>
          <p className="text-slate-500 mt-1">{projects.length} progetti totali</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
          + Nuovo Progetto
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Modifica Progetto" : "Nuovo Progetto"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">— Nessun cliente —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stato</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="active">Attivo</option>
                <option value="paused">In pausa</option>
                <option value="completed">Completato</option>
                <option value="cancelled">Annullato</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Budget (€)</label>
              <input type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                {editingId ? "Salva" : "Crea"}
              </button>
              <button type="button" onClick={resetForm}
                className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">Annulla</button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
          <p className="text-4xl mb-3">📁</p>
          <p className="text-slate-500">Nessun progetto ancora. Creane uno!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const st = statusLabels[p.status] || statusLabels.active;
            return (
              <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{p.name}</h3>
                    {p.clientName && <p className="text-sm text-slate-500 truncate">👤 {p.clientName}</p>}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600">✏️</button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600">🗑️</button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                  {p.budget && <span className="text-sm text-slate-500 font-medium">{fmt(p.budget)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
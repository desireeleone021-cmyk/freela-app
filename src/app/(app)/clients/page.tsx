"use client";

import { useEffect, useState, useCallback } from "react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });

  const load = useCallback(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setForm({ name: "", email: "", phone: "", company: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(c: Client) {
    setForm({
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      company: c.company || "",
      notes: c.notes || "",
    });
    setEditingId(c.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editingId ? `/api/clients/${editingId}` : "/api/clients";
    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questo cliente?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    load();
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
          <h1 className="text-2xl font-bold text-slate-900">Clienti</h1>
          <p className="text-slate-500 mt-1">{clients.length} clienti totali</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
          + Nuovo Cliente
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Modifica Cliente" : "Nuovo Cliente"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefono</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Azienda</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
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

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-slate-500">Nessun cliente ancora. Aggiungine uno!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{c.name}</h3>
                  {c.company && <p className="text-sm text-slate-500 truncate">{c.company}</p>}
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600">✏️</button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600">🗑️</button>
                </div>
              </div>
              {c.email && <p className="text-sm text-slate-500 mt-2 truncate">📧 {c.email}</p>}
              {c.phone && <p className="text-sm text-slate-500 mt-1 truncate">📞 {c.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
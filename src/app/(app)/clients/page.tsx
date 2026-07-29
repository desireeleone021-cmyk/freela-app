"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { CardsGridSkeleton, PageHeaderSkeleton } from "@/components/skeleton";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
}

type SortKey = "name" | "company" | "email";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });

  // Ricerca e ordinamento
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const load = useCallback(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtra e ordina
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Filtra per ricerca
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      );
    }

    // Ordina
    result.sort((a, b) => {
      const aVal = (a[sortKey] || "").toLowerCase();
      const bVal = (b[sortKey] || "").toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [clients, search, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

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
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(editingId ? "Cliente aggiornato! ✓" : "Cliente creato! 🎉");
      resetForm();
      load();
    } else {
      toast.error("Errore nel salvataggio");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questo cliente?")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Cliente eliminato");
      load();
    } else {
      toast.error("Errore nell'eliminazione");
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.dataset.placeholder = e.currentTarget.placeholder;
    e.currentTarget.placeholder = "";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.currentTarget.dataset.placeholder) {
      e.currentTarget.placeholder = e.currentTarget.dataset.placeholder;
    }
  };

  const inputClass = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none";

  if (loading) {
    return (
      <div>
        <PageHeaderSkeleton />
        <CardsGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Clienti</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {filteredClients.length} di {clients.length} clienti
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
          + Nuovo Cliente
        </button>
      </div>

      {/* Barra ricerca + ordinamento */}
      {clients.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Cerca per nome, email, azienda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleSort("name")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortKey === "name"
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              Nome {sortKey === "name" && (sortAsc ? "↑" : "↓")}
            </button>
            <button
              onClick={() => toggleSort("company")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortKey === "company"
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              Azienda {sortKey === "company" && (sortAsc ? "↑" : "↓")}
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
            {editingId ? "Modifica Cliente" : "Nuovo Cliente"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                onFocus={handleFocus} onBlur={handleBlur}
                className={inputClass} placeholder="Mario Rossi" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={handleFocus} onBlur={handleBlur}
                className={inputClass} placeholder="mario@esempio.it" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefono</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onFocus={handleFocus} onBlur={handleBlur}
                className={inputClass} placeholder="+39 333 1234567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Azienda</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                onFocus={handleFocus} onBlur={handleBlur}
                className={inputClass} placeholder="Azienda SRL" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Note</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                onFocus={handleFocus} onBlur={handleBlur}
                rows={2} className={inputClass} placeholder="Note aggiuntive..." />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                {editingId ? "Salva" : "Crea"}
              </button>
              <button type="button" onClick={resetForm}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700">
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-slate-500 dark:text-slate-400">Nessun cliente ancora. Aggiungine uno!</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-500 dark:text-slate-400">Nessun risultato per &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{c.name}</h3>
                  {c.company && <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{c.company}</p>}
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600">✏️</button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600">🗑️</button>
                </div>
              </div>
              {c.email && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 truncate">📧 {c.email}</p>}
              {c.phone && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">📞 {c.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeleton";

interface Expense {
  id: string;
  category: string;
  supplier: string | null;
  description: string;
  amount: string;
  date: string;
  paid: boolean;
  notes: string | null;
}

const CATEGORIES = [
  "Software & Abbonamenti",
  "Marketing & Pubblicità",
  "Attrezzatura",
  "Fornitori",
  "Consulenze",
  "Trasporti",
  "Utenze",
  "Tasse & Contributi",
  "Formazione",
  "Altro",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Software & Abbonamenti": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  "Marketing & Pubblicità": "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400",
  "Attrezzatura": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  "Fornitori": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  "Consulenze": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  "Trasporti": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400",
  "Utenze": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  "Tasse & Contributi": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  "Formazione": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  "Altro": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

type SortKey = "date" | "category" | "supplier" | "amount";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: CATEGORIES[0],
    supplier: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paid: true,
    notes: "",
  });

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(() => {
    fetch("/api/expenses").then((r) => r.json()).then(setExpenses).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(e => 
        e.description.toLowerCase().includes(q) ||
        (e.supplier && e.supplier.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q)
      );
    }

    if (filterCategory) {
      result = result.filter(e => e.category === filterCategory);
    }

    result.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      if (sortKey === "amount") {
        aVal = parseFloat(a.amount);
        bVal = parseFloat(b.amount);
      } else if (sortKey === "date") {
        aVal = a.date;
        bVal = b.date;
      } else {
        aVal = (a[sortKey] || "").toString().toLowerCase();
        bVal = (b[sortKey] || "").toString().toLowerCase();
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [expenses, search, filterCategory, sortKey, sortAsc]);

  const totalExpenses = useMemo(() => 
    filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0),
    [filteredExpenses]
  );

  const paidExpenses = useMemo(() => 
    filteredExpenses.filter(e => e.paid).reduce((sum, e) => sum + parseFloat(e.amount), 0),
    [filteredExpenses]
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  function resetForm() {
    setForm({
      category: CATEGORIES[0],
      supplier: "",
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      paid: true,
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(e: Expense) {
    setForm({
      category: e.category,
      supplier: e.supplier || "",
      description: e.description,
      amount: e.amount,
      date: e.date.substring(0, 10),
      paid: e.paid,
      notes: e.notes || "",
    });
    setEditingId(e.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editingId ? `/api/expenses/${editingId}` : "/api/expenses";
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(editingId ? "Spesa aggiornata! ✓" : "Spesa registrata! 💸");
      resetForm();
      load();
    } else {
      toast.error("Errore nel salvataggio");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questa spesa?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Spesa eliminata");
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

  function fmt(n: string | number) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(typeof n === "string" ? parseFloat(n) : n);
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("it-IT");
  }

  const inputClass = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none";

  const SortHeader = ({ label, keyName, align = "left" }: { label: string; keyName: SortKey; align?: "left" | "right" }) => (
    <th className={`text-${align} px-4 py-3 font-medium text-slate-600 dark:text-slate-400`}>
      <button onClick={() => toggleSort(keyName)} className={`inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 ${sortKey === keyName ? "text-indigo-600 dark:text-indigo-400" : ""}`}>
        {label}
        {sortKey === keyName ? (sortAsc ? "↑" : "↓") : "↕"}
      </button>
    </th>
  );

  if (loading) {
    return (
      <div>
        <PageHeaderSkeleton />
        <TableSkeleton count={5} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">💸 Spese</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {filteredExpenses.length} di {expenses.length} spese
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
          + Nuova Spesa
        </button>
      </div>

      {/* Stat cards */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Totale spese</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{fmt(totalExpenses)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{filteredExpenses.length} registrate</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pagate</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{fmt(paidExpenses)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Da pagare</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{fmt(totalExpenses - paidExpenses)}</p>
          </div>
        </div>
      )}

      {/* Ricerca e filtri */}
      {expenses.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input type="text" placeholder="Cerca per descrizione, fornitore, categoria..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              onFocus={handleFocus} onBlur={handleBlur}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
            )}
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">Tutte le categorie</option>
            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
            {editingId ? "Modifica Spesa" : "Nuova Spesa"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass} required>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Importo (€) *</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                onFocus={handleFocus} onBlur={handleBlur}
                className={inputClass} required placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrizione *</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                onFocus={handleFocus} onBlur={handleBlur}
                className={inputClass} required placeholder="Es. Abbonamento Adobe Cloud" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fornitore</label>
              <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                onFocus={handleFocus} onBlur={handleBlur}
                className={inputClass} placeholder="Es. Adobe" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Note</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                onFocus={handleFocus} onBlur={handleBlur}
                rows={2} className={inputClass} placeholder="Note aggiuntive..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stato pagamento</label>
              <div className="flex items-center h-[42px]">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.paid}
                    onChange={(e) => setForm({ ...form, paid: e.target.checked })}
                    className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">{form.paid ? "Pagata ✓" : "Da pagare"}</span>
                </label>
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                {editingId ? "Salva" : "Crea"}
              </button>
              <button type="button" onClick={resetForm}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700">Annulla</button>
            </div>
          </form>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-4xl mb-3">💸</p>
          <p className="text-slate-500 dark:text-slate-400">Nessuna spesa registrata. Aggiungine una!</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-500 dark:text-slate-400">Nessun risultato trovato</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <SortHeader label="Data" keyName="date" />
                  <SortHeader label="Categoria" keyName="category" />
                  <SortHeader label="Descrizione" keyName="supplier" />
                  <SortHeader label="Importo" keyName="amount" align="right" />
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Stato</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 dark:border-slate-800">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDate(e.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS["Altro"]}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{e.description}</p>
                      {e.supplier && <p className="text-xs text-slate-500 dark:text-slate-400">🏢 {e.supplier}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">-{fmt(e.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${e.paid ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"}`}>
                        {e.paid ? "Pagata" : "Da pagare"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => startEdit(e)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600">✏️</button>
                        <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
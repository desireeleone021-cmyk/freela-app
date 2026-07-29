"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeleton";

interface Client { id: string; name: string; }
interface Invoice {
  id: string;
  clientId: string | null;
  projectId: string | null;
  number: string;
  amount: string;
  status: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  notes: string | null;
  clientName: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Bozza", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  sent: { label: "Inviata", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  paid: { label: "Pagata", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
  overdue: { label: "Scaduta", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ number: "", amount: "", clientId: "", status: "draft", issuedAt: "", dueAt: "", notes: "" });

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]).then(([i, c]) => { setInvoices(i); setClients(c); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setForm({ number: "", amount: "", clientId: "", status: "draft", issuedAt: "", dueAt: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(inv: Invoice) {
    setForm({
      number: inv.number,
      amount: inv.amount,
      clientId: inv.clientId || "",
      status: inv.status,
      issuedAt: inv.issuedAt ? inv.issuedAt.substring(0, 10) : "",
      dueAt: inv.dueAt ? inv.dueAt.substring(0, 10) : "",
      notes: inv.notes || "",
    });
    setEditingId(inv.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editingId ? `/api/invoices/${editingId}` : "/api/invoices";
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, clientId: form.clientId || null, issuedAt: form.issuedAt || null, dueAt: form.dueAt || null }),
    });
    if (res.ok) {
      toast.success(editingId ? "Fattura aggiornata! ✓" : "Fattura creata! 🎉");
      resetForm();
      load();
    } else {
      toast.error("Errore nel salvataggio");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questa fattura?")) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Fattura eliminata");
      load();
    } else {
      toast.error("Errore nell'eliminazione");
    }
  }

  async function markPaid(inv: Invoice) {
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...inv, status: "paid", paidAt: new Date().toISOString() }),
    });
    if (res.ok) {
      toast.success("Fattura segnata come pagata! 💰");
      load();
    } else {
      toast.error("Errore");
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

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("it-IT");
  }

  const inputClass = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none";

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fatture</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{invoices.length} fatture totali</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
          + Nuova Fattura
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
            {editingId ? "Modifica Fattura" : "Nuova Fattura"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Numero *</label>
              <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })}
                onFocus={handleFocus} onBlur={handleBlur}
                className={inputClass} required placeholder="FAT-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Importo (€) *</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                onFocus={handleFocus} onBlur={handleBlur}
                className={inputClass} required placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stato</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputClass}>
                <option value="draft">Bozza</option>
                <option value="sent">Inviata</option>
                <option value="paid">Pagata</option>
                <option value="overdue">Scaduta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cliente</label>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className={inputClass}>
                <option value="">— Nessun cliente —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data emissione</label>
              <input type="date" value={form.issuedAt} onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Scadenza</label>
              <input type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                className={inputClass} />
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

      {invoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-slate-500 dark:text-slate-400">Nessuna fattura ancora. Creane una!</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">N°</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Importo</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Stato</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Scadenza</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const st = statusLabels[inv.status] || statusLabels.draft;
                  return (
                    <tr key={inv.id} className="border-b border-slate-50 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{inv.number}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{inv.clientName || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">{fmt(inv.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDate(inv.dueAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {inv.status !== "paid" && (
                            <button onClick={() => markPaid(inv)} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-400 hover:text-green-600">✅</button>
                          )}
                          <button onClick={() => startEdit(inv)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600">✏️</button>
                          <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
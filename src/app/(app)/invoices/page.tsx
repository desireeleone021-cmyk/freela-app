"use client";

import { useEffect, useState, useCallback } from "react";

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
  draft: { label: "Bozza", color: "bg-slate-100 text-slate-600" },
  sent: { label: "Inviata", color: "bg-blue-100 text-blue-700" },
  paid: { label: "Pagata", color: "bg-green-100 text-green-700" },
  overdue: { label: "Scaduta", color: "bg-red-100 text-red-700" },
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
    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, clientId: form.clientId || null, issuedAt: form.issuedAt || null, dueAt: form.dueAt || null }),
    });
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questa fattura?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    load();
  }

  async function markPaid(inv: Invoice) {
    await fetch(`/api/invoices/${inv.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...inv, status: "paid", paidAt: new Date().toISOString() }),
    });
    load();
  }

  function fmt(n: string | number) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(typeof n === "string" ? parseFloat(n) : n);
  }

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("it-IT");
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
          <h1 className="text-2xl font-bold text-slate-900">Fatture</h1>
          <p className="text-slate-500 mt-1">{invoices.length} fatture totali</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
          + Nuova Fattura
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Modifica Fattura" : "Nuova Fattura"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Numero *</label>
              <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required placeholder="FAT-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Importo (€) *</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stato</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="draft">Bozza</option>
                <option value="sent">Inviata</option>
                <option value="paid">Pagata</option>
                <option value="overdue">Scaduta</option>
              </select>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Data emissione</label>
              <input type="date" value={form.issuedAt} onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scadenza</label>
              <input type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                {editingId ? "Salva" : "Crea"}
              </button>
              <button type="button" onClick={resetForm}
                className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">Annulla</button>
            </div>
          </form>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-slate-500">Nessuna fattura ancora. Creane una!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">N°</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Importo</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Stato</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Scadenza</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const st = statusLabels[inv.status] || statusLabels.draft;
                  return (
                    <tr key={inv.id} className="border-b border-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{inv.number}</td>
                      <td className="px-4 py-3 text-slate-600">{inv.clientName || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(inv.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{fmtDate(inv.dueAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {inv.status !== "paid" && (
                            <button onClick={() => markPaid(inv)} className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600">✅</button>
                          )}
                          <button onClick={() => startEdit(inv)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600">✏️</button>
                          <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600">🗑️</button>
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
"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface UserData {
  id: string;
  name: string;
  email: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("Errore caricamento utente:", err);
      }
    }
    loadUser();
  }, []);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.dataset.placeholder = e.currentTarget.placeholder;
    e.currentTarget.placeholder = "";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.currentTarget.dataset.placeholder) {
      e.currentTarget.placeholder = e.currentTarget.dataset.placeholder;
    }
  };

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Le nuove password non corrispondono");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("La nuova password deve avere almeno 8 caratteri");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Errore cambio password");
        return;
      }

      toast.success("Password aggiornata! 🎉");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profilo</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Gestisci il tuo account</p>
      </div>

      {/* Info account */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Informazioni account
        </h2>
        {user ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Nome</label>
              <p className="text-slate-900 dark:text-slate-100">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Email</label>
              <p className="text-slate-900 dark:text-slate-100">{user.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">Caricamento...</p>
        )}
      </div>

      {/* Cambio password */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Cambia password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password attuale
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={inputClass}
              placeholder="La tua password attuale"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nuova password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={inputClass}
              placeholder="Almeno 8 caratteri"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Conferma nuova password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={inputClass}
              placeholder="Ripeti la nuova password"
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Salvataggio..." : "Aggiorna password"}
          </button>
        </form>
      </div>
    </div>
  );
}
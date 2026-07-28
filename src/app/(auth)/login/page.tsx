"use client";
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const body: Record<string, string> = { email, password };
      if (isRegister) body.name = name;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Errore sconosciuto");
        return;
      }

      toast.success(isRegister ? "Account creato! Benvenuto 🎉" : "Bentornato!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
            <span className="text-3xl font-bold text-white">F</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Freela</h1>
          <p className="text-indigo-300 mt-1">Gestione Freelance</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            {isRegister ? "Crea il tuo account" : "Accedi al tuo account"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  focus:placeholder:text-transparent
                  placeholder="Mario Rossi" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                focus:placeholder:text-transparent
                placeholder="mario@esempio.it" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                focus:placeholder:text-transparent
                placeholder="Almeno 8 caratteri" minLength={isRegister ? 8 : 6} required />
            </div>
            
            {!isRegister && (
              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800">
                  Password dimenticata?
                </Link>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors">
              {loading ? "Caricamento..." : isRegister ? "Registrati" : "Accedi"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-indigo-600 hover:text-indigo-800">
              {isRegister ? "Hai già un account? Accedi" : "Non hai un account? Registrati"}
            </button>
          </div>
        </div>
        <p className="text-center text-indigo-400/60 text-xs mt-6">PWA installabile • Dati protetti • 100% tuo</p>
      </div>
    </div>
  );
}
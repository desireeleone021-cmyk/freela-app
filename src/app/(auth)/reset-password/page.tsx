"use client";
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Le password non corrispondono");
      return;
    }

    if (password.length < 8) {
      toast.error("La password deve avere almeno 8 caratteri");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Errore reset password");
        return;
      }

      toast.success("Password aggiornata! 🎉");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-medium">Link non valido</p>
        <p className="text-sm mt-1">Il link di reset è mancante o corrotto.</p>
        <Link href="/forgot-password" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
          Richiedi un nuovo link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
        <p className="font-medium">Password aggiornata!</p>
        <p className="text-sm mt-1">Verrai reindirizzato al login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
            <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nuova Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 pr-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Almeno 8 caratteri"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Conferma Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 pr-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ripeti la password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {loading ? "Salvataggio..." : "Reimposta Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Nuova Password
        </h1>
        <p className="text-slate-600 mb-6">
          Inserisci la tua nuova password.
        </p>

        <Suspense fallback={<div>Caricamento...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-indigo-600 hover:underline text-sm">
            ← Torna al login
          </Link>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link di verifica non valido");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Errore verifica");
          return;
        }

        setStatus("success");
        setMessage("Email verificata con successo!");
        toast.success("Account attivato! 🎉");

        setTimeout(() => router.push("/dashboard"), 2000);
      } catch {
        setStatus("error");
        setMessage("Errore di connessione");
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Verifica in corso...
            </h1>
            <p className="text-slate-600 dark:text-slate-400">Attendere prego</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {message}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Verrai reindirizzato alla dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Verifica fallita
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{message}</p>
            <Link href="/login" className="text-indigo-600 hover:underline">
              Torna al login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, removeAuthCookie } from "@/lib/auth";
import { rateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Non autenticato" }, { status: 401 });
    }

    const ip = getClientIP(req);
    const rl = rateLimit(`delete-account:${user.id}:${ip}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
    });

    if (!rl.success) {
      return rateLimitResponse(rl.resetIn);
    }

    const { password, confirmation } = await req.json();

    if (!password || !confirmation) {
      return Response.json(
        { error: "Password e conferma sono obbligatorie" },
        { status: 400 }
      );
    }

    if (confirmation !== "ELIMINA") {
      return Response.json(
        { error: "Devi scrivere ELIMINA per confermare" },
        { status: 400 }
      );
    }

    const [dbUser] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser) {
      return Response.json({ error: "Utente non trovato" }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, dbUser.passwordHash);
    if (!valid) {
      return Response.json({ error: "Password non corretta" }, { status: 401 });
    }

    // Elimina utente (le tabelle collegate hanno ON DELETE CASCADE)
    await db.delete(users).where(eq(users.id, user.id));

    // Rimuovi cookie di autenticazione
    await removeAuthCookie();

    return Response.json({ success: true });
  } catch (err) {
    console.error("Errore delete-account:", err);
    return Response.json({ error: "Errore interno" }, { status: 500 });
  }
}
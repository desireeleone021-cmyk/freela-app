import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
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
    const rl = rateLimit(`change-password:${user.id}:${ip}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
    });

    if (!rl.success) {
      return rateLimitResponse(rl.resetIn);
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: "Password attuale e nuova password obbligatorie" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return Response.json(
        { error: "La nuova password deve avere almeno 8 caratteri" },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return Response.json(
        { error: "La nuova password deve essere diversa da quella attuale" },
        { status: 400 }
      );
    }

    // Recupera il password_hash dal DB
    const [dbUser] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser) {
      return Response.json({ error: "Utente non trovato" }, { status: 404 });
    }

    // Verifica password attuale
    const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!valid) {
      return Response.json({ error: "Password attuale non corretta" }, { status: 401 });
    }

    // Aggiorna con nuova password
    const newHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));

    return Response.json({ success: true });
  } catch (err) {
    console.error("Errore change-password:", err);
    return Response.json({ error: "Errore interno" }, { status: 500 });
  }
}
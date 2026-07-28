import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { rateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { eq, and, isNull, gt } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rl = rateLimit(`reset:${ip}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
    });

    if (!rl.success) {
      return rateLimitResponse(rl.resetIn);
    }

    const { token, password } = await req.json();

    if (!token || !password) {
      return Response.json(
        { error: "Token e password sono obbligatori" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "La password deve avere almeno 8 caratteri" },
        { status: 400 }
      );
    }

    // Trova il token valido
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetToken) {
      return Response.json(
        { error: "Token non valido o scaduto" },
        { status: 400 }
      );
    }

    // Aggiorna la password dell'utente
    const passwordHash = await bcrypt.hash(password, 12);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, resetToken.userId));

    // Marca il token come usato
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return Response.json({ success: true });
  } catch (err) {
    console.error("Errore reset-password:", err);
    return Response.json({ error: "Errore interno" }, { status: 500 });
  }
}
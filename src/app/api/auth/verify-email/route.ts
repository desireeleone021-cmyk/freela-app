import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { setAuthCookie } from "@/lib/auth";
import { and, eq, gt, isNull } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: "Token mancante" }, { status: 400 });
    }

    // Trova il token valido
    const [verifyToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.token, token),
          isNull(emailVerificationTokens.usedAt),
          gt(emailVerificationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!verifyToken) {
      return Response.json(
        { error: "Token non valido o scaduto" },
        { status: 400 }
      );
    }

    // Attiva l'account
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, verifyToken.userId));

    // Marca token come usato
    await db
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.id, verifyToken.id));

    // Recupera dati utente per login automatico
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, verifyToken.userId))
      .limit(1);

    // Login automatico dopo verifica
    await setAuthCookie({ userId: user.id, email: user.email });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Errore verify-email:", err);
    return Response.json({ error: "Errore interno" }, { status: 500 });
  }
}
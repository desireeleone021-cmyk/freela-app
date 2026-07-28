import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rl = rateLimit(`forgot:${ip}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
    });

    if (!rl.success) {
      return rateLimitResponse(rl.resetIn);
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: "Email obbligatoria" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    // Rispondi sempre successo per sicurezza (non rivelare se l'email esiste)
    if (!user) {
      return Response.json({ success: true });
    }

    // Genera token sicuro
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Costruisci il link di reset
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://freela-web-eight.vercel.app";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Invia email
    await sendPasswordResetEmail(user.email, resetLink);

    return Response.json({ success: true });
  } catch (err) {
    console.error("Errore forgot-password:", err);
    return Response.json({ error: "Errore interno" }, { status: 500 });
  }
}
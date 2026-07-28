import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { rateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rl = rateLimit(`register:${ip}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
    });

    if (!rl.success) {
      return rateLimitResponse(rl.resetIn);
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return Response.json(
        { error: "Nome, email e password sono obbligatori" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "La password deve avere almeno 8 caratteri" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return Response.json(
        { error: "Questa email è già registrata" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        emailVerified: false,
      })
      .returning({ id: users.id, name: users.name, email: users.email });

    // Genera token di verifica
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Invia email di verifica
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://freela-web-eight.vercel.app";
    const verifyLink = `${baseUrl}/verify-email?token=${token}`;

    sendVerificationEmail(user.email, user.name, verifyLink).catch((err) =>
      console.error("Errore invio email verifica:", err)
    );

    return Response.json({
      success: true,
      message: "Registrazione completata! Controlla la tua email per verificare l'account.",
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Errore nella registrazione" }, { status: 500 });
  }
}
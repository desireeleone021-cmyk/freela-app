import { db } from "@/db";
import { users } from "@/db/schema";
import { setAuthCookie } from "@/lib/auth";
import { rateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

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
      })
      .returning({ id: users.id, name: users.name, email: users.email });

    await setAuthCookie({ userId: user.id, email: user.email });

    return Response.json({ user });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Errore nella registrazione" }, { status: 500 });
  }
}
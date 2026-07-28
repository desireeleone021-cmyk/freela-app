import { db } from "@/db";
import { users } from "@/db/schema";
import { setAuthCookie } from "@/lib/auth";
import { rateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rl = rateLimit(`login:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 5,
    });

    if (!rl.success) {
      return rateLimitResponse(rl.resetIn);
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: "Email e password sono obbligatori" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      return Response.json({ error: "Email o password non validi" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return Response.json({ error: "Email o password non validi" }, { status: 401 });
    }

    // Controlla se l'email è stata verificata
    if (!user.emailVerified) {
      return Response.json(
        { 
          error: "Devi verificare la tua email prima di accedere. Controlla la posta in arrivo.",
          needsVerification: true,
        }, 
        { status: 403 }
      );
    }

    await setAuthCookie({ userId: user.id, email: user.email });

    return Response.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Errore nel login" }, { status: 500 });
  }
}
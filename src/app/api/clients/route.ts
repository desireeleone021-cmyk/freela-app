import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();
    const data = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, session.userId))
      .orderBy(desc(clients.createdAt));
    return Response.json(data);
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    
    if (!body.name) {
      return Response.json({ error: "Nome cliente obbligatorio" }, { status: 400 });
    }
    
    const [client] = await db
      .insert(clients)
      .values({
        userId: session.userId,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        notes: body.notes || null,
      })
      .returning();
    
    return Response.json(client, { status: 201 });
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}
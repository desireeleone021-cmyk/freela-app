import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    
    const [updated] = await db
      .update(clients)
      .set({
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        notes: body.notes || null,
      })
      .where(and(eq(clients.id, id), eq(clients.userId, session.userId)))
      .returning();
    
    if (!updated) return Response.json({ error: "Non trovato" }, { status: 404 });
    return Response.json(updated);
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    
    const [deleted] = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, session.userId)))
      .returning();
    
    if (!deleted) return Response.json({ error: "Non trovato" }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}
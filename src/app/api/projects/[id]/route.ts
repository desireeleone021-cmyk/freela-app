import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    
    const [updated] = await db
      .update(projects)
      .set({
        clientId: body.clientId || null,
        name: body.name,
        description: body.description || null,
        status: body.status || "active",
        budget: body.budget || null,
      })
      .where(and(eq(projects.id, id), eq(projects.userId, session.userId)))
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
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, session.userId)))
      .returning();
    
    if (!deleted) return Response.json({ error: "Non trovato" }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}
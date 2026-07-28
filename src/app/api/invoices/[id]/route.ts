import { db } from "@/db";
import { invoices } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db
      .update(invoices)
      .set({
        clientId: body.clientId || null,
        projectId: body.projectId || null,
        number: body.number,
        amount: body.amount?.toString(),
        status: body.status || "draft",
        issuedAt: body.issuedAt ? new Date(body.issuedAt) : null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        paidAt: body.paidAt ? new Date(body.paidAt) : null,
        notes: body.notes || null,
      })
      .where(and(eq(invoices.id, id), eq(invoices.userId, session.userId)))
      .returning();

    if (!updated) {
      return Response.json({ error: "Non trovato" }, { status: 404 });
    }
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
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, session.userId)))
      .returning();

    if (!deleted) {
      return Response.json({ error: "Non trovato" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}
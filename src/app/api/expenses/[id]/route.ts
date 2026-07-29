import { db } from "@/db";
import { expenses } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { category, supplier, description, amount, date, paid, notes } = await req.json();

    const [row] = await db
      .update(expenses)
      .set({
        category,
        supplier: supplier || null,
        description,
        amount: String(amount),
        date: new Date(date),
        paid,
        notes: notes || null,
      })
      .where(and(eq(expenses.id, id), eq(expenses.userId, session.userId)))
      .returning();

    if (!row) {
      return Response.json({ error: "Spesa non trovata" }, { status: 404 });
    }

    return Response.json(row);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Errore aggiornamento" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, session.userId)));

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Errore eliminazione" }, { status: 500 });
  }
}
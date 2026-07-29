import { db } from "@/db";
import { expenses } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, session.userId))
      .orderBy(desc(expenses.date));
    return Response.json(rows);
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const { category, supplier, description, amount, date, paid, notes } = await req.json();

    if (!category || !description || !amount || !date) {
      return Response.json(
        { error: "Categoria, descrizione, importo e data sono obbligatori" },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(expenses)
      .values({
        userId: session.userId,
        category,
        supplier: supplier || null,
        description,
        amount: String(amount),
        date: new Date(date),
        paid: paid !== undefined ? paid : true,
        notes: notes || null,
      })
      .returning();

    return Response.json(row);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Errore creazione spesa" }, { status: 500 });
  }
}
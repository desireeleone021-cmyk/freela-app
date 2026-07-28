import { db } from "@/db";
import { timeEntries } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const [deleted] = await db
      .delete(timeEntries)
      .where(and(eq(timeEntries.id, id), eq(timeEntries.userId, session.userId)))
      .returning();

    if (!deleted) {
      return Response.json({ error: "Non trovato" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}
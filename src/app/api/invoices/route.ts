import { db } from "@/db";
import { invoices, clients, projects } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();
    const data = await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        clientId: invoices.clientId,
        projectId: invoices.projectId,
        number: invoices.number,
        amount: invoices.amount,
        status: invoices.status,
        issuedAt: invoices.issuedAt,
        dueAt: invoices.dueAt,
        paidAt: invoices.paidAt,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        clientName: clients.name,
        projectName: projects.name,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(projects, eq(invoices.projectId, projects.id))
      .where(eq(invoices.userId, session.userId))
      .orderBy(desc(invoices.createdAt));
    return Response.json(data);
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    if (!body.number || !body.amount) {
      return Response.json({ error: "Numero e importo obbligatori" }, { status: 400 });
    }

    const [invoice] = await db
      .insert(invoices)
      .values({
        userId: session.userId,
        clientId: body.clientId || null,
        projectId: body.projectId || null,
        number: body.number,
        amount: body.amount.toString(),
        status: body.status || "draft",
        issuedAt: body.issuedAt ? new Date(body.issuedAt) : null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        notes: body.notes || null,
      })
      .returning();

    return Response.json(invoice, { status: 201 });
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}
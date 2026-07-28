import { db } from "@/db";
import { timeEntries, projects } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();
    const data = await db
      .select({
        id: timeEntries.id,
        userId: timeEntries.userId,
        projectId: timeEntries.projectId,
        description: timeEntries.description,
        hours: timeEntries.hours,
        date: timeEntries.date,
        billable: timeEntries.billable,
        createdAt: timeEntries.createdAt,
        projectName: projects.name,
      })
      .from(timeEntries)
      .leftJoin(projects, eq(timeEntries.projectId, projects.id))
      .where(eq(timeEntries.userId, session.userId))
      .orderBy(desc(timeEntries.date));
    return Response.json(data);
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    if (!body.hours || !body.date) {
      return Response.json({ error: "Ore e data obbligatori" }, { status: 400 });
    }

    const [entry] = await db
      .insert(timeEntries)
      .values({
        userId: session.userId,
        projectId: body.projectId || null,
        description: body.description || null,
        hours: body.hours.toString(),
        date: new Date(body.date),
        billable: body.billable !== false,
      })
      .returning();

    return Response.json(entry, { status: 201 });
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}
import { db } from "@/db";
import { projects, clients } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();
    const data = await db
      .select({
        id: projects.id,
        userId: projects.userId,
        clientId: projects.clientId,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        budget: projects.budget,
        createdAt: projects.createdAt,
        clientName: clients.name,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.userId, session.userId))
      .orderBy(desc(projects.createdAt));
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
      return Response.json({ error: "Nome progetto obbligatorio" }, { status: 400 });
    }
    
    const [project] = await db
      .insert(projects)
      .values({
        userId: session.userId,
        clientId: body.clientId || null,
        name: body.name,
        description: body.description || null,
        status: body.status || "active",
        budget: body.budget || null,
      })
      .returning();
    
    return Response.json(project, { status: 201 });
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}
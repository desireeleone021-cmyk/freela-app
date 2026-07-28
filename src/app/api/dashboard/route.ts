import { db } from "@/db";
import { clients, projects, invoices, timeEntries } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, sql, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();
    const uid = session.userId;

    const [clientCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(eq(clients.userId, uid));

    const [projectCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.userId, uid));

    const [activeProjectCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(and(eq(projects.userId, uid), eq(projects.status, "active")));

    const [invoiceStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        totalAmount: sql<string>`coalesce(sum(amount), 0)`,
        paidAmount: sql<string>`coalesce(sum(case when status = 'paid' then amount else 0 end), 0)`,
        pendingAmount: sql<string>`coalesce(sum(case when status != 'paid' then amount else 0 end), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.userId, uid));

    const [hoursStats] = await db
      .select({
        totalHours: sql<string>`coalesce(sum(hours), 0)`,
        billableHours: sql<string>`coalesce(sum(case when billable then hours else 0 end), 0)`,
      })
      .from(timeEntries)
      .where(eq(timeEntries.userId, uid));

    return Response.json({
      clients: clientCount.count,
      projects: projectCount.count,
      activeProjects: activeProjectCount.count,
      invoices: {
        total: invoiceStats.total,
        totalAmount: parseFloat(invoiceStats.totalAmount),
        paidAmount: parseFloat(invoiceStats.paidAmount),
        pendingAmount: parseFloat(invoiceStats.pendingAmount),
      },
      hours: {
        total: parseFloat(hoursStats.totalHours),
        billable: parseFloat(hoursStats.billableHours),
      },
    });
  } catch {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}
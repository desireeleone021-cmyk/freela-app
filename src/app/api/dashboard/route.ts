import { db } from "@/db";
import { clients, projects, invoices, timeEntries } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, sql, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  paused: "#f59e0b",
  completed: "#3b82f6",
  cancelled: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Attivo",
  paused: "In pausa",
  completed: "Completato",
  cancelled: "Annullato",
};

const MONTHS_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export async function GET() {
  try {
    const session = await requireAuth();
    const uid = session.userId;

    // Statistiche base (uguali a prima)
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

    // 📈 GRAFICO 1: Fatturato mensile (ultimi 6 mesi)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const monthlyData = await db
      .select({
        month: sql<string>`to_char(coalesce(issued_at, created_at), 'YYYY-MM')`,
        totalAmount: sql<string>`coalesce(sum(amount), 0)`,
        paidAmount: sql<string>`coalesce(sum(case when status = 'paid' then amount else 0 end), 0)`,
      })
      .from(invoices)
      .where(and(
        eq(invoices.userId, uid),
        sql`coalesce(issued_at, created_at) >= ${sixMonthsAgo.toISOString()}`
      ))
      .groupBy(sql`to_char(coalesce(issued_at, created_at), 'YYYY-MM')`)
      .orderBy(sql`to_char(coalesce(issued_at, created_at), 'YYYY-MM')`);

    // Riempi con tutti i 6 mesi (anche quelli senza dati)
    const monthlyRevenue: { month: string; revenue: number; paid: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const found = monthlyData.find((m) => m.month === key);
      monthlyRevenue.push({
        month: MONTHS_IT[d.getMonth()],
        revenue: found ? parseFloat(found.totalAmount) : 0,
        paid: found ? parseFloat(found.paidAmount) : 0,
      });
    }

    // 🥧 GRAFICO 2: Progetti per stato
    const statusData = await db
      .select({
        status: projects.status,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .where(eq(projects.userId, uid))
      .groupBy(projects.status);

    const projectsByStatus = statusData.map((s) => ({
      name: STATUS_LABELS[s.status] || s.status,
      value: s.count,
      color: STATUS_COLORS[s.status] || "#94a3b8",
    }));

    // 📊 GRAFICO 3: Ore per progetto (top 5)
    const hoursByProjectData = await db
      .select({
        projectName: projects.name,
        hours: sql<string>`coalesce(sum(time_entries.hours), 0)`,
      })
      .from(timeEntries)
      .leftJoin(projects, eq(timeEntries.projectId, projects.id))
      .where(eq(timeEntries.userId, uid))
      .groupBy(projects.name)
      .orderBy(desc(sql`sum(time_entries.hours)`))
      .limit(5);

    const hoursByProject = hoursByProjectData
      .filter((p) => p.projectName)
      .map((p) => ({
        name: p.projectName || "Senza progetto",
        hours: parseFloat(p.hours),
      }));

    // 🏆 GRAFICO 4: Top 5 clienti per fatturato
    const topClientsData = await db
      .select({
        clientName: clients.name,
        amount: sql<string>`coalesce(sum(invoices.amount), 0)`,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, uid))
      .groupBy(clients.name)
      .orderBy(desc(sql`sum(invoices.amount)`))
      .limit(5);

    const topClients = topClientsData
      .filter((c) => c.clientName)
      .map((c) => ({
        name: c.clientName || "Sconosciuto",
        amount: parseFloat(c.amount),
      }));

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
      // Nuovi dati grafici
      monthlyRevenue,
      projectsByStatus,
      hoursByProject,
      topClients,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}
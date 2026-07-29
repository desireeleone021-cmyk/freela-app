import { db } from "@/db";
import { clients, projects, invoices, timeEntries, expenses } from "@/db/schema";
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

const CATEGORY_COLORS: Record<string, string> = {
  "Software & Abbonamenti": "#3b82f6",
  "Marketing & Pubblicità": "#ec4899",
  "Attrezzatura": "#8b5cf6",
  "Fornitori": "#f97316",
  "Consulenze": "#6366f1",
  "Trasporti": "#06b6d4",
  "Utenze": "#eab308",
  "Tasse & Contributi": "#ef4444",
  "Formazione": "#10b981",
  "Altro": "#94a3b8",
};

const MONTHS_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export async function GET() {
  try {
    const session = await requireAuth();
    const uid = session.userId;

    // Statistiche base
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

    // NUOVE STATISTICHE SPESE
    const [expenseStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        totalAmount: sql<string>`coalesce(sum(amount), 0)`,
        paidAmount: sql<string>`coalesce(sum(case when paid then amount else 0 end), 0)`,
        pendingAmount: sql<string>`coalesce(sum(case when not paid then amount else 0 end), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.userId, uid));

    // Stats mese corrente
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthInvoices] = await db
      .select({
        totalAmount: sql<string>`coalesce(sum(amount), 0)`,
        paidAmount: sql<string>`coalesce(sum(case when status = 'paid' then amount else 0 end), 0)`,
      })
      .from(invoices)
      .where(and(
        eq(invoices.userId, uid),
        sql`coalesce(issued_at, created_at) >= ${firstDayMonth.toISOString()}`
      ));

    const [monthExpenses] = await db
      .select({
        totalAmount: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, uid),
        sql`date >= ${firstDayMonth.toISOString()}`
      ));

    // 📈 Grafico Entrate vs Uscite (ultimi 6 mesi)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const monthlyInvoices = await db
      .select({
        month: sql<string>`to_char(coalesce(issued_at, created_at), 'YYYY-MM')`,
        amount: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(invoices)
      .where(and(
        eq(invoices.userId, uid),
        sql`coalesce(issued_at, created_at) >= ${sixMonthsAgo.toISOString()}`
      ))
      .groupBy(sql`to_char(coalesce(issued_at, created_at), 'YYYY-MM')`);

    const monthlyExpenses = await db
      .select({
        month: sql<string>`to_char(date, 'YYYY-MM')`,
        amount: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, uid),
        sql`date >= ${sixMonthsAgo.toISOString()}`
      ))
      .groupBy(sql`to_char(date, 'YYYY-MM')`);

    const monthlyComparison: { month: string; entrate: number; uscite: number; profitto: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inv = monthlyInvoices.find((m) => m.month === key);
      const exp = monthlyExpenses.find((m) => m.month === key);
      const entrate = inv ? parseFloat(inv.amount) : 0;
      const uscite = exp ? parseFloat(exp.amount) : 0;
      monthlyComparison.push({
        month: MONTHS_IT[d.getMonth()],
        entrate,
        uscite,
        profitto: entrate - uscite,
      });
    }

    // 🥧 Progetti per stato
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

    // 🥧 Spese per categoria
    const expensesByCategoryData = await db
      .select({
        category: expenses.category,
        amount: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.userId, uid))
      .groupBy(expenses.category);

    const expensesByCategory = expensesByCategoryData.map((c) => ({
      name: c.category,
      value: parseFloat(c.amount),
      color: CATEGORY_COLORS[c.category] || "#94a3b8",
    }));

    // 📊 Ore per progetto (top 5)
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

    // 🏆 Top clienti
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

    // Calcolo profitto totale e mensile
    const totalRevenue = parseFloat(invoiceStats.totalAmount);
    const totalExpenses = parseFloat(expenseStats.totalAmount);
    const totalProfit = totalRevenue - totalExpenses;

    const monthRevenue = parseFloat(monthInvoices.totalAmount);
    const monthExpenseAmount = parseFloat(monthExpenses.totalAmount);
    const monthProfit = monthRevenue - monthExpenseAmount;

    return Response.json({
      clients: clientCount.count,
      projects: projectCount.count,
      activeProjects: activeProjectCount.count,
      invoices: {
        total: invoiceStats.total,
        totalAmount: totalRevenue,
        paidAmount: parseFloat(invoiceStats.paidAmount),
        pendingAmount: parseFloat(invoiceStats.pendingAmount),
      },
      expenses: {
        total: expenseStats.total,
        totalAmount: totalExpenses,
        paidAmount: parseFloat(expenseStats.paidAmount),
        pendingAmount: parseFloat(expenseStats.pendingAmount),
      },
      hours: {
        total: parseFloat(hoursStats.totalHours),
        billable: parseFloat(hoursStats.billableHours),
      },
      profit: {
        total: totalProfit,
        month: monthProfit,
        monthRevenue,
        monthExpenses: monthExpenseAmount,
      },
      monthlyComparison,
      projectsByStatus,
      expensesByCategory,
      hoursByProject,
      topClients,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
}
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const session = await getSession();
    if (session) {
      redirect("/dashboard");
    }
  } catch (error) {
    // sessione non valida, vai al login
  }
  redirect("/login");
}
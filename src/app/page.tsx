import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let session = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }
  
  if (session) {
    redirect("/dashboard");
  }
  redirect("/login");
}

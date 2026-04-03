import { redirect } from "next/navigation";
import { getAuthPayload } from "@/lib/auth";

export default async function HomePage() {
  const payload = await getAuthPayload();

  if (payload?.role === "EMPLOYEE") redirect("/admin");
  if (payload?.role === "CUSTOMER") redirect("/dashboard");

  redirect("/login");
}

import { redirect } from "next/navigation";
import { getAuthPayload } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { Navbar } from "@/components/Navbar";

async function getEmployeeProfile() {
  const payload = await getAuthPayload();
  if (!payload || payload.role !== "EMPLOYEE") return null;

  await connectDB();
  const user = await User.findById(payload.userId).select("name").lean();
  return user ? { name: user.name } : null;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getEmployeeProfile();
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="EMPLOYEE" userName={profile.name} />
      <div className="max-w-6xl mx-auto p-6">{children}</div>
    </div>
  );
}

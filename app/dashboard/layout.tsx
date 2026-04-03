import { redirect } from "next/navigation";
import { getMyProfile } from "@/app/actions/customer";
import { Navbar } from "@/components/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="CUSTOMER" userName={profile.name} />
      <div className="max-w-6xl mx-auto p-6">{children}</div>
    </div>
  );
}

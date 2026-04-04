import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 overflow-hidden w-full max-w-7xl mx-auto">
      {/* The Sidebar will sit on the left on desktop */}
      <Sidebar />
      
      {/* The main content area will take up the rest of the space */}
      <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-slate-50 p-6">
        {children}
      </main>
    </div>
  );
}
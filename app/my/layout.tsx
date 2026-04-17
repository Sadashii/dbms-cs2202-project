import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 1. Added this NEW outer wrapper that stretches across the entire screen
    // and forces the background color (including the gutters) to be dark.
    <div className="flex flex-1 w-full bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* 2. Your original max-w-7xl container that centers the content */}
      <div className="flex flex-1 overflow-hidden w-full max-w-7xl mx-auto">
        
        {/* The Sidebar will sit on the left on desktop */}
        <Sidebar />
        
        {/* The main content area will take up the rest of the space */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
          {children}
        </main>
      </div>
      
    </div>
  );
}
import { Sidebar } from "@/components/Sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
            <div className="flex flex-1 overflow-hidden w-full max-w-7xl mx-auto">
                <Sidebar />
                <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

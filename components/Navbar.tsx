import { signOut } from "@/app/actions/auth";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
}

interface NavbarProps {
  role: "CUSTOMER" | "EMPLOYEE";
  userName: string;
}

const customerLinks: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/transfer", label: "Transfer" },
];

const employeeLinks: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/ledger", label: "Ledger" },
];

export function Navbar({ role, userName }: NavbarProps) {
  const links = role === "CUSTOMER" ? customerLinks : employeeLinks;

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-8">
        <span className="font-bold text-lg tracking-wide">🏦 BankingApp</span>
        <ul className="hidden md:flex gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-blue-100 hover:text-white transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-blue-200 text-sm hidden sm:block">
          {role === "EMPLOYEE" ? "👤 Employee" : "👤 Customer"} – {userName}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm bg-blue-800 hover:bg-blue-900 px-3 py-1 rounded-md transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </nav>
  );
}

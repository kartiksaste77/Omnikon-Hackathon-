"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles, Calendar, MessageSquare, User } from "lucide-react";

const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/matches", label: "Explore", icon: Sparkles },
  { href: "/sessions", label: "Sessions", icon: Calendar },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-bottom-nav lg:hidden">
      {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname?.startsWith(href + "/");
        return (
          <Link key={href} href={href} className={isActive ? "active" : ""}>
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

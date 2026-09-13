"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Landmark, FileText, Users, MessageSquare, FolderOpen, UserCheck, User } from "lucide-react";
import { useUserRole } from "@/lib/context/RoleContext";
import { getStoredConsultations } from "@/lib/data/consultations";

export function BottomNav() {
  const pathname = usePathname();
  const { role, activeLawyer } = useUserRole();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      const consultations = getStoredConsultations();
      let count = 0;
      consultations.forEach((c) => {
        c.messages?.forEach((m) => {
          if (m.senderRole !== role && m.status !== "read") {
            count++;
          }
        });
      });
      setUnreadCount(count);
    } catch (e) {}
  }, [role, pathname]);

  // Completely hide bottom navigation on the login screen
  if (pathname === "/login") {
    return null;
  }

  const isClient = role === "client";

  const clientNavItems = [
    {
      label: "Home",
      href: "/",
      icon: Landmark,
      match: pathname === "/",
    },
    {
      label: "Cases",
      href: "/cases",
      icon: FolderOpen,
      match: pathname.startsWith("/cases"),
    },
    {
      label: "Intake",
      href: "/intake",
      icon: FileText,
      match: pathname === "/intake",
    },
    {
      label: "Messages",
      href: "/messages",
      icon: MessageSquare,
      match: pathname.startsWith("/messages"),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      label: "Account",
      href: "/profile",
      icon: User,
      match: pathname === "/profile",
    },
  ];

  const lawyerNavItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: Landmark,
      match: pathname === "/",
    },
    {
      label: "Cases",
      href: "/cases",
      icon: FolderOpen,
      match: pathname.startsWith("/cases"),
    },
    {
      label: "Messages",
      href: "/messages",
      icon: MessageSquare,
      match: pathname.startsWith("/messages"),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      label: "Profile",
      href: activeLawyer ? `/lawyers/${activeLawyer.id}` : "/profile",
      icon: UserCheck,
      match: activeLawyer ? pathname === `/lawyers/${activeLawyer.id}` : pathname === "/profile",
    },
    {
      label: "Account",
      href: "/profile",
      icon: User,
      match: pathname === "/profile",
    },
  ];

  const activeItems = isClient ? clientNavItems : lawyerNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-md border-t border-hairline shadow-dossier">
      <div className="h-16 px-2 pb-safe flex justify-around items-center">
        {activeItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.match;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 py-1.5 relative ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "text-brass" : "text-on-surface-variant"}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-brass text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight ${
                  isActive ? "text-primary font-semibold" : "text-on-surface-variant font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Settings,
  LogOut,
  Clock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/wallet-store";
import { Logo } from "@/components/logo";

export function Sidebar() {
  const pathname = usePathname();
  const lockWallet = useWalletStore((state) => state.lockWallet);

  const routes = [
    {
      label: "Home",
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-slate-600 group-hover:text-yellow-600",
    },
    {
      label: "Privacy",
      icon: ShieldCheck,
      href: "/dashboard/privacy",
      color: "text-slate-600 group-hover:text-yellow-600",
    },
    {
      label: "History",
      icon: Clock,
      href: "/dashboard/history",
      color: "text-slate-600 group-hover:text-yellow-600",
    },
    {
      label: "Contacts",
      icon: Users,
      href: "/dashboard/contacts",
      color: "text-slate-600 group-hover:text-purple-500",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      color: "text-slate-600 group-hover:text-yellow-600",
    },
  ];

  return (
    <>
      {/* Desktop Sidebar - Obsidian Gold */}
      <div className="hidden md:flex flex-col h-full bg-[#050505]/50 backdrop-blur-xl border-r border-white/5 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none" />

        <div className="px-6 py-10 flex-1 z-10">
          <Link href="/dashboard" className="flex items-center mb-10 group">
            <div className="mr-4 transition-transform group-hover:scale-110 duration-300">
              <Logo width={48} height={48} />
            </div>
            <h1 className="text-2xl font-bold font-space bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
              OctraWallet
            </h1>
          </Link>

          <div className="space-y-2">
            {routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "relative group flex items-center p-3 w-full font-medium cursor-pointer rounded-xl transition-all duration-300",
                    isActive
                      ? "text-yellow-400 bg-white/5"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {/* Glowing active line */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-yellow-400 rounded-r-full shadow-[0_0_10px_#FACC15]" />
                  )}

                  <route.icon
                    className={cn(
                      "h-5 w-5 mr-3 transition-colors",
                      isActive
                        ? "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]"
                        : "group-hover:text-yellow-200/70"
                    )}
                  />
                  <span className="font-space tracking-wide">
                    {route.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="px-6 py-6 border-t border-white/5 z-10">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={lockWallet}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Lock Wallet
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Glass */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050505]/80 backdrop-blur-2xl border-t border-white/10 z-50 px-4 py-2 flex justify-between items-center safe-area-bottom">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative",
              pathname === route.href ? "text-yellow-400" : "text-slate-500"
            )}
          >
            {pathname === route.href && (
              <div className="absolute -top-2 w-8 h-1 bg-yellow-400 rounded-full shadow-[0_0_10px_#FACC15]" />
            )}
            <route.icon
              className={cn(
                "h-6 w-6",
                pathname === route.href
                  ? "drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                  : ""
              )}
            />
            <span className="text-[10px] font-medium mt-1 font-space">
              {route.label}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

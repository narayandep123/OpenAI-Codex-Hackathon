"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SurgiFindLogo from "@/components/layout/surgifind-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/chat", label: "Chat" },
  { href: "/insurance", label: "Insurance" },
  { href: "/bookings", label: "My Bookings" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 6);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  const redirectTarget = pathname === "/sign-in" || pathname === "/sign-up" ? "/bookings" : pathname;
  const userInitial = user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/90 backdrop-blur transition-shadow duration-200",
        isScrolled
          ? "border-b border-slate-200/80 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.55)]"
          : "border-b border-transparent shadow-none",
      )}
    >
      <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-wide text-slate-900">
          <SurgiFindLogo className="h-8 w-8" />
          <span>SurgiFind</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#05aba5]/10 text-xs font-bold text-[#05aba5]">
                    {userInitial}
                  </span>
                  <span className="max-w-40 truncate">{user.email}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-2">
                <div className="rounded-xl px-3 py-2 text-sm text-slate-600">
                  Signed in as
                  <p className="mt-1 truncate font-semibold text-slate-900">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  {isSigningOut ? "Signing out..." : "Sign Out"}
                </button>
              </PopoverContent>
            </Popover>
          ) : (
            <Link
              href={`/sign-in?redirect=${encodeURIComponent(redirectTarget || "/bookings")}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), isLoading && "opacity-70")}
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

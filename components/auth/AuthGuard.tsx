"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserRole } from "@/lib/context/RoleContext";
import { Scale } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoadingAuth } = useUserRole();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isAuthenticated && !isLoginPage) {
        router.replace("/login");
      } else if (isAuthenticated && isLoginPage) {
        router.replace("/");
      }
    }
  }, [isAuthenticated, isLoadingAuth, isLoginPage, router]);

  if (isLoadingAuth && !isLoginPage) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-brass shadow-lg mb-4 animate-pulse">
          <Scale className="w-7 h-7 text-brass" />
        </div>
        <h2 className="font-headline text-xl font-bold text-primary tracking-tight">ADVOCATO</h2>
        <p className="text-xs text-on-surface-variant mt-1 font-medium">
          Verifying privileged legal credentials...
        </p>
        <div className="w-36 h-1 bg-surface-container-high rounded-full overflow-hidden mt-4">
          <div className="w-1/2 h-full bg-brass rounded-full animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
    );
  }

  // If unauthenticated and on a protected page, block rendering while redirecting
  if (!isAuthenticated && !isLoginPage) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-brass mb-3">
          <Scale className="w-6 h-6 text-brass" />
        </div>
        <p className="text-xs text-on-surface-variant font-medium">Redirecting to secure login...</p>
      </div>
    );
  }

  return <>{children}</>;
}

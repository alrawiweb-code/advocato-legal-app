import Link from "next/link";
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function VerifySuccessPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const errorMessage = resolvedSearchParams.error || authError?.message || null;

  if (errorMessage || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-surface min-h-[calc(100dvh-4rem)]">
        <div className="w-full max-w-[480px]">
          <div className="bg-surface-container-lowest p-8 sm:p-10 rounded-2xl border border-hairline shadow-sm space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mx-auto flex items-center justify-center text-red-600 mb-2 shadow-xs">
              <AlertCircle className="w-12 h-12" />
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-800">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span>Verification Failed</span>
              </div>
              
              <h1 className="font-headline text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                Link Invalid or Expired
              </h1>
              
              <p className="text-sm text-on-surface-variant leading-relaxed px-4">
                We could not verify your email address. The link may have expired or has already been used. Please try logging in again to request a new link.
              </p>
              
              {errorMessage && (
                <p className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded-md mt-4 text-left break-all">
                  Error: {errorMessage}
                </p>
              )}
            </div>

            <div className="pt-4">
              <Link
                href="/login"
                className="w-full bg-brass hover:bg-brass-hover text-white py-3.5 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // At this point, the user is authenticated securely on the server!
  const isLawyer = user.user_metadata?.role === "lawyer";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-surface min-h-[calc(100dvh-4rem)]">
      <div className="w-full max-w-[480px]">
        <div className="bg-surface-container-lowest p-8 sm:p-10 rounded-2xl border border-hairline shadow-sm space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-600 mb-2 shadow-xs">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Authentication Confirmed</span>
            </div>
            
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Email Verified Successfully
            </h1>
            
            <p className="text-sm text-on-surface-variant leading-relaxed px-4">
              Your email address has been confirmed and your account is now fully active. 
              {isLawyer 
                ? " You can now submit your Bar credentials for professional verification." 
                : " You can now begin searching for legal representation."}
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/"
              className="w-full bg-brass hover:bg-brass-hover text-white py-3.5 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 block text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

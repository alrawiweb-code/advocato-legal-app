"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Bell,
  Lock,
  Smartphone,
  Scale,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  LogOut,
  Briefcase,
  User,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { useUserRole } from "@/lib/context/RoleContext";
import { formatPersonaName } from "@/lib/utils/formatters";
import { EditProfileModal } from "@/components/lawyer/EditProfileModal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const { role, currentUser, isSupabaseConnected, activeLawyer, setMyLawyerProfile, logout } = useUserRole();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordChangeError("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordChangeError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError("The new passwords do not match. Please verify both fields.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordChangeError("The new password must be different from your current password.");
      return;
    }

    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);
    setIsChangingPassword(true);

    try {
      const supabase = createClient();

      // Step 1: Verify current credentials to satisfy re-authentication security requirements
      if (!currentUser.email) {
        setPasswordChangeError("Session user email not detected. Please refresh the page.");
        setIsChangingPassword(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });

      if (verifyError) {
        setPasswordChangeError("Current password is incorrect. Please verify your current credentials.");
        setIsChangingPassword(false);
        return;
      }

      // Step 2: Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordChangeError(updateError.message || "Failed to update password. Please try again.");
        setIsChangingPassword(false);
        return;
      }

      setPasswordChangeSuccess("Password updated successfully. Your account is secured with your new password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordChangeError(err.message || "An unexpected error occurred while updating your password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = currentUser.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex-1 flex flex-col bg-background min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 pb-16">
        <div className="pb-6 border-b border-hairline mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface-container-low border border-hairline text-[11px] font-semibold text-primary mb-2">
            <Scale className="w-3.5 h-3.5 text-brass" />
            <span>Account &amp; Preferences</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">Account &amp; Security</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Manage your authenticated profile, privileged privacy settings, and active session.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Identity & Session */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            {/* Authenticated Identity Card */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-hairline shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0 shadow-xs overflow-hidden">
                  {currentUser.avatar && !currentUser.avatar.startsWith("data:image/svg+xml") ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-headline text-base sm:text-lg font-semibold text-primary truncate">{formatPersonaName(currentUser.name, role)}</h2>
                  <p className="text-xs text-on-surface-variant truncate">{currentUser.email}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-brass font-medium mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-brass shrink-0" />
                    <span>
                      {role === "admin"
                        ? "Regulatory Administrator"
                        : role === "client"
                        ? "Verified Client Account"
                        : `Verified Attorney (${activeLawyer?.jurisdiction || "Active License"})`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
            </div>

            {/* Authenticated Session Management */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-hairline shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {role === "lawyer" ? (
                    <Briefcase className="w-4 h-4 text-brass" />
                  ) : (
                    <User className="w-4 h-4 text-brass" />
                  )}
                  <h3 className="text-xs uppercase font-bold tracking-wider text-primary">
                    Active Session: <span className="text-brass">{role === "client" ? "Client Account" : "Attorney Practice Account"}</span>
                  </h3>
                </div>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-xl border border-hairline space-y-2 text-xs">
                <div className="flex justify-between pb-1 border-b border-hairline text-on-surface-variant">
                  <span>Signed In As</span>
                  <span className="font-semibold text-primary">{currentUser.name}</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-hairline text-on-surface-variant">
                  <span>Account Role</span>
                  <span className="font-semibold text-primary capitalize">{role}</span>
                </div>
                {role === "lawyer" && activeLawyer && (
                  <div className="flex justify-between pb-1 border-b border-hairline text-on-surface-variant">
                    <span>Bar Admission</span>
                    <span className="font-semibold text-primary">{activeLawyer.jurisdiction}</span>
                  </div>
                )}
                <div className="flex justify-between text-on-surface-variant">
                  <span>Session Security</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 256-Bit Encrypted
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Advocato</span>
              </button>
            </div>

            {/* Privileged Security Banner */}
            <div className="bg-surface-container-low p-4 rounded-xl border border-hairline/80 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-brass shrink-0 mt-0.5" />
              <div className="text-xs text-on-surface-variant leading-relaxed">
                <span className="font-semibold text-primary block mb-0.5">Attorney-Client Privilege Protected</span>
                All uploaded documents, case briefs, and direct messages sent on Advocato are encrypted and restricted to assigned counsel.
              </div>
            </div>
          </div>

          {/* Right Column: Settings & Navigation */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            {/* Settings */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-hairline shadow-xs space-y-4">
              <h3 className="text-xs uppercase font-semibold tracking-wider text-on-surface-variant">
                Notifications &amp; Cloud Infrastructure
              </h3>

              <div className="flex items-center justify-between py-2.5 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-primary">Message &amp; Case Alerts</div>
                    <div className="text-[11px] text-on-surface-variant">Get notified when counsel or client replies to your matter</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                  className="w-4 h-4 text-brass rounded border-hairline accent-brass cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-primary">Cloud Storage &amp; Database</div>
                    <div className="text-[11px] text-on-surface-variant">
                      {isSupabaseConnected ? "Connected securely to encrypted database & storage" : "Running in offline mode"}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isSupabaseConnected ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-amber-700 bg-amber-50 border border-amber-200"}`}>
                  {isSupabaseConnected ? "Connected" : "Local Mode"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-slate shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-primary">Mobile Web &amp; Desktop PWA</div>
                    <div className="text-[11px] text-on-surface-variant">Encrypted progressive web app enabled</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Ready
                </span>
              </div>
            </div>

            {/* Security & Password Card */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-hairline shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-brass" />
                  <h3 className="text-xs uppercase font-semibold tracking-wider text-primary">
                    Security &amp; Password
                  </h3>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Protected
                </span>
              </div>

              <p className="text-[11px] text-on-surface-variant">
                Change your account password. For security, you must provide your current password to authorize changes.
              </p>

              {passwordChangeError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div className="flex-1 leading-relaxed">{passwordChangeError}</div>
                </div>
              )}

              {passwordChangeSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <div className="flex-1 leading-relaxed">{passwordChangeSuccess}</div>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-primary block">
                    Current Password
                  </label>
                  <PasswordInput
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-primary block">
                    New Password
                  </label>
                  <PasswordInput
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Min. 8 characters"
                    required
                    showStrength={true}
                    minLength={8}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-primary block">
                    Confirm New Password
                  </label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Re-enter new password"
                    required
                    minLength={8}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-red-600 font-medium">
                      Passwords do not match.
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={
                      isChangingPassword ||
                      !currentPassword ||
                      newPassword.length < 8 ||
                      newPassword !== confirmPassword
                    }
                    className="w-full bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 min-h-[42px]"
                  >
                    {isChangingPassword ? (
                      <span>Updating Password...</span>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Links Scoped to Current Role */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-hairline shadow-xs space-y-3">
              <h3 className="text-xs uppercase font-semibold tracking-wider text-on-surface-variant">
                {role === "lawyer" ? "Practice Navigation" : "Client Portal Navigation"}
              </h3>
              {role === "lawyer" ? (
                <>
                  <Link
                    href="/"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <span>Attorney Practice Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/cases"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <span>Client Consultations &amp; Inquiries</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/messages"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <span>Client Messages &amp; Video Consultations</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  {activeLawyer && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowEditModal(true)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors text-left"
                      >
                        <span>Edit Professional Profile</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/lawyers/${activeLawyer.id}`}
                        className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 transition-colors"
                      >
                        <span>{activeLawyer.isVerified ? "Public Lawyer Profile" : "Preview Lawyer Profile"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/cases"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <span>My Active Cases</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/lawyers"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-brass" />
                      <span>Browse All Verified Lawyers</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/intake"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <span>Tell Us What Happened (New Intake)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/messages"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 transition-colors"
                  >
                    <span>Attorney Consultation Messages</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && activeLawyer && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          lawyer={activeLawyer}
          onProfileUpdated={(updated) => {
            setMyLawyerProfile(updated);
          }}
        />
      )}
    </div>
  );
}

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Lawyer, VerificationStatus } from "@/types";
import { getLawyerById } from "@/lib/data/lawyers";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "client" | "lawyer" | "admin" | "public";

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  lawyerId?: string;
  barNumber?: string;
  jurisdiction?: string;
  isVerified?: boolean;
  verificationStatus?: VerificationStatus;
}

export function getInitialsAvatar(name: string): string {
  const initials = (name || "User")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "US";
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231a2634"/><text x="50" y="55" font-family="system-ui,-apple-system,sans-serif" font-size="38" font-weight="700" fill="%23c5a059" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
}

// Deprecated stubs for backward compatibility
export const DEMO_CLIENT: UserPersona = {
  id: "client-alex-mercer",
  name: "Alex Mercer",
  email: "alex.mercer@company.com",
  role: "client",
  avatar: getInitialsAvatar("Alex Mercer"),
};

export const DEMO_LAWYER_SARAH: UserPersona = {
  id: "lawyer-1",
  name: "Sarah Jenkins, Adv.",
  email: "sarah.jenkins@jenkinslaw.com",
  role: "lawyer",
  avatar: getInitialsAvatar("Sarah Jenkins"),
  lawyerId: "1",
  barNumber: "D/4921/2012",
  jurisdiction: "Delhi (DL)",
};

export const DEMO_LAWYER_MARCUS: UserPersona = {
  id: "lawyer-2",
  name: "Marcus Vance, Adv.",
  email: "marcus.vance@vancelegal.com",
  role: "lawyer",
  avatar: getInitialsAvatar("Marcus Vance"),
  lawyerId: "2",
  barNumber: "MAH/8291/2008",
  jurisdiction: "Maharashtra (MH)",
};

export const DEMO_ACCOUNTS = [DEMO_CLIENT, DEMO_LAWYER_SARAH, DEMO_LAWYER_MARCUS];

interface LoginCredentials {
  email?: string;
  password?: string;
  role?: UserRole;
  lawyerId?: string;
  personaId?: string;
}

interface RoleContextType {
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  role: UserRole;
  currentUser: UserPersona;
  currentUserId: string;
  activeLawyerId: string | null;
  activeLawyer: Lawyer | null;
  myLawyerProfile: Lawyer | null;
  setMyLawyerProfile: (lawyer: Lawyer) => void;
  isSupabaseConnected: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  registerClient: (data: { name: string; email: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  registerLawyer: (data: {
    name: string;
    email: string;
    barNumber: string;
    stateBar: string;
    primaryPractice: string;
    hourlyRate: number | string;
    bio: string;
    password?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  refreshUser: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [sessionUser, setSessionUser] = useState<UserPersona | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeLawyerId, setActiveLawyerIdState] = useState<string | null>(null);
  const [myLawyerProfile, setMyLawyerProfileState] = useState<Lawyer | null>(null);

  const supabase = createClient();
  const isSupabaseConnected = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const hydrateUserProfile = useCallback(async (userId: string, email: string, userMeta?: any): Promise<UserRole | null> => {
    try {
      // 1. Fetch public profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const userRole: UserRole =
        email.toLowerCase() === "alrawiweb@gmail.com"
          ? "admin"
          : (profile?.role as UserRole) ||
            (userMeta?.role as UserRole) ||
            "client";

      const fullName =
        profile?.full_name ||
        userMeta?.full_name ||
        email.split("@")[0] ||
        "User";

      let lawyerDetails: any = null;
      let isLawyerVerified = false;
      let lawyerVerificationStatus: VerificationStatus = "NOT_VERIFIED";

      if (userRole === "lawyer") {
        const { data: lp } = await supabase
          .from("lawyer_profiles")
          .select("*")
          .eq("id", userId)
          .single();
        lawyerDetails = lp;

        if (lp) {
          isLawyerVerified = Boolean(lp.is_verified);
          lawyerVerificationStatus = (lp.verification_status as VerificationStatus) || (isLawyerVerified ? "VERIFIED" : "NOT_VERIFIED");

          const lawyerModel: Lawyer = {
            id: userId,
            name: fullName,
            title: lp.title || "Advocate",
            headline: lp.headline || `${lp.practice_areas?.[0] || "General"} Specialist`,
            yearsExperience: lp.years_experience || 5,
            hourlyRate: lp.hourly_rate || 2500,
            isVerified: isLawyerVerified,
            verificationStatus: lawyerVerificationStatus,
            availability: (lp.availability as any) || "Available today",
            jurisdiction: lp.jurisdiction || lp.state_bar || "Delhi (DL)",
            state: lp.state || lp.state_bar || lp.jurisdiction || "Delhi (DL)",
            city: lp.city || undefined,
            languages: lp.languages || ["English", "Hindi"],
            practiceAreas: lp.practice_areas || ["General Legal Counsel"],
            tags: lp.tags || [],
            avatar: profile?.avatar_url || getInitialsAvatar(fullName),
            bio: lp.bio || "",
            notableCases: lp.notable_cases || [],
            rating: Number(lp.rating) || 5.0,
            reviewCount: lp.review_count || 0,
            // Suspension fields
            ...(lp.suspension_reason ? { suspensionReason: lp.suspension_reason } : {}),
            ...(lp.suspended_at ? { suspendedAt: lp.suspended_at } : {}),
          };
          setMyLawyerProfileState(lawyerModel);
          setActiveLawyerIdState(userId);
        }
      }

      const persona: UserPersona = {
        id: userId,
        name: fullName,
        email: email,
        role: userRole,
        avatar: profile?.avatar_url || getInitialsAvatar(fullName),
        lawyerId: userRole === "lawyer" ? userId : undefined,
        barNumber: lawyerDetails?.bar_number || userMeta?.bar_number,
        jurisdiction: lawyerDetails?.jurisdiction || userMeta?.jurisdiction,
        isVerified: userRole === "lawyer" ? isLawyerVerified : true,
        verificationStatus: userRole === "lawyer" ? lawyerVerificationStatus : "VERIFIED",
      };

      setSessionUser(persona);
      if (persona.lawyerId) {
        setActiveLawyerIdState(persona.lawyerId);
      }
      return userRole;
    } catch (err) {
      console.error("Error hydrating profile from Supabase:", err);
      return null;
    }
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await hydrateUserProfile(user.id, user.email || "", user.user_metadata);
      } else {
        setSessionUser(null);
        setActiveLawyerIdState(null);
        setMyLawyerProfileState(null);
      }
    } catch (e) {
      console.error("Auth hydration error:", e);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [supabase, hydrateUserProfile]);

  useEffect(() => {
    refreshUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await hydrateUserProfile(
          session.user.id,
          session.user.email || "",
          session.user.user_metadata
        );
      } else {
        setSessionUser(null);
        setActiveLawyerIdState(null);
        setMyLawyerProfileState(null);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, hydrateUserProfile, refreshUser]);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!credentials.email || !credentials.password) {
        return { success: false, error: "Please provide both email and password." };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const actualRole = await hydrateUserProfile(data.user.id, data.user.email || "", data.user.user_metadata);
        
        if (credentials.role && actualRole && credentials.role !== actualRole && actualRole !== "admin") {
          await supabase.auth.signOut();
          setSessionUser(null);
          setActiveLawyerIdState(null);
          setMyLawyerProfileState(null);
          
          if (actualRole === "lawyer") {
            return { success: false, error: "This account is registered for Attorney Practice. Please sign in through the Attorney Practice portal." };
          } else {
            return { success: false, error: "This account is registered for the Client Portal. Please sign in through the Client Portal." };
          }
        }

        return { success: true };
      }

      return { success: false, error: "Failed to establish authenticated session." };
    } catch (err: any) {
      return { success: false, error: err.message || "Authentication failed" };
    }
  };

  const registerClient = async (data: { name: string; email: string; password?: string }) => {
    try {
      if (!data.password) {
        return { success: false, error: "A secure password is required to create an account." };
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.name.trim(),
            role: "client",
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (authData?.user) {
        await hydrateUserProfile(authData.user.id, authData.user.email || data.email, {
          full_name: data.name,
          role: "client",
        });
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Registration failed" };
    }
  };

  const registerLawyer = async (data: {
    name: string;
    email: string;
    barNumber: string;
    stateBar: string;
    primaryPractice: string;
    hourlyRate: number | string;
    bio: string;
    password?: string;
  }) => {
    try {
      if (!data.password) {
        return { success: false, error: "A password is required for attorney registration." };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.name.trim(),
            role: "lawyer",
            bar_number: data.barNumber.trim(),
            jurisdiction: data.stateBar,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      const userId = authData.user?.id;
      if (!userId) {
        return { success: false, error: "Attorney account creation failed." };
      }

      // Upsert into lawyer_profiles
      const { error: profileError } = await supabase.from("lawyer_profiles").upsert({
        id: userId,
        title: "Advocate",
        headline: `${data.primaryPractice} Specialist`,
        bar_number: data.barNumber.trim(),
        state_bar: data.stateBar,
        years_experience: 5,
        hourly_rate: Number(data.hourlyRate) || 2500,
        is_verified: false,
        verification_status: "NOT_VERIFIED",
        availability: "Available today",
        jurisdiction: data.stateBar,
        state: data.stateBar,
        practice_areas: [data.primaryPractice],
        bio: data.bio.trim() || `Licensed attorney admitted to the Bar Council of ${data.stateBar}.`,
        rating: 5.0,
        review_count: 0,
      });

      if (profileError) {
        console.warn("Lawyer profile upsert notice:", profileError.message);
      }

      await hydrateUserProfile(userId, data.email, {
        full_name: data.name,
        role: "lawyer",
        bar_number: data.barNumber,
        jurisdiction: data.stateBar,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Lawyer registration failed" };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase sign out warning:", e);
    } finally {
      setSessionUser(null);
      setActiveLawyerIdState(null);
      setMyLawyerProfileState(null);
    }
  };

  const setMyLawyerProfile = (lawyer: Lawyer) => {
    setMyLawyerProfileState(lawyer);
    setActiveLawyerIdState(lawyer.id);
  };

  const setRole = (newRole: UserRole) => {
    if (sessionUser) {
      setSessionUser({ ...sessionUser, role: newRole });
    }
  };

  const toggleRole = () => {
    if (sessionUser) {
      setRole(sessionUser.role === "client" ? "lawyer" : "client");
    }
  };

  const isAuthenticated = sessionUser !== null;
  const role: UserRole = sessionUser?.role || "public";
  const activeLawyer =
    myLawyerProfile ||
    (activeLawyerId ? getLawyerById(activeLawyerId) : null) ||
    (role === "lawyer" ? getLawyerById("1") || null : null);

  const currentUser: UserPersona = sessionUser || {
    id: "guest",
    name: "Guest",
    email: "guest@advocato.legal",
    role: "public",
    avatar: getInitialsAvatar("Guest User"),
  };
  const currentUserId = currentUser.id;

  return (
    <RoleContext.Provider
      value={{
        isAuthenticated,
        isLoadingAuth,
        role,
        currentUser,
        currentUserId,
        activeLawyerId,
        activeLawyer,
        myLawyerProfile,
        setMyLawyerProfile,
        isSupabaseConnected,
        login,
        logout,
        registerClient,
        registerLawyer,
        setRole,
        toggleRole,
        refreshUser,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useUserRole must be used within a RoleProvider");
  }
  return context;
}

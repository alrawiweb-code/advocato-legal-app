"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Lawyer } from "@/types";
import { getAllLawyers, getLawyerById, registerNewLawyer } from "@/lib/data/lawyers";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "client" | "lawyer";

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  lawyerId?: string;
  barNumber?: string;
  jurisdiction?: string;
}

export const DEMO_CLIENT: UserPersona = {
  id: "client-alex-mercer",
  name: "Alex Mercer",
  email: "alex.mercer@company.com",
  role: "client",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
};

export const DEMO_LAWYER_SARAH: UserPersona = {
  id: "lawyer-1",
  name: "Sarah Jenkins, Adv.",
  email: "sarah.jenkins@jenkinslaw.com",
  role: "lawyer",
  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
  lawyerId: "1",
  barNumber: "D/4921/2012",
  jurisdiction: "Delhi (DL)",
};

export const DEMO_LAWYER_MARCUS: UserPersona = {
  id: "lawyer-2",
  name: "Marcus Vance, Adv.",
  email: "marcus.vance@vancelegal.com",
  role: "lawyer",
  avatar: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400",
  lawyerId: "2",
  barNumber: "MAH/8291/2008",
  jurisdiction: "Maharashtra (MH)",
};

export const DEMO_ACCOUNTS = [
  DEMO_CLIENT,
  DEMO_LAWYER_SARAH,
  DEMO_LAWYER_MARCUS,
];

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
  // Deprecated developer helpers kept for safe backward compatibility
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const AUTH_SESSION_KEY = "advocato_auth_session";
const ACTIVE_LAWYER_KEY = "advocato_active_lawyer_id";
const MY_LAWYER_PROFILE_KEY = "advocato_my_lawyer_profile";
const DATA_PURGE_VERSION_KEY = "advocato_data_version";
const CURRENT_DATA_VERSION = "v6_indian_states_pricing";

export function purgeAllDummyData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("advocato_latest_intake");
    localStorage.removeItem("advocato_intake_data");
    localStorage.removeItem("advocato_consultations");
    localStorage.removeItem("advocato_registered_lawyers");
    localStorage.setItem(DATA_PURGE_VERSION_KEY, CURRENT_DATA_VERSION);
  }
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [sessionUser, setSessionUser] = useState<UserPersona | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeLawyerId, setActiveLawyerIdState] = useState<string | null>(null);
  const [myLawyerProfile, setMyLawyerProfileState] = useState<Lawyer | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  useEffect(() => {
    // 0. Automatic purge of stale dummy data / mock cases
    if (typeof window !== "undefined") {
      try {
        const storedVersion = localStorage.getItem(DATA_PURGE_VERSION_KEY);
        if (storedVersion !== CURRENT_DATA_VERSION) {
          purgeAllDummyData();
        }
      } catch (e) {
        console.error("Failed to run storage purge", e);
      }
    }

    const supabase = createClient();
    const hasConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    setIsSupabaseConnected(hasConfig);

    // Hydrate session from localStorage
    if (typeof window !== "undefined") {
      try {
        const savedSession = localStorage.getItem(AUTH_SESSION_KEY);
        if (savedSession) {
          const parsed: UserPersona = JSON.parse(savedSession);
          setSessionUser(parsed);
          if (parsed.lawyerId) {
            setActiveLawyerIdState(parsed.lawyerId);
          }
        }

        const savedLawyerId = localStorage.getItem(ACTIVE_LAWYER_KEY);
        if (savedLawyerId) {
          setActiveLawyerIdState(savedLawyerId);
        }

        const savedProfile = localStorage.getItem(MY_LAWYER_PROFILE_KEY);
        if (savedProfile) {
          setMyLawyerProfileState(JSON.parse(savedProfile));
        }
      } catch (e) {
        console.error("Failed to restore session from storage", e);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    if (hasConfig) {
      // Sync Supabase Auth state if user signs in with Supabase directly
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata;
          const userRole = (userMeta?.role as UserRole) || "client";
          const userObj: UserPersona = {
            id: session.user.id,
            name: userMeta?.full_name || session.user.email?.split("@")[0] || "User",
            email: session.user.email || "",
            role: userRole,
            avatar: userMeta?.avatar_url || (userRole === "client" ? DEMO_CLIENT.avatar : DEMO_LAWYER_SARAH.avatar),
            lawyerId: userMeta?.lawyer_id,
            barNumber: userMeta?.bar_number,
            jurisdiction: userMeta?.jurisdiction,
          };
          setSessionUser(userObj);
          if (userObj.lawyerId) {
            setActiveLawyerIdState(userObj.lawyerId);
          }
          if (typeof window !== "undefined") {
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userObj));
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Direct Demo Persona Login
      if (credentials.personaId) {
        const found = DEMO_ACCOUNTS.find((d) => d.id === credentials.personaId);
        if (found) {
          setSessionUser(found);
          if (found.lawyerId) {
            setActiveLawyerIdState(found.lawyerId);
          }
          if (typeof window !== "undefined") {
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(found));
          }
          return { success: true };
        }
      }

      // 2. Matching by Email in Demo Accounts
      if (credentials.email) {
        const emailLower = credentials.email.toLowerCase().trim();
        const demoMatch = DEMO_ACCOUNTS.find((d) => d.email.toLowerCase() === emailLower);
        if (demoMatch) {
          setSessionUser(demoMatch);
          if (demoMatch.lawyerId) {
            setActiveLawyerIdState(demoMatch.lawyerId);
          }
          if (typeof window !== "undefined") {
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(demoMatch));
          }
          return { success: true };
        }

        // Check registered lawyers roster
        const allLawyers = getAllLawyers();
        const lawyerMatch = allLawyers.find((l) =>
          l.name.toLowerCase().includes(emailLower.split("@")[0].toLowerCase()) ||
          l.id === credentials.lawyerId
        );

        if (credentials.role === "lawyer" && lawyerMatch) {
          const lawyerUser: UserPersona = {
            id: lawyerMatch.id,
            name: lawyerMatch.name,
            email: credentials.email,
            role: "lawyer",
            avatar: lawyerMatch.avatar,
            lawyerId: lawyerMatch.id,
            jurisdiction: lawyerMatch.jurisdiction,
          };
          setSessionUser(lawyerUser);
          setActiveLawyerIdState(lawyerMatch.id);
          if (typeof window !== "undefined") {
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(lawyerUser));
          }
          return { success: true };
        }

        // 3. Supabase Auth Sign In (if credentials supplied and Supabase connected)
        if (isSupabaseConnected && credentials.password) {
          const supabase = createClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (!error && data?.user) {
            const userMeta = data.user.user_metadata;
            const userRole = (userMeta?.role as UserRole) || credentials.role || "client";
            const userObj: UserPersona = {
              id: data.user.id,
              name: userMeta?.full_name || data.user.email?.split("@")[0] || "User",
              email: data.user.email || "",
              role: userRole,
              avatar: userMeta?.avatar_url || (userRole === "client" ? DEMO_CLIENT.avatar : DEMO_LAWYER_SARAH.avatar),
              lawyerId: userMeta?.lawyer_id || credentials.lawyerId,
            };
            setSessionUser(userObj);
            if (typeof window !== "undefined") {
              localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userObj));
            }
            return { success: true };
          }
        }

        // 4. Fallback Generic User Sign-In (Creates session for evaluated custom email)
        const role = credentials.role || (credentials.lawyerId ? "lawyer" : "client");
        const defaultName = credentials.email.split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        
        const fallbackUser: UserPersona = {
          id: `user-${Date.now()}`,
          name: defaultName || "Client User",
          email: credentials.email,
          role: role,
          avatar: role === "client" ? DEMO_CLIENT.avatar : DEMO_LAWYER_SARAH.avatar,
          lawyerId: credentials.lawyerId || (role === "lawyer" ? "1" : undefined),
        };

        setSessionUser(fallbackUser);
        if (fallbackUser.lawyerId) {
          setActiveLawyerIdState(fallbackUser.lawyerId);
        }
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(fallbackUser));
        }
        return { success: true };
      }

      return { success: false, error: "Please provide valid credentials" };
    } catch (err: any) {
      return { success: false, error: err.message || "Authentication failed" };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (isSupabaseConnected) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn("Supabase sign out error:", e);
    } finally {
      setSessionUser(null);
      setActiveLawyerIdState(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_SESSION_KEY);
        localStorage.removeItem(ACTIVE_LAWYER_KEY);
      }
    }
  };

  const registerClient = async (data: { name: string; email: string; password?: string }) => {
    try {
      if (isSupabaseConnected && data.password) {
        const supabase = createClient();
        await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.name,
              role: "client",
            },
          },
        });
      }

      const clientUser: UserPersona = {
        id: `client-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: "client",
        avatar: DEMO_CLIENT.avatar,
      };

      setSessionUser(clientUser);
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(clientUser));
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
      // Register in lawyer directory
      const newLawyer = registerNewLawyer({
        fullName: data.name,
        email: data.email,
        barNumber: data.barNumber,
        stateBar: data.stateBar,
        primaryPractice: data.primaryPractice,
        hourlyRate: data.hourlyRate,
        yearsExperience: 10,
        bio: data.bio,
      });

      if (isSupabaseConnected && data.password) {
        const supabase = createClient();
        await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.name,
              role: "lawyer",
              lawyer_id: newLawyer.id,
              bar_number: data.barNumber,
              jurisdiction: data.stateBar,
            },
          },
        });
      }

      const lawyerUser: UserPersona = {
        id: newLawyer.id,
        name: newLawyer.name,
        email: data.email,
        role: "lawyer",
        avatar: newLawyer.avatar,
        lawyerId: newLawyer.id,
        barNumber: data.barNumber,
        jurisdiction: data.stateBar,
      };

      setSessionUser(lawyerUser);
      setActiveLawyerIdState(newLawyer.id);
      setMyLawyerProfileState(newLawyer);

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(lawyerUser));
        localStorage.setItem(ACTIVE_LAWYER_KEY, newLawyer.id);
        localStorage.setItem(MY_LAWYER_PROFILE_KEY, JSON.stringify(newLawyer));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Lawyer registration failed" };
    }
  };

  const setMyLawyerProfile = (lawyer: Lawyer) => {
    setMyLawyerProfileState(lawyer);
    setActiveLawyerIdState(lawyer.id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(MY_LAWYER_PROFILE_KEY, JSON.stringify(lawyer));
        localStorage.setItem(ACTIVE_LAWYER_KEY, lawyer.id);
      } catch (e) {}
    }
  };

  // Deprecated developer helpers kept for safe backward compatibility
  const setRole = (newRole: UserRole) => {
    if (sessionUser) {
      const updated = { ...sessionUser, role: newRole };
      setSessionUser(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updated));
      }
    }
  };

  const toggleRole = () => {
    if (sessionUser) {
      setRole(sessionUser.role === "client" ? "lawyer" : "client");
    }
  };

  const isAuthenticated = sessionUser !== null;
  const role: UserRole = sessionUser?.role || "client";
  const activeLawyer =
    (activeLawyerId ? getLawyerById(activeLawyerId) : null) ||
    myLawyerProfile ||
    (role === "lawyer" ? getLawyerById("1") || null : null);

  // Fallback currentUser presentation
  const currentUser: UserPersona = sessionUser || {
    id: "guest",
    name: "Guest",
    email: "guest@advocato.legal",
    role: "client",
    avatar: DEMO_CLIENT.avatar,
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

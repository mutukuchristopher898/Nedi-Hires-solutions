"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

export interface AuthUser {
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

const STORAGE_KEY = "nedi-hires-auth-user";
const authEvents = new EventTarget();

function subscribe(callback: () => void) {
  authEvents.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  return () => {
    authEvents.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = useMemo<AuthUser | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }, [raw]);

  function signIn(nextUser: AuthUser) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    authEvents.dispatchEvent(new Event("change"));
  }

  function signOut() {
    window.localStorage.removeItem(STORAGE_KEY);
    authEvents.dispatchEvent(new Event("change"));
  }

  return (
    <AuthContext.Provider value={{ user, ready: true, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

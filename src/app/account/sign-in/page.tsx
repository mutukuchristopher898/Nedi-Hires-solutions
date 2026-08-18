"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <div className="container-shell max-w-md py-16">
      <h1 className="text-2xl font-bold text-midnight">Sign In</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Access your bookings, documents, and profile.
      </p>

      <form
        className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line"
        onSubmit={(e) => {
          e.preventDefault();
          const name = email.split("@")[0]?.replace(/[._]/g, " ") || "Traveler";
          signIn({ name: name.replace(/\b\w/g, (c) => c.toUpperCase()), email });
          router.push("/account");
        }}
      >
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Password</span>
          <input
            required
            type="password"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
        >
          Sign In
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-midnight/60">
        Don&apos;t have an account?{" "}
        <Link href="/account/sign-up" className="font-medium text-gold-dark hover:text-gold">
          Create one
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function SignUpPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="container-shell max-w-md py-16">
      <h1 className="text-2xl font-bold text-midnight">Create an Account</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Book faster, track your rentals, and manage your documents in one place.
      </p>

      <form
        className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line"
        onSubmit={(e) => {
          e.preventDefault();
          signIn({ name, email, phone });
          router.push("/account");
        }}
      >
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Full Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
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
          <span className="text-xs font-medium text-midnight/60">Phone / WhatsApp</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
          Create Account
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-midnight/60">
        Already have an account?{" "}
        <Link href="/account/sign-in" className="font-medium text-gold-dark hover:text-gold">
          Sign in
        </Link>
      </p>
    </div>
  );
}

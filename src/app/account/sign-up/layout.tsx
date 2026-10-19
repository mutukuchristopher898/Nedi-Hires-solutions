import type { Metadata } from "next";
import AuthFrame from "@/components/account/AuthFrame";

export const metadata: Metadata = {
  title: "Create an account",
  // Account pages have nothing for a search engine to show.
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthFrame>{children}</AuthFrame>;
}

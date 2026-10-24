import type { Metadata } from "next";
import AuthFrame from "@/components/account/AuthFrame";

export const metadata: Metadata = {
  title: "Create your password",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthFrame>{children}</AuthFrame>;
}

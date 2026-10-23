import type { Metadata } from "next";
import Link from "next/link";
import FaqAccordion from "@/components/FaqAccordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "How booking, payment, documents, driver hire, corporate leasing, insurance replacement and vehicle partnership work at Nedi Hires Solutions.",
  alternates: { canonical: "/faq" },
  openGraph: { images: [site.ogImage], title: "Frequently asked questions", description: "How booking, payment, documents, driver hire, corporate leasing, insurance replacement and vehicle partnership work at Nedi Hires Solutions.", url: "/faq" },
};

export default function FaqPage() {
  return (
    <div className="container-shell max-w-2xl py-14">
      <h1 className="text-3xl font-bold text-midnight">Frequently asked questions</h1>
      <p className="mt-2 text-sm text-midnight/60">
        Can&apos;t find what you&apos;re looking for?{" "}
        <Link href="/contact" className="font-medium text-gold-dark hover:text-gold">
          Contact our support team
        </Link>
          .
      </p>

      <div className="mt-8">
        <FaqAccordion />
      </div>

      <p className="mt-6 text-xs text-midnight/50">
        See also our <Link href="/terms" className="underline">Terms of Service</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}

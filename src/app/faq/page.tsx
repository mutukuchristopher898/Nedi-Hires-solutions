import Link from "next/link";
import FaqAccordion from "@/components/FaqAccordion";

export default function FaqPage() {
  return (
    <div className="container-shell max-w-2xl py-14">
      <p className="text-xs font-medium uppercase tracking-wide text-gold-dark">Support</p>
      <h1 className="mt-2 text-3xl font-bold text-midnight">Frequently Asked Questions</h1>
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

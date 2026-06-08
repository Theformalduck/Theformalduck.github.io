import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, LEGAL_UPDATED, LEGAL_EMAIL, COMPANY } from "@/components/site/info-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of Sellora.",
};

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Service" updated={LEGAL_UPDATED}>
      <p>
        These Terms of Service (“Terms”) are a binding agreement between you and {COMPANY} (“Sellora”,
        “we”, “us”) governing your use of our website and services (the “Service”). By creating an
        account or using the Service, you agree to these Terms. If you do not agree, do not use the
        Service.
      </p>

      <h2>1. Eligibility & accounts</h2>
      <p>
        You must be at least 13 years old (or the minimum legal age in your jurisdiction) to use the
        Service. You are responsible for your account, for keeping your credentials secure, and for all
        activity under your account. Provide accurate information and keep it up to date.
      </p>

      <h2>2. Your content</h2>
      <p>
        You retain ownership of the content you create or upload (portfolios, products, campaigns,
        posts, and media). By posting content, you grant Sellora a non-exclusive, worldwide,
        royalty-free license to host, store, display, and distribute that content solely to operate and
        promote the Service.
      </p>
      <p>You represent that you have the rights to the content you post and that it does not infringe others’ rights.</p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Post unlawful, infringing, deceptive, or harmful content.</li>
        <li>Sell prohibited, counterfeit, or illegal goods, or run fraudulent campaigns.</li>
        <li>Harass, abuse, or harm other users.</li>
        <li>Attempt to breach security, scrape, overload, or disrupt the Service.</li>
        <li>Use the Service to send spam or distribute malware.</li>
      </ul>
      <p>We may remove content or suspend accounts that violate these Terms.</p>

      <h2>4. Selling, payments & fees</h2>
      <p>
        Creators can sell products and run crowdfunding campaigns. Payments are processed by Stripe, and
        your use of payment features is also subject to Stripe’s terms. Payments from sales are paid out to
        the creator’s connected Stripe account, less Stripe’s fees and any platform fee. You are responsible
        for delivering what you sell, honoring reward commitments, handling refunds you offer, and for any
        taxes on your earnings.
      </p>

      <h2>5. Buyers</h2>
      <p>
        When you purchase from a creator, your contract for that product is with the creator, not
        Sellora. Refund and delivery terms are set by the seller. Sellora facilitates the transaction
        and payment but is not the merchant of record for creator sales.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        The Service itself — including our software, design, and trademarks — is owned by Sellora and
        protected by law. These Terms do not grant you rights to our branding or technology except as
        needed to use the Service.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time. We may suspend or terminate
        your access if you violate these Terms or to protect the Service and its users. Provisions that
        by their nature should survive termination will survive.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Service is provided “as is” and “as available” without warranties of any kind, to the
        fullest extent permitted by law. We do not warrant that the Service will be uninterrupted,
        error-free, or secure.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Sellora will not be liable for indirect, incidental,
        special, consequential, or punitive damages, or for lost profits or data. Our total liability for
        any claim relating to the Service is limited to the greater of the amounts you paid us in the 12
        months before the claim or USD $100.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these Terms from time to time. Material changes will be posted with a new “Last
        updated” date. Continued use after changes means you accept the updated Terms.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms? Email <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> or visit our{" "}
        <Link href="/contact">contact page</Link>.
      </p>

      <p className="text-sm text-gray-400 mt-8">
        This document is a general template and not legal advice. Have it reviewed by qualified counsel
        before relying on it for your business.
      </p>
    </InfoPage>
  );
}

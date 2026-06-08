import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, LEGAL_UPDATED, LEGAL_EMAIL, COMPANY } from "@/components/site/info-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Sellora collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" updated={LEGAL_UPDATED}>
      <p>
        This Privacy Policy explains how {COMPANY} (“Sellora”, “we”, “us”) collects, uses, and shares
        information when you use our website and services (the “Service”). By using the Service, you
        agree to the practices described here.
      </p>

      <h2>1. Information we collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li><strong>Account data:</strong> name, email, username, password (stored hashed), and profile details such as bio and avatar.</li>
        <li><strong>Content:</strong> portfolios, products, campaigns, posts, images, and other material you create or upload.</li>
        <li><strong>Payment data:</strong> when you buy or sell, payments are processed by Stripe. We do not store full card numbers; we receive limited transaction details (amounts, status, and identifiers).</li>
        <li><strong>Communications:</strong> messages you send to support.</li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li><strong>Usage data:</strong> pages visited, features used, and actions taken, used to operate and improve the Service.</li>
        <li><strong>Device data:</strong> IP address, browser type, and similar technical information.</li>
        <li><strong>Cookies:</strong> see our <Link href="/cookies">Cookie Policy</Link>.</li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>Provide, maintain, and secure the Service and your account.</li>
        <li>Process transactions and pay out creators.</li>
        <li>Send transactional emails (verification, password resets, order confirmations).</li>
        <li>Detect, prevent, and respond to fraud, abuse, and security incidents.</li>
        <li>Analyze usage to improve features and performance.</li>
        <li>Comply with legal obligations.</li>
      </ul>

      <h2>3. How we share information</h2>
      <p>We do not sell your personal information. We share information only as needed to run the Service:</p>
      <ul>
        <li><strong>Service providers:</strong> infrastructure, database, file storage, email delivery, and analytics vendors who process data on our behalf.</li>
        <li><strong>Payments:</strong> Stripe, to process payments and creator payouts. Stripe’s handling of your data is governed by its own privacy policy.</li>
        <li><strong>Public content:</strong> information you choose to publish (a published portfolio, store, or post) is visible to others by design.</li>
        <li><strong>Legal:</strong> when required by law or to protect rights, safety, and the integrity of the Service.</li>
        <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of assets.</li>
      </ul>

      <h2>4. Data retention</h2>
      <p>
        We retain your information for as long as your account is active or as needed to provide the
        Service, comply with legal obligations, resolve disputes, and enforce our agreements. You can
        delete your account at any time, after which we delete or anonymize your personal data except
        where retention is legally required.
      </p>

      <h2>5. Security</h2>
      <p>
        We use technical and organizational measures to protect your information, including encryption
        in transit, hashed passwords, access controls, and rate limiting. No method of transmission or
        storage is 100% secure, and we cannot guarantee absolute security.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on your location, you may have the right to access, correct, export, or delete your
        personal data, and to object to or restrict certain processing. You can manage much of this in
        your account settings, or contact us to exercise these rights.
      </p>

      <h2>7. Children’s privacy</h2>
      <p>
        The Service is not directed to children under 13 (or the minimum age in your jurisdiction), and
        we do not knowingly collect their personal information.
      </p>

      <h2>8. International users</h2>
      <p>
        We may process and store information in countries other than your own. Where required, we use
        appropriate safeguards for cross-border transfers.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the updated version with a new
        “Last updated” date and, where appropriate, notify you.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about this policy or your data? Email us at <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>{" "}
        or via our <Link href="/contact">contact page</Link>.
      </p>

      <p className="text-sm text-gray-400 mt-8">
        This document is a general template and not legal advice. Have it reviewed by qualified counsel
        before relying on it for your business.
      </p>
    </InfoPage>
  );
}

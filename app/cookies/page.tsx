import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, LEGAL_UPDATED, LEGAL_EMAIL } from "@/components/site/info-page";
import { CookieSettingsLink } from "@/components/consent/cookie-settings-link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Sellora uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <InfoPage title="Cookie Policy" updated={LEGAL_UPDATED}>
      <p>
        This Cookie Policy explains how Sellora uses cookies and similar technologies when you visit our
        website. It should be read alongside our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They let the site
        remember your actions and preferences (such as staying signed in) over time. We also use similar
        technologies like local storage to provide core functionality.
      </p>

      <h2>2. How we use cookies</h2>
      <ul>
        <li>
          <strong>Strictly necessary:</strong> required to run the Service, for example, keeping you
          securely signed in (authentication/session cookies) and protecting against fraud. The Service
          cannot function properly without these.
        </li>
        <li>
          <strong>Preferences:</strong> remember choices you make, such as UI settings, so your
          experience is consistent.
        </li>
        <li>
          <strong>Analytics:</strong> help us understand how the Service is used so we can improve it.
          These are aggregated and used to measure and enhance performance.
        </li>
      </ul>

      <h2>3. Third-party cookies</h2>
      <p>
        Some features rely on third parties that may set their own cookies, for example, our payment
        processor (Stripe) during checkout, and our infrastructure and analytics providers. Their use of
        cookies is governed by their own policies.
      </p>

      <h2>4. Your choices</h2>
      <p>
        Analytics and marketing cookies are off until you opt in through our consent banner, shown on
        your first visit. You can change or withdraw your choice at any time by opening{" "}
        <CookieSettingsLink className="text-blue-600 font-medium underline underline-offset-2" />, or
        from the link in our footer. Strictly necessary cookies cannot be switched off, as the Service
        cannot function without them.
      </p>
      <p>
        Most browsers also let you view, manage, and delete cookies through their settings, and block
        cookies from specific or all sites. Note that blocking strictly necessary cookies will prevent
        you from signing in and using core features of the Service.
      </p>

      <h2>5. Changes to this policy</h2>
      <p>
        We may update this Cookie Policy from time to time. We will post the updated version with a new
        “Last updated” date.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about our use of cookies? Email <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> or
        see our <Link href="/contact">contact page</Link>.
      </p>
    </InfoPage>
  );
}

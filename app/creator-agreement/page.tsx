import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, LEGAL_UPDATED, LEGAL_EMAIL, COMPANY } from "@/components/site/info-page";

export const metadata: Metadata = {
  title: "Creator Agreement",
  description: "The terms that apply when you sell, crowdfund, or earn on Sellora.",
};

export default function CreatorAgreementPage() {
  return (
    <InfoPage title="Creator Agreement" updated={LEGAL_UPDATED}>
      <p>
        This Creator Agreement (“Agreement”) applies when you use {COMPANY} (“Sellora”, “we”, “us”) to
        sell products or services, run crowdfunding campaigns, offer subscriptions, or otherwise earn
        money (“Creator activities”). It is in addition to our{" "}
        <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>; if
        there is a conflict on a Creator-specific topic, this Agreement controls. By enabling payments or
        listing anything for sale, you agree to these terms.
      </p>

      <h2>1. Your relationship with us</h2>
      <p>
        You sell directly to your customers and backers. Sellora provides the platform, storefront, and
        payment tooling, but is not the seller or merchant of record and is not a party to the contract
        between you and your customer. You are an independent business, not our employee, agent, or
        partner.
      </p>

      <h2>2. Getting paid</h2>
      <ul>
        <li>
          <strong>Stripe is required.</strong> Payments and payouts are processed by Stripe. You must
          connect a Stripe account and complete its onboarding and identity verification before you can
          receive funds. Your use of Stripe is governed by the Stripe Connected Account Agreement.
        </li>
        <li>
          <strong>How funds flow.</strong> Customer payments are charged through the platform and the
          proceeds are transferred to your connected Stripe account, less the platform fee below and
          Stripe’s own processing fees. Payout timing is controlled by Stripe.
        </li>
        <li>
          <strong>Platform fee.</strong> We may deduct a platform fee (an application fee) from each
          transaction. The current rate is shown in your dashboard and may change with notice.
        </li>
        <li>
          <strong>Accurate details.</strong> You are responsible for keeping your payout and tax details
          accurate. We are not liable for funds delayed or lost due to incorrect information you provide.
        </li>
      </ul>

      <h2>3. Taxes</h2>
      <p>
        You are solely responsible for determining, collecting, reporting, and remitting any taxes
        (including VAT, GST, and sales tax) arising from your sales, and for any income tax on your
        earnings. Sellora does not provide tax advice and is not responsible for your tax obligations.
      </p>

      <h2>4. Your listings and storefront</h2>
      <ul>
        <li>Describe products, services, prices, availability, and delivery times accurately.</li>
        <li>Only sell items you have the right to sell, and honor the terms you advertise.</li>
        <li>Fulfill orders promptly and provide the digital files, goods, or services as described.</li>
        <li>
          Do not list prohibited, illegal, infringing, counterfeit, or unsafe items, or anything barred
          by our Terms of Service or by Stripe’s restricted-business rules.
        </li>
      </ul>

      <h2>5. Refunds, chargebacks, and disputes</h2>
      <p>
        You set and clearly publish your own refund policy and are responsible for resolving customer
        disputes. You are financially responsible for refunds, chargebacks, and related fees on your
        sales, which may be deducted from your balance or future payouts. Repeated disputes or
        chargebacks may result in suspension.
      </p>

      <h2>6. Crowdfunding campaigns</h2>
      <p>
        If you run a campaign, you are responsible for delivering the rewards and outcomes you promise to
        backers, on the timeline you state. Pledges are a commitment between you and your backers.
        Failing to deliver, or misrepresenting a campaign, may lead to refunds, removal of the campaign,
        and account action.
      </p>

      <h2>7. Subscriptions</h2>
      <p>
        For subscription products, you must clearly describe what subscribers receive, the billing
        amount and interval, and how to cancel. You must continue to provide the subscribed benefits for
        as long as a subscriber is billed.
      </p>

      <h2>8. Your customers’ data</h2>
      <p>
        Personal data you collect from your customers (such as newsletter emails and order details) is
        your responsibility to handle lawfully. You act as the controller of that data; use it only for
        legitimate purposes, honor opt-outs, and comply with applicable privacy and marketing laws. If
        you add your own analytics or marketing tools (for example a Google Analytics ID, Meta Pixel, or
        custom code), you are responsible for the appropriate disclosures and consents on your store.
      </p>

      <h2>9. Content license</h2>
      <p>
        You retain ownership of your content. You grant Sellora a non-exclusive, worldwide, royalty-free
        license to host, display, and promote your storefront, listings, and campaigns for the purpose
        of operating and marketing the Service. This license ends when you remove the content or close
        your account, except for copies retained as required by law or in routine backups.
      </p>

      <h2>10. Prohibited conduct</h2>
      <p>
        You may not use the Service to defraud customers, launder money, evade fees, manipulate reviews
        or campaign metrics, or circumvent Stripe’s or our policies. We may withhold funds, reverse
        transactions, or remove content where we reasonably suspect fraud, abuse, or a legal violation.
      </p>

      <h2>11. Suspension and termination</h2>
      <p>
        We may suspend or terminate your Creator activities if you breach this Agreement, our Terms, or
        Stripe’s requirements, or to comply with law or protect the Service, our users, or customers.
        You may stop selling at any time. Obligations to your existing customers and backers survive
        termination.
      </p>

      <h2>12. Disclaimers and liability</h2>
      <p>
        The Service is provided “as is.” To the maximum extent permitted by law, we are not liable for
        lost profits or for indirect, incidental, or consequential damages arising from your Creator
        activities, and our aggregate liability is limited as set out in our Terms of Service.
      </p>

      <h2>13. Changes</h2>
      <p>
        We may update this Agreement from time to time. We will post the updated version with a new
        “Last updated” date and, where the change is material, give reasonable notice. Continuing to sell
        after a change means you accept it.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about this Agreement? Email <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> or use
        our <Link href="/contact">contact page</Link>.
      </p>

      <p className="text-sm text-gray-400 mt-8">
        This document is a general template and not legal advice. Have it reviewed by qualified counsel
        before relying on it for your business.
      </p>
    </InfoPage>
  );
}

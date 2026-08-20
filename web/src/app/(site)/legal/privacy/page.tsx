import type { Metadata } from "next";

import { Badge } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="shell py-24 lg:py-28">
      <Badge tone="warning" className="mb-5">
        Draft, pending legal review
      </Badge>
      <h1 className="text-4xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-5 text-lg leading-relaxed text-foreground-muted">
        Kaa handles identity documents, phone numbers and location data. The full policy is being prepared
        against Tanzania&rsquo;s Personal Data Protection Act and will be published here before launch.
      </p>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">What we already commit to</h2>
      <ul className="mt-4 space-y-3 leading-relaxed text-foreground-muted">
        <li>
          Your phone number is never sold, shared with brokers, or used for anything other than Kaa. That is
          the entire point of the product.
        </li>
        <li>
          NIDA details are used to verify identity and are not shown to landlords or other tenants. Only the
          verification result is.
        </li>
        <li>
          Location data is captured for listings, not for tracking people. Agent GPS is recorded at the moment
          of capture and nowhere else.
        </li>
        <li>You can ask us to delete your account and personal data at any time.</li>
      </ul>

      <p className="mt-8 text-sm text-foreground-subtle">
        Data questions: <span className="font-medium text-foreground">privacy@kaa.co.tz</span>
      </p>
    </div>
  );
}

import type { Metadata } from "next";

import { Badge } from "@/components/ui";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-20 lg:px-8">
      <Badge tone="warning" className="mb-5">
        Draft — pending legal review
      </Badge>
      <h1 className="text-4xl font-semibold tracking-tight">Terms of service</h1>
      <p className="mt-5 text-lg leading-relaxed text-foreground-muted">
        Kaa&rsquo;s terms are being prepared with counsel in Tanzania and will be published here before
        launch. They will cover the tenant subscription, the landlord facilitation fee, listing standards,
        field agent conduct, dispute resolution and the limits of Kaa&rsquo;s role in a tenancy.
      </p>
      <p className="mt-4 leading-relaxed text-foreground-muted">
        Kaa facilitates introductions and provides tooling. The tenancy itself is an agreement between the
        tenant and the landlord.
      </p>
      <p className="mt-8 text-sm text-foreground-subtle">
        Questions in the meantime: <span className="font-medium text-foreground">legal@kaa.co.tz</span>
      </p>
    </div>
  );
}

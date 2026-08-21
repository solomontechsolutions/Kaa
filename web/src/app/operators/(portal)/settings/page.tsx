import { Building2, CreditCard, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";
import { currentOrg } from "@/lib/data/queries";
import { displayPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

const team = [
  { name: "Ally Rashid", role: "Owner", email: "ally@mwangaproperties.co.tz" },
  { name: "Zuhura Kimaro", role: "Manager", email: "zuhura@mwangaproperties.co.tz" },
  { name: "Method Chuwa", role: "Staff", email: "method@mwangaproperties.co.tz" },
];

export default function SettingsPage() {
  const org = currentOrg();

  return (
    <>
      <PageHeader title="Settings" description="Your organisation, team and payout details." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ── Organisation ────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-foreground-subtle" />
                <CardTitle>Organisation</CardTitle>
              </div>
              {org.isVerified && (
                <Badge tone="brand">
                  <ShieldCheck />
                  Verified
                </Badge>
              )}
            </CardHeader>
            <CardBody className="grid gap-4 pt-4 sm:grid-cols-2">
              <Field label="Organisation name" className="sm:col-span-2">
                <Input defaultValue={org.name} />
              </Field>
              <Field label="Type">
                <Select defaultValue={org.type}>
                  <option value="individual_landlord">Individual landlord</option>
                  <option value="property_manager">Property manager</option>
                  <option value="developer">Developer</option>
                </Select>
              </Field>
              <Field label="TIN" hint="Tanzania Revenue Authority number">
                <Input placeholder="123-456-789" />
              </Field>
              <Field label="Contact phone">
                <Input defaultValue={displayPhone(org.contactPhone)} />
              </Field>
              <Field label="Contact email">
                <Input defaultValue={org.contactEmail} type="email" />
              </Field>
            </CardBody>
            <CardFooter className="justify-end">
              <Button variant="outline">Cancel</Button>
              <Button>Save changes</Button>
            </CardFooter>
          </Card>

          {/* ── Payouts ─────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-foreground-subtle" />
                <CardTitle>Payouts</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="grid gap-4 pt-4 sm:grid-cols-2">
              <Field label="Payout method">
                <Select defaultValue="mpesa">
                  <option value="mpesa">M-Pesa</option>
                  <option value="tigopesa">Tigo Pesa</option>
                  <option value="airtelmoney">Airtel Money</option>
                  <option value="halopesa">Halopesa</option>
                  <option value="bank_transfer">Bank transfer</option>
                </Select>
              </Field>
              <Field label="Payout number" hint="Rent settles here within one business day.">
                <Input defaultValue={displayPhone(org.contactPhone)} />
              </Field>
              <Field label="Kaa platform fee" hint="Kaa never charges a landlord a subscription or a commission." className="sm:col-span-2">
                <Input defaultValue="TSh 0 — always" disabled />
              </Field>
            </CardBody>
            <CardFooter className="justify-end">
              <Button>Update payouts</Button>
            </CardFooter>
          </Card>
        </div>

        {/* ── Team ──────────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-foreground-subtle" />
                <CardTitle>Team</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="pt-3">
              <ul className="divide-y divide-border">
                {team.map((member) => (
                  <li key={member.email} className="flex items-center gap-3 py-3 first:pt-0">
                    <Avatar name={member.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{member.name}</p>
                      <p className="truncate text-xs text-foreground-subtle">{member.email}</p>
                    </div>
                    <Badge tone="outline">{member.role}</Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                Invite teammate
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language</CardTitle>
            </CardHeader>
            <CardBody className="pt-3">
              <Field label="Default language" hint="Tenant-facing messages and invoices use this.">
                <Select defaultValue="sw">
                  <option value="sw">Kiswahili</option>
                  <option value="en">English</option>
                </Select>
              </Field>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

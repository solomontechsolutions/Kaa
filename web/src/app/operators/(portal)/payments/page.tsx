import { AlertTriangle, Banknote, Download, Send } from "lucide-react";
import type { Metadata } from "next";

import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader, Table, Td, Th, Tr } from "@/components/ui";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import { listInvoices, listPayments, operatorOverview } from "@/lib/data/queries";
import { date, displayPhone, money } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

export const metadata: Metadata = { title: "Rent & payments" };

const methodLabel: Record<PaymentMethod, string> = {
  mpesa: "M-Pesa",
  tigopesa: "Tigo Pesa",
  airtelmoney: "Airtel Money",
  halopesa: "Halopesa",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  card: "Card",
};

export default function PaymentsPage() {
  const overview = operatorOverview();
  const payments = listPayments();
  const invoices = listInvoices();
  const overdue = invoices.filter((i) => i.status === "overdue");
  const upcoming = invoices.filter((i) => i.status === "pending").slice(0, 6);

  const feesPaid = payments.reduce((sum, p) => sum + p.feeAmount, 0);

  return (
    <>
      <PageHeader
        title="Rent & payments"
        description="Mobile money settlements, invoices and arrears in one ledger."
        action={
          <Button variant="outline">
            <Download />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Collected this month" value={money(overview.collectedThisMonth)} tone="brand" icon={<Banknote />} />
        <Stat label="Expected this month" value={money(overview.expectedMonthly)} sub={`${overview.collectionRate.toFixed(0)}% collected`} />
        <Stat
          label="In arrears"
          value={money(overview.arrears)}
          sub={`${overdue.length} invoices`}
          tone={overview.arrears ? "danger" : "neutral"}
          icon={<AlertTriangle />}
        />
        <Stat
          label="Provider fees"
          value={money(feesPaid)}
          sub="lifetime, shown transparently"
        />
      </div>

      {/* ── Arrears ─────────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <Card className="mt-6 border-[var(--color-danger)]/25">
          <CardHeader>
            <div>
              <CardTitle className="text-[var(--color-danger)]">Overdue rent</CardTitle>
              <p className="mt-1 text-sm text-foreground-muted">
                {overdue.length} invoices past their due date, {money(overview.arrears)} outstanding.
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Send />
              Send reminders
            </Button>
          </CardHeader>
          <CardBody className="px-0 pb-0 pt-3">
            <Table>
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Period</Th>
                  <Th>Due</Th>
                  <Th className="text-right">Outstanding</Th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((invoice) => (
                  <Tr key={invoice.id}>
                    <Td className="tnum text-xs font-medium text-foreground-muted">{invoice.reference}</Td>
                    <Td className="text-sm">
                      {date(invoice.periodStart)} → {date(invoice.periodEnd)}
                    </Td>
                    <Td className="text-sm">{date(invoice.dueDate)}</Td>
                    <Td className="tnum text-right font-semibold text-[var(--color-danger)]">
                      {money(invoice.amountDue - invoice.amountPaid)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* ── Settled payments ──────────────────────────────────── */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent settlements</CardTitle>
          </CardHeader>
          <CardBody className="px-0 pb-0 pt-3">
            {payments.length === 0 ? (
              <EmptyState icon={<Banknote />} title="No payments yet" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Reference</Th>
                    <Th>Tenant</Th>
                    <Th>Method</Th>
                    <Th className="text-right">Amount</Th>
                    <Th className="text-right">Fee</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 14).map((payment) => (
                    <Tr key={payment.id}>
                      <Td>
                        <span className="tnum text-xs font-medium text-foreground-muted">{payment.reference}</span>
                        <p className="text-xs text-foreground-subtle">
                          {payment.settledAt && date(payment.settledAt)}
                        </p>
                      </Td>
                      <Td>
                        <p className="text-sm font-medium">{payment.tenant?.fullName ?? "-"}</p>
                        <p className="text-xs text-foreground-subtle">
                          {payment.unit?.property.name} · {payment.unit?.label}
                        </p>
                      </Td>
                      <Td>
                        <Badge tone="outline">{methodLabel[payment.method]}</Badge>
                        <p className="mt-1 text-xs text-foreground-subtle">{displayPhone(payment.payerPhone)}</p>
                      </Td>
                      <Td className="tnum text-right font-medium">{money(payment.amount)}</Td>
                      <Td className="tnum text-right text-xs text-foreground-subtle">
                        {payment.feeAmount ? money(payment.feeAmount) : "-"}
                      </Td>
                      <Td>
                        <StatusBadge kind="payment" value={payment.status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* ── Upcoming ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Falling due</CardTitle>
          </CardHeader>
          <CardBody className="pt-3">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-foreground-subtle">Nothing scheduled.</p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((invoice) => (
                  <li key={invoice.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="tnum text-xs font-medium text-foreground-muted">{invoice.reference}</p>
                      <p className="text-xs text-foreground-subtle">Due {date(invoice.dueDate)}</p>
                    </div>
                    <span className="tnum text-sm font-medium">{money(invoice.amountDue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

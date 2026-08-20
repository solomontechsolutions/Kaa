import { UnlockFlow } from "@/components/app/unlock-flow";
import { currentEntitlement } from "@/lib/access/session";
import { getAccount } from "@/lib/accounts/store";
import { getLocale } from "@/lib/i18n/server";
import { TENANT_ANNUAL_PRICE_TZS } from "@/lib/subscription/service";

export const metadata = { title: "Unlock Kaa" };

export default async function UnlockPage() {
  const entitlement = await currentEntitlement();
  const account = entitlement.accountId ? await getAccount(entitlement.accountId) : undefined;

  return (
    <UnlockFlow
      locale={await getLocale()}
      price={TENANT_ANNUAL_PRICE_TZS}
      accountPhone={account?.phone}
      hasAccount={Boolean(account && account.nidaStatus === "verified" && account.phoneVerifiedAt)}
      alreadyActive={entitlement.level === "member"}
    />
  );
}

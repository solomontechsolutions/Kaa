import { JoinFlow } from "@/components/app/join-flow";
import { getLocale } from "@/lib/i18n/server";

export const metadata = { title: "Create your account" };

export default async function JoinPage() {
  return <JoinFlow locale={await getLocale()} />;
}

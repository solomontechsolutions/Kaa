import { redirect } from "next/navigation";

import { ChatThread } from "@/components/app/chat-thread";
import { currentEntitlement } from "@/lib/access/session";
import { getLocale } from "@/lib/i18n/server";

export const metadata = { title: "Chat" };

export default async function AppChatPage() {
  const entitlement = await currentEntitlement();
  if (entitlement.level === "anonymous") redirect("/app/welcome");

  return <ChatThread locale={await getLocale()} />;
}

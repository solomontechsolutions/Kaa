import { MessageCircle, Send } from "lucide-react";

import { KaaMark } from "@/components/brand/logo";

export const metadata = { title: "Chat" };

const thread = [
  { from: "bot", text: "Karibu Kaa. Unatafuta nyumba wapi?" },
  { from: "user", text: "Mikocheni, bajeti 700,000" },
  { from: "bot", text: "Vyumba vingapi vya kulala, na unahitaji maegesho?" },
];

export default function AppChatPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl">
        <span className="flex size-10 items-center justify-center rounded-full bg-kaa-500 text-ink-950">
          <KaaMark className="size-6" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">Kaa assistant</p>
          <p className="text-xs text-kaa-700 dark:text-kaa-400">online</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-foreground-subtle">
          <MessageCircle className="size-3.5" />
          also on WhatsApp
        </span>
      </header>

      <ul className="flex-1 space-y-2.5 px-5 py-4">
        {thread.map((message, i) => (
          <li key={i} className={message.from === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                message.from === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-md bg-kaa-500 px-3.5 py-2.5 text-sm text-ink-950"
                  : "max-w-[85%] rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-sm"
              }
            >
              {message.text}
            </div>
          </li>
        ))}
      </ul>

      <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background/95 px-5 py-3 backdrop-blur-xl">
        <div className="h-11 flex-1 rounded-full border border-border bg-surface px-4 text-sm leading-[2.75rem] text-foreground-subtle">
          Andika ujumbe
        </div>
        <span className="flex size-11 items-center justify-center rounded-full bg-kaa-500 text-ink-950">
          <Send className="size-4" />
        </span>
      </div>
    </div>
  );
}

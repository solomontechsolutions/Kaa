import { Bookmark } from "lucide-react";

import { ButtonLink } from "@/components/ui";

export const metadata = { title: "Saved" };

export default function AppSavedPage() {
  return (
    <div className="flex min-h-full flex-col px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <h1 className="text-xl font-semibold tracking-tight">Saved</h1>
      <div className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-surface text-foreground-subtle">
          <Bookmark className="size-6" />
        </span>
        <p className="mt-4 font-medium">Nothing saved yet</p>
        <p className="mt-1.5 max-w-xs text-sm text-foreground-muted">
          Tap the bookmark on any home and it will wait for you here.
        </p>
        <ButtonLink href="/app/search" className="mt-6">
          Browse homes
        </ButtonLink>
      </div>
    </div>
  );
}

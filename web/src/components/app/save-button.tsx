"use client";

import { Bookmark, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The bookmark.
 *
 * A free user's tap does not save anything locally and then reconcile later —
 * it goes to `/api/saved`, comes back 402, and turns into an unlock prompt.
 * There is no offline queue and no local-storage list, because either would be
 * a way to keep an unlimited saved set without paying.
 */
export function SaveButton({
  unitId,
  initiallySaved,
  canSave,
  saveLabel,
  savedLabel,
  lockedLabel,
}: {
  unitId: string;
  initiallySaved: boolean;
  canSave: boolean;
  saveLabel: string;
  savedLabel: string;
  lockedLabel: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = React.useState(initiallySaved);
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function toggle() {
    if (!canSave) {
      setNotice(lockedLabel);
      router.push("/app/unlock");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/saved", {
        method: saved ? "DELETE" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ unitId }),
      });

      if (response.status === 402) {
        setNotice(lockedLabel);
        router.push("/app/unlock");
        return;
      }
      if (response.ok) {
        setSaved((current) => !current);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        aria-label={saved ? savedLabel : saveLabel}
        className={cn(
          "flex size-10 items-center justify-center rounded-full bg-background/85 shadow-[var(--shadow-elev-1)] backdrop-blur transition-transform active:scale-95",
          saved ? "text-kaa-600 dark:text-kaa-400" : "text-foreground",
        )}
      >
        {busy ? (
          <Loader2 className="size-4.5 animate-spin" />
        ) : (
          <Bookmark className={cn("size-4.5", saved && "fill-current")} />
        )}
      </button>
      {notice && (
        <p role="status" className="max-w-[12rem] rounded-lg bg-background/90 px-2 py-1 text-right text-[0.65rem] leading-snug backdrop-blur">
          {notice}
        </p>
      )}
    </div>
  );
}

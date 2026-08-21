import { KaaMark } from "@/components/brand/logo";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <KaaMark className="size-14" />
      <h1 className="mt-6 text-xl font-semibold tracking-tight">No connection</h1>
      <p className="mt-2 max-w-xs text-sm text-foreground-muted">
        Kaa needs a signal to load new homes. Anything you opened before is still here.
      </p>
    </div>
  );
}

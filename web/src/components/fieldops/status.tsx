import {
  CheckCircle2,
  CircleDashed,
  CloudUpload,
  Eye,
  FileEdit,
  RotateCcw,
  UploadCloud,
  XCircle,
} from "lucide-react";

import { translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { SubmissionStatus } from "@/lib/fieldops/types";
import { cn } from "@/lib/utils";

/**
 * One status vocabulary, used by the portal, the handset app and Kaa's review
 * queue alike. A status that reads one way to an officer and another way to a
 * reviewer is how two teams end up describing the same record differently on
 * a phone call.
 */
const STATUS: Record<SubmissionStatus, { tone: string; dot: string; icon: React.ReactNode }> = {
  DRAFT: {
    tone: "bg-surface text-foreground-muted border-border",
    dot: "bg-foreground-subtle",
    icon: <FileEdit />,
  },
  READY_FOR_UPLOAD: {
    tone: "bg-[#EAF2FF] text-[#1A4FA8] border-[#CBDDFB] dark:bg-[#0F1F3D] dark:text-[#93B8FF] dark:border-[#1D3355]",
    dot: "bg-[#1A4FA8]",
    icon: <CloudUpload />,
  },
  UPLOADING: {
    tone: "bg-[#EAF2FF] text-[#1A4FA8] border-[#CBDDFB] dark:bg-[#0F1F3D] dark:text-[#93B8FF]",
    dot: "bg-[#1A4FA8] animate-pulse",
    icon: <UploadCloud />,
  },
  UPLOADED: {
    tone: "bg-[#FDF3E0] text-[#8A5A00] border-[#F5E0B8] dark:bg-[#33240A] dark:text-[#FBBF24]",
    dot: "bg-[#B98200]",
    icon: <CircleDashed />,
  },
  UNDER_REVIEW: {
    tone: "bg-[#FDF3E0] text-[#8A5A00] border-[#F5E0B8] dark:bg-[#33240A] dark:text-[#FBBF24]",
    dot: "bg-[#B98200]",
    icon: <Eye />,
  },
  CORRECTION_REQUIRED: {
    tone: "bg-[#FDECEE] text-[#A61B2B] border-[#F7CDD2] dark:bg-[#37151A] dark:text-[#FB7185]",
    dot: "bg-[#A61B2B]",
    icon: <RotateCcw />,
  },
  RESUBMITTED: {
    tone: "bg-[#EAF2FF] text-[#1A4FA8] border-[#CBDDFB] dark:bg-[#0F1F3D] dark:text-[#93B8FF]",
    dot: "bg-[#1A4FA8]",
    icon: <RotateCcw />,
  },
  APPROVED: {
    tone: "bg-kaa-50 text-kaa-800 border-kaa-200 dark:bg-kaa-950 dark:text-kaa-300 dark:border-kaa-800",
    dot: "bg-kaa-600",
    icon: <CheckCircle2 />,
  },
  REJECTED: {
    tone: "bg-surface text-foreground-muted border-border",
    dot: "bg-foreground-subtle",
    icon: <XCircle />,
  },
};

export function statusLabel(status: SubmissionStatus, locale: Locale = "en") {
  return translator(locale)(`fieldops.status.${status}`);
}

/**
 * The label is looked up per render rather than baked into the map above, so a
 * status reads in the viewer's language everywhere it appears. The map holds
 * only what is visual — the colour and the icon are the same in every language.
 */
export function StatusPill({
  status,
  locale = "en",
  compact = false,
  className,
}: {
  status: SubmissionStatus;
  locale?: Locale;
  compact?: boolean;
  className?: string;
}) {
  const meta = STATUS[status];
  const t = translator(locale);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
        meta.tone,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} />
      {t(`fieldops.${compact ? "statusShort" : "status"}.${status}`)}
    </span>
  );
}

export function StatusIcon({ status, className }: { status: SubmissionStatus; className?: string }) {
  return <span className={cn("[&_svg]:size-4", className)}>{STATUS[status].icon}</span>;
}

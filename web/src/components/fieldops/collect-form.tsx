"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Crosshair,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui";
import { deleteDraft, loadDraft, saveDraft, uploadDraft, isOnline, type LocalDraft } from "@/lib/fieldops/offline";
import { translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { CollectedProperty, PhotoRoom, PropertySubmission } from "@/lib/fieldops/types";
import { cn } from "@/lib/utils";

/**
 * Collecting a property.
 *
 * Five steps rather than one long form, because an officer works through a
 * property in roughly this order and a fifty-field page on a phone is a way to
 * lose people halfway.
 *
 * Every change writes to IndexedDB immediately. Nothing waits for a "save"
 * button, because the failure this design exists to prevent is a dropped call
 * or a dead battery costing a visit.
 *
 * Selectable options wherever the value is one of a known set — free text is
 * reserved for the things that genuinely are free text, so the data arriving
 * at Kaa is comparable across officers.
 */

const STEPS = ["property", "location", "amenities", "photos", "review"] as const;
type Step = (typeof STEPS)[number];

const PROPERTY_KINDS = ["apartment", "house", "standalone_room", "shared_house", "bedsitter", "commercial"] as const;
const HOUSE_TYPES = ["self_contained", "shared_facilities", "master_ensuite", "studio", "duplex", "bungalow"] as const;
const FURNISHING = ["unfurnished", "semi_furnished", "furnished"] as const;
const CONDITION = ["new", "excellent", "good", "fair", "needs_work"] as const;
const WATER = ["piped_reliable", "piped_intermittent", "borehole", "tank_only", "shared_point"] as const;
const AMENITIES = [
  "parking", "security", "water_tank", "borehole", "generator", "luku",
  "balcony", "aircon", "lift", "garden", "pool", "staff_quarters", "internet", "fence",
] as const;
const ROOMS: PhotoRoom[] = ["exterior", "living_room", "bedroom", "kitchen", "bathroom", "compound", "other"];

/** What the officer must supply before Kaa can review it. Mirrors `readiness`. */
function missingFrom(draft: LocalDraft, t: (key: string) => string): string[] {
  const p = draft.property;
  const missing: string[] = [];
  if (!p.propertyKind) missing.push(t("fieldops.field.propertyKind"));
  if (p.bedrooms === undefined) missing.push(t("fieldops.field.bedrooms"));
  if (p.bathrooms === undefined) missing.push(t("fieldops.field.bathrooms"));
  if (!p.monthlyRent) missing.push(t("fieldops.field.monthlyRent"));
  if (!p.ward) missing.push(t("fieldops.field.ward"));
  if (p.latitude === undefined) missing.push(t("fieldops.field.gps"));
  else if ((p.gpsAccuracyM ?? Infinity) > 50) missing.push(t("fieldops.app.gpsTooCoarse"));
  if (!p.landlordName || !p.landlordPhone) missing.push(t("fieldops.field.landlordName"));
  if (!p.landlordConsent) missing.push(t("fieldops.app.landlordConsentLabel"));
  if (!draft.photos.some((photo) => photo.room === "exterior")) missing.push(t("fieldops.room.exterior"));
  if (draft.photos.length < 3) missing.push(t("fieldops.field.photos"));
  return missing;
}

export function CollectForm({
  locale,
  draftId,
  serverSubmission,
  wards,
}: {
  locale: Locale;
  /** "new", a local draft id, or a server submission id being corrected. */
  draftId: string;
  serverSubmission?: PropertySubmission;
  wards: string[];
}) {
  const t = React.useMemo(() => translator(locale), [locale]);
  const router = useRouter();

  const [draft, setDraft] = React.useState<LocalDraft | null>(null);
  const [step, setStep] = React.useState<Step>("property");
  const [busy, setBusy] = React.useState(false);
  const [gpsState, setGpsState] = React.useState<"idle" | "working" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  // Load, or create. A submission Kaa sent back is seeded from the server so
  // the officer edits what Kaa actually saw, not a stale local copy.
  React.useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (serverSubmission) {
        const seeded: LocalDraft = {
          id: serverSubmission.id,
          reference: serverSubmission.reference,
          status: serverSubmission.status,
          property: serverSubmission.property,
          photos: serverSubmission.photos,
          createdAt: serverSubmission.createdAt,
          updatedAt: new Date().toISOString(),
          attempts: 0,
          synced: true,
        };
        if (!cancelled) setDraft(seeded);
        return;
      }

      const existing = draftId === "new" ? undefined : await loadDraft(draftId).catch(() => undefined);
      if (cancelled) return;

      setDraft(
        existing ?? {
          id: draftId === "new" ? `local-${crypto.randomUUID()}` : draftId,
          status: "DRAFT",
          property: { amenities: [] },
          photos: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          attempts: 0,
          synced: false,
        },
      );
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [draftId, serverSubmission]);

  const persist = React.useCallback(async (next: LocalDraft) => {
    setDraft(next);
    await saveDraft(next).catch(() => {
      // Storage denied. Say so rather than letting the officer keep typing into
      // something that is not being kept.
      setError("This device would not save the draft. Do not leave the property yet.");
    });
  }, []);

  const update = React.useCallback(
    (patch: Partial<CollectedProperty>) => {
      if (!draft) return;
      void persist({
        ...draft,
        property: { ...draft.property, ...patch },
        updatedAt: new Date().toISOString(),
      });
    },
    [draft, persist],
  );

  async function captureGps() {
    if (!navigator.geolocation) {
      setGpsState("error");
      setError(t("fieldops.app.gpsUnavailable"));
      return;
    }

    setGpsState("working");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsState("idle");
        update({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          gpsAccuracyM: position.coords.accuracy,
          gpsCapturedAt: new Date().toISOString(),
        });
      },
      () => {
        setGpsState("error");
        setError(t("fieldops.app.gpsUnavailable"));
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  }

  async function addPhoto(room: PhotoRoom, file: File) {
    if (!draft) return;

    const uri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    await persist({
      ...draft,
      photos: [
        ...draft.photos,
        { id: crypto.randomUUID(), room, uri, capturedAt: new Date().toISOString(), size: file.size },
      ],
      updatedAt: new Date().toISOString(),
    });
  }

  async function send() {
    if (!draft) return;
    setBusy(true);
    setError(null);

    try {
      if (!isOnline()) {
        // Keep it, mark it ready, and let the queue take it when the signal
        // returns. The officer is told, and can walk away.
        await persist({ ...draft, status: "READY_FOR_UPLOAD", updatedAt: new Date().toISOString() });
        setError(t("fieldops.app.offlineNotice"));
        return;
      }

      if (draft.synced) {
        // Answering a correction: patch the server record and re-upload.
        const patched = await fetch(`/api/fieldops/submissions/${draft.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ property: draft.property }),
        });
        if (!patched.ok) throw new Error((await patched.json().catch(() => ({}))).message ?? "Could not save");

        const uploaded = await fetch(`/api/fieldops/submissions/${draft.id}/upload`, { method: "POST" });
        if (!uploaded.ok) throw new Error((await uploaded.json().catch(() => ({}))).message ?? "Could not upload");
      } else {
        const readied: LocalDraft = { ...draft, status: "READY_FOR_UPLOAD" };
        await persist(readied);
        const result = await uploadDraft(readied);
        if (!result.ok) throw new Error(result.error ?? t("fieldops.app.uploadFailed"));
      }

      router.push("/field/app");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("fieldops.app.uploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!draft) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-foreground-subtle" />
      </div>
    );
  }

  const missing = missingFrom(draft, t);
  const openCorrection = serverSubmission?.corrections.find((correction) => !correction.resolvedAt);
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="flex min-h-full flex-col pb-8">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (stepIndex === 0 ? router.push("/field/app") : setStep(STEPS[stepIndex - 1]!))}
            aria-label={t("common.back")}
            className="flex size-9 items-center justify-center rounded-full bg-surface text-foreground-muted"
          >
            <ArrowLeft className="size-4.5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {draft.reference ?? t("fieldops.app.newProperty")}
            </p>
            <p className="text-xs text-foreground-subtle">{t(`fieldops.app.section${sectionKey(step)}`)}</p>
          </div>
        </div>

        <div className="mt-3 flex gap-1" aria-hidden="true">
          {STEPS.map((value, index) => (
            <span
              key={value}
              className={cn("h-1 flex-1 rounded-full", index <= stepIndex ? "bg-kaa-500" : "bg-border")}
            />
          ))}
        </div>
      </header>

      {openCorrection && (
        <div className="mx-5 mt-4 rounded-2xl border border-[#F7CDD2] bg-[#FDECEE] p-4 dark:border-[#5A2027] dark:bg-[#37151A]">
          <p className="text-xs font-medium uppercase tracking-wider text-[#A61B2B] dark:text-[#FB7185]">
            {t("fieldops.app.kaaOperatorSays")}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed">{openCorrection.message}</p>
        </div>
      )}

      <div className="flex-1 space-y-6 px-5 pt-5">
        {step === "property" && (
          <>
            <Choice
              label={t("fieldops.field.propertyKind")}
              options={PROPERTY_KINDS}
              value={draft.property.propertyKind}
              onChange={(value) => update({ propertyKind: value })}
              render={(value) => value.replace(/_/g, " ")}
            />
            <Choice
              label={t("fieldops.field.houseType")}
              options={HOUSE_TYPES}
              value={draft.property.houseType}
              onChange={(value) => update({ houseType: value })}
              render={(value) => value.replace(/_/g, " ")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Stepper
                label={t("fieldops.field.bedrooms")}
                value={draft.property.bedrooms}
                onChange={(value) => update({ bedrooms: value })}
              />
              <Stepper
                label={t("fieldops.field.bathrooms")}
                value={draft.property.bathrooms}
                onChange={(value) => update({ bathrooms: value })}
              />
            </div>
            <NumberField
              label={t("fieldops.field.monthlyRent")}
              value={draft.property.monthlyRent}
              onChange={(value) => update({ monthlyRent: value })}
              prefix="TSh"
            />
            <Choice
              label={t("fieldops.field.furnishing")}
              options={FURNISHING}
              value={draft.property.furnishing}
              onChange={(value) => update({ furnishing: value })}
              render={(value) => value.replace(/_/g, " ")}
            />
            <Choice
              label={t("fieldops.field.condition")}
              options={CONDITION}
              value={draft.property.condition}
              onChange={(value) => update({ condition: value })}
              render={(value) => value.replace(/_/g, " ")}
            />
          </>
        )}

        {step === "location" && (
          <>
            <Choice
              label={t("fieldops.field.ward")}
              options={wards}
              value={draft.property.ward}
              onChange={(value) => update({ ward: value })}
              render={(value) => value}
            />
            <TextField
              label={t("fieldops.field.area")}
              value={draft.property.area}
              onChange={(value) => update({ area: value })}
            />
            <TextField
              label={t("fieldops.field.street")}
              value={draft.property.street}
              onChange={(value) => update({ street: value })}
            />
            <TextField
              label={t("fieldops.field.landmark")}
              value={draft.property.landmark}
              onChange={(value) => update({ landmark: value })}
            />

            <div className="rounded-2xl border border-border bg-surface-raised p-4">
              <p className="text-sm font-medium">{t("fieldops.field.gps")}</p>

              {draft.property.latitude !== undefined ? (
                <>
                  <p className="tnum mt-2 text-sm">
                    {draft.property.latitude.toFixed(5)}, {draft.property.longitude!.toFixed(5)}
                  </p>
                  <p
                    className={cn(
                      "tnum mt-1 text-xs",
                      (draft.property.gpsAccuracyM ?? 0) > 50
                        ? "text-[var(--color-danger)]"
                        : "text-[var(--color-success)]",
                    )}
                  >
                    {t("fieldops.app.gpsCaptured", { metres: Math.round(draft.property.gpsAccuracyM ?? 0) })}
                  </p>
                  {(draft.property.gpsAccuracyM ?? 0) > 50 && (
                    <p className="mt-1.5 text-xs text-[var(--color-danger)]">{t("fieldops.app.gpsTooCoarse")}</p>
                  )}
                </>
              ) : (
                <p className="mt-1.5 text-xs text-foreground-subtle">
                  {t("fieldops.app.captureGps")}
                </p>
              )}

              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={captureGps}
                disabled={gpsState === "working"}
              >
                {gpsState === "working" ? <Loader2 className="animate-spin" /> : <Crosshair />}
                {gpsState === "working" ? t("fieldops.app.capturingGps") : t("fieldops.app.captureGps")}
              </Button>
            </div>
          </>
        )}

        {step === "amenities" && (
          <>
            <fieldset>
              <legend className="mb-2.5 text-sm font-medium">{t("fieldops.field.amenities")}</legend>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((amenity) => {
                  const on = draft.property.amenities?.includes(amenity) ?? false;
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() =>
                        update({
                          amenities: on
                            ? (draft.property.amenities ?? []).filter((value) => value !== amenity)
                            : [...(draft.property.amenities ?? []), amenity],
                        })
                      }
                      aria-pressed={on}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-xs font-medium capitalize transition-colors",
                        on
                          ? "border-kaa-400 bg-kaa-500 text-ink-950"
                          : "border-border bg-surface text-foreground-muted",
                      )}
                    >
                      {amenity.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <Stepper
              label={t("fieldops.field.parkingSpaces")}
              value={draft.property.parkingSpaces}
              onChange={(value) => update({ parkingSpaces: value })}
            />
            <Choice
              label={t("fieldops.field.water")}
              options={WATER}
              value={draft.property.water}
              onChange={(value) => update({ water: value })}
              render={(value) => value.replace(/_/g, " ")}
            />
            <Toggle
              label={t("fieldops.field.security")}
              value={draft.property.hasSecurity}
              onChange={(value) => update({ hasSecurity: value })}
            />
            <Toggle
              label={t("fieldops.field.electricity")}
              value={draft.property.hasElectricity}
              onChange={(value) => update({ hasElectricity: value })}
            />

            <TextField
              label={t("fieldops.field.landlordName")}
              value={draft.property.landlordName}
              onChange={(value) => update({ landlordName: value })}
            />
            <TextField
              label={t("fieldops.field.landlordPhone")}
              value={draft.property.landlordPhone}
              onChange={(value) => update({ landlordPhone: value })}
              inputMode="tel"
            />

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface-raised p-4">
              <input
                type="checkbox"
                checked={draft.property.landlordConsent ?? false}
                onChange={(event) => update({ landlordConsent: event.target.checked })}
                className="mt-0.5 size-4 shrink-0"
              />
              <span className="text-sm leading-relaxed">
                {t("fieldops.app.landlordConsentLabel")}
                <span className="mt-1 block text-xs text-foreground-subtle">
                  {t("fieldops.app.landlordConsentHelp")}
                </span>
              </span>
            </label>
          </>
        )}

        {step === "photos" && (
          <>
            {ROOMS.map((room) => {
              const photos = draft.photos.filter((photo) => photo.room === room);
              return (
                <div key={room}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">{t(`fieldops.room.${room}`)}</p>
                    {room === "exterior" && photos.length === 0 && (
                      <span className="text-xs text-[var(--color-danger)]">{t("fieldops.submission.stillNeeded")}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.uri}
                          alt={t(`fieldops.room.${room}`)}
                          className="size-24 rounded-xl border border-border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            persist({
                              ...draft,
                              photos: draft.photos.filter((row) => row.id !== photo.id),
                              updatedAt: new Date().toISOString(),
                            })
                          }
                          aria-label={t("common.cancel")}
                          className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-ink-950 text-white"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}

                    <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong bg-surface text-foreground-subtle">
                      <Camera className="size-5" />
                      <span className="text-[0.65rem]">{t("fieldops.app.takePhoto")}</span>
                      <input
                        type="file"
                        accept="image/*"
                        // `capture` opens the camera directly on a handset
                        // rather than the gallery, which is what an officer
                        // standing at the property wants.
                        capture="environment"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void addPhoto(room, file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {step === "review" && (
          <>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{t("fieldops.app.reviewBeforeUpload")}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                {t("fieldops.app.reviewBody")}
              </p>
            </div>

            {missing.length > 0 && (
              <div className="rounded-2xl border border-[#F5E0B8] bg-[#FDF3E0] p-4 dark:border-[#4A3510] dark:bg-[#33240A]">
                <p className="text-sm font-semibold text-[#8A5A00] dark:text-[#FBBF24]">
                  {t("fieldops.submission.stillNeeded")}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-[#8A5A00] dark:text-[#FBBF24]">
                  {missing.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            <Summary draft={draft} t={t} />

            {error && (
              <p role="alert" className="rounded-xl bg-[#FDECEE] px-3.5 py-2.5 text-sm text-[#A61B2B] dark:bg-[#37151A] dark:text-[#FB7185]">
                {error}
              </p>
            )}

            <Button size="lg" className="w-full" onClick={send} disabled={busy || missing.length > 0}>
              {busy ? <Loader2 className="animate-spin" /> : <Upload />}
              {draft.synced ? t("fieldops.app.reUpload") : t("fieldops.app.uploadProperty")}
            </Button>

            {!draft.synced && (
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(t("fieldops.app.deleteDraftConfirm"))) return;
                  await deleteDraft(draft.id);
                  router.push("/field/app");
                }}
                className="flex w-full items-center justify-center gap-1.5 py-2 text-sm text-foreground-subtle"
              >
                <Trash2 className="size-3.5" />
                {t("fieldops.app.deleteDraft")}
              </button>
            )}
          </>
        )}
      </div>

      {step !== "review" && (
        <div className="sticky bottom-0 border-t border-border bg-background/95 px-5 py-3 backdrop-blur-xl">
          <Button size="lg" className="w-full" onClick={() => setStep(STEPS[stepIndex + 1]!)}>
            {t("common.next")}
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}

function sectionKey(step: Step): string {
  return { property: "Property", location: "Location", amenities: "Amenities", photos: "Photos", review: "Property" }[step];
}

function Summary({ draft, t }: { draft: LocalDraft; t: (key: string) => string }) {
  const p = draft.property;
  const rows: [string, React.ReactNode][] = [
    [t("fieldops.field.propertyKind"), p.propertyKind?.replace(/_/g, " ")],
    [t("fieldops.field.bedrooms"), p.bedrooms],
    [t("fieldops.field.bathrooms"), p.bathrooms],
    [t("fieldops.field.monthlyRent"), p.monthlyRent ? `TSh ${p.monthlyRent.toLocaleString("en-US")}` : undefined],
    [t("fieldops.field.ward"), p.ward],
    [t("fieldops.field.area"), p.area],
    [t("fieldops.field.gps"), p.latitude ? `${p.latitude.toFixed(4)}, ${p.longitude!.toFixed(4)}` : undefined],
    [t("fieldops.field.amenities"), p.amenities?.length ? p.amenities.length : undefined],
    [t("fieldops.field.photos"), draft.photos.length],
    [t("fieldops.field.landlordName"), p.landlordName],
    [t("fieldops.field.landlordPhone"), p.landlordPhone],
  ];

  return (
    <dl className="divide-y divide-border rounded-2xl border border-border bg-surface-raised">
      {rows
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-foreground-muted">{label}</dt>
            <dd className="truncate text-sm font-medium capitalize">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

// ── Inputs ─────────────────────────────────────────────────────────────

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value?: T;
  onChange: (value: T) => void;
  render: (value: T) => string;
}) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-medium capitalize transition-colors",
              value === option
                ? "border-kaa-400 bg-kaa-500 text-ink-950"
                : "border-border bg-surface text-foreground-muted",
            )}
          >
            {render(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value: number) => void;
}) {
  const current = value ?? 0;
  return (
    <div>
      <p className="mb-2.5 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-raised p-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, current - 1))}
          aria-label={`${label} −`}
          className="flex size-10 items-center justify-center rounded-xl bg-surface text-lg font-medium"
        >
          −
        </button>
        <span className="tnum flex-1 text-center text-lg font-semibold">{value ?? "—"}</span>
        <button
          type="button"
          onClick={() => onChange(current + 1)}
          aria-label={`${label} +`}
          className="flex size-10 items-center justify-center rounded-xl bg-surface text-lg font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  prefix?: string;
}) {
  return (
    <div>
      <label className="mb-2.5 block text-sm font-medium" htmlFor={label}>{label}</label>
      <div className="flex h-13 items-center gap-2 rounded-2xl border border-border bg-surface px-4 focus-within:border-kaa-400">
        {prefix && <span className="shrink-0 text-sm text-foreground-subtle">{prefix}</span>}
        <input
          id={label}
          inputMode="numeric"
          value={value ?? ""}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            onChange(digits ? Number(digits) : undefined);
          }}
          className="tnum min-w-0 flex-1 bg-transparent text-base outline-none"
        />
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  inputMode?: "text" | "tel";
}) {
  return (
    <div>
      <label className="mb-2.5 block text-sm font-medium" htmlFor={label}>{label}</label>
      <input
        id={label}
        inputMode={inputMode}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-13 w-full rounded-2xl border border-border bg-surface px-4 text-base outline-none transition-colors focus:border-kaa-400"
      />
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-raised p-4">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-1.5">
        {[true, false].map((option) => (
          <button
            key={String(option)}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border text-sm transition-colors",
              value === option
                ? "border-kaa-400 bg-kaa-500 text-ink-950"
                : "border-border bg-surface text-foreground-muted",
            )}
          >
            {option ? <Check className="size-4" /> : <X className="size-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Crosshair,
  ImageIcon,
  Loader2,
  Send,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import * as React from "react";

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { money, normalizePhone, displayPhone, mnoFor } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Ward } from "@/lib/types";

type Fix = { latitude: number; longitude: number; accuracy: number; at: number };

const STEPS = ["Location", "Landlord", "Property", "Units", "Photos"] as const;
type Step = (typeof STEPS)[number];

/** Kaa will not publish a listing whose pin could be on a neighbouring plot. */
const ACCURACY_LIMIT_M = 10;
const MIN_PHOTOS = 6;

export function CaptureForm({ wards, amenities }: { wards: Ward[]; amenities: { slug: string; label: string }[] }) {
  const [step, setStep] = React.useState(0);

  // Location
  const [fix, setFix] = React.useState<Fix | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const [wardId, setWardId] = React.useState("");
  const [addressLine, setAddressLine] = React.useState("");
  const [landmark, setLandmark] = React.useState("");

  // Landlord
  const [landlordName, setLandlordName] = React.useState("");
  const [landlordPhone, setLandlordPhone] = React.useState("");

  // Property
  const [propertyName, setPropertyName] = React.useState("");
  const [propertyType, setPropertyType] = React.useState("apartment_block");
  const [totalUnits, setTotalUnits] = React.useState("1");
  const [description, setDescription] = React.useState("");
  const [caretakerName, setCaretakerName] = React.useState("");
  const [caretakerPhone, setCaretakerPhone] = React.useState("");

  // Units
  const [bedrooms, setBedrooms] = React.useState("2");
  const [bathrooms, setBathrooms] = React.useState("1");
  const [rent, setRent] = React.useState("");
  const [advanceMonths, setAdvanceMonths] = React.useState("6");
  const [depositMonths, setDepositMonths] = React.useState("1");
  const [furnishing, setFurnishing] = React.useState("unfurnished");
  const [picked, setPicked] = React.useState<string[]>([]);

  // Photos
  const [photos, setPhotos] = React.useState<{ name: string; url: string }[]>([]);

  const normalizedLandlord = normalizePhone(landlordPhone);
  const rentValue = Number(rent.replace(/\D/g, "")) || 0;

  React.useEffect(() => {
    // Object URLs are only valid while the page lives; release them on unmount.
    return () => photos.forEach((p) => URL.revokeObjectURL(p.url));
  }, [photos]);

  function captureFix() {
    if (!("geolocation" in navigator)) {
      setGeoError("This device cannot report a location.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFix({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          at: Date.now(),
        });
        setLocating(false);
      },
      (error) => {
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission is off. Turn it on to capture a listing."
            : "Could not get a fix. Step outside, away from walls, and try again.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotos((current) => [
      ...current,
      ...Array.from(files).map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    ]);
  }

  const complete: Record<Step, boolean> = {
    Location: Boolean(fix && fix.accuracy <= ACCURACY_LIMIT_M && wardId && addressLine.trim()),
    Landlord: Boolean(landlordName.trim() && normalizedLandlord),
    Property: Boolean(propertyName.trim() && Number(totalUnits) > 0),
    Units: rentValue > 0,
    Photos: photos.length >= MIN_PHOTOS,
  };

  const currentStep = STEPS[step]!;
  const allComplete = STEPS.every((s) => complete[s]);

  return (
    <>
      {/* ── Step rail ───────────────────────────────────────────── */}
      <ol className="mb-5 flex items-center gap-1.5">
        {STEPS.map((label, i) => {
          const done = complete[label];
          const active = i === step;
          return (
            <li key={label} className="flex-1">
              <button
                type="button"
                onClick={() => setStep(i)}
                className="group w-full text-left"
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-colors",
                    done ? "bg-kaa-500" : active ? "bg-kaa-300" : "bg-border",
                  )}
                />
                <span
                  className={cn(
                    "mt-1.5 block truncate text-[0.7rem] font-medium transition-colors",
                    active ? "text-foreground" : "text-foreground-subtle",
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* ── Location ────────────────────────────────────────────── */}
      {currentStep === "Location" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Where is it?</CardTitle>
              <p className="mt-1 text-sm text-foreground-muted">
                Stand at the gate with a clear view of the sky before taking the pin.
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 pt-4">
            <div
              className={cn(
                "rounded-xl border p-4",
                fix
                  ? fix.accuracy <= ACCURACY_LIMIT_M
                    ? "border-[var(--color-success)]/40 bg-[#F2FBF5] dark:bg-[#0C2415]"
                    : "border-[var(--color-warning)]/40 bg-[#FDF9F0] dark:bg-[#241C0C]"
                  : "border-dashed border-border-strong",
              )}
            >
              {fix ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="tnum text-sm font-medium">
                      {fix.latitude.toFixed(5)}, {fix.longitude.toFixed(5)}
                    </span>
                    <Badge tone={fix.accuracy <= ACCURACY_LIMIT_M ? "success" : "warning"}>
                      ±{fix.accuracy.toFixed(1)} m
                    </Badge>
                  </div>
                  {fix.accuracy > ACCURACY_LIMIT_M && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-[var(--color-warning)]">
                      <TriangleAlert className="mt-px size-3.5 shrink-0" />
                      Above the {ACCURACY_LIMIT_M} m limit — this pin may land on the wrong plot. Take it again.
                    </p>
                  )}
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={captureFix} disabled={locating}>
                    {locating ? <Loader2 className="animate-spin" /> : <Crosshair />}
                    Take the pin again
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-foreground-muted">No location captured yet.</p>
                  <Button className="mt-3 w-full" onClick={captureFix} disabled={locating}>
                    {locating ? <Loader2 className="animate-spin" /> : <Crosshair />}
                    {locating ? "Getting a fix…" : "Capture GPS pin"}
                  </Button>
                </>
              )}
              {geoError && <p className="mt-2 text-xs text-[var(--color-danger)]">{geoError}</p>}
            </div>

            <Field label="Ward" required>
              <Select value={wardId} onChange={(e) => setWardId(e.target.value)}>
                <option value="">Choose a ward…</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name} — {ward.district}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Street or address" required>
              <Input
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Mikocheni B, Rose Garden Road"
              />
            </Field>

            <Field label="Landmark" hint="How a boda rider would find it. Swahili is fine.">
              <Input
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Karibu na Shoppers Plaza"
              />
            </Field>
          </CardBody>
        </Card>
      )}

      {/* ── Landlord ────────────────────────────────────────────── */}
      {currentStep === "Landlord" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Who owns it?</CardTitle>
              <p className="mt-1 text-sm text-foreground-muted">
                Kaa contacts this number to confirm the listing before it goes live.
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 pt-4">
            <Field label="Landlord name" required>
              <Input value={landlordName} onChange={(e) => setLandlordName(e.target.value)} placeholder="Ally Nassoro" />
            </Field>

            <Field
              label="Landlord phone"
              required
              hint={
                landlordPhone && !normalizedLandlord
                  ? "That is not a valid Tanzanian number."
                  : normalizedLandlord
                    ? `${displayPhone(normalizedLandlord)} · ${mnoFor(normalizedLandlord)}`
                    : "0784 000 500 or +255 784 000 500"
              }
            >
              <Input
                value={landlordPhone}
                onChange={(e) => setLandlordPhone(e.target.value)}
                inputMode="tel"
                placeholder="0784 000 500"
                className={landlordPhone && !normalizedLandlord ? "border-[var(--color-danger)]" : undefined}
              />
            </Field>

            <div className="rounded-xl bg-surface p-3.5">
              <p className="text-xs text-foreground-muted">
                Explain to the landlord: Kaa lists the unit free, verifies it, and sends only tenants who have
                confirmed their identity. No dalali fee is charged to the tenant.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Property ────────────────────────────────────────────── */}
      {currentStep === "Property" && (
        <Card>
          <CardHeader>
            <CardTitle>The property</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4 pt-4">
            <Field label="Property name" required hint="What people in the area call it.">
              <Input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="Bahari Court" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <Select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  <option value="apartment_block">Apartment block</option>
                  <option value="house">House</option>
                  <option value="standalone_room">Standalone rooms</option>
                  <option value="shared_house">Shared house</option>
                  <option value="commercial">Commercial</option>
                </Select>
              </Field>
              <Field label="Units in total" required>
                <Input
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(e.target.value)}
                  inputMode="numeric"
                  type="number"
                  min="1"
                />
              </Field>
            </div>

            <Field label="Description" hint="Water source, power, security, parking — what a tenant asks about.">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Borehole water, standby generator for common areas, walled compound with 24-hour security."
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Caretaker name">
                <Input value={caretakerName} onChange={(e) => setCaretakerName(e.target.value)} />
              </Field>
              <Field label="Caretaker phone">
                <Input
                  value={caretakerPhone}
                  onChange={(e) => setCaretakerPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="0754 001 122"
                />
              </Field>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Units ───────────────────────────────────────────────── */}
      {currentStep === "Units" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Typical unit</CardTitle>
              <p className="mt-1 text-sm text-foreground-muted">
                Describe the unit on offer. Operators split this into individual units later.
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bedrooms">
                <Input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} type="number" min="0" inputMode="numeric" />
              </Field>
              <Field label="Bathrooms">
                <Input value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} type="number" min="0" inputMode="numeric" />
              </Field>
            </div>

            <Field
              label="Rent per month (TZS)"
              required
              hint={rentValue > 0 ? money(rentValue) : "Whole shillings, no commas needed."}
            >
              <Input value={rent} onChange={(e) => setRent(e.target.value)} inputMode="numeric" placeholder="650000" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Months upfront" hint="Be honest — this is what tenants get ambushed with.">
                <Select value={advanceMonths} onChange={(e) => setAdvanceMonths(e.target.value)}>
                  {["1", "3", "6", "12"].map((m) => (
                    <option key={m} value={m}>
                      {m} month{m === "1" ? "" : "s"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Deposit (months)">
                <Select value={depositMonths} onChange={(e) => setDepositMonths(e.target.value)}>
                  {["0", "1", "2", "3"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {rentValue > 0 && (
              <div className="rounded-xl bg-kaa-50 p-3.5 dark:bg-kaa-950/60">
                <p className="text-xs font-medium text-kaa-800 dark:text-kaa-300">
                  A tenant needs{" "}
                  <span className="tnum">
                    {money(rentValue * Number(advanceMonths) + rentValue * Number(depositMonths))}
                  </span>{" "}
                  to move in.
                </p>
              </div>
            )}

            <Field label="Furnishing">
              <Select value={furnishing} onChange={(e) => setFurnishing(e.target.value)}>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi_furnished">Semi furnished</option>
                <option value="furnished">Furnished</option>
              </Select>
            </Field>

            <div>
              <p className="mb-2 text-sm font-medium">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => {
                  const on = picked.includes(amenity.slug);
                  return (
                    <button
                      key={amenity.slug}
                      type="button"
                      onClick={() =>
                        setPicked((current) =>
                          on ? current.filter((s) => s !== amenity.slug) : [...current, amenity.slug],
                        )
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        on
                          ? "border-kaa-400 bg-kaa-50 text-kaa-800 dark:bg-kaa-950 dark:text-kaa-300"
                          : "border-border text-foreground-muted hover:border-border-strong",
                      )}
                    >
                      {on && <Check className="size-3" />}
                      {amenity.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Photos ──────────────────────────────────────────────── */}
      {currentStep === "Photos" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Photos</CardTitle>
              <p className="mt-1 text-sm text-foreground-muted">
                At least {MIN_PHOTOS}: outside, gate, each room, kitchen, bathroom, and the water source.
              </p>
            </div>
            <Badge tone={photos.length >= MIN_PHOTOS ? "success" : "warning"}>
              {photos.length}/{MIN_PHOTOS}
            </Badge>
          </CardHeader>
          <CardBody className="pt-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border-strong py-8 transition-colors hover:border-kaa-400 hover:bg-surface">
              <Camera className="size-6 text-foreground-subtle" />
              <span className="mt-2 text-sm font-medium">Take or choose photos</span>
              <span className="mt-0.5 text-xs text-foreground-subtle">Geotag and timestamp are kept</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="sr-only"
                onChange={(e) => addPhotos(e.target.files)}
              />
            </label>

            {photos.length > 0 && (
              <ul className="mt-4 grid grid-cols-3 gap-2.5">
                {photos.map((photo, i) => (
                  <li key={`${photo.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((current) => current.filter((_, index) => index !== i))}
                      className="absolute right-1 top-1 rounded-md bg-ink-950/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {photos.length === 0 && (
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-foreground-subtle">
                <ImageIcon className="size-3.5" />
                No photos yet
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── Navigation ──────────────────────────────────────────── */}
      <div className="sticky bottom-[5.5rem] z-10 mt-5 flex gap-3 rounded-2xl border border-border bg-surface-raised/95 p-2.5 shadow-[var(--shadow-elev-2)] backdrop-blur-md">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ArrowLeft />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="flex-1" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
            Next
            <ArrowRight />
          </Button>
        ) : (
          <Button className="flex-1" disabled={!allComplete}>
            <Send />
            Submit for review
          </Button>
        )}
      </div>

      {step === STEPS.length - 1 && !allComplete && (
        <p className="mt-3 text-center text-xs text-foreground-subtle">
          Still needed: {STEPS.filter((s) => !complete[s]).join(", ")}
        </p>
      )}
    </>
  );
}

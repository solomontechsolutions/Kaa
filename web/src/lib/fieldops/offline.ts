"use client";

/**
 * Working without a signal.
 *
 * A FieldOps officer is standing at a gate in Mbagala with one bar. The
 * application must never be the reason a visit has to be repeated, so
 * everything is written to the handset first and sent when the network allows.
 *
 *   collect ──▶ IndexedDB (immediately, always)
 *                   │
 *                   └──▶ upload queue ──▶ Kaa, when there is a signal
 *
 * IndexedDB rather than localStorage because photographs are the bulk of a
 * submission and localStorage is a ~5 MB string store. A single exterior
 * photograph can be 2 MB.
 */

import type { CollectedProperty, SubmissionPhoto, SubmissionStatus } from "./types";

const DB_NAME = "kaa-fieldops";
const DB_VERSION = 1;
const DRAFTS = "drafts";

export interface LocalDraft {
  /** The server id once it has one, otherwise a local id. */
  id: string;
  reference?: string;
  status: SubmissionStatus;
  property: CollectedProperty;
  photos: SubmissionPhoto[];
  createdAt: string;
  updatedAt: string;
  /** Set when an upload failed, so the officer sees why rather than silence. */
  lastError?: string;
  /** How many times we have tried to send it. */
  attempts: number;
  /** True once the server has it. Kept locally until then. */
  synced: boolean;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DRAFTS)) {
        db.createObjectStore(DRAFTS, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(DRAFTS, mode);
    const request = run(tx.objectStore(DRAFTS));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraft(draft: LocalDraft): Promise<void> {
  await withStore("readwrite", (store) => store.put(draft) as IDBRequest<IDBValidKey>);
}

export async function loadDraft(id: string): Promise<LocalDraft | undefined> {
  return withStore("readonly", (store) => store.get(id) as IDBRequest<LocalDraft | undefined>);
}

export async function listDrafts(): Promise<LocalDraft[]> {
  const rows = await withStore("readonly", (store) => store.getAll() as IDBRequest<LocalDraft[]>);
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteDraft(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id) as IDBRequest<undefined>);
}

/** Drafts that are finished on the device and waiting for a signal. */
export async function pendingUploads(): Promise<LocalDraft[]> {
  return (await listDrafts()).filter((draft) => !draft.synced && draft.status === "READY_FOR_UPLOAD");
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/**
 * Send one draft.
 *
 * On failure it stays on the device with the reason attached, and the attempt
 * count goes up — nothing is thrown away because the network was poor, which
 * is the entire point of collecting offline.
 */
export async function uploadDraft(draft: LocalDraft): Promise<{ ok: boolean; error?: string }> {
  try {
    // Create the server record if this draft has never been sent.
    let serverId = draft.synced ? draft.id : undefined;

    if (!serverId) {
      const created = await fetch("/api/fieldops/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ward: draft.property.ward,
          district: draft.property.district,
          area: draft.property.area,
        }),
      });
      if (!created.ok) throw new Error(`Could not start the submission (${created.status})`);
      serverId = (await created.json()).submission.id as string;
    }

    const patched = await fetch(`/api/fieldops/submissions/${serverId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        property: strip(draft.property),
        ...(draft.property.latitude !== undefined && draft.property.longitude !== undefined
          ? {
              gps: {
                latitude: draft.property.latitude,
                longitude: draft.property.longitude,
                accuracyM: draft.property.gpsAccuracyM ?? 0,
              },
            }
          : {}),
      }),
    });
    if (!patched.ok) throw new Error(await message(patched));

    for (const photo of draft.photos) {
      const sent = await fetch(`/api/fieldops/submissions/${serverId}/photos`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ room: photo.room, uri: photo.uri, size: photo.size }),
      });
      if (!sent.ok) throw new Error(await message(sent));
    }

    const ready = await fetch(`/api/fieldops/submissions/${serverId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ markReady: true }),
    });
    if (!ready.ok) throw new Error(await message(ready));

    const uploaded = await fetch(`/api/fieldops/submissions/${serverId}/upload`, { method: "POST" });
    if (!uploaded.ok) throw new Error(await message(uploaded));

    await deleteDraft(draft.id);
    return { ok: true };
  } catch (error) {
    await saveDraft({
      ...draft,
      attempts: draft.attempts + 1,
      lastError: error instanceof Error ? error.message : "Upload failed",
      updatedAt: new Date().toISOString(),
    });
    return { ok: false, error: error instanceof Error ? error.message : undefined };
  }
}

async function message(response: Response): Promise<string> {
  const payload = await response.json().catch(() => ({}));
  return payload.message ?? `Request failed (${response.status})`;
}

/** GPS-derived fields travel in their own request; strip them from the patch. */
function strip(property: CollectedProperty): Partial<CollectedProperty> {
  const { latitude, longitude, gpsAccuracyM, gpsCapturedAt, ...rest } = property;
  void latitude; void longitude; void gpsAccuracyM; void gpsCapturedAt;
  return rest;
}

/** Send everything that is waiting. Returns how many made it. */
export async function flushQueue(): Promise<{ sent: number; failed: number }> {
  if (!isOnline()) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  for (const draft of await pendingUploads()) {
    const result = await uploadDraft(draft);
    if (result.ok) sent += 1;
    else failed += 1;
  }
  return { sent, failed };
}
